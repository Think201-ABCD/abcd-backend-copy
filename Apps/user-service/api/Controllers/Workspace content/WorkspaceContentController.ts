import { RequestHandler } from "express";
import { api } from "@redlof/libs/Helpers/helpers";
import { v4 as uuidv4 } from "uuid";
import { Workspace } from "@redlof/libs/Models/Workspace/Workspace";
import { UserWorkspaceContent } from "@redlof/libs/Models/Workspace/UserWorkspaceContent";
import { User } from "@redlof/libs/Models/Auth/User";
import { determineModel, validateWorkspaceAccess } from "@redlof/libs/Helpers/WorkspaceHelper";
import { Topic } from "@redlof/libs/Models/Topic/Topic";
import { BehaviourTopic } from "@redlof/libs/Models/Behaviour/BehaviourTopic";
import { Behaviour } from "@redlof/libs/Models/Behaviour/Behaviour";
import { Op } from "sequelize";
import { getFilteredWorkspaceContent } from "@redlof/libs/Helpers/DataFilterHelper";
import { OrganisationMember } from "@redlof/libs/Models/Organisation/OrganisationMember";
import { UserWorkspacePin } from "@redlof/libs/Models/Workspace/UserWorkspacePins";
import _ from "lodash";

import { convertUuidToId, getModelInclude } from "../../Helper/EntityHelper";

