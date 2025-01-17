import bcrypt from "bcryptjs";
import { RequestHandler } from "express";
import { v4 as uuidv4 } from "uuid";
import { Op, where } from "sequelize";
import Bull from "bull";

//Helpers
import { api, apiException } from "@redlof/libs/Helpers/helpers";
import { uploadIdenticon } from "@redlof/libs/Helpers/FileUploadHelper";
import { addRole, attachRole } from "@redlof/libs/Helpers/AuthenticationHelper";
import { getFilteredOrganisations } from "@redlof/libs/Helpers/DataFilterHelper";
import { validateOrganisationAccess } from "@redlof/libs/Helpers/OrganisationHelper";

// Models
import { User } from "@redlof/libs/Models/Auth/User";
import { Organisation } from "@redlof/libs/Models/Organisation/Organisation";
import { OrganisationMember } from "@redlof/libs/Models/Organisation/OrganisationMember";
import { Topic } from "@redlof/libs/Models/Topic/Topic";
import { OrganisationTopic } from "@redlof/libs/Models/Organisation/OrganisationTopic";
import { Behaviour } from "@redlof/libs/Models/Behaviour/Behaviour";
import { OrganisationBehaviour } from "@redlof/libs/Models/Organisation/OrganisationBehaviour";
import { Workspace } from "@redlof/libs/Models/Workspace/Workspace";
import { WorkspaceMember } from "@redlof/libs/Models/Workspace/WorkspaceMember";
import { OrganisationExpert } from "@redlof/libs/Models/Organisation/OrganisationExpert";
import { Expert } from "@redlof/libs/Models/Expert/Expert";
import { Country } from "@redlof/libs/Models/Data/Country";
import { State } from "@redlof/libs/Models/Data/State";

export const getOrganisations: RequestHandler = async (req, res) => {
    const query: any = {};

    if (req.query.status) {
        query.status = req.query.status;
    }

    if (req.query.is_funder) {
        query.is_funder = req.query.is_funder;
    }

    if (req.query.is_partner) {
        query.is_partner = req.query.is_partner;
    }

    if (req.query.is_contributor) {
        query.is_contributor = req.query.is_contributor;
    }

    const organisationIds = await getFilteredOrganisations(req.query);
    if (organisationIds) {
        query.id = { [Op.in]: organisationIds };
    }

    const organisations = await Organisation.findAll({
        where: query,
        include: [
            {
                model: Expert,
                as: "experts",
                required: false,
            },
            {
                model: Country,
                as: "countries",
                required: false,
            },
            {
                model: State,
                as: "states",
                required: false,
            },
        ],
        order: [["created_at", "desc"]],
    });

    return api("", res, organisations);
};

