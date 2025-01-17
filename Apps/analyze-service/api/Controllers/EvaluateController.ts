import { RequestHandler, Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import { orderBy } from "lodash";
import FormData from "form-data";
import { Op } from "sequelize";
import moment from "moment";
import Bull from "bull";
import fs from "fs";

// Middlewares
import { authorize } from "@redlof/libs/Middlewares/AuthenticationMiddleware";
import { diskUpload } from "@redlof/libs/Middlewares/MulterUploadMiddleware";
import { throwError } from "@redlof/libs/Exceptions/ValidationException";
import { Validate } from "../Validations/EvaluateRequest";

// Helpers
import { AuthenticatedApiBaseController } from "@redlof/libs/Classes/AuthenticatedApiBaseController";
import { AnalyserMailRequest } from "@redlof/libs/Models/Analysis/AnalyserMailRequest";
import { EvaluateServiceClass } from "@redlof/libs/Classes/EvaluateServiceClass";
import { uploadFile } from "@redlof/libs/Helpers/FileUploadHelper";
import PdfMakeService from "@redlof/libs/Classes/PdfMakeService";
import PdfKitService from "@redlof/libs/Classes/PdfKitService";
import { api } from "@redlof/libs/Helpers/helpers";

export class EvaluateController extends AuthenticatedApiBaseController {
    constructor() {
        super();
        this.initializeRoutes();
    }

    initializeRoutes = () => {
        this.router.route("/").post(diskUpload.fields([{ name: "proposal_pdf_file" }, { name: "tor_pdf_file" }]), authorize(["role-all"]), Validate("postEvaluate"), throwError, this.postEvaluate);
        this.router.route("/sessions").get(this.getSessions);
        this.router.route("/sessions/:session_id").get(authorize(["role-all"]), Validate("getSessionData"), throwError, this.getSessionData);
        this.router.route("/sessions/:session_id").put(Validate("putSessionTitle"), throwError, this.putSessionTitle);
        this.router.route("/sessions/:session_id/download").post(authorize(["role-all"]), Validate("downloadSessionData"), throwError, this.downloadSessionData);
        this.router.route("/feedback").post(authorize(["role-all"]), Validate("postFeedback"), throwError, this.postFeedback);
        this.router.route("/followup").post(authorize(["role-all"]), Validate("postFollowup"), throwError, this.postFollowup);
        this.router.route("/organisation_ids").get(authorize(["role-all"]), this.getOrganisationIds);
    };

    postEvaluate: RequestHandler = async (req: Request, res: Response) => {

        if (req.body.send_in_mail) {
            const isEvaluating = await AnalyserMailRequest.findOne({
                where: {
                    user_id: res.locals.user.id,
                    status: { [Op.or]: [{ [Op.ne]: "completed" }, null] },
                    source: "web",
                    type: "evaluate",
                    created_at: { [Op.gte]: moment().subtract(10, "minutes").toDate() },
                },
            });

            if (isEvaluating) {
                throw { code: 422, message: "Your file is being evaluated, Please wait before submitting another file" };
            }

            const upload: any = {
                buffer: fs.createReadStream(`${process.env.APP_ASSET_PATH}/${req.files["proposal_pdf_file"][0].originalname}`),
                originalname: req.files["proposal_pdf_file"][0].originalname,
            };
            const path = await uploadFile(upload, { type: "pdf", foldername: "evaluate_documents" });

            const evaluateRequest = await AnalyserMailRequest.create({
                uuid: uuidv4(),
                user_id: res.locals.user.id,
                user_file: path,
                user_file_name: req.files["proposal_pdf_file"][0].originalname,
                type: "evaluate",
                source: "web",
            });

            await new Bull(`${process.env.REDIS_ANALYSIS_QUEUE}`).add({
                type: "evaluate",
                data: { user: res.locals.user, evaluate: req.body, files: req.files, request_uuid: evaluateRequest.uuid },
            });

            return api("Evaluated file will be sent to your registered mail id shortly", res, {});
        }

        const formData = new FormData();

        formData.append("user_id", res.locals.user.id);
        formData.append("user_name", res.locals.user.first_name);
        formData.append("nature_of_document", req.body.nature_of_document);

        if (req.body.identity) {
            formData.append("identity", req.body.identity);
        }

        if (req.body.organisation_id) {
            formData.append("organization_id", req.body.organisation_id);
        }

        if (req.body.org_guideline_id) {
            formData.append("org_guideline_id", req.body.org_guideline_id);
        }

        if (req.body.proposal_type === "pdf") {
            formData.append("proposal_pdf_file", fs.createReadStream(`${process.env.APP_ASSET_PATH}/${req.files["proposal_pdf_file"][0].originalname}`));
        }

        if (req.body.proposal_type === "text") {
            formData.append("proposal_text_input", req.body.proposal_text_input);
        }

        if (req.body.tor_type === "pdf") {
            formData.append("tor_pdf_file", fs.createReadStream(`${process.env.APP_ASSET_PATH}/${req.files["tor_pdf_file"][0].originalname}`));
        }

        if (req.body.tor_type === "text") {
            formData.append("tor_text_input", req.body.tor_text_input);
        }

        console.log("Calling ther API")
        const data: any = await EvaluateServiceClass.sendEvaluateData(formData);

        // delete the files from local
        if (req.files) {
            Object.keys(req.files).forEach((key: any) => {
                fs.unlink(`${process.env.APP_ASSET_PATH}/${req.files[key][0].originalname}`, (err) => {
                    if (err) {
                        console.log(err);
                    } else {
                        // console.log("File deleted successfully");
                    }
                });
            });
        }

        console.log("data", data)

        // if (!data || !data.session_id) {
        //     throw {
        //         message: "Something went wrong!, please try later",
        //         code: 422,
        //     };
        // }

        api("File evaluated successfully", res, data);
    };

    getSessions: RequestHandler = async (req: Request, res: Response) => {
        const data = {
            user_id: res.locals.user.id,
        };
        const response: any = await EvaluateServiceClass.getEvaluateSessions(data);

        if (!response) {
            throw {
                message: "Something went wrong!, please try later",
                code: 422,
            };
        }

        const sortedData = orderBy(response?.sessions, "created_at", "desc");

        api("Fetched evaluator sessions successfully", res, sortedData);
    };

    getSessionData: RequestHandler = async (req: Request, res: Response) => {
        const body = {
            user_id: res.locals.user.id,
            session_id: req.params.session_id,
        };

        const data: any = await EvaluateServiceClass.getSessionData(body);

        if (!data || !data.session_id) {
            throw {
                message: "Something went wrong!, please try later",
                code: 422,
            };
        }

        api("Session data fetched successfully", res, data);
    };

    putSessionTitle: RequestHandler = async (req: Request, res: Response) => {
        const data = {
            user_id: res.locals.user.id,
            session_id: req.params.session_id,
            session_title: req.body.session_title,
        };

        const response: any = await EvaluateServiceClass.putEvaluateSessionTitle(data);

        if (!response) {
            throw {
                message: "Something went wrong!, please try later",
                code: 422,
            };
        }

        api("Session title updated successfully", res, response);
    };

    downloadSessionData: RequestHandler = async (req: Request, res: Response) => {
        const data = {
            user_id: res.locals.user.id,
            session_id: req.params.session_id,
        };

        let response: any;
        if (req.body.data) {
            response = req.body.data;
        } else {
            response = await EvaluateServiceClass.getSessionData(data);
        }

        if (!response) {
            throw {
                message: "Something went wrong!, please try later",
                code: 422,
            };
        }

        const fileName = response.title ? response.title : "evaluation_data";

        try {
            // const pdfKitService = new PdfKitService();
            // const { doc, buffers } = await pdfKitService.generateEvaluationSessionPdf(response);

            const pdfMakeService = new PdfMakeService();
            const { doc, buffers } = await pdfMakeService.generateEvaluationPdf(response);

            doc.on("end", () => {
                const pdfData = Buffer.concat(buffers);
                res.contentType("application/pdf").attachment(`${fileName}.pdf`);
                res.send(pdfData);
            });
        } catch (err) {
            throw { message: "Something went wrong! Try again later", code: 500 };
        }
    };

    postFeedback: RequestHandler = async (req: Request, res: Response) => {
        const body: any = {
            user_id: res.locals.user.id,
            session_id: req.body.session_id,
            feedback: req.body.feedback,
        };

        if (req.body.feedback_note) {
            body.feedback_note = req.body.feedback_note;
        }

        if (req.body.response_id) {
            body.response_id = req.body.response_id;
        }

        if (req.body.section) {
            body.section = req.body.section;
        }

        const data: any = await EvaluateServiceClass.sendFeedback(body);

        if (!data) {
            throw {
                message: "Something went wrong!, please try later",
                code: 422,
            };
        }

        return api("Feedback submited successfully", res, data);
    };

    postFollowup: RequestHandler = async (req: Request, res: Response) => {
        const body: any = {};

        body.user_id = res.locals.user.id;
        body.session_id = req.body.session_id;
        body.query = req.body.query;

        if (req.body.section) {
            body.section = req.body.section;
        }

        const data: any = await EvaluateServiceClass.postEvaluateFollowup(body);

        if (!data.session_id || !data.response_id) {
            throw {
                message: "Something went wrong!, please try later",
                code: 422,
            };
        }

        return api("Successfull", res, data);
    };

    getOrganisationIds: RequestHandler = async (req: Request, res: Response) => {
        const response = await EvaluateServiceClass.getOrganisationIds();

        if (!response) {
            throw {
                message: "Something went wrong!, please try later",
                code: 422,
            };
        }
        api("Organisation ids fetched successfully", res, response);
    };
}