export const getWorkspaceEntities: RequestHandler = async (req, res) => {
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

    const workspace = await Workspace.findOne({
        where: { uuid: uuid },
        attributes: ["id", "uuid"],
    });

    if (!workspace) {
        throw { message: "Workspace does not exist", code: 422 };
    }

    // Check if the logged user is member of the workspace
    await validateWorkspaceAccess(workspace, res.locals.user);

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
                    user_id: res.locals.user.id,
                    workspace_id: workspace.id,
                    workspace_content_id: workspaceEntity.id,
                },
            });

            if (workspaceEntity.entity_id) {
                entity = await model.findOne({
                    where: { id: workspaceEntity.entity_id },
                    attributes: ["uuid", "title"],
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

    const sortedWorkspaceEntities = _.orderBy(filteredWorkspaceEntities, ["pin", "created_at"], ["desc", "desc"]);

    return api("Workspace entities list successfully sent", res, { WorkspaceEntities: sortedWorkspaceEntities });
};

export const getWorkspaceEntity: RequestHandler = async (req, res) => {
    const uuid = req.params.uuid;
    const entity_uuid = req.params.entity_uuid;

    // Check if workspace exist

    const workspace = await Workspace.findOne({
        where: { uuid: uuid },
        attributes: ["id", "uuid"],
    });

    if (!workspace) {
        throw { message: "Workspace does not exist", code: 422 };
    }

    await validateWorkspaceAccess(workspace, res.locals.user);

    // Fetch entity detail for the workspace

    const workspaceEntity: any = await UserWorkspaceContent.findOne({
        where: { workspace_id: workspace.id, uuid: entity_uuid },
        attributes: ["uuid", "type", "logo", "title", "description", "images", "files", "entity_id"],
    });

    if (workspaceEntity.images) {
        const updatedImage = workspaceEntity.images.map((images) => `${process.env.AWS_BASE_URL}` + `${images}`);

        workspaceEntity.images = updatedImage;
    }

    if (workspaceEntity.files) {
        const updatedFile = workspaceEntity.files.map((files) => `${process.env.AWS_BASE_URL}` + `${files}`);

        workspaceEntity.files = updatedFile;
    }

    return api("Workspace entity detail sent", res, { workspaceEntity });
};

export const putWorkspaceEntity: RequestHandler = async (req, res) => {
    const uuid = req.params.uuid;
    const entity_uuid = req.params.entity_uuid;

    // Check if workspace exist

    const workspace = await Workspace.findOne({
        where: { uuid: uuid },
        attributes: ["id", "uuid"],
    });

    if (!workspace) {
        throw { message: "Workspace does not exist", code: 422 };
    }

    // Check if logged user is member of the workspace
    await validateWorkspaceAccess(workspace, res.locals.user);

    // Update the entity content

    const workspaceEntity = await UserWorkspaceContent.findOne({
        where: { workspace_id: workspace.id, uuid: entity_uuid },
    });

    if (!workspaceEntity) {
        throw { message: "Workspace not found", code: 422 };
    }

    workspaceEntity.description = req.body.description ? req.body.description : workspaceEntity.description;
    workspaceEntity.images = req.body.images ? req.body.images : workspaceEntity.images;
    workspaceEntity.files = req.body.files ? req.body.files : workspaceEntity.files;

    await workspaceEntity.save();

    return api("Workspace entity updated successfully", res, {});
};

export const addExistingWorkspaceContents: RequestHandler = async (req, res) => {
    const uuids = req.body.content_uuids;

    const workspace = await Workspace.findOne({ where: { uuid: req.params.uuid } });

    if (!workspace) {
        throw { message: "Workspace not found", code: 422 };
    }

    await validateWorkspaceAccess(workspace, res.locals.user);

    const model = determineModel(req.body.entity_slug);

    const contents = await model.findAll({ where: { uuid: { [Op.in]: uuids } } });

    if (contents.length != uuids.length) {
        throw { message: "Selected item does not belongs to the category", code: 422 };
    }

    // Check if any content is already added
    const contentIds = contents.map((content) => content.id);

    const userWorkspaceContents = await UserWorkspaceContent.findAll({
        where: { workspace_id: workspace.id, type: req.body.entity_slug, entity_id: { [Op.in]: contentIds } },
    });

    const userWorkspaceContentEntityIDs = userWorkspaceContents.map((data) => data.entity_id);
    const userWorkspaceContentsToAdd = contents.filter((content: any) => !userWorkspaceContentEntityIDs.includes(content.id));

    // Make entry in user workspace content table
    const userWorkspaceContentCreate = userWorkspaceContentsToAdd.map((content: any) => {
        return {
            workspace_id: workspace.id,
            entity_id: content.id,
            user_id: res.locals.user.id,
            type: req.body.entity_slug,
            uuid: uuidv4(),
            logo: content.getDataValue("logo"),
            title: content.title,
        };
    });

    await UserWorkspaceContent.bulkCreate(userWorkspaceContentCreate);

    return api("Workspace contents added", res, {});
};

export const addCustomWorkspaceContent: RequestHandler = async (req, res) => {
    const workspace_uuid = req.params.uuid;

    const title = req.body.title;
    const logo = req.body.logo;
    const category = req.body.category;
    const description = req.body.description;
    const images = req.body.images;
    const files = req.body.files;

    const workspace = await Workspace.findOne({ where: { uuid: workspace_uuid } });

    if (!workspace) {
        throw { message: "Workspace not found", code: 422 };
    }

    await validateWorkspaceAccess(workspace, res.locals.user);

    await UserWorkspaceContent.create({
        uuid: uuidv4(),
        workspace_id: workspace.id,
        user_id: res.locals.user.id,
        title: title,
        type: category,
        logo: logo,
        description: description,
        images: images,
        files: files,
    })

    return api("Custom workspace content added", res, {});
};

export const deleteWorkspaceEntity: RequestHandler = async (req, res) => {
    const uuid = req.params.uuid;
    const entity_uuid = req.params.entity_uuid;

    // Check if workspace exist

    const workspace = await Workspace.findOne({
        where: { uuid: uuid },
        attributes: ["id", "uuid"],
    });

    if (!workspace) {
        throw { message: "Workspace does not exist", code: 422 };
    }

    // Check if logged user is member of the workspace
    await validateWorkspaceAccess(workspace, res.locals.user);

    // Delete the entity

    await UserWorkspaceContent.destroy({
        where: { workspace_id: workspace.id, uuid: entity_uuid },
    });

    return api("Deleted successfully", res, {});
};

export const getTopics: RequestHandler = async (req, res) => {
    const topics = await Topic.findAll({ attributes: ["uuid", "title"] });

    return api("Topic list", res, { topics });
};

export const getBehaviors: RequestHandler = async (req, res) => {
    const uuid = req.body.topic_uuids;

    // Get the topic id
    const topics = await Topic.findAll({ where: { uuid: { [Op.in]: uuid } }, attributes: ["id", "title"] });

    if (topics.length <= 0) {
        throw { message: "Topic does not exist", code: 422 };
    }

    const topicIds = topics.map((topic) => topic.id);

    // Find behavior ids related to that topic

    const behaviorTopics = await BehaviourTopic.findAll({
        where: { topic_id: { [Op.in]: topicIds } },
        attributes: ["behaviour_id", "topic_id"],
    });

    const behaviorIds = behaviorTopics.map((behaviorTopic) => behaviorTopic.behaviour_id);

    const behaviors = await Behaviour.findAll({
        where: { id: { [Op.in]: behaviorIds } },
        attributes: ["uuid", "title"],
    });

    return api("Topic list", res, { behaviors });
};

export const getEmailMemberList: RequestHandler = async (req, res) => {
    const email = req.body.email ? req.body.email.toLowerCase() : "";

    const organisationMember = await OrganisationMember.findOne({
        where: { user_id: res.locals.user.id, type: "admin" },
    });

    if (!organisationMember) {
        return api("Member list", res, { memberList: [] });
    }

    const members = await OrganisationMember.findAll({
        where: {
            organisation_id: organisationMember.organisation_id,
            user_id: { [Op.ne]: organisationMember.user_id },
            status: "active",
        },
    });

    if (members.length <= 0) {
        return api("Member list", res, { memberList: [] });
    }

    const memberIds = members.map((member) => member.user_id);

    const memberList = await User.findAll({
        where: { id: { [Op.in]: memberIds }, email: { [Op.like]: `${email}%` } },
        attributes: ["uuid", "first_name", "last_name", "email"],
    });

    return api("Member list", res, { memberList });
};

export const addPin: RequestHandler = async (req, res) => {
    const workspace_uuid = req.params.uuid;
    const content_uuid = req.params.content_uuid;

    // Check if workspace exist
    const workspace = await Workspace.findOne({ where: { uuid: workspace_uuid } });

    if (!workspace) {
        throw { message: "Workspace not found", code: 422 };
    }

    // check if content exist
    const workspaceContent = await UserWorkspaceContent.findOne({
        where: { uuid: content_uuid, workspace_id: workspace.id },
    });

    if (!workspaceContent) {
        throw { message: "Content not found", code: 422 };
    }

    // Check if user has access to pin
    await validateWorkspaceAccess(workspace, res.locals.user);

    // Make entry in user workspace pin table
    const pinEntry = await UserWorkspacePin.findOne({
        where: { user_id: res.locals.user.id, workspace_id: workspace.id, workspace_content_id: workspaceContent.id },
    });

    if (pinEntry) {
        throw { message: "The content is already pinned", code: 422 };
    }

    await UserWorkspacePin.create({
        user_id: res.locals.user.id,
        workspace_id: workspace.id,
        workspace_content_id: workspaceContent.id,
    });

    return api("Content pinned successfully", res, {});
};

export const removePin: RequestHandler = async (req, res) => {
    const workspace_uuid = req.params.uuid;
    const content_uuid = req.params.content_uuid;

    // Check if workspace exist
    const workspace = await Workspace.findOne({ where: { uuid: workspace_uuid } });

    if (!workspace) {
        throw { message: "Workspace not found", code: 422 };
    }

    // check if content exist
    const workspaceContent = await UserWorkspaceContent.findOne({
        where: { uuid: content_uuid, workspace_id: workspace.id },
    });

    if (!workspaceContent) {
        throw { message: "Content not found", code: 422 };
    }

    // Check if user has access to pin
    await validateWorkspaceAccess(workspace, res.locals.user);

    // Delete pin entry
    await UserWorkspacePin.destroy({
        where: {
            user_id: res.locals.user.id,
            workspace_id: workspace.id,
            workspace_content_id: workspaceContent.id,
        },
    });

    return api("Content unpinned successfully", res, {});
};

// Filter logic

export const getEntities: RequestHandler = async (req, res) => {
    const searched_entity = req.body.searched_entity;
    let filter_data = req.body.filter_data;

    // convert uuid to id

    if (filter_data) {
        filter_data = await convertUuidToId(filter_data);
    }

    const model = determineModel(searched_entity);

    const filterInclude = filter_data ? getModelInclude(searched_entity, filter_data) : [];

    const entitylist = await model.findAll({
        where: { status: "published" },
        attributes: ["uuid", "id", "logo", "title", "status"],
        include: filterInclude,
    });

    // remove include data from the entity list

    const filteredEntityList = entitylist.map((entity) => {
        delete entity.dataValues.topics;
        delete entity.dataValues.barriers;
        delete entity.dataValues.behaviours;
        delete entity.dataValues.collaterals;
        delete entity.dataValues.knowledges;
        delete entity.dataValues.outcomes;
        delete entity.dataValues.sub_outcomes;
        delete entity.dataValues.proposals;
        delete entity.dataValues.solutions;
        delete entity.dataValues.sub_topics;

        return entity;
    });

    return api("Entity list received successfully", res, filteredEntityList);
};
