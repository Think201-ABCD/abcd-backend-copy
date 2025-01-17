import { RequestHandler, Request, Response } from "express";
import { Parser } from "json2csv";
import { groupBy } from "lodash";
import ExcelJS from "exceljs/dist/es5";

// Helpers
import { AuthenticatedApiBaseController } from "@redlof/libs/Classes/AuthenticatedApiBaseController";
import { throwError } from "@redlof/libs/Exceptions/ValidationException";
import { api } from "@redlof/libs/Helpers/helpers";
import { authorize } from "@redlof/libs/Middlewares/AuthenticationMiddleware";
import { Validate } from "../Validations/CockpitRequest";
import { CockpitServiceClass } from "@redlof/libs/Classes/CockpitServiceClass";
import { CockpitHelperClass } from "@redlof/libs/Classes/CockpitHelperClass";

// Models

export class CockpitController extends AuthenticatedApiBaseController {
    constructor() {
        super();
        this.initializeRoutes();
    }

    // Initialise the routes
    initializeRoutes = () => {
        this.router.route("/prompts").get(authorize(["role-cockpit-admin"]), Validate("getPrompts"), throwError, this.getPrompts);
        this.router.route("/prompts/:prompt_label").put(authorize(["role-cockpit-admin"]), Validate("putPrompts"), throwError, this.putPrompts);
        this.router.route("/analyzer_comments_summary/prompts").get(authorize(["role-cockpit-admin"]), Validate("getAnalyzerSummaryPrompts"), throwError, this.getAnalyzerSummaryPrompts);
        this.router.route("/analyzer_comments_summary/prompts").put(authorize(["role-cockpit-admin"]), Validate("putAnalyzerSummaryPrompts"), throwError, this.putAnalyzerSummaryPrompts);
        this.router.route("/proposal_summary/prompts").get(authorize(["role-cockpit-admin"]), Validate("getProposalSummaryPrompts"), throwError, this.getProposalSummaryPrompts);
        this.router.route("/proposal_summary/prompts").put(authorize(["role-cockpit-admin"]), Validate("putProposalSummaryPrompts"), throwError, this.putProposalSummaryPrompts);
        this.router.route("/prompts/download").get(authorize(["role-cockpit-admin"]), this.downloadPrompts);
    };

    getPrompts: RequestHandler = async (req: Request, res: Response) => {
        const query: any = {};

        if (req.query.prompt_label) {
            query.prompt_label = req.query.prompt_label;
        }

        if (req.query.doc_type) {
            query.doc_type = req.query.doc_type;
        }

        const response = await CockpitServiceClass.getPrompts(query);

        if (!response) {
            throw { message: "Something went wrong. Try again later", code: 422 };
        }

        api("Prompts fetched successfully", res, response);
    };

    putPrompts: RequestHandler = async (req: Request, res: Response) => {
        if (req.params.prompt_label === ":prompt_label") {
            throw { message: "Please provide a prompt label", code: 422 };
        }

        const params = {
            prompt_label: req.params.prompt_label,
        };

        const response = await CockpitServiceClass.updatePrompts(req.body, params);

        if (!response) {
            throw { message: "Something went wrong. Try again later", code: 422 };
        }

        api("Prompt updated successfully", res, response);
    };

    getAnalyzerSummaryPrompts: RequestHandler = async (req: Request, res: Response) => {
        const data = {
            doc_type: req.query.doc_type ? req.query.doc_type : null,
        };

        const response = await CockpitServiceClass.getAnalyzerCommentsSummaryPrompts(data);

        if (!response) {
            throw { message: "Something went wrong. Try again later", code: 422 };
        }

        api("Analyzer summary prompts fetched successfully", res, response);
    };

    putAnalyzerSummaryPrompts: RequestHandler = async (req: Request, res: Response) => {
        const response = await CockpitServiceClass.updateAnalyzerCommentsSummaryPrompts(req.body);

        if (!response) {
            throw { message: "Something went wrong. Try again later", code: 422 };
        }

        api("Analyzer summary prompts updated successfully", res, response);
    };

    getProposalSummaryPrompts: RequestHandler = async (req: Request, res: Response) => {
        const data = {
            doc_type: req.query.doc_type ? req.query.doc_type : null,
        };

        const response = await CockpitServiceClass.getAnalyzerProposalSummaryPrompts(data);

        if (!response) {
            throw { message: "Something went wrong. Try again later", code: 422 };
        }
        api("Proposal summary prompts fetched successfully", res, response);
    };

    putProposalSummaryPrompts: RequestHandler = async (req: Request, res: Response) => {
        const response = await CockpitServiceClass.updateProposalSummaryPrompts(req.body);

        if (!response) {
            throw { message: "Something went wrong. Try again later", code: 422 };
        }

        api("Proposal summary prompts updated successfully", res, response);
    };

    downloadPrompts: RequestHandler = async (req: Request, res: Response) => {
        const workbook = new ExcelJS.Workbook();

        // Add proposal summary prompts (P-IS) data to workbook
        const proposalSummaryPrompts: any = await CockpitServiceClass.getAnalyzerProposalSummaryPrompts({});

        if (!proposalSummaryPrompts) {
            throw { message: "Something went wrong. Try again later", code: 422 };
        }

        const proposalSummaryWorksheet = workbook.addWorksheet("P-IS");
        proposalSummaryWorksheet.columns = CockpitHelperClass.getSummaryPromptsHeaders();

        const proposalSummaryWorksheetData: any = {};
        proposalSummaryPrompts.prompts.forEach((data: any) => {
            proposalSummaryWorksheetData[data.doc_type] = data.proposal_prompt;
        });

        proposalSummaryWorksheet.addRows([proposalSummaryWorksheetData]);

        // Add analyzer summary prompts (P0) data to workbook
        const analyzerSummaryPrompts: any = await CockpitServiceClass.getAnalyzerCommentsSummaryPrompts({});

        if (!analyzerSummaryPrompts) {
            throw { message: "Something went wrong. Try again later", code: 422 };
        }

        const analyzerSummaryWorksheet = workbook.addWorksheet("P0");
        analyzerSummaryWorksheet.columns = CockpitHelperClass.getSummaryPromptsHeaders();

        const analyzerSummaryWorksheetData: any = {};
        analyzerSummaryPrompts.prompts.forEach((data: any) => {
            analyzerSummaryWorksheetData[data.doc_type] = data.summary_prompt;
        });

        analyzerSummaryWorksheet.addRows([analyzerSummaryWorksheetData]);

        // Add prompts (P1 - P9) data to workbook
        const response: any = await CockpitServiceClass.getPrompts({});

        if (!response) {
            throw { message: "Something went wrong. Try again later", code: 422 };
        }

        const promptsGroupedByLabel = groupBy(response.prompts, "prompt_label");

        Object.keys(promptsGroupedByLabel).forEach((label: any) => {
            const worksheetData = [];
            const worksheet = workbook.addWorksheet(label);

            worksheet.columns = CockpitHelperClass.getPromptsHeaders();

            const row1: any = { prompt_type: "Base prompt" };
            const row2: any = { prompt_type: "Customization prompt" };

            promptsGroupedByLabel[label].forEach((data: any) => {
                row1[data.doc_type] = data.base_prompt;
                row2[data.doc_type] = data.customization_prompt;
            });

            worksheetData.push(row1);
            worksheetData.push(row2);

            worksheet.addRows(worksheetData);
        });

        const responseSheet = await workbook.xlsx.writeBuffer();
        const fileName = `Analyzer Prompts.xlsx`;

        res.attachment(fileName);
        res.send(responseSheet);
    };
}
