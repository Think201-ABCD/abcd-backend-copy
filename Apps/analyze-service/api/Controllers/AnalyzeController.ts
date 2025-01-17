import { RequestHandler, Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import FormData from "form-data";
import { orderBy } from "lodash";
import { Op } from "sequelize";
import moment from "moment";
import Bull from "bull";
import fs from "fs";

// Helper classes
import { AuthenticatedApiBaseController } from "@redlof/libs/Classes/AuthenticatedApiBaseController";
import { AnalyzeClass } from "@redlof/libs/Classes/AnalyzeServiceClass";
import PdfKitService from "@redlof/libs/Classes/PdfKitService";
import PdfMakeService from "@redlof/libs/Classes/PdfMakeService";

// Helpers functions
import { diskUpload } from "@redlof/libs/Middlewares/MulterUploadMiddleware";
import { throwError } from "@redlof/libs/Exceptions/ValidationException";
import { Validate } from "../Validations/AnalyzeRequest";
import { api } from "@redlof/libs/Helpers/helpers";

// Models
import { AnalyserMailRequest } from "@redlof/libs/Models/Analysis/AnalyserMailRequest";
import { User } from "@redlof/libs/Models/Auth/User";
import { uploadFile } from "@redlof/libs/Helpers/FileUploadHelper";

export class AnalyzeController extends AuthenticatedApiBaseController {
    constructor() {
        super();
        this.initializeRoutes();
    }

    initializeRoutes = () => {
        this.router.route("/upload").post(diskUpload.single("pdf_file"), Validate("postAnalyze"), throwError, this.postAnalyze);
        this.router.route("/upload-text").post(Validate("postAnalyzeText"), throwError, this.postAnalyzeText);
        this.router.route("/sessions").get(this.getSessions);
        this.router.route("/session-data").get(Validate("getSessionData"), throwError, this.getSessionData);
        this.router.route("/feedback").post(Validate("postSessionFeedback"), throwError, this.postSessionFeedback);
        this.router.route("/sessions/:session_id").put(Validate("putSessionTitle"), throwError, this.putSessionTitle);
        this.router.route("/followup").post(Validate("postFollowup"), throwError, this.postFollowup);
        this.router.route("/sessions/:session_id/download").post(Validate("downloadAnalysisData"), throwError, this.downloadAnalysisData);
        this.router.route("/analysis-via-mail").get(this.getAnalysisViaMail);
    };

    postAnalyze: RequestHandler = async (req: Request, res: Response) => {
        if (req.body.send_in_mail) {
            const isAnalysing = await AnalyserMailRequest.findOne({
                where: {
                    user_id: res.locals.user.id,
                    status: { [Op.or]: [{ [Op.ne]: "completed" }, null] },
                    source: "web",
                    type: "analyze",
                    created_at: { [Op.gte]: moment().subtract(10, "minutes").toDate() },
                },
            });

            if (isAnalysing) {
                throw { code: 422, message: "Your file is being analyzed, Please wait before submitting another file" };
            }

            const upload: any = {
                buffer: fs.createReadStream(`${process.env.APP_ASSET_PATH}/${req.file.originalname}`),
                originalname: req.file.originalname,
            };
            const path = await uploadFile(upload, { type: "pdf", foldername: "analyze_documents" });

            const analyzerRequest = await AnalyserMailRequest.create({
                uuid: uuidv4(),
                user_id: res.locals.user.id,
                user_file: path,
                user_file_name: req.file.originalname,
                type: "analyze",
                source: "web",
            });

            await new Bull(`${process.env.REDIS_ANALYSIS_QUEUE}`).add({
                type: "analyze",
                data: { user: res.locals.user, analyze: req.body, file: req.file, request_uuid: analyzerRequest.uuid },
            });

            return api("Analyzed file will be sent to your registered mail id shortly", res, {});
        }
        const formData = new FormData();

        formData.append("user_id", res.locals.user.id);
        formData.append("user_name", res.locals.user.email);
        formData.append("nature_of_document", req.body.nature_of_document);

        if (req.body.user_role) formData.append("user_role", req.body.user_role);
        if (req.body.prompt_labels) {
            formData.append("prompt_labels", req.body.prompt_labels.toString());
        } else {
            formData.append("prompt_labels", ["P1", "P2", "P3", "P4", "P5"].toString());
        }

        if (res.locals.user.orgId) {
            formData.append("organization_id", res.locals.user.orgId);
        }

        formData.append("pdf_file", fs.createReadStream(`${process.env.APP_ASSET_PATH}/${req.file.originalname}`));

        const response: any = await AnalyzeClass.sendAnalyzeData(formData);

        // delete the file from local
        fs.unlink(`${process.env.APP_ASSET_PATH}/${req.file.originalname}`, (err) => {
            if (err) console.log(err);
            // File Deleted
            else {
                // console.log("File deleted successfully");
            }
        });

        if (!response) {
            throw {
                message: "Something went wrong!, please try later",
                code: 422,
            };
        }

        if (res.locals.user.orgId) {
            response.organisation_id = res.locals.user.orgId;
        }

        api("File analyzed successfully", res, response);
    };

    postAnalyzeText: RequestHandler = async (req: Request, res: Response) => {
        let body: any = {
            user_id: res.locals.user.id,
            user_name: res.locals.user.email,
            text_input: req.body.text_input,
            nature_of_document: req.body.nature_of_document,
        };

        if (req.body.user_role) body.user_role = req.body.user_role;
        if (req.body.prompt_labels) {
            body.prompt_labels = req.body.prompt_labels.toString();
        } else {
            body.prompt_labels = ["P1", "P2", "P3", "P4", "P5"].toString();
        }

        if (res.locals.user.orgId) {
            body.organization_id = res.locals.user.orgId;
        }

        if (req.body.send_in_mail) {
            const isAnalysing = await AnalyserMailRequest.findOne({
                where: {
                    user_id: res.locals.user.id,
                    status: { [Op.or]: [{ [Op.ne]: "completed" }, null] },
                    source: "web",
                    type: "analyze",
                    created_at: { [Op.gte]: moment().subtract(10, "minutes").toDate() },
                },
            });

            if (isAnalysing) {
                throw { code: 422, message: "Your file is being analyzed, Please wait before submitting another file" };
            }

            const fileName = `${uuidv4()}.txt`;
            fs.writeFileSync(`${process.env.APP_ASSET_PATH}/${fileName}`, req.body.text_input);

            const upload: any = {
                buffer: fs.createReadStream(`${process.env.APP_ASSET_PATH}/${fileName}`),
                originalname: fileName,
            };
            const path = await uploadFile(upload, { type: "txt", foldername: "analyze_documents" });
            fs.unlinkSync(`${process.env.APP_ASSET_PATH}/${fileName}`);

            const analyzerRequest = await AnalyserMailRequest.create({
                uuid: uuidv4(),
                user_id: res.locals.user.id,
                user_file: path,
                user_file_name: fileName,
                type: "analyze",
                source: "web",
            });

            await new Bull(`${process.env.REDIS_ANALYSIS_QUEUE}`).add({
                type: "analyze",
                data: { body: body, user: res.locals.user, request_uuid: analyzerRequest.uuid },
            });

            return api("Analyzed file will be sent to your registered mail id shortly", res, {});
        }

        const response: any = await AnalyzeClass.sendAnalyzeDataText(body);

        if (!response) {
            throw {
                message: "Something went wrong!, please try later",
                code: 422,
            };
        }

        if (res.locals.user.orgId) {
            response.organisation_id = res.locals.user.orgId;
        }

        api("Text analyzed successfully", res, response);
    };

    getSessions: RequestHandler = async (req: Request, res: Response) => {
        const data = {
            user_id: res.locals.user.id,
        };
        const response = await AnalyzeClass.getAnalyzeSessions(data);

        if (!response) {
            throw {
                message: "Something went wrong!, please try later",
                code: 422,
            };
        }

        const sortedData = orderBy(response, "created_at", "desc");

        api("Fetched analyze sessions successfully", res, sortedData);
    };

    getSessionData: RequestHandler = async (req: Request, res: Response) => {
        const data = {
            user_id: res.locals.user.id,
            session_id: req.query.session_id,
        };

        const response: any = await AnalyzeClass.getAnalyzeSessionData(data);

        if (!response) {
            throw {
                message: "Something went wrong!, please try later",
                code: 422,
            };
        }

        if (res.locals.user.orgId) {
            response.organisation_id = res.locals.user.orgId;
        }

        api("Fetched analyze sessions successfully", res, response);
    };

    postSessionFeedback: RequestHandler = async (req: Request, res: Response) => {
        const data: any = {
            user_id: res.locals.user.id,
            session_id: req.body.session_id,
            feedback: req.body.feedback,
        };

        if (req.body.feedback_note) {
            data.feedback_note = req.body.feedback_note;
        }

        if (req.body.response_id) {
            data.response_id = req.body.response_id;
        }

        if (req.body.section) {
            data.section = req.body.section;
        }

        const response: any = await AnalyzeClass.postAnalyzeSectionFeedback(data);

        if (!response) {
            throw {
                message: "Something went wrong!, please try later",
                code: 422,
            };
        }

        api("Feedback added successfully", res, response);
    };

    putSessionTitle: RequestHandler = async (req: Request, res: Response) => {
        const data = {
            user_id: res.locals.user.id,
            session_id: req.params.session_id,
            session_title: req.body.session_title,
        };

        const response: any = await AnalyzeClass.putAnalyzeSessionTitle(data);

        if (!response) {
            throw {
                message: "Something went wrong!, please try later",
                code: 422,
            };
        }

        api("Session title updated successfully", res, {});
    };

    postFollowup: RequestHandler = async (req: Request, res: Response) => {
        const data: any = {
            user_id: res.locals.user.id,
            session_id: req.body.session_id,
            query: req.body.question,
        };

        if (req.body.section) {
            data.section = req.body.section;
        }

        const response: any = await AnalyzeClass.postAnalyzeFollowup(data);

        if (!response) {
            throw {
                message: "Something went wrong!, please try later",
                code: 422,
            };
        }

        api("Feedback added successfully", res, response);
    };

    downloadAnalysisData: RequestHandler = async (req: Request, res: Response) => {
        const data = {
            user_id: res.locals.user.id,
            session_id: req.params.session_id,
        };

        let response: any;
        if (req.body.data) {
            response = req.body.data;
        } else {
            response = await AnalyzeClass.getAnalyzeSessionData(data);
        }

        if (!response) {
            throw {
                message: "Something went wrong!, please try later",
                code: 422,
            };
        }

        const fileName = response.title ? response.title : "analysis_data";

        try {
            const orgId = res.locals.user.orgId;
            const pdfMakeService = new PdfMakeService();
            const { doc, buffers } = await pdfMakeService.generateAnalysisPdf(response, orgId);

            doc.on("end", () => {
                let pdfData = Buffer.concat(buffers);
                res.contentType("application/pdf").attachment(`${fileName}.pdf`);
                res.send(pdfData);
            });
        } catch (err) {
            throw { message: "Something went wrong! Try again later", code: 500 };
        }
    };

    getAnalysisViaMail: RequestHandler = async (req: Request, res: Response) => {
        const analyisViaMail = await AnalyserMailRequest.findAll({
            include: {
                model: User,
                as: "user",
                attributes: ["id", "first_name", "last_name", "email", "photo"],
            },
            order: [["created_at", "DESC"]],
            attributes: ["id", "uuid", "user_file_name", "response_file", "created_at"],
        });

        api("", res, analyisViaMail);
    };
}
