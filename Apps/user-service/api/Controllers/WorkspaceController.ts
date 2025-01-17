import { RequestHandler } from "express";
import { v4 as uuidv4 } from "uuid";
import { Op } from "sequelize";
import Bull from "bull";

//Helpers
import { api, apiException } from "@redlof/libs/Helpers/helpers";
import { uploadIdenticon } from "@redlof/libs/Helpers/FileUploadHelper";

// Models
import { User } from "@redlof/libs/Models/Auth/User";
import { Workspace } from "@redlof/libs/Models/Workspace/Workspace";
import { WorkspaceMember } from "@redlof/libs/Models/Workspace/WorkspaceMember";
import { getUserOrganisation, validateWorkspaceAccess } from "@redlof/libs/Helpers/WorkspaceHelper";
import { Organisation, organisationCreationAttributes } from "@redlof/libs/Models/Organisation/Organisation";
import { Topic } from "@redlof/libs/Models/Topic/Topic";
import { WorkspaceTopic } from "@redlof/libs/Models/Workspace/WorkspaceTopic";
import { SubTopic } from "@redlof/libs/Models/Topic/SubTopic";
import { Outcome } from "@redlof/libs/Models/Outcome/Outcome";
import { WorkspaceOutcome } from "@redlof/libs/Models/Workspace/WorkspaceOutcome";
import { SubOutcome } from "@redlof/libs/Models/Outcome/SubOutcome";
import { Solution } from "@redlof/libs/Models/Solution/Solution";
import { WorkspaceSolution } from "@redlof/libs/Models/Workspace/WorkspaceSolution";
import { Behaviour } from "@redlof/libs/Models/Behaviour/Behaviour";
import { WorkspaceBehaviour } from "@redlof/libs/Models/Workspace/WorkspaceBehaviour";
import { Barrier } from "@redlof/libs/Models/Barrier/Barrier";
import { WorkspaceBarrier } from "@redlof/libs/Models/Workspace/WorkspaceBarrier";
import { WorkspaceInvitation } from "@redlof/libs/Models/Workspace/WorkspaceInvitation";
import { UserWorkspaceContent } from "@redlof/libs/Models/Workspace/UserWorkspaceContent";
import { Collateral } from "@redlof/libs/Models/Collateral/Collateral";
import { WorkspaceCollateral } from "@redlof/libs/Models/Workspace/WorkspaceCollateral";
import { Knowledge } from "@redlof/libs/Models/Knowledge/Knowledge";
import { WorkspaceKnowledge } from "@redlof/libs/Models/Workspace/WorkspaceKnowledge";
import { Proposal } from "@redlof/libs/Models/ProposalRequest/Proposal";
import { WorkspaceProposal } from "@redlof/libs/Models/Workspace/WorkspaceProposal";
import { SolutionCategory } from "@redlof/libs/Models/Solution/SolutionCategory";
import { Role } from "@redlof/libs/Models/Auth/Role";
import { UserWorkspacePin } from "@redlof/libs/Models/Workspace/UserWorkspacePins";
import { Course } from "@redlof/libs/Models/CourseLibrary/Course";

export const getWorkspaces: RequestHandler = async (req, res) => {
    const query: any = {};

    if (req.query.status) {
        query.status = req.query.status;
    }

    if (req.query.type) {
        query.type = req.query.type;
    }

    if (typeof req.query.showcase === "boolean") {
        if (req.query.showcase) {
            query.showcase = true;
        }else{
            query.showcase = {[Op.not]: true}
        }
    }

    if (!res.locals.roles.includes("role-admin")) {
        // Get only the current user workspaces
        const workspaceId = [...(await WorkspaceMember.findAll({ where: { user_id: res.locals.user.id } }))].map((workspaceMember: any) => workspaceMember.workspace_id);

        query.id = { [Op.in]: workspaceId };
    }

    const workspaces = await Workspace.findAll({
        where: query,
        order: [["created_at", "desc"]],
        include: [
            {
                as: "created_by",
                model: User,
                attributes: ["uuid", "first_name", "last_name", "photo", "status"],
            },
            {
                as: "organisation",
                model: Organisation,
                attributes: ["uuid", "name", "logo", "description", "status"],
            },
        ],
    });

    return api("", res, workspaces);
};

