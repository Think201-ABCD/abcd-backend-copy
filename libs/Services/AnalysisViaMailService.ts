import { v4 as uuidv4 } from "uuid";
import FormData from "form-data";
import moment from "moment";
import path from "path";
import fs from "fs";

// Models
import { AnalyserMailRequest } from "@redlof/libs/Models/Analysis/AnalyserMailRequest";
import { User } from "../Models/Auth/User";

// Classes
import { AnalyzeClass } from "@redlof/libs/Classes/AnalyzeServiceClass";
import { EvaluateServiceClass } from "../Classes/EvaluateServiceClass";
import PdfMakeService from "../Classes/PdfMakeService";
import IMAPService from "../Classes/IMAPService";

// Helpers
import { RedlofQueue } from "@redlof/libs/System/RedlofQueue";
import { TelegramHelper } from "../System/TelegramHelper";
import { uploadFile } from "../Helpers/FileUploadHelper";

export default class AnalysisViaMailService {
    static init = async () => {
        const imapWrapper = new IMAPService();

        await imapWrapper.connect();

        const box: any = await imapWrapper.openBox("INBOX", false);

        AnalysisViaMailService._listenToMail(imapWrapper);
    };

    static _listenToMail = (imapWrapper) => {
        const imap = imapWrapper.getImap();

        imap.on("mail", (numNewMsgs) => {
            const searchCondition = [["OR", ["SUBJECT", `${process.env.ANALYZER_MAIL_SUBJECT}`], ["SUBJECT", process.env.EVALUATOR_MAIL_SUBJECT]], "UNSEEN"];
            imap.search(searchCondition, function (err, result) {
                if (err) {
                    throw err;
                }

                if (result.length > 0) {
                    //result is a array containing the seqno(s) of mails matching the given criteria
                    const f = imap.fetch(result, { bodies: "" });

                    f.on("message", async (msg, seqno) => {
                        const email: any = await imapWrapper.parseMail(msg, seqno);
                        const analysisType = email.subject === process.env.ANALYZER_MAIL_SUBJECT ? "analyze" : "evaluate";

                        // marking the mail as read
                        imap.addFlags(email.uid, ["\\Deleted"], function (err) {
                            if (err) {
                                console.log(err);
                            }
                        });

                        const userEmail = email.from_address;

                        const user: any = await User.findOne({ where: { email: userEmail } });

                        if (!user) {
                            // user not found mail
                            RedlofQueue.addToQueue(process.env.REDIS_EMAIL_QUEUE, {
                                type: "user-does-not-exist",
                                data: { email: userEmail },
                            });

                            return;
                        }

                        if (email.files.length == 0) {
                            RedlofQueue.addToQueue(process.env.REDIS_EMAIL_QUEUE, {
                                type: "add-attachment",
                                data: {
                                    user_id: user.id,
                                },
                            });

                            return;
                        }

                        if (email.files.length > 4) {
                            RedlofQueue.addToQueue(process.env.REDIS_EMAIL_QUEUE, {
                                type: "analyser-attachment-limit-exceeded",
                                data: {
                                    user_id: user.id,
                                },
                            });

                            return;
                        }

                        const validMimeTypes = ["application/pdf", "text/plain", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
                        const validAttachements = email.files.filter((attachment) => {
                            return attachment.size / 1024 / 1024 < 10 && validMimeTypes.includes(attachment.mimetype);
                        });

                        if (validAttachements == 0) {
                            RedlofQueue.addToQueue(process.env.REDIS_EMAIL_QUEUE, {
                                type: "attachment-validation",
                                data: {
                                    user_id: user.id,
                                },
                            });

                            return;
                        }

                        const promises = [];

                        RedlofQueue.addToQueue(process.env.REDIS_EMAIL_QUEUE, {
                            type: "analyser-quick-reply",
                            data: {
                                type: analysisType,
                                user_id: user.id,
                            },
                        });

                        for (const attachment of validAttachements) {
                            const promise = new Promise(async (resolve, reject) => {
                                try {
                                    const fileName = `${uuidv4()}.${path.extname(attachment.originalname)}`;

                                    if (!fs.existsSync(process.env.APP_TEMP_PATH)) {
                                        fs.mkdirSync(process.env.APP_TEMP_PATH, "0775");
                                    }

                                    fs.writeFile(`${process.env.APP_TEMP_PATH}/${fileName}`, attachment.buffer, (err) => {
                                        if (err) {
                                            console.log(err);
                                        }
                                    });

                                    const upload: any = {
                                        buffer: attachment.buffer,
                                        originalname: attachment.originalname,
                                    };

                                    const foldername = analysisType === "analyze" ? "analyze_documents" : "evaluate_documents";
                                    const url_path = await uploadFile(upload, { type: "file", foldername: foldername });

                                    const analyzerRequest = await AnalyserMailRequest.create({
                                        uuid: uuidv4(),
                                        user_id: user.id,
                                        user_file: url_path,
                                        user_file_name: attachment.originalname,
                                        type: analysisType,
                                        source: "mail",
                                    });

                                    // Analyze or evaluate the file
                                    if (analysisType === "analyze") {
                                        await AnalysisViaMailService._analyzeData(user, analyzerRequest, fileName, attachment.originalname);
                                    } else {
                                        await AnalysisViaMailService._evaluateData(user, analyzerRequest, fileName, attachment.originalname);
                                    }
                                    resolve("success");
                                } catch (err) {
                                    reject(err);
                                }
                            });

                            promises.push(promise);
                        }

                        Promise.all(promises)
                            .then((result) => {
                                console.log(result);
                            })
                            .catch((err) => {
                                console.log(err);
                            });
                    });
                }
            });
        });

        imap.once("error", async function (err) {
            console.log(`IMAP ERROR : ${JSON.stringify(err)}`);

            TelegramHelper.sendToBot(`IMAP ERROR: ${JSON.stringify(err)}`);
        });

        imap.once("end", async function () {
            console.log("Connection ended.. trying to reconnect....");

            TelegramHelper.sendToBot("IMAP CONNECTION DISCONNECTED, TRYING TO RECONNECT...");

            // re-establishing the connection
            AnalysisViaMailService.init();

            TelegramHelper.sendToBot("IMAP CONNECTION RE-ESTABLISHED");
        });
    };

    static _analyzeData = async (user, analyzerRequest, fileName, originalname) => {
        try {
            const formData: any = new FormData();
            formData.append("user_id", user.id);
            formData.append("user_name", user.email);
            formData.append("prompt_labels", ["P1", "P2", "P3", "P4", "P5"].toString());
            formData.append("pdf_file", fs.createReadStream(`${process.env.APP_TEMP_PATH}/${fileName}`));

            const data: any = await AnalyzeClass.sendAnalyzeData(formData);

            fs.unlink(`${process.env.APP_TEMP_PATH}/${fileName}`, (err) => {
                if (err) {
                    console.log(err);
                } else {
                    console.log("File deleted successfully");
                }
            });

            if (!data) throw "Analysis failed";

            const displayName = `Document-analysis-${moment().format("YYYY-MM-DD")}.pdf`;

            const analysisResponseData = {
                generated_analyze_comments: {
                    ...data,
                },
                session_id: data?.session_id,
            };

            const pdfMakeService = new PdfMakeService();
            const { doc, buffers } = await pdfMakeService.generateAnalysisPdf(analysisResponseData, null);

            doc.on("end", async () => {
                const pdfData = Buffer.concat(buffers);

                const upload: any = {
                    buffer: pdfData,
                    originalname: displayName,
                };

                const url_path = await uploadFile(upload, { type: "pdf", foldername: "analyze_documents" });

                analyzerRequest.response_file = url_path;
                analyzerRequest.status = "completed";

                await analyzerRequest.save();

                RedlofQueue.addToQueue(process.env.REDIS_EMAIL_QUEUE, {
                    type: "analysis-complete",
                    data: {
                        user_id: user.id,
                        input_file_name: originalname,
                        attachments: [
                            {
                                filename: displayName,
                                path: `${process.env.AWS_BASE_URL}${url_path}`,
                            },
                        ],
                    },
                });
            });
        } catch (error) {
            analyzerRequest.status = "completed";
            await analyzerRequest.save();

            console.log(error);
            throw "Analysis failed";
        }
    };

    static _evaluateData = async (user, analyzerRequest, fileName, originalname) => {
        try {
            const formData = new FormData();
            formData.append("user_id", user.id);
            formData.append("user_name", user.first_name);
            formData.append("proposal_pdf_file", fs.createReadStream(`${process.env.APP_TEMP_PATH}/${fileName}`));
            formData.append("tor_pdf_file", fs.createReadStream(`${process.env.APP_TEMP_PATH}/${fileName}`));

            const data: any = await EvaluateServiceClass.sendEvaluateData(formData);

            fs.unlink(`${process.env.APP_TEMP_PATH}/${fileName}`, (err) => {
                if (err) {
                    console.log(err);
                } else {
                    console.log("File deleted successfully");
                }
            });

            if (!data) throw "Evaluation failed";

            const displayName = `Document-evaluation-${moment().format("YYYY-MM-DD")}.pdf`;

            const evaluationResponseData = {
                generated_evaluator_comments: {
                    ...data,
                },
                session_id: data?.session_id,
            };

            const pdfMakeService = new PdfMakeService();
            const { doc, buffers } = await pdfMakeService.generateEvaluationPdf(evaluationResponseData);

            doc.on("end", async () => {
                const pdfData = Buffer.concat(buffers);

                const upload: any = {
                    buffer: pdfData,
                    originalname: displayName,
                };

                const url_path = await uploadFile(upload, { type: "pdf", foldername: "evaluate_documents" });

                analyzerRequest.response_file = url_path;
                analyzerRequest.status = "completed";

                await analyzerRequest.save();

                RedlofQueue.addToQueue(process.env.REDIS_EMAIL_QUEUE, {
                    type: "evaluation-complete",
                    data: {
                        user_id: user.id,
                        input_file_name: originalname,
                        attachments: [
                            {
                                filename: displayName,
                                path: `${process.env.AWS_BASE_URL}${url_path}`,
                            },
                        ],
                    },
                });
            });
        } catch (error) {
            analyzerRequest.status = "completed";
            await analyzerRequest.save();

            console.log(error);
            throw "Evaluation failed";
        }
    };
}
