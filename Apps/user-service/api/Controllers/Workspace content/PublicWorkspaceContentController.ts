import { RequestHandler } from "express";
import { api, apiError } from "@redlof/libs/Helpers/helpers";
import { Workspace } from "@redlof/libs/Models/Workspace/Workspace";
import { UserWorkspaceContent } from "@redlof/libs/Models/Workspace/UserWorkspaceContent";
import { User } from "@redlof/libs/Models/Auth/User";
import { UserWorkspacePin } from "@redlof/libs/Models/Workspace/UserWorkspacePins";
import { determineModel } from "@redlof/libs/Helpers/WorkspaceHelper";
import { orderBy, groupBy } from "lodash";
import { getFilteredWorkspaceContent } from "@redlof/libs/Helpers/DataFilterHelper";
import { Op, where } from "sequelize";
import { Knowledge } from "@redlof/libs/Models/Knowledge/Knowledge";
import { Collateral } from "@redlof/libs/Models/Collateral/Collateral";
import { Course } from "@redlof/libs/Models/CourseLibrary/Course";
import { Organisation } from "@redlof/libs/Models/Organisation/Organisation";
import { Behaviour } from "@redlof/libs/Models/Behaviour/Behaviour";
import { BehaviourCountry } from "@redlof/libs/Models/Behaviour/BehaviourCountry";
import { KnowledgeCountry } from "@redlof/libs/Models/Knowledge/KnowledgeCountry";
import { CollateralCountry } from "@redlof/libs/Models/Collateral/CollateralCountry";
import { Barrier } from "@redlof/libs/Models/Barrier/Barrier";
import { BarrierCategory } from "@redlof/libs/Models/Barrier/BarrierCategory";
import { Solution } from "@redlof/libs/Models/Solution/Solution";
import { SolutionCategory } from "@redlof/libs/Models/Solution/SolutionCategory";

export const getWorkspaceDetail: RequestHandler = async (req, res) => {
    const uuid = req.params.uuid;

    let workspace: any = await Workspace.findOne({
        where: { uuid: uuid },
        include: [
            {
                model: UserWorkspaceContent,
                as: "entities",
                include: [{ model: User, as: "user", attributes: ["first_name", "last_name"] }],
            },
        ],
    });

    if (!workspace) {
        throw { message: "Workspace not found", code: 422 };
    }

    const updatedEntities = await Promise.all(
        await workspace.entities.map(async (entity) => {
            let entityData = null;

            const model = determineModel(entity.type);

            if (entity.images) {
                const updatedImage = entity.images.map((images) => `${process.env.AWS_BASE_URL}` + `${images}`);

                entity.images = updatedImage;
            }

            if (entity.files) {
                const updatedFile = entity.files.map((files) => `${process.env.AWS_BASE_URL}` + `${files}`);

                entity.files = updatedFile;
            }

            if (!entity.logo.includes(process.env.AWS_BASE_URL)) {
                entity.logo = `${process.env.AWS_BASE_URL}` + `${entity.logo}`;
            }

            const pinEntry = await UserWorkspacePin.findOne({
                where: {
                    workspace_id: workspace.id,
                    workspace_content_id: entity.id,
                },
            });

            if (entity.entity_id) {
                entityData = await model.findOne({
                    where: { id: entity.entity_id },
                    attributes: ["uuid", "title"],
                });
            }

            return {
                ...entity.dataValues,
                entity: entityData,
                custom: entity.entity_id ? false : true,
                pin: pinEntry ? true : false,
                created_at: pinEntry ? pinEntry.created_at : entity.created_at,
            };
        })
    );

    const sortedEntities = orderBy(updatedEntities, ["pin", "created_at"], ["desc", "desc"]);

    workspace = workspace.toJSON();

    workspace.entities = sortedEntities;

    return api("Workspace details sent successfully", res, { workspace });
};