export const postOrganisations: RequestHandler = async (req, res) => {
    const { first_name, last_name, admin_email } = req.body;

    const query: any = {};

    // Create company and map a user as admin
    const organisation = await Organisation.create({
        uuid: uuidv4(),
        added_by: res.locals.user.id,
        country_id: req.body.country_id,
        state_id: req.body.state_id,
        name: req.body.name,
        logo: req.body.logo,
        brief: req.body.brief ? req.body.brief : null,
        description: req.body.description ? req.body.description : null,
        category: req.body.category || null,
        type: req.body.type ? req.body.type : null,
        website: req.body.website ? req.body.website : null,
        key_programs: req.body.key_programs ? req.body.key_programs : null,
        service_lines: req.body.service_lines ? req.body.service_lines : null,
        is_partner: "is_partner" in req.body ? req.body.is_partner : false,
        is_funder: "is_funder" in req.body ? req.body.is_funder : false,
        is_contributor: "is_contributor" in req.body ? req.body.is_contributor : false,
        functions: req.body.functions ? req.body.functions : null,

        source: req.body.source || null,
        budget: req.body.budget || 0,
        impact: req.body.impact || null,
        status: "active",
    });

    if (req.body.expert_ids) {
        const expert_ids: any = req.body.expert_ids;

        const organisationExpertData: any = [];

        expert_ids.map((exp: any) => {
            organisationExpertData.push({
                organisation_id: organisation.id,
                expert_id: exp,
                created_at: new Date(),
                updated_at: new Date(),
            });
        });

        const createdOrganisationExpert = await OrganisationExpert.bulkCreate(organisationExpertData);
    }

    if (!(first_name && last_name && admin_email) || organisation.is_contributor == true) {
        return api("Organisation created successfully.", res, {});
    }

    const password = Math.random().toString(36).slice(2);

    // Create a user and attach a role
    const user = await User.create({
        uuid: uuidv4(),
        first_name: req.body.first_name,
        last_name: req.body.last_name,
        email: req.body.admin_email,
        username: req.body.admin_email,
        photo: await uploadIdenticon("profiles", req.body.email),
        password: await bcrypt.hash(password, 8),
        status: "yet_to_join",
    });

    await attachRole(user.id, "role-organisation-admin");

    // Create the default workspace (personal)
    const workspace = await Workspace.create({
        uuid: uuidv4(),
        added_by: user.id,
        name: "My Workspace",
        logo: await uploadIdenticon("workspaces", "My Workspace"),
        type: "personal",
        share_text: "Link to the single view page of the resource",
    });

    // Make a user part of the workspace
    await WorkspaceMember.create({ workspace_id: workspace.id, user_id: user.id });

    await OrganisationMember.create({ organisation_id: organisation.id, user_id: user.id, type: "admin" });

    // send an welcome email with credentials
    await new Bull(`${process.env.REDIS_EMAIL_QUEUE}`).add({
        type: "email-organisation-welcome",
        data: { user_id: user.id, organisation_id: organisation.id, password },
    });

    return api("Organisation created successfully.", res, {});
};

export const getOrganisation: RequestHandler = async (req, res) => {
    const organisation = await Organisation.findOne({
        where: { uuid: req.params.uuid },
        include: [
            {
                model: OrganisationMember,
                as: "members",
                required: false,
                include: [
                    {
                        attributes: ["uuid", "first_name", "last_name", "email", "phone", "photo", "status", "created_at"],
                        model: User,
                        as: "user",
                        required: false,
                    },
                ],
            },

            {
                model: Expert,
                as: "experts",
                required: false,
            },
            {
                model: Country,
                as: "countries",
                required: false,
            },
            {
                model: State,
                as: "states",
                required: false,
            },
        ],
    });

    if (!organisation) {
        throw { message: "Organisation not found", code: 422 };
    }

    return api("", res, organisation);
};