export const postWorkspaces: RequestHandler = async (req, res) => {
    const { name, logo, banner, description, share_text, showcase } = req.body;

    const organisation: organisationCreationAttributes = await getUserOrganisation(res.locals.user.id);

    const workspace = await Workspace.create({
        uuid: uuidv4(),
        added_by: res.locals.user.id,
        organisation_id: res.locals.roles.includes("role-organisation-admin") ? organisation.id : null,
        name,
        logo,
        description,
        banner: banner ? banner : null,
        type: res.locals.roles.includes("role-organisation-admin") ? "organisation" : "personal",
        share_text: share_text ? share_text : "Link to the single view page of the resource",
        showcase: showcase ?? false,
    });

    // Add creator as the part of the workspace
    await WorkspaceMember.create({
        workspace_id: workspace.id,
        user_id: res.locals.user.id,
        organisation_id: organisation.id,
        role: "owner",
    });

    return api("Workspace created successfully.", res, workspace);
};

export const getWorkspace: RequestHandler = async (req, res) => {
    const user_ids: any = [];
    const workspace: any = await Workspace.findOne({
        where: { uuid: req.params.uuid },
        include: [
            {
                as: "created_by",
                model: User,
                attributes: ["uuid", "first_name", "last_name", "photo", "status"],
            },
            {
                model: WorkspaceMember,
                as: "members",
                required: false,
                include: [
                    {
                        attributes: ["uuid", "first_name", "last_name", "email", "phone", "photo", "status", "created_at"],
                        model: User,
                        as: "user",
                        include: [
                            {
                                model: Role,
                                as: "roles",
                                attributes: ["name"],
                            },
                        ],
                        required: false,
                    },
                ],
            },
        ],
    });

    // Get logged user role
    const workspaceMember = await WorkspaceMember.findOne({
        where: { workspace_id: workspace.id, user_id: res.locals.user.id },
    });

    if (!workspaceMember) {
        throw { message: "you are not allowed to access this workspace", code: 422 };
    }

    workspace.setDataValue("access_role", workspaceMember.role);

    workspace.members.map((member: any) => {
        user_ids.push(member.user.uuid);
    });

    if (!workspace) {
        throw { message: "Workspace not found", code: 422 };
    }

    if (!user_ids.includes(res.locals.user.uuid) && res.locals.roles[0] !== "role-admin") {
        return apiException("you are not allowed to access this workspace", res, {}, 500);
    }

    return api("", res, workspace);
};

export const putWorkspace: RequestHandler = async (req, res) => {
    const workspace = await Workspace.findOne({ where: { uuid: req.params.uuid } });

    if (!workspace) {
        throw { message: "workspace not found", code: 422 };
    }
    // Validate the access to add or update the content of the workspace

    const workspaceMember = await WorkspaceMember.findOne({
        where: { workspace_id: workspace.id, user_id: res.locals.user.id, role: { [Op.in]: ["owner", "admin"] } },
    });

    if (!workspaceMember) {
        throw { message: "Invalid access. Please check your access to this action.", code: 422 };
    }

    workspace.name = req.body.name ? req.body.name : workspace.name;
    workspace.logo = req.body.logo ? req.body.logo : workspace.getDataValue("logo");
    workspace.banner = req.body.banner ? req.body.banner : workspace.getDataValue("banner");
    workspace.description = req.body.description ? req.body.description : workspace.description;
    workspace.status = req.body.status ? req.body.status : workspace.status;
    workspace.showcase = req.body.showcase ?? workspace.showcase;

    await workspace.save();

    return api("", res, workspace);
};

