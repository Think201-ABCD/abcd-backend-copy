import { Request, RequestHandler, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import parseCSV from "csvtojson";
import { uniq, unionBy } from "lodash";
import { Op } from "sequelize";

// Helper Classes
import { ApiBaseController } from "@redlof/libs/Classes/ApiBaseController";

// Helper Functions
import { upload } from "@redlof/libs/Middlewares/MulterUploadMiddleware";
import { authorize } from "@redlof/libs/Middlewares/AuthenticationMiddleware";
import { throwError } from "@redlof/libs/Exceptions/ValidationException";
import { Validate } from "../Validations/PersonaRequest";
import { api, apiException } from "@redlof/libs/Helpers/helpers";
import { validatePersonaDump, validatePersonaMappingDump } from "@redlof/libs/Helpers/PersonaValidationHelper";

// Dummy API data
import { taskStepKeys } from "@redlof/libs/Constants/personaData";

// Models
import { Persona, PersonaCreationAttributes } from "@redlof/libs/Models/Persona/Persona";
import { PersonaTaskStep, PersonaTaskStepCreationAttributes } from "@redlof/libs/Models/Persona/PersonaTaskStep";
import { UserPersona } from "@redlof/libs/Models/Persona/UserPersona";
import { PersonaTask } from "@redlof/libs/Models/Persona/PersonaTask";
import { Task } from "@redlof/libs/Models/Persona/Task";
import { Tool } from "@redlof/libs/Models/Persona/Tool";
import { Topic } from "@redlof/libs/Models/Topic/Topic";

export class PersonaController extends ApiBaseController {
    constructor() {
        super();
        this.initializeRoutes();
    }

    initializeRoutes = () => {
        this.router.route("/").get(authorize(["role-all"]), Validate("getPersonas"), throwError, this.getPersonas);
        this.router.route("/settings").post(authorize(["role-all"]), Validate("postPersonaSettings"), throwError, this.postPersonaSettings);
        this.router.route("/settings").get(authorize(["role-all"]), Validate("getPersonaSettings"), throwError, this.getPersonaSettings);
        this.router.route("/:persona_uuid").get(authorize(["role-all"]), Validate("getPersona"), throwError, this.getPersona);

        // admin routes
        this.router.route("/:persona_uuid").put(authorize(["role-admin"]), Validate("putPersonas"), throwError, this.putPersona);
        this.router.route("/:persona_uuid").delete(authorize(["role-admin"]), Validate("deletePersonas"), throwError, this.deletePersonas);

        this.router.route("/dump").post(authorize(["role-admin"]), upload.single("file"), Validate("dumpCSVFile"), throwError, this.postPersonaDump);
        this.router.route("/mapping/dump").post(authorize(["role-admin"]), upload.single("file"), Validate("dumpCSVFile"), throwError, this.postPersonaMappingDump);
    };

    getPersonas: RequestHandler = async (req: Request, res: Response) => {
        const personas = await Persona.findAll({
            include: [
                {
                    model: Task,
                    as: "tasks",
                    through: {
                        attributes: [],
                    },
                    attributes: ["id", "name", "uuid", "slug", "config_name"],
                },
            ],
        });
        api("Personas fetched successfully", res, personas);
    };

    getPersona: RequestHandler = async (req: Request, res: Response) => {
        const persona = await Persona.findOne({
            where: { uuid: req.params.persona_uuid },
        });

        api("Persona details fetched successfully", res, persona);
    };

    postPersonaSettings: RequestHandler = async (req: Request, res: Response) => {
        const persona = await Persona.findOne({
            where: { uuid: req.body.persona_uuid },
            attributes: ["id", "uuid"],
        });

        if (!persona) {
            throw { message: "Persona not found", code: 404, report: false };
        }

        const tasks = await Task.findAll({
            where: { uuid: { [Op.in]: req.body.task_uuids } },
            attributes: ["id", "uuid"],
        });

        if (!tasks.length) {
            throw { message: "Please select atleast one valid task", code: 422, report: false };
        }

        const topics = await Topic.findAll({
            where: { uuid: { [Op.in]: req.body.topic_uuids } },
            attributes: ["id", "uuid"],
        });

        if (!topics.length) {
            throw { message: "Please select atleast one valid topic", code: 422, report: false };
        }

        const task_ids: any = tasks.map((task) => Number(task.id));
        const topic_ids: any = topics.map((topic) => Number(topic.id));

        const [userPersona, created] = await UserPersona.findOrCreate({
            where: {
                user_id: res.locals.user.id,
            },
            defaults: {
                persona_id: persona.id,
                tasks: task_ids,
                topics: topic_ids,
            },
        });

        if (!created) {
            userPersona.persona_id = persona.id;
            userPersona.tasks = task_ids;
            userPersona.topics = topic_ids;

            await userPersona.save();
        }

        api("User persona updated successfully", res, userPersona);
    };

    getPersonaSettings: RequestHandler = async (req: Request, res: Response) => {
        const userPersona = await UserPersona.findOne({
            where: { user_id: res.locals.user.id },
            include: {
                model: Persona,
                as: "persona",
            },
        });

        if (!userPersona) {
            const responaseData = { isPersonaAdded: false, persona: {} };
            return api("User persona not added yet", res, responaseData);
        }

        const taskIds: any = userPersona.tasks;
        const userTasks = await Task.findAll({
            where: { id: { [Op.in]: taskIds } },
        });

        const topicIds: any = userPersona.topics;
        const userTopics = await Topic.findAll({
            where: { id: { [Op.in]: topicIds } },
        });

        // Get tools mapped to tasks selected by user
        const personaTasks: any = await PersonaTask.findAll({
            where: { persona_id: userPersona.persona_id, task_id: { [Op.in]: taskIds } },
            attributes: ["id"],
            include: [
                {
                    model: PersonaTaskStep,
                    as: "task_steps",
                    attributes: ["id"],
                    include: [
                        {
                            model: Tool,
                            as: "tool",
                        },
                    ],
                },
            ],
        });

        const taskSteps = personaTasks.map((personaTask) => personaTask.task_steps);
        const taskStepUnionByTool = unionBy(...taskSteps, "tool.id");

        const tools = taskStepUnionByTool.filter((data) => data.tool).map((data) => data.tool);

        // Get response object
        const responseData = JSON.parse(JSON.stringify(userPersona));
        responseData.isPersonaAdded = true;
        responseData.topic_ids = userPersona.topics;
        responseData.task_ids = userPersona.tasks;
        responseData.topics = userTopics;
        responseData.tasks = userTasks;
        responseData.tools = tools

        api("User persona fetched successfully", res, responseData);
    };

    // admin controllers
    postPersonaDump: RequestHandler = async (req: Request, res: Response) => {
        const dump = (await parseCSV().fromString(req.file.buffer.toString())) as Array<PersonaCreationAttributes>;

        req.body.dump = dump;
        const validationErrors = await validatePersonaDump(req);

        if (validationErrors.length > 0) {
            return apiException("", res, validationErrors, 422);
        }

        const existingPersonaSulgs = await Persona.findAll({
            attributes: ["slug"],
        }).then((personas) => personas.map((persona) => persona.slug));

        const incommingPersonaSulgs = dump.map((persona) => persona.slug);
        const commonSlugs = incommingPersonaSulgs.filter((slug) => existingPersonaSulgs.includes(slug));

        if (commonSlugs.length) {
            throw { message: `Persona slugs: ${commonSlugs.toString()}, already exists.`, code: 422, report: false };
        }

        const personaCreationData: Array<PersonaCreationAttributes> = [];

        for (const item of dump) {
            personaCreationData.push({
                uuid: uuidv4(),
                slug: item.slug,
                name: item.name,
                description: item.description,
            });
        }

        await Persona.bulkCreate(personaCreationData);

        api("Persona dumped successfully", res, {});
    };

    putPersona: RequestHandler = async (req: Request, res: Response) => {
        const persona = await Persona.findOne({
            where: { uuid: req.params.persona_uuid },
        });

        if (!persona) {
            throw { code: 404, message: "Persona not found", report: false };
        }

        persona.name = req.body.name ? req.body.name : persona.name;
        persona.description = req.body.description ? req.body.description : persona.description;
        persona.icon = req.body.icon ? req.body.icon : persona.getDataValue("icon");

        await persona.save();

        api("Persona updated successfully", res, persona);
    };

    deletePersonas: RequestHandler = async (req: Request, res: Response) => {
        const persona = await Persona.findOne({
            where: { uuid: req.params.persona_uuid },
        });

        if (!persona) {
            throw { code: 404, message: "Persona not found", report: false };
        }

        // logic to delete all the mapped contents to persona
        const personaTask = await PersonaTask.findAll({
            where: { persona_id: persona.id },
            attributes: ["id"],
        });

        const personaTaskIds = personaTask.map((item) => item.id);
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

        await persona.destroy();

        api("Persona deleted successfully", res, {});
    };

    postPersonaMappingDump: RequestHandler = async (req: Request, res: Response) => {
        const dump = await parseCSV().fromString(req.file.buffer.toString());

        req.body.dump = dump;
        const validationErrors = await validatePersonaMappingDump(req);

        if (validationErrors.length > 0) {
            return apiException("", res, validationErrors, 422);
        }

        // check all persona exists
        const personaSlugs = uniq(dump.map((data: any) => data.persona_slug));

        const personas = await Persona.findAll({
            attributes: ["id", "slug"],
        });

        const personaSlugArr = personas.map((persona: any) => persona.slug);
        const personaNotExist = personaSlugs.filter((slug) => !personaSlugArr.includes(slug));

        if (personaNotExist.length) {
            throw { message: `Persona ${personaNotExist.toString()} not found`, code: 422, report: false };
        }

        // check all tasks exists
        const taskSlugs = uniq(dump.map((data: any) => data.task_slug));

        const tasks = await Task.findAll({
            attributes: ["id", "slug"],
        });

        const taskSlugArr = tasks.map((task) => task.slug);
        const taskNotExist = taskSlugs.filter((slug) => !taskSlugArr.includes(slug));

        if (taskNotExist.length) {
            throw { message: `Tasks ${taskNotExist.toString()} not found`, code: 422, report: false };
        }

        // check all tools exists
        const toolSlugs = [];
        dump.forEach((data: any) => {
            taskStepKeys.forEach((stepKey) => {
                if (data[stepKey.tool_slug]) {
                    toolSlugs.push(data[stepKey.tool_slug]);
                }
            });
        });
        const uniqToolSlugs = uniq(toolSlugs);

        const tools = await Tool.findAll({
            attributes: ["id", "slug"],
        });

        const toolSlugArr = tools.map((tool) => tool.slug);
        const toolNotExist = uniqToolSlugs.filter((slug) => !toolSlugArr.includes(slug));

        if (toolNotExist.length) {
            throw { message: `Tools ${toolNotExist.toString()} not found`, code: 422, report: false };
        }

        // Add persona mapping data
        const personaTaskStepCreationData: Array<PersonaTaskStepCreationAttributes> = [];

        for (const item of dump) {
            const currPersona = personas.find((persona) => persona.slug === item.persona_slug);
            const currTask = tasks.find((task) => task.slug === item.task_slug);

            const [personaTask, created] = await PersonaTask.findOrCreate({
                where: {
                    persona_id: currPersona.id,
                    task_id: currTask.id,
                },
                defaults: {
                    select_default: item.select_task_default,
                    name: item.popup_title,
                    description: item.popup_description,
                },
            });

            if (!created) {
                await PersonaTaskStep.destroy({
                    where: { persona_task_id: personaTask.id },
                });

                personaTask.select_default = item.select_task_default;
                personaTask.name = item.popup_title;
                personaTask.description = item.popup_description;

                await personaTask.save();
            }

            for (const stepKey of taskStepKeys) {
                if (!item[stepKey.name]) continue;

                let currToolId = null;
                if (item[stepKey.tool_slug]) {
                    const currTool = tools.find((task) => task.slug === item[stepKey.tool_slug]);
                    currToolId = currTool.id;
                }

                personaTaskStepCreationData.push({
                    persona_task_id: personaTask.id,
                    tool_id: currToolId,
                    sequence: stepKey.sequence,
                    name: item[stepKey.name],
                    description: item[stepKey.description],
                });
            }
        }

        await PersonaTaskStep.bulkCreate(personaTaskStepCreationData);

        api("Persona mappings dumped successfully", res, {});
    };
}