export const putOrganisation: RequestHandler = async (req, res) => {
    const organisation = await Organisation.findOne({ where: { uuid: req.params.uuid } });

    const query: any = {};

    if (!organisation) {
        throw { message: "Organisation not found", code: 422 };
    }

    organisation.name = req.body.name ? req.body.name : organisation.name;
    organisation.country_id = req.body.country_id ? req.body.country_id : organisation.country_id;
    organisation.state_id = req.body.state_id ? req.body.state_id : organisation.state_id;
    organisation.logo = req.body.logo ? req.body.logo : organisation.getDataValue("logo");
    organisation.description = req.body.description ? req.body.description : organisation.description;
    organisation.type = req.body.type ? req.body.type : organisation.type;
    organisation.key_programs = req.body.key_programs ? req.body.key_programs : organisation.key_programs;
    organisation.website = req.body.website ? req.body.website : organisation.website;
    organisation.service_lines = req.body.service_lines ? req.body.service_lines : organisation.service_lines;
    organisation.category = req.body.category ? req.body.category : organisation.category;
    organisation.source = req.body.source ? req.body.source : organisation.source;
    organisation.budget = req.body.budget ? req.body.budget : organisation.budget;
    organisation.impact = req.body.impact ? req.body.impact : organisation.impact;
    organisation.status = req.body.status ? req.body.status : organisation.status;

    if (req.body.expert_ids) {
        const all_experts = [...(await OrganisationExpert.findAll({ where: { organisation_id: organisation.id } }))].map((t: any) => parseInt(t.expert_id));

        const expertToBeDeleted = all_experts.filter((t: any) => !req.body.expert_ids.includes(t));

        const expertToBeAdded = req.body.expert_ids.filter((t: any) => !all_experts.includes(t));

        await OrganisationExpert.destroy({
            where: {
                expert_id: { [Op.in]: expertToBeDeleted },
                organisation_id: organisation.id,
            },
        });

        const expertCreate: any = [];

        for (const id of expertToBeAdded) {
            expertCreate.push({ organisation_id: organisation.id, expert_id: id });
        }

        await OrganisationExpert.bulkCreate(expertCreate);
    }

    if (req.body.status) {
        // Update the status of all the organisation members

        const memberId = [...(await OrganisationMember.findAll({ where: { organisation_id: organisation.id } }))].map((orgMember: any) => orgMember.user_id);

        await OrganisationMember.update({ status: req.body.status }, { where: { user_id: { [Op.in]: memberId }, organisation_id: organisation.id } });

        await User.update({ status: req.body.status }, { where: { id: { [Op.in]: memberId } } });

        // Send welcome email
        if (req.body.status == "active" && memberId.length > 0) {
            await new Bull(`${process.env.REDIS_EMAIL_QUEUE}`).add({
                type: "email-welcome",
                data: { user_id: memberId[0] },
            });
        }
    }

    await organisation.save();

    return api("", res, organisation);
};

export const postOrganisationMember: RequestHandler = async (req, res) => {
    const organisation = await Organisation.findOne({ where: { uuid: req.params.uuid } });

    if (!organisation) {
        throw { message: "Organisation not found", code: 422 };
    }

    if (!res.locals.roles.includes("role-admin")) {
        if (res.locals.user.id !== organisation.added_by) {
            throw { message: "Invalid action, Please check your access to this action.", code: 422 };
        }
    }

    const password = Math.random().toString(36).slice(2);

    // Create a user and attach a role
    const user = await User.create({
        uuid: uuidv4(),
        first_name: req.body.first_name,
        last_name: req.body.last_name,
        email: req.body.email,
        username: req.body.email,
        photo: await uploadIdenticon("profiles", req.body.email),
        password: await bcrypt.hash(password, 8),
        status: "yet_to_join",
    });

    await attachRole(user.id, "role-organisation-member");

    // Create the default workspace (personal)
    const workspace = await Workspace.create({
        uuid: uuidv4(),
        added_by: user.id,
        name: "My Workspace",
        logo: await uploadIdenticon("workspaces", "My Workspace"),
        type: "personal",
        share_text: "Link to the single view page of the resource",
    });

    // Make a user part of the workspace
    await WorkspaceMember.create({ workspace_id: workspace.id, user_id: user.id });

    await OrganisationMember.create({
        organisation_id: organisation.id,
        user_id: user.id,
        type: "member",
    });

    // send an welcome email with credentials
    await new Bull(`${process.env.REDIS_EMAIL_QUEUE}`).add({
        type: "email-organisation-member-welcome",
        data: { admin_id: res.locals.user.id, user_id: user.id, organisation_id: organisation.id, password },
    });

    return api("Member added successfully.", res, organisation);
};

