import { Request, RequestHandler, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import { Parser } from "json2csv";
import parseCSV from "csvtojson";
import { Op } from "sequelize";

// Helper classes
import { ApiBaseController } from "@redlof/libs/Classes/ApiBaseController";

// Helper functions
import { authorize } from "@redlof/libs/Middlewares/AuthenticationMiddleware";
import { upload } from "@redlof/libs/Middlewares/MulterUploadMiddleware";
import { throwError } from "@redlof/libs/Exceptions/ValidationException";
import { Validate } from "../Validations/PersonaDataRequest";
import { api, apiException } from "@redlof/libs/Helpers/helpers";

// Dummpu API data
import { validateTaskDump, validateToolDump } from "@redlof/libs/Helpers/PersonaValidationHelper";

// Models
import { Task, TaskCreationAttributes } from "@redlof/libs/Models/Persona/Task";
import { Tool, ToolCreationAttributes } from "@redlof/libs/Models/Persona/Tool";
import { Persona } from "@redlof/libs/Models/Persona/Persona";
import { PersonaTask } from "@redlof/libs/Models/Persona/PersonaTask";
import { PersonaTaskStep } from "@redlof/libs/Models/Persona/PersonaTaskStep";

export class PersonaDataController extends ApiBaseController {
    constructor() {
        super();
        this.initializeRoutes();
    }

    initializeRoutes = () => {
        this.router.route("/tasks").get(authorize(["role-all"]), Validate("getTasks"), throwError, this.getTasks);
        this.router.route("/tools").get(authorize(["role-all"]), Validate("getTools"), throwError, this.getTools);
        this.router.route("/tasks/:task_uuid/steps").get(authorize(["role-all"]), Validate("getTaskSteps"), throwError, this.getTaskSteps);

        // admin routes
        this.router.route("/tools/dump").post(authorize(["role-admin"]), upload.single("file"), Validate("dumpCSVFile"), throwError, this.postToolDump);
        this.router.route("/tasks/dump").post(authorize(["role-admin"]), upload.single("file"), Validate("dumpCSVFile"), throwError, this.postTasksDump);
        this.router.route("/tasks/:task_uuid").put(authorize(["role-admin"]), Validate("putTask"), throwError, this.putTask);
        this.router.route("/tasks/:task_uuid").delete(authorize(["role-admin"]), Validate("deleteTask"), throwError, this.deleteTask);
        this.router.route("/tools/download").get(authorize(["role-admin"]), this.downloadToolData);
    };

    getTasks: RequestHandler = async (req: Request, res: Response) => {
        const include = [];

        if (req.query.persona_uuid) {
            const personaUUID = req.query.persona_uuid as string;
            const persona = await Persona.findOne({ where: { uuid: personaUUID } });

            if (!persona) {
                throw { message: "Persona not found", code: 404, report: false };
            }

            include.push({
                model: PersonaTask,
                as: "task_personas",
                where: { persona_id: persona.id },
                required: true,
                attributes: ["select_default"],
                include: [
                    {
                        model: PersonaTaskStep,
                        as: "task_steps",
                        attributes: ["tool_id", "id"],
                    },
                ],
            });
        }

        const tasks = await Task.findAll({
            include: include,
        });

        const responseData = JSON.parse(JSON.stringify(tasks));

        if (req.query.persona_uuid) {
            responseData.forEach((task: any) => {
                const select_default = task.task_personas[0].select_default;
                const tool_ids = task.task_personas[0].task_steps.filter((step) => step.tool_id).map((step) => Number(step.tool_id));

                task.persona_task = {
                    select_default: select_default,
                    tool_ids: tool_ids,
                };

                delete task.task_personas;
            });
        }

        api("Tasks fetched successfully", res, responseData);
    };

    getTools: RequestHandler = async (req: Request, res: Response) => {
        const tools = await Tool.findAll();
        api("Tools fetched successfully", res, tools);
    };

    getTaskSteps: RequestHandler = async (req: Request, res: Response) => {
        const personaUUID = req.query.persona_uuid as string;
        const persona = await Persona.findOne({
            where: { uuid: personaUUID },
            attributes: ["id"],
        });

        if (!persona) {
            throw { message: "Selected persona not found", code: 404, report: false };
        }

        const taskUUID = req.params.task_uuid as string;
        const task = await Task.findOne({
            where: { uuid: taskUUID },
            attributes: { exclude: ["created_at", "updated_at", "deleted_at"] },
            include: {
                model: PersonaTask,
                as: "task_personas",
                where: { persona_id: persona.id },
                attributes: ["id", "persona_id", "name", "description"],
                required: true,
                include: [
                    {
                        model: PersonaTaskStep,
                        as: "task_steps",
                        attributes: { exclude: ["created_at", "updated_at", "deleted_at"] },
                        required: true,
                        include: [
                            {
                                model: Tool,
                                as: "tool",
                                required: false,
                                attributes: { exclude: ["created_at", "updated_at", "deleted_at"] },
                            },
                        ],
                    },
                ],
            },
            order: [["task_personas", "task_steps", "sequence", "ASC"]],
        });

        if (!task) {
            throw { message: "Selected task which is mapped to given persona not found", code: 404, report: false };
        }

        api("Task steps fetched successfully", res, task);
    };

    // admin controller

    postToolDump: RequestHandler = async (req: Request, res: Response) => {
        const dump = (await parseCSV().fromString(req.file.buffer.toString())) as Array<ToolCreationAttributes>;

        req.body.dump = dump;
        const validationErrors = await validateToolDump(req);

        if (validationErrors.length > 0) {
            return apiException("", res, validationErrors, 422);
        }

        const existingToolSulgs = await Tool.findAll({
            attributes: ["slug"],
        }).then((tools) => tools.map((tool) => tool.slug));

        const incommingToolSulgs = dump.map((tool) => tool.slug);
        const commonSlugs = incommingToolSulgs.filter((slug) => existingToolSulgs.includes(slug));

        if (commonSlugs.length) {
            throw { message: `Tool slugs: ${commonSlugs.toString()}, already exists.`, code: 422, report: false };
        }

        const toolCreationData: Array<ToolCreationAttributes> = [];

        for (const item of dump) {
            toolCreationData.push({
                uuid: uuidv4(),
                slug: item.slug,
                name: item.name,
                config_name: item.config_name,
                description: item.description,
            });
        }

        await Tool.bulkCreate(toolCreationData);

        api("Tools dumped successfully", res, {});
    };

    postTasksDump: RequestHandler = async (req: Request, res: Response) => {
        const dump = (await parseCSV().fromString(req.file.buffer.toString())) as Array<TaskCreationAttributes>;

        req.body.dump = dump;
        const validationErrors = await validateTaskDump(req);

        if (validationErrors.length > 0) {
            return apiException("", res, validationErrors, 422);
        }

        const existingTaskSulgs = await Task.findAll({
            attributes: ["slug"],
        }).then((tasks) => tasks.map((task) => task.slug));

        const incommingTaskSulgs = dump.map((task) => task.slug);
        const commonSlugs = incommingTaskSulgs.filter((slug) => existingTaskSulgs.includes(slug));

        if (commonSlugs.length) {
            throw { message: `Task slugs: ${commonSlugs.toString()}, already exists.`, code: 422, report: false };
        }

        const taskCreationData: Array<TaskCreationAttributes> = [];

        for (const item of dump) {
            taskCreationData.push({
                uuid: uuidv4(),
                slug: item.slug,
                name: item.name,
                config_name: item.config_name,
                description: item.description,
            });
        }

        await Task.bulkCreate(taskCreationData);

        api("Tasks dumped successfully", res, { taskCreationData });
    };

    putTask: RequestHandler = async (req: Request, res: Response) => {
        const task = await Task.findOne({
            where: { uuid: req.params.task_uuid },
        });

        if (!task) {
            throw { code: 404, message: "Task not found", report: false };
        }

        task.name = req.body.name ? req.body.name : task.name;
        task.config_name = req.body.config_name ? req.body.config_name : task.config_name;
        task.description = req.body.description ? req.body.description : task.description;
        task.icon = req.body.icon ? req.body.icon : task.getDataValue("icon");

        await task.save();

        api("Task updated successfully", res, task);
    };

    deleteTask: RequestHandler = async (req: Request, res: Response) => {
        const task = await Task.findOne({
            where: { uuid: req.params.task_uuid },
        });

        if (!task) {
            throw { code: 404, message: "Task not found", report: false };
        }

        // logic to delete all the mapped contents to task
        const personaTasks = await PersonaTask.findAll({
            where: { task_id: task.id },
            attributes: ["id"],
        });

        const personaTaskIds = personaTasks.map((item) => item.id);
        const personaTaskSteps = await PersonaTaskStep.findAll({
            where: { persona_task_id: { [Op.in]: personaTaskIds } },
            attributes: ["id"],
        });

        const personaTaskStepIds = personaTaskSteps.map((item) => item.id);
        await PersonaTaskStep.destroy({
            where: { id: { [Op.in]: personaTaskStepIds } },
        });

        await PersonaTask.destroy({
            where: { id: { [Op.in]: personaTaskIds } },
        });

        await task.destroy();

        api("Task deleted successfully", res, { task, personaTasks, personaTaskIds, personaTaskSteps, personaTaskStepIds });
    };

    downloadToolData: RequestHandler = async (req: Request, res: Response) => {
        const tools = await Tool.findAll();

        const fields: any = [
            { label: "Slug", value: "slug" },
            { label: "Name", value: "name" },
            { label: "Config Name", value: "config_name" },
            { label: "Icon", value: "icon" },
            { label: "Description", value: "description" },
        ];

        const data: any = tools.map((tool: any) => {
            return {
                slug: tool.slug,
                name: tool.name,
                config_name: tool.config_name,
                icon: tool.getDataValue("icon") ? tool.icon : "N/A",
                description: tool.description,
            };
        });

        const json2csv = new Parser({ fields });
        const csv = json2csv.parse(data);

        res.header("Content-Type", "text/csv");
        res.attachment("ABCD-Tools.csv");

        return res.send(csv);
    };
}