export const postMarkAsAdminWorkspaceMember: RequestHandler = async (req, res) => {
    const workspace = await Workspace.findOne({ where: { uuid: req.params.uuid } });

    // if (!workspace)
    //     throw { message: 'workspace not found', code: 422 };

    // // let workspaceMember = await WorkspaceMember.findOne({ where: { organisation_id: workspace.id, user_id: req.params.id } })
    // let workspaceMember = await WorkspaceMember.findAll({ where: { organisation_id: workspace.id, user_id: req.params.id } })

    // if (!workspaceMember)
    //     throw { message: 'Member is not mapped to this workspace', code: 422 };

    // workspaceMember.type = 'admin';

    // await workspaceMember.save();

    return api("Member removed successfully.", res, {});
};

export const deleteWorkspaceMember: RequestHandler = async (req, res) => {
    const workspace = await Workspace.findOne({ where: { uuid: req.params.uuid } });

    if (!workspace) {
        throw { message: "workspace not found", code: 422 };
    }

    // Validate the access to add or update the content of the workspace
    await validateWorkspaceAccess(workspace, res.locals.user);

    await WorkspaceMember.destroy({ where: { id: req.params.id, workspace_id: workspace.id } });

    return api("Member removed successfully.", res, {});
};

// Contents
export const postWorkspaceContents: RequestHandler = async (req, res) => {
    const workspace = await Workspace.findOne({ where: { uuid: req.params.uuid } });

    if (!workspace) {
        throw { message: "workspace not found", code: 422 };
    }

    // Validate the access to add or update the content of the workspace

    await validateWorkspaceAccess(workspace, res.locals.user);

    // From here, will carry out the barrier, solution, behaviour, topics and outcomes mapping

    let createdata: any = {};
    const query: any = { where: { uuid: req.body.entity_uuid } };

    switch (req.body.entity_type) {
        case "topics": {
            const topic = await Topic.findOne(query);

            if (!topic) {
                throw { message: "Topic not found", code: 422 };
            }

            const workspaceContent = await UserWorkspaceContent.findOne({
                where: { workspace_id: workspace.id, entity_id: topic.id },
            });

            if (workspaceContent) {
                throw { message: "Selected topic already added to the workspace.", code: 422 };
            }

            createdata = {
                workspace_id: workspace.id,
                entity_id: topic.id,
                user_id: res.locals.user.id,
                type: "topic",
                uuid: uuidv4(),
                logo: topic.getDataValue("logo"),
                title: topic.title,
            };

            break;
        }
        case "sub_topics": {
            const subtopic = await SubTopic.findOne(query);

            if (!subtopic) {
                throw { message: "Sub-topic not found", code: 422 };
            }

            const workspaceContent = await UserWorkspaceContent.findOne({
                where: { workspace_id: workspace.id, entity_id: subtopic.id },
            });

            if (workspaceContent) {
                throw { message: "Selected sub-topic already added to the workspace.", code: 422 };
            }

            createdata = {
                workspace_id: workspace.id,
                entity_id: subtopic.id,
                user_id: res.locals.user.id,
                type: "sub-topic",
                uuid: uuidv4(),
                logo: subtopic.getDataValue("logo"),
                title: subtopic.title,
            };

            break;
        }
        case "outcomes": {
            const outcome = await Outcome.findOne(query);

            if (!outcome) {
                throw { message: "Outcome not found", code: 422 };
            }

            const workspaceContent = await UserWorkspaceContent.findOne({
                where: { workspace_id: workspace.id, entity_id: outcome.id },
            });

            if (workspaceContent) {
                throw { message: "Selected outcome already added to the workspace.", code: 422 };
            }

            createdata = {
                workspace_id: workspace.id,
                entity_id: outcome.id,
                user_id: res.locals.user.id,
                type: "outcome",
                uuid: uuidv4(),
                logo: outcome.getDataValue("logo"),
                title: outcome.title,
            };

            break;
        }
        case "sub_outcomes": {
            const suboutcome = await SubOutcome.findOne(query);

            if (!suboutcome) {
                throw { message: "Sub-outcome not found", code: 422 };
            }

            const workspaceContent = await UserWorkspaceContent.findOne({
                where: { workspace_id: workspace.id, entity_id: suboutcome.id },
            });

            if (workspaceContent) {
                throw { message: "Selected sub-outcome already added to the workspace.", code: 422 };
            }

            createdata = {
                workspace_id: workspace.id,
                entity_id: suboutcome.id,
                user_id: res.locals.user.id,
                type: "sub-outcome",
                uuid: uuidv4(),
                logo: suboutcome.getDataValue("logo"),
                title: suboutcome.title,
            };

            break;
        }
        case "solutions": {
            const solution = await Solution.findOne(query);

            if (!solution) {
                throw { message: "Solution not found", code: 422 };
            }

            const workspaceContent = await UserWorkspaceContent.findOne({
                where: { workspace_id: workspace.id, entity_id: solution.id },
            });

            if (workspaceContent) {
                throw { message: "Selected solution already added to the workspace.", code: 422 };
            }

            createdata = {
                workspace_id: workspace.id,
                entity_id: solution.id,
                user_id: res.locals.user.id,
                type: "solution",
                uuid: uuidv4(),
                logo: solution.getDataValue("logo"),
                title: solution.title,
            };

            break;
        }
        case "behaviours": {
            const behaviour = await Behaviour.findOne(query);

            if (!behaviour) {
                throw { message: "Behaviour not found", code: 422 };
            }

            const workspaceContent = await UserWorkspaceContent.findOne({
                where: { workspace_id: workspace.id, entity_id: behaviour.id },
            });

            if (workspaceContent) {
                throw { message: "Selected behaviour already added to the workspace.", code: 422 };
            }

            createdata = {
                workspace_id: workspace.id,
                entity_id: behaviour.id,
                user_id: res.locals.user.id,
                type: "behaviour",
                uuid: uuidv4(),
                logo: behaviour.getDataValue("logo"),
                title: behaviour.title,
            };

            break;
        }
        case "barriers": {
            const barrier = await Barrier.findOne(query);

            if (!barrier) {
                throw { message: "Barrier not found", code: 422 };
            }

            const workspaceContent = await UserWorkspaceContent.findOne({
                where: { workspace_id: workspace.id, entity_id: barrier.id },
            });

            if (workspaceContent) {
                throw { message: "Selected barrier already added to the workspace.", code: 422 };
            }

            createdata = {
                workspace_id: workspace.id,
                entity_id: barrier.id,
                user_id: res.locals.user.id,
                type: "barrier",
                uuid: uuidv4(),
                logo: barrier.getDataValue("logo"),
                title: barrier.title,
            };

            break;
        }
        case "collaterals": {
            const collateral = await Collateral.findOne(query);

            if (!collateral) {
                throw { message: "collateral not found", code: 422 };
            }

            const workspaceContent = await UserWorkspaceContent.findOne({
                where: { workspace_id: workspace.id, entity_id: collateral.id },
            });

            if (workspaceContent) {
                throw { message: "Selected collateral already added to the workspace.", code: 422 };
            }

            createdata = {
                workspace_id: workspace.id,
                entity_id: collateral.id,
                user_id: res.locals.user.id,
                type: "collateral-library",
                uuid: uuidv4(),
                logo: collateral.getDataValue("logo"),
                title: collateral.title,
            };

            break;
        }
        case "knowledges": {
            const knowledge = await Knowledge.findOne(query);

            if (!knowledge) {
                throw { message: "knowledge not found", code: 422 };
            }

            const workspaceContent = await UserWorkspaceContent.findOne({
                where: { workspace_id: workspace.id, entity_id: knowledge.id },
            });

            if (workspaceContent) {
                throw { message: "Selected knowledge-library already added to the workspace.", code: 422 };
            }

            createdata = {
                workspace_id: workspace.id,
                entity_id: knowledge.id,
                user_id: res.locals.user.id,
                type: "knowledge-library",
                uuid: uuidv4(),
                logo: knowledge.getDataValue("logo"),
                title: knowledge.title,
            };

            break;
        }
        case "proposals": {
            const proposal = await Proposal.findOne(query);

            if (!proposal) {
                throw { message: "Proposal request not found", code: 422 };
            }

            const workspaceContent = await UserWorkspaceContent.findOne({
                where: { workspace_id: workspace.id, entity_id: proposal.id },
            });

            if (workspaceContent) {
                throw { message: "Selected project and proposal already added to the workspace.", code: 422 };
            }

            createdata = {
                workspace_id: workspace.id,
                entity_id: proposal.id,
                user_id: res.locals.user.id,
                type: "project-and-proposal",
                uuid: uuidv4(),
                logo: proposal.getDataValue("logo"),
                title: proposal.title,
            };

            break;
        }

        case "courses": {
            const course = await Course.findOne(query);

            if (!course) {
                throw { message: "course not found", code: 422 };
            }

            const workspaceContent = await UserWorkspaceContent.findOne({
                where: { workspace_id: workspace.id, entity_id: course.id },
            });

            if (workspaceContent) {
                throw { message: "Selected course-library already added to the workspace.", code: 422 };
            }

            createdata = {
                workspace_id: workspace.id,
                entity_id: course.id,
                user_id: res.locals.user.id,
                type: "course-library",
                uuid: uuidv4(),
                logo: course.getDataValue("banner"),
                title: course.title,
            };

            break;
        }
        default:
            throw { message: "Invalid request.", code: 422 };
    }

    await UserWorkspaceContent.create(createdata);

    return api("Content added to workspace successfully.", res, {});
};