export const getWorkspaceContents: RequestHandler = async (req, res) => {
    const uuid = req.params.uuid;

    let userQuery: any = {};
    let contentQuery: any = {};

    if (req.query.added_by) {
        userQuery.uuid = { [Op.in]: req.query.added_by };
    }

    if (req.query.category) {
        contentQuery.type = { [Op.in]: req.query.category };
    }

    const name: any = req.query.s ? req.query.s : "";

    // Get workspace id from uuid

    const workspace: any = await Workspace.findOne({
        where: { uuid: uuid },
        attributes: ["id", "uuid", "name", "description", "logo", "banner", "updated_at"],
        include: [
            {
                model: UserWorkspaceContent,
                as: "entities",
                where: { type: { [Op.or]: ["behaviour", "topic"] } },
                required: false,
            },
        ],
    });

    if (!workspace) {
        throw { message: "Workspace does not exist", code: 422 };
    }

    if (!req.query?.behaviour_ids?.length && workspace.entities.length) {
        const workspaceBehaviours = workspace.entities.filter((entity) => entity.type === "behaviour");
        if (workspaceBehaviours.length) {
            req.query.behaviour_ids = [workspaceBehaviours[0].entity_id];
        }
    }

    // Fetch all the entities for the workspace

    const workspaceEntities: any = await UserWorkspaceContent.findAll({
        where: { workspace_id: workspace.id, ...contentQuery, title: { [Op.iLike]: `%${name.trim()}%` } },
        attributes: ["id", "uuid", "type", "logo", "title", "description", "images", "files", "entity_id", "created_at"],
        include: [{ model: User, as: "user", where: userQuery, attributes: ["uuid", "id", "first_name", "last_name"] }],
    });

    const updatedWorkspaceEntities = await Promise.all(
        await workspaceEntities.map(async (workspaceEntity) => {
            let entity = null;

            const model = determineModel(workspaceEntity.type);

            if (workspaceEntity.images) {
                const updatedImage = workspaceEntity.images.map((images) => `${process.env.AWS_BASE_URL}` + `${images}`);

                workspaceEntity.images = updatedImage;
            }

            if (workspaceEntity.files) {
                const updatedFile = workspaceEntity.files.map((files) => `${process.env.AWS_BASE_URL}` + `${files}`);

                workspaceEntity.files = updatedFile;
            }

            if (!workspaceEntity.logo.includes(process.env.AWS_BASE_URL)) {
                workspaceEntity.logo = `${process.env.AWS_BASE_URL}` + `${workspaceEntity.logo}`;
            }

            const pinEntry = await UserWorkspacePin.findOne({
                where: {
                    workspace_id: workspace.id,
                    workspace_content_id: workspaceEntity.id,
                },
            });

            if (workspaceEntity.entity_id) {
                const attributes = ["id", "uuid", "title"];
                const include = [];
                if (model === Knowledge || model === Collateral) {
                    attributes.push("impact");
                }

                if (model === Knowledge) {
                    attributes.push("impact");
                    const query: any = {};
                    if (req.query?.country_id) {
                        query.country_id = req.query.country_id;
                    }
                    include.push({
                        model: KnowledgeCountry,
                        as: "knowledge_countries",
                        where: query,
                    });
                }

                if (model === Collateral) {
                    attributes.push("impact");
                    const query: any = {};
                    if (req.query?.country_id) {
                        query.country_id = req.query.country_id;
                    }
                    include.push({
                        model: CollateralCountry,
                        as: "collateral_countries",
                        where: query,
                    });
                }

                if (model === Course) {
                    attributes.push("course_overview", "start_date", "end_date", "certification");
                    include.push({
                        model: Organisation,
                        as: "organisation",
                        attributes: ["id", "name", "logo"],
                    });
                }

                if (model === Behaviour) {
                    const query: any = {};
                    if (req.query?.country_id) {
                        query.country_id = req.query.country_id;
                    }
                    include.push({
                        model: BehaviourCountry,
                        as: "behaviour_countries",
                        where: query,
                    });
                }

                if (model === Barrier) {
                    include.push({
                        model: BarrierCategory,
                        as: "category",
                    });
                }

                entity = await model.findOne({
                    where: { id: workspaceEntity.entity_id },
                    attributes: attributes,
                    include: include,
                });
            }

            return {
                ...workspaceEntity.dataValues,
                logo: workspaceEntity.logo,
                entity: entity,
                custom: workspaceEntity.entity_id ? false : true,
                pin: pinEntry ? true : false,
                created_at: pinEntry ? pinEntry.created_at : workspaceEntity.created_at,
            };
        })
    );

    const filteredWorkspaceEntities = await getFilteredWorkspaceContent(req.query, updatedWorkspaceEntities);

    const sortedWorkspaceEntities = orderBy(filteredWorkspaceEntities, ["pin", "created_at"], ["desc", "desc"]);

    const groupedEntities = groupBy(sortedWorkspaceEntities, "type");

    return api("Workspace entities list successfully sent", res, { workspace: workspace, WorkspaceEntities: groupedEntities });
};

export const getWorkspaceEntityDetail: RequestHandler = async (req, res) => {
    const uuid = req.params.uuid;
    const entity_uuid = req.params.entity_uuid;
    let entityData = null;

    let workspace: any = await Workspace.findOne({
        where: { uuid: uuid },
    });

    if (!workspace) {
        throw { message: "Workspace not found", code: 422 };
    }

    let workspaceEntity: any = await UserWorkspaceContent.findOne({
        where: { workspace_id: workspace.id, uuid: entity_uuid },
        include: [{ model: User, as: "user", attributes: ["first_name", "last_name"] }],
    });

    if (workspaceEntity.images) {
        const updatedImage = workspaceEntity.images.map((images) => `${process.env.AWS_BASE_URL}` + `${images}`);

        workspaceEntity.images = updatedImage;
    }

    if (workspaceEntity.files) {
        const updatedFile = workspaceEntity.files.map((files) => `${process.env.AWS_BASE_URL}` + `${files}`);

        workspaceEntity.files = updatedFile;
    }

    const model = determineModel(workspaceEntity.type);

    const pinEntry = await UserWorkspacePin.findOne({
        where: {
            workspace_id: workspace.id,
            workspace_content_id: workspaceEntity.id,
        },
    });

    if (workspaceEntity.entity_id) {
        entityData = await model.findOne({
            where: { id: workspaceEntity.entity_id },
            attributes: ["uuid", "title"],
        });
    }

    workspaceEntity = workspaceEntity.toJSON();
    workspace = workspace.toJSON();

    workspaceEntity.pin = pinEntry ? true : false;
    workspaceEntity.custom = workspaceEntity.entity_id ? false : true;

    workspace.entities = [workspaceEntity];

    return api("Workspace entity details sent successfully", res, { workspace });
};