export const putOrganisationMember: RequestHandler = async (req, res) => {
    const organisation = await Organisation.findOne({ where: { uuid: req.params.uuid } });

    if (!organisation) {
        throw { message: "Organisation not found", code: 422 };
    }

    if (!res.locals.roles.includes("role-admin")) {
        if (res.locals.user.id !== organisation.added_by) {
            throw { message: "Invalid action, Please check your access to this action.", code: 422 };
        }
    }

    // Get the organisation member
    const orgMember: any = await User.findOne({
        where: { uuid: req.params.member_uuid },
        include: [
            {
                where: { organisation_id: organisation.id },
                model: OrganisationMember,
                as: "organisation_member",
                required: true,
            },
        ],
    });

    if (!orgMember) {
        throw { message: "Member details not found.", code: 422 };
    }

    await OrganisationMember.update({ status: req.body.status }, { where: { user_id: orgMember.id, organisation_id: organisation.id } });

    orgMember.status = req.body.status;
    await orgMember.save();

    // Send welcome email
    if (req.body.status == "active") {
        await new Bull(`${process.env.REDIS_EMAIL_QUEUE}`).add({
            type: "email-welcome",
            data: { user_id: orgMember.id },
        });
    }

    if (req.body.status == "inactive") {
        await new Bull(`${process.env.REDIS_EMAIL_QUEUE}`).add({
            type: "email-organisation-rejected",
            data: { user_id: orgMember.id },
        });
    }
    return api("Member details saved successfully.", res, {});
};

export const putOrganisatioMemberType: RequestHandler = async (req, res) => {
    const organisation = await Organisation.findOne({
        where: { uuid: req.params.uuid },
        include: [
            {
                model: OrganisationMember,
                as: "members",
                required: false,
            },
        ],
    });

    if (!organisation) {
        throw { message: "Organisation not found", code: 422 };
    }

    await validateOrganisationAccess(organisation, res.locals.user, ["admin"]);

    const orgMember: any = await User.findOne({
        where: { uuid: req.params.member_uuid },
        include: [
            {
                where: { organisation_id: organisation.id },
                model: OrganisationMember,
                as: "organisation_member",
                required: true,
            },
        ],
    });

    if (orgMember.organisation_member.organisation_id !== organisation.id) {
        throw { message: "Organisation member not found", code: 422 };
    }

    await OrganisationMember.update({ type: req.body.type }, { where: { user_id: orgMember.id, organisation_id: organisation.id } });

    if (req.body.type === "admin") {
        await addRole(orgMember.id, "role-organisation-admin");

        await new Bull(`${process.env.REDIS_EMAIL_QUEUE}`).add({
            type: "admin-welcome",
            data: { user_id: orgMember.id },
        });
    }

    if (req.body.type === "member") {
        await addRole(orgMember.id, "role-organisation-member");
    }

    return api("Member details updated successfully.", res, {});
};

export const deleteOrganisationMember: RequestHandler = async (req, res) => {
    const organisation = await Organisation.findOne({ where: { uuid: req.params.uuid } });

    if (!organisation) {
        throw { message: "Organisation not found", code: 422 };
    }

    if (!res.locals.roles.includes("role-admin")) {
        await validateOrganisationAccess(organisation, res.locals.user, ["admin"]);
    }

    // Get the organisation member
    const orgMember: any = await User.findOne({
        where: { uuid: req.params.member_uuid },
        include: [
            {
                where: { organisation_id: organisation.id },
                model: OrganisationMember,
                as: "organisation_member",
                required: true,
            },
        ],
    });

    if (!orgMember) {
        throw { message: "Organisation member not found", code: 422 };
    }

    await OrganisationMember.destroy({ where: { user_id: orgMember.id, organisation_id: organisation.id } });

    await WorkspaceMember.destroy({ where: { user_id: orgMember.id, organisation_id: organisation.id } });

    return api("Member removed successfully.", res, {});
};