export const getWorkspaceContents: RequestHandler = async (req, res) => {
    let Ids: any;
    const workspace = await Workspace.findOne({ where: { uuid: req.params.uuid } });

    if (!workspace) {
        throw { message: "workspace not found", code: 422 };
    }

    // Validate the access to add or update the content of the workspace
    if (!res.locals.roles.includes("role-admin")) {
        await validateWorkspaceAccess(workspace, res.locals.user);
    }

    let contents: any = {};

    const query: any = { where: { workspace_id: workspace.id } };
    const types = ["proposals", "collaterals", "knowledges", "barriers", "behaviours", "solutions", "outcomes", "sub_outcomes", "topics", "sub_topics"];

    if (req.query.limit) {
        query.limit = Number(req.query.limit);
    }

    for (const type of types) {
        switch (type) {
            case "topics": {
                Ids = [...(await WorkspaceTopic.findAll(query))].map((workspaceTopic) => workspaceTopic.topic_id);

                const topics = await Topic.findAll({
                    attributes: ["uuid", "id", "logo", "title", "status", "created_at"],
                    where: { id: { [Op.in]: Ids } },
                });

                contents = { ...contents, topics };

                break;
            }
            case "sub_topics": {
                Ids = [...(await WorkspaceTopic.findAll(query))].map((workspaceTopic) => workspaceTopic.sub_topic_id);

                const sub_topics = await SubTopic.findAll({
                    attributes: ["uuid", "id", "logo", "title", "status", "created_at"],
                    where: { id: { [Op.in]: Ids } },
                });

                contents = { ...contents, sub_topics };

                break;
            }
            case "outcomes": {
                Ids = [...(await WorkspaceOutcome.findAll(query))].map((workspaceOutcome) => workspaceOutcome.outcome_id);

                const outcomes = await Outcome.findAll({
                    attributes: ["uuid", "id", "logo", "title", "status", "created_at"],
                    where: { id: { [Op.in]: Ids } },
                });

                contents = { ...contents, outcomes };

                break;
            }
            case "sub_outcomes": {
                Ids = [...(await WorkspaceOutcome.findAll(query))].map((workspaceOutcome) => workspaceOutcome.sub_outcome_id);

                const sub_outcomes = await SubOutcome.findAll({
                    attributes: ["uuid", "id", "logo", "title", "status", "created_at"],
                    where: { id: { [Op.in]: Ids } },
                });

                contents = { ...contents, sub_outcomes };

                break;
            }
            case "solutions": {
                Ids = [...(await WorkspaceSolution.findAll(query))].map((workspaceSolution) => workspaceSolution.solution_id);

                const solutions: any = await Solution.findAll({
                    attributes: ["uuid", "id", "logo", "title", "status", "categories", "created_at"],
                    where: { id: { [Op.in]: Ids } },
                });

                const updatedSolutions = await Promise.all(
                    solutions.map(async (solution) => {
                        const categoryDetails = await Promise.all(
                            solution.categories.map(async (categoryId) => {
                                const category = await SolutionCategory.findOne({ where: { id: categoryId } });
                                return category.dataValues;
                            })
                        );

                        return { ...solution.dataValues, categories: categoryDetails };
                    })
                );

                contents = { ...contents, solutions: updatedSolutions };

                break;
            }
            case "behaviours": {
                Ids = [...(await WorkspaceBehaviour.findAll(query))].map((workspaceBehaviour) => workspaceBehaviour.behaviour_id);

                const behaviours = await Behaviour.findAll({
                    attributes: ["uuid", "id", "logo", "title", "status", "created_at"],
                    where: { id: { [Op.in]: Ids } },
                });

                contents = { ...contents, behaviours };

                break;
            }
            case "barriers": {
                Ids = [...(await WorkspaceBarrier.findAll(query))].map((workspaceBarrier) => workspaceBarrier.barrier_id);

                const barriers = await Barrier.findAll({
                    attributes: ["uuid", "id", "logo", "title", "status", "type", "created_at"],
                    include: ["category"],
                    where: { id: { [Op.in]: Ids } },
                });

                contents = { ...contents, barriers };

                break;
            }
            case "collaterals": {
                Ids = [...(await WorkspaceCollateral.findAll(query))].map((workspaceCollateral) => workspaceCollateral.collateral_id);

                const collaterals = await Collateral.findAll({
                    attributes: ["uuid", "id", "logo", "title", "status", "created_at"],
                    where: { id: { [Op.in]: Ids } },
                });

                contents = { ...contents, collaterals };

                break;
            }
            case "knowledges": {
                Ids = [...(await WorkspaceKnowledge.findAll(query))].map((workspaceKnowledge) => workspaceKnowledge.knowledge_id);

                const knowledges = await Knowledge.findAll({
                    attributes: ["uuid", "id", "logo", "title", "status", "created_at"],
                    where: { id: { [Op.in]: Ids } },
                });

                contents = { ...contents, knowledges };

                break;
            }
            case "proposals": {
                Ids = [...(await WorkspaceProposal.findAll(query))].map((workspaceProposal) => workspaceProposal.proposal_id);

                const proposals = await Proposal.findAll({
                    attributes: ["uuid", "id", "logo", "title", "status", "created_at"],
                    where: { id: { [Op.in]: Ids } },
                });

                contents = { ...contents, proposals };

                break;
            }
            default:
                break;
        }
    }

    return api("Contents", res, contents);
};

