import FormData from "form-data";
import moment from "moment";
import Bull from "bull";
import fs from "fs";

// MOdles
import { AnalyserMailRequest } from "@redlof/libs/Models/Analysis/AnalyserMailRequest";

// Helpers
import { EvaluateServiceClass } from "@redlof/libs/Classes/EvaluateServiceClass";
import { AnalyzeClass } from "@redlof/libs/Classes/AnalyzeServiceClass";
import { uploadFile } from "@redlof/libs/Helpers/FileUploadHelper";
import PDFKitService from "@redlof/libs/Classes/PdfKitService";
import PdfMakeService from "@redlof/libs/Classes/PdfMakeService";

export const analysisHandler = async function ({ type, data }: any) {
    let analyzerRequest: any;
    try {
        switch (type) {
            case "analyze": {
                console.log(`File analysing for user ${data.user.email}`);

                const response = data.file ? await _postAnalysis(data) : await AnalyzeClass.sendAnalyzeDataText(data.body);

                if (!response) {
                    throw "analysis failed";
                }

                const displayName = `Document-analysis-${moment().format("YYYY-MM-DD")}.pdf`;

                const analysisResponseData = {
                    generated_analyze_comments: {
                        ...response,
                    },
                    session_id: response?.session_id,
                };

                const pdfMakeService = new PdfMakeService();
                const { doc, buffers } = await pdfMakeService.generateAnalysisPdf(analysisResponseData, data.user.orgId);

                // const pdfService = new PDFKitService();
                // const { doc, buffers } = await pdfService.generateAnalysisPdf(analysisResponseData, data.user.orgId);

                doc.on("end", async () => {
                    const pdfData = Buffer.concat(buffers);

                    const upload: any = {
                        buffer: pdfData,
                        originalname: displayName,
                    };

                    const path = await uploadFile(upload, { type: "pdf", foldername: "analyze_documents" });

                    analyzerRequest = await AnalyserMailRequest.findOne({
                        where: { uuid: data.request_uuid },
                    });

                    analyzerRequest.response_file = path;
                    analyzerRequest.status = "completed";
                    await analyzerRequest.save();

                    await new Bull(`${process.env.REDIS_EMAIL_QUEUE}`).add({
                        type: "send-analyzed-file",
                        data: {
                            user_id: data.user.id,
                            input_file_name: data.file ? data.file.originalname : null,
                            attachments: [
                                {
                                    filename: displayName,
                                    path: `${process.env.AWS_BASE_URL}${path}`,
                                },
                            ],
                        },
                    });

                    console.log(`File analysis completed for user ${data.user.email}`);
                });
                break;
            }

            case "evaluate": {
                console.log(`File evaluating for user ${data.user.email}`);
                const response = await _postEvaluate(data);

                if (!response || !response.session_id) {
                    throw "evaluation failed";
                }

                const displayName = `Document-evaluation-${moment().format("YYYY-MM-DD")}.pdf`;

                const evaluationResponseData = {
                    generated_evaluator_comments: {
                        ...response,
                    },
                    session_id: response?.session_id,
                };

                // const pdfService = new PDFKitService();
                // const { doc, buffers } = await pdfService.generateEvaluationSessionPdf(evaluationResponseData);

                const pdfMakeService = new PdfMakeService();
                const { doc, buffers } = await pdfMakeService.generateEvaluationPdf(evaluationResponseData);

                doc.on("end", async () => {
                    const pdfData = Buffer.concat(buffers);

                    const upload: any = {
                        buffer: pdfData,
                        originalname: displayName,
                    };

                    const path = await uploadFile(upload, { type: "pdf", foldername: "evaluate_documents" });

                    analyzerRequest = await AnalyserMailRequest.findOne({
                        where: { uuid: data.request_uuid },
                    });

                    analyzerRequest.response_file = path;
                    analyzerRequest.status = "completed";
                    await analyzerRequest.save();

                    await new Bull(`${process.env.REDIS_EMAIL_QUEUE}`).add({
                        type: "send-evaluated-file",
                        data: {
                            user_id: data.user.id,
                            input_file_name: data.files ? data.files["proposal_pdf_file"][0].originalname : null,
                            attachments: [
                                {
                                    filename: displayName,
                                    path: `${process.env.AWS_BASE_URL}${path}`,
                                },
                            ],
                        },
                    });

                    console.log(`File evaluation completed for user ${data.user.email}`);
                });

                break;
            }

            default:
                break;
        }
    } catch (err) {
        console.log(`File ${type === "analyze" ? "analysis" : "evaluation"} failed for user ${data.user.email}`);

        if (analyzerRequest) {
            analyzerRequest.status = "completed";
            await analyzerRequest.save();
        }
        return;
    }
};

const _postAnalysis = async (data: any) => {
    const formData = new FormData();

    formData.append("user_id", data.user.id);
    formData.append("user_name", data.user.email);
    formData.append("nature_of_document", data.analyze.nature_of_document);

    if (data.analyze.user_role) formData.append("user_role", data.analyze.user_role);
    if (data.analyze.prompt_labels) {
        formData.append("prompt_labels", data.analyze.prompt_labels.toString());
    } else {
        formData.append("prompt_labels", ["P1", "P2", "P3", "P4", "P5"].toString());
    }

    if (data.user.orgId) {
        formData.append("organization_id", data.user.orgId);
    }

    formData.append("pdf_file", fs.createReadStream(`${process.env.APP_ASSET_PATH}/${data.file.originalname}`));

    const response: any = await AnalyzeClass.sendAnalyzeData(formData);

    // delete the file from local
    fs.unlink(`${process.env.APP_ASSET_PATH}/${data.file.originalname}`, (err) => {
        if (err) console.log(err);
        // File Deleted
        else {
            // console.log("File deleted successfully");
        }
    });

    return response;
};

const _postEvaluate = async (data: any) => {
    const formData = new FormData();

    formData.append("user_id", data.user.id);
    formData.append("user_name", data.user.first_name);
    formData.append("nature_of_document", data.evaluate.nature_of_document);

    if (data.evaluate.identity) {
        formData.append("identity", data.evaluate.identity);
    }

    if (data.evaluate.organisation_id) {
        formData.append("organization_id", data.evaluate.organisation_id);
    }

    if (data.evaluate.org_guideline_id) {
        formData.append("org_guideline_id", data.evaluate.org_guideline_id);
    }

    if (data.evaluate.proposal_type === "pdf") {
        formData.append("proposal_pdf_file", fs.createReadStream(`${process.env.APP_ASSET_PATH}/${data.files["proposal_pdf_file"][0].originalname}`));
    }

    if (data.evaluate.proposal_type === "text") {
        formData.append("proposal_text_input", data.evaluate.proposal_text_input);
    }

    if (data.evaluate.tor_type === "pdf") {
        formData.append("tor_pdf_file", fs.createReadStream(`${process.env.APP_ASSET_PATH}/${data.files["tor_pdf_file"][0].originalname}`));
    }

    if (data.evaluate.tor_type === "text") {
        formData.append("tor_text_input", data.evaluate.tor_text_input);
    }

    const response: any = await EvaluateServiceClass.sendEvaluateData(formData);

    // delete the files from local
    if (data.files) {
        Object.keys(data.files).forEach((key: any) => {
            fs.unlink(`${process.env.APP_ASSET_PATH}/${data.files[key][0].originalname}`, (err) => {
                if (err) {
                    console.log(err);
                } else {
                    // console.log("File deleted successfully");
                }
            });
        });
    }

    return response;
};