export const postOrganisationTopics: RequestHandler = async (req, res) => {
    const organisation = await Organisation.findOne({ where: { uuid: req.params.uuid } });

    if (!organisation) {
        throw { message: "Organisation not found", code: 422 };
    }

    const topics = await Topic.findAll({ where: { uuid: { [Op.in]: req.body.topics } } });

    if (topics.length <= 0) {
        throw { message: "Please select at least one topic", code: 422 };
    }

    const data: any = [];

    for (const topic of topics) {
        data.push({
            organisation_id: organisation.id,
            topic_id: topic.id,
            created_at: new Date(),
            updated_at: new Date(),
        });
    }

    // Delete the previously marked and update with new one
    await OrganisationTopic.destroy({ where: { organisation_id: organisation.id } });

    await OrganisationTopic.bulkCreate(data);

    return api("Topics added successfully.", res, {});
};

export const getOrganisationTopics: RequestHandler = async (req, res) => {
    const organisation = await Organisation.findOne({ where: { uuid: req.params.uuid } });

    if (!organisation) {
        throw { message: "Organisation not found", code: 422 };
    }

    // Get all the topic mapped to organisations
    const topicId = [...(await OrganisationTopic.findAll({ where: { organisation_id: organisation.id } }))].map((orgTopic) => orgTopic.topic_id);

    const topics = await Topic.findAll({ where: { id: { [Op.in]: topicId } } });

    return api("", res, topics);
};

export const postOrganisationBehaviours: RequestHandler = async (req, res) => {
    const organisation = await Organisation.findOne({ where: { uuid: req.params.uuid } });

    if (!organisation) {
        throw { message: "Organisation not found", code: 422 };
    }

    const behaviours = await Behaviour.findAll({ where: { uuid: { [Op.in]: req.body.behaviours } } });

    if (behaviours.length <= 0) {
        throw { message: "Please select at least one topic", code: 422 };
    }

    const data: any = [];

    for (const behaviour of behaviours) {
        data.push({
            organisation_id: organisation.id,
            behaviour_id: behaviour.id,
            created_at: new Date(),
            updated_at: new Date(),
        });
    }

    // Delete the previously marked and update with new one
    await OrganisationBehaviour.destroy({ where: { organisation_id: organisation.id } });

    await OrganisationBehaviour.bulkCreate(data);

    return api("Behaviours added successfully.", res, {});
};

export const getOrganisationBehaviours: RequestHandler = async (req, res) => {
    const organisation = await Organisation.findOne({ where: { uuid: req.params.uuid } });

    if (!organisation) {
        throw { message: "Organisation not found", code: 422 };
    }

    // Get all the behaviour mapped to organisations
    const behaviourId = [...(await OrganisationBehaviour.findAll({ where: { organisation_id: organisation.id } }))].map((orgBehaviour) => orgBehaviour.behaviour_id);

    const behaviours = await Behaviour.findAll({ where: { id: { [Op.in]: behaviourId } } });

    return api("", res, behaviours);
};

export const getOrganisationExperts: RequestHandler = (req, res) => {
    // if(req.body.exp_id) query.expert_id = { [Op.in]: req.body.exp_ids }
};

export const postOrganisationExperts: RequestHandler = async (req, res) => {
    const query: any = {};

    const expert_ids: any = req.body.exp_ids;

    if (req.body.org_id) {
        query.organisation_id = req.body.org_id;
    }

    if (req.body.exp_id) {
        query.expert_id = { [Op.in]: req.body.exp_ids };
    }

    const organisationExpert: any = await OrganisationExpert.findAll({
        where: query,
    });

    if (organisationExpert) {
        throw "This expert is already mapped to your organisation";
    }

    organisationExpert.toJSON();

    const expert_includes: any = [];

    organisationExpert.map((ids: any) => expert_includes.push(ids));

    const experts_to_included = expert_ids.filter((exp_id: any) => !expert_includes.includes(exp_id));

    const organisationExpertData: any = [];

    experts_to_included.map((exp: any) => {
        organisationExpertData.push({
            organisation_id: req.body.org_id,
            expert_id: exp,
            created_at: new Date(),
            updated_at: new Date(),
        });
    });

    const createdOrganisationExpert = await OrganisationExpert.bulkCreate(organisationExpertData);

    return api("OrganisationExperts added successfully.", res, {});
};