// Invitations
export const postWorkspaceInvitations: RequestHandler = async (req, res) => {
    const workspace = await Workspace.findOne({ where: { uuid: req.params.uuid } });

    if (!workspace) {
        throw { message: "workspace not found", code: 422 };
    }

    await validateWorkspaceAccess(workspace, res.locals.user);

    for (const member of req.body.members) {
        const user = await User.findOne({ where: { email: member.email } });

        if (!user) {
            if ((await WorkspaceInvitation.count({ where: { email: member.email } })) > 0) {
                throw {
                    message: `Invite has been already been sent to member with email ${member.email}`,
                    code: 422,
                };
            }

            continue;
        }

        // Check if the user is already exists in the workspace
        if ((await WorkspaceMember.count({ where: { user_id: user.id, workspace_id: workspace.id } })) > 0) {
            throw { message: `Member with email ${member.email} already exists in the Workspace`, code: 422 };
        }
    }

    // Email handler
    const emailQueue = new Bull(`${process.env.REDIS_EMAIL_QUEUE}`);

    for (const member of req.body.members) {
        const user = await User.findOne({ where: { email: member.email } });
        const createData: any = {
            workspace_id: workspace.id,
            organisation_id: workspace.organisation_id ? workspace.organisation_id : null,
        };

        if (user) {
            // Check if the user is already exists in the workspace
            createData.user_id = user.id;
            createData.role = req.body.role;
            await WorkspaceMember.create(createData);
            createData.invited_name = res.locals.user.first_name;

            // Add pin entries in user workspace pins tables

            const ownerPins = await UserWorkspacePin.findAll({
                where: { workspace_id: workspace.id, user_id: workspace.added_by },
            });

            if (ownerPins.length > 0) {
                let contentIds = ownerPins.map((ownerPin) => ownerPin.workspace_content_id);

                contentIds.map(async (contentId) => {
                    await UserWorkspacePin.create({
                        user_id: user.id,
                        workspace_id: workspace.id,
                        workspace_content_id: contentId,
                    });
                });
            }

            // Send invite email
            await emailQueue.add({ type: "email-workspace-invite", data: createData });
        }

        if (!user) {
            // Send an invitation to email
            createData.uuid = uuidv4();
            createData.name = member.name ? member.name : null;
            createData.email = member.email;
            createData.invite_role = req.body.role;

            await WorkspaceInvitation.create(createData);
            createData.invited_name = res.locals.user.first_name;

            await emailQueue.add({ type: "email-workspace-invite", data: createData });
        }
    }

    return api("Invites sent successfully", res, workspace);
};

export const getWorkspaceInvitations: RequestHandler = async (req, res) => {
    const workspace = await Workspace.findOne({ where: { uuid: req.params.uuid } });

    if (!workspace) {
        throw { message: "workspace not found", code: 422 };
    }

    const query: any = { workspace_id: workspace.id };

    if (req.query.status) {
        query.status = req.query.status;
    }

    const invitations = await WorkspaceInvitation.findAll({
        where: query,
        order: [["created_at", "desc"]],
    });

    return api("", res, invitations);
};

export const postWorkspaceAddContents: RequestHandler = async (req, res) => {
    const workspace = await Workspace.findOne({ where: { uuid: req.params.uuid } });

    if (!workspace) {
        throw { message: "workspace not found", code: 422 };
    }

    const content = await UserWorkspaceContent.create({
        uuid: uuidv4(),
        user_id: req.body.user_id,
        workspace_id: workspace.id,
        type: req.body.type,
        description: req.body.description,
    });

    return api("Details added successfully", res, content);
};

export const getWorkspaceContentDetails: RequestHandler = async (req, res) => {
    const workspace = await Workspace.findOne({ where: { uuid: req.params.uuid } });

    if (!workspace) {
        throw { message: "workspace not found", code: 422 };
    }

    const query: any = { workspace_id: workspace.id };

    if (req.query.status) {
        query.status = req.query.status;
    }

    const invitations = await WorkspaceInvitation.findAll({
        where: query,
        order: [["created_at", "desc"]],
    });

    return api("", res, invitations);
};

export const addWorkspaceMemberRole: RequestHandler = async (req, res) => {
    const emailQueue = new Bull(`${process.env.REDIS_EMAIL_QUEUE}`);
    const workspace = await Workspace.findOne({ where: { uuid: req.params.uuid } });

    if (!workspace) {
        throw { message: "Workspace not found", code: 422 };
    }

    const user = await User.findOne({ where: { uuid: req.params.user_uuid } });

    if (!user) {
        throw { message: "User does not exist", code: 422 };
    }

    const workspaceOwner = await WorkspaceMember.findOne({
        where: { workspace_id: workspace.id, user_id: res.locals.user.id, role: { [Op.in]: ["owner", "admin"] } },
    });

    if (!workspaceOwner) {
        throw { message: "Invalid action. User is not the owner of the workspace", code: 422 };
    }

    const workspaceMember = await WorkspaceMember.findOne({ where: { workspace_id: workspace.id, user_id: user.id } });

    if (!workspaceMember) {
        throw { message: "User is not a member of the workspace", code: 422 };
    }

    workspaceMember.role = req.body.role;
    await workspaceMember.save();

    let createData = {
        first_name: user.first_name,
        workspace_name: workspace.name,
        workspace_uuid: workspace.uuid,
        role: req.body.role,
        user_id: user.id,
        admin_id: res.locals.user.id,
    };

    await emailQueue.add({ type: "email-change-member-role", data: createData });

    return api("Role added successfully", res, {});
};
