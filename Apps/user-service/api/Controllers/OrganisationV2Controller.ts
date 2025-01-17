import { Router, RequestHandler, Request, Response } from "express";

import { throwError } from "@redlof/libs/Exceptions/ValidationException";
import { Validate } from "../Validations/OrganisationV2Request";
import { api } from "@redlof/libs/Helpers/helpers";
import { authorize } from "@redlof/libs/Middlewares/AuthenticationMiddleware";

import { v4 as uuidv4 } from "uuid";
import Bull from "bull";
import { filter, includes } from "lodash";

// Models
import { OrganisationMember } from "@redlof/libs/Models/Organisation/OrganisationMember";
import { Organisation } from "@redlof/libs/Models/Organisation/Organisation";
import { PUBLIC_DOMAIN } from "@redlof/libs/Constants/emailDomain";
import { addRole } from "@redlof/libs/Helpers/AuthenticationHelper";
import { User } from "@redlof/libs/Models/Auth/User";
import { Op, col, fn } from "sequelize";
import { Workspace } from "@redlof/libs/Models/Workspace/Workspace";
import { UserRole } from "@redlof/libs/Models/Auth/UserRole";
import { Role } from "@redlof/libs/Models/Auth/Role";
import { OrganisationExpert } from "@redlof/libs/Models/Organisation/OrganisationExpert";
import { Expert } from "@redlof/libs/Models/Expert/Expert";
import { UserTopic } from "@redlof/libs/Models/Individual/UserTopic";
import { OrganisationTopic } from "@redlof/libs/Models/Organisation/OrganisationTopic";
import { UserBehaviour } from "@redlof/libs/Models/Individual/UserBehaviour";
import { OrganisationBehaviour } from "@redlof/libs/Models/Organisation/OrganisationBehaviour";

export class OrganisationController {
    router;

    constructor() {
        this.router = Router();
        this.initializeRoutes();
    }

    initializeRoutes() {
        this.router.route("/").get(Validate("getOrganisations"), throwError, authorize(["role-all"]), this.getOrganisations);
        this.router.route("/").post(Validate("postOrganisation"), throwError, authorize(["role-member"]), this.postOrganisation);

        this.router.route("/:uuid").get(Validate("getOrganisation"), throwError, authorize(["role-all"]), this.getOrganisation);
        this.router.route("/:uuid").put(Validate("putOrganisation"), throwError, authorize(["role-admin", "role-organisation-admin"]), this.putOrganisation);
        this.router.route("/:uuid").patch(Validate("patchOrganisationStatus"), throwError, authorize(["role-admin"]), this.patchOrganisationStatus);

        this.router.route("/:uuid/non-members").get(Validate("getNonMembers"), throwError, authorize(["role-admin"]), this.getNonMembers);
        this.router.route("/:uuid/add-members").post(Validate("postAddMembers"), throwError, authorize(["role-admin"]), this.postAddMembers);
        this.router.route("/:uuid/remove-member").delete(Validate("deleteMember"), throwError, authorize(["role-admin"]), this.deleteMember);
    }

    postOrganisation: RequestHandler = async (req: Request, res: Response) => {
        const user = res.locals.user;
        const domain = user.email.split("@")[1];

        // check if user is admin of an organisation
        const isOrgAdmin = await OrganisationMember.findOne({
            where: { user_id: user.id, type: "admin" },
        });

        if (isOrgAdmin) {
            throw { message: "Invalid request, User has already created an organisation", code: 422 };
        }

        // check if organisation already exist
        const isOrg = await Organisation.findOne({
            where: { domain },
            attributes: ["id", "status"],
        });

        if (isOrg && isOrg.status !== "inactive") {
            throw { message: "Organisation with this domain already exist", code: 422 };
        }

        let organisation = await Organisation.findOne({
            where: { added_by: user.id },
        });

        if (organisation) {
            organisation.country_id = req.body.country_id;
            organisation.state_id = req.body.state_id;
            organisation.name = req.body.name;
            organisation.logo = req.body.logo;
            organisation.brief = req.body.brief;
            organisation.description = req.body.description ? req.body.description : null;
            organisation.website = req.body.website ? req.body.website : null;
            organisation.banner = req.body.banner ? req.body.banner : null;
            organisation.domain = PUBLIC_DOMAIN.includes(domain) ? null : domain;
            organisation.status = "pending";

            await organisation.save();
        } else {
            organisation = await Organisation.create({
                uuid: uuidv4(),
                added_by: user.id,
                country_id: req.body.country_id,
                state_id: req.body.state_id,
                name: req.body.name,
                logo: req.body.logo,
                brief: req.body.brief,
                description: req.body.description ? req.body.description : null,
                website: req.body.website ? req.body.website : null,
                banner: req.body.banner ? req.body.banner : null,
                domain: PUBLIC_DOMAIN.includes(domain) ? null : domain,
            });
        }

        // add user topics preferences to organisation
        const userTopics = await UserTopic.findAll({
            where: { user_id: res.locals.user.id, topic_id: { [Op.ne]: null } },
        });

        if (userTopics.length) {
            const data = [];

            for (const userTopic of userTopics) {
                data.push({
                    organisation_id: organisation.id,
                    topic_id: userTopic.topic_id,
                    created_at: new Date(),
                    updated_at: new Date(),
                });
            }

            // Delete the previously marked and update with new one
            await OrganisationTopic.destroy({ where: { organisation_id: organisation.id } });

            await OrganisationTopic.bulkCreate(data);
        }

        // add user behaviors preferences to organisation
        const userBehaviours = await UserBehaviour.findAll({
            where: { user_id: res.locals.user.id },
        });

        if (userBehaviours.length) {
            const data = [];

            for (const userBehaviour of userBehaviours) {
                data.push({
                    organisation_id: organisation.id,
                    behaviour_id: userBehaviour.behaviour_id,
                    created_at: new Date(),
                    updated_at: new Date(),
                });
            }

            // Delete the previously marked and update with new one
            await OrganisationBehaviour.destroy({ where: { organisation_id: organisation.id } });

            await OrganisationBehaviour.bulkCreate(data);
        }

        api("Organisation created successfully", res, organisation);
    };

    patchOrganisationStatus: RequestHandler = async (req: Request, res: Response) => {
        const organisation = await Organisation.findOne({
            where: { uuid: req.params.uuid },
        });

        if (!organisation) {
            throw { message: "Organisation not found", code: 422 };
        }

        const approved = req.body.status === "active" && organisation.status !== "active" ? true : false;
        const rejected = req.body.status === "inactive" && organisation.status !== "inactive" ? true : false;

        organisation.status = req.body.status;
        await organisation.save();

        if (approved) {
            // make user a member and admin of the organisation
            await OrganisationMember.create({
                organisation_id: organisation.id,
                user_id: organisation.added_by,
                status: "active",
                type: "admin",
            });
            await addRole(organisation.added_by, "role-organisation-admin");

            // check users with same domain as organisation domain and make them a member
            const members = await User.findAll({
                where: {
                    email: { [Op.like]: `%@${organisation.domain}` },
                },
                attributes: ["id", "email"],
            });

            // filter members to remove existing members
            let filteredMembers: any;
            if (members && members.length > 0) {
                const organisationMembers = await OrganisationMember.findAll({
                    where: { organisation_id: organisation.id },
                });

                const orgMemberIds = organisationMembers.map((member) => member.user_id);
                filteredMembers = filter(members, (member: any) => !includes(orgMemberIds, member.id));
            }

            if (filteredMembers && filteredMembers.length > 0) {
                const data = filteredMembers.map((member) => {
                    return {
                        organisation_id: organisation.id,
                        user_id: member.id,
                        status: "active",
                        type: "member",
                    };
                });

                await OrganisationMember.bulkCreate(data);

                // send mail to all members: added to an organisation
                filteredMembers.forEach(async (member) => {
                    await new Bull(`${process.env.REDIS_EMAIL_QUEUE}`).add({
                        type: "email-organisation-member-added",
                        data: { user_id: member.id, organisation_id: organisation.id },
                    });
                });
            }

            // send mail to org admin: request approved
            await new Bull(`${process.env.REDIS_EMAIL_QUEUE}`).add({
                type: "email-organisation-approved",
                data: { user_id: organisation.added_by, organisation_id: organisation.id },
            });
        }

        if (rejected) {
            await new Bull(`${process.env.REDIS_EMAIL_QUEUE}`).add({
                type: "email-organisation-rejected",
                data: { user_id: organisation.added_by },
            });
        }

        api("Organisation status updated successfully", res, organisation);
    };

    postAddMembers: RequestHandler = async (req: Request, res: Response) => {
        // get organisation details
        const organisation: any = await Organisation.findOne({
            where: { uuid: req.params.uuid, status: "active" },
            attributes: ["id", "name", "added_by"],
            include: [
                {
                    model: OrganisationMember,
                    as: "members",
                    attributes: ["user_id"],
                },
            ],
        });

        if (!organisation) {
            throw { message: "Please select a valid organisation", code: 422 };
        }

        // get users details
        const users = await User.findAll({
            where: {
                uuid: { [Op.in]: req.body.users },
            },
            attributes: ["id", "first_name", "last_name", "email", "gender", "dob"],
        });

        if (users.length == 0) {
            throw { message: "Please select atleast one valid user", code: 422 };
        }

        // filter users to remove existing members
        const orgMemberIds = organisation.members.map((member) => member.user_id);
        const filteredUsers = filter(users, (v) => !includes(orgMemberIds, v.id));

        if (filteredUsers.length == 0) {
            throw { message: "Please select atleast one valid user", code: 422 };
        }

        // create data to bulkCreate OrganisationMember
        const organisationMemberCreate: any = [];

        filteredUsers.forEach((user) => {
            organisationMemberCreate.push({
                user_id: user.id,
                organisation_id: organisation.id,
                type: "member",
                status: "active",
            });
        });

        await OrganisationMember.bulkCreate(organisationMemberCreate);

        filteredUsers.forEach(async (user) => {
            await new Bull(`${process.env.REDIS_EMAIL_QUEUE}`).add({
                type: "email-organisation-member-added",
                data: { user_id: user.id, organisation_id: organisation.id },
            });
        });

        await new Bull(`${process.env.REDIS_EMAIL_QUEUE}`).add({
            type: "email-organisation-admin-members-added",
            data: {
                admin_id: organisation.added_by,
                organisation_id: organisation.id,
                users: filteredUsers,
            },
        });

        api(`Members added to organisation ${organisation.name} successfully`, res, filteredUsers);
    };

    getNonMembers: RequestHandler = async (req: Request, res: Response) => {
        const organisation: any = await Organisation.findOne({
            where: { uuid: req.params.uuid, status: "active" },
            attributes: ["id"],
            include: [
                {
                    model: OrganisationMember,
                    as: "members",
                    attributes: ["user_id"],
                },
            ],
        });

        if (!organisation) {
            throw { message: "No organisation found. Invalid request", code: 404 };
        }

        const orgMemberIds = organisation.members.map((member) => member.user_id);

        const non_members = await User.findAll({
            where: {
                id: { [Op.notIn]: orgMemberIds },
            },
            attributes: ["uuid", "first_name", "last_name", "email", "username", "phone", "photo", "created_at"],
        });

        api("Organisation non members fetched successfully", res, non_members);
    };

    getOrganisations: RequestHandler = async (req: any, res: Response) => {
        const query: any = {};

        if (req.query.status) {
            query.status = req.query.status;
        }

        if (req.query.type && req.query.type === "partner") {
            query.is_partner = true;
        }

        if (req.query.type && req.query.type === "funder") {
            query.is_funder = true;
        }

        if (req.query.type && req.query.type === "contributor") {
            query.is_contributor = true;
        }

        const { rows, count }: any = await Organisation.findAndCountAll({
            where: query,
            limit: req.query.limit ? req.query.limit : null,
            offset: req.query.page && req.query.limit ? (Number(req.query.page) - 1) * Number(req.query.limit) : 0,
            attributes: ["id", "uuid", "logo", "name", "created_at", "updated_at", "domain", "status", "brief", "is_partner", "is_contributor", "is_funder"],
            order: [["created_at", "desc"]],
            distinct: true,
            include: [
                {
                    model: OrganisationMember,
                    where: { status: "active" },
                    attributes: ["user_id"],
                    as: "members",
                    required: false,
                },
                {
                    model: User,
                    attributes: ["id", "uuid", "first_name", "last_name", "email", "username", "photo"],
                    as: "admin",
                },
            ],
        });

        const responseData = JSON.parse(JSON.stringify(rows));

        responseData.forEach((organisation) => {
            organisation.total_members = organisation.members.length;
            delete organisation.members;
        });

        const pages = req.query.limit ? count / Number(req.query.limit) : 1;
        api("Fetched organisations successfully", res, { total: count, pages: Math.ceil(pages), data: responseData });
    };

    getOrganisation: RequestHandler = async (req: Request, res: Response) => {
        const organisation = await Organisation.findOne({
            where: { uuid: req.params.uuid },
            include: [
                {
                    model: User,
                    attributes: ["id", "uuid", "first_name", "last_name", "email", "username", "photo", "phone"],
                    as: "admin",
                },
                {
                    model: User,
                    attributes: ["id", "uuid", "first_name", "last_name", "photo", "email", "username", "phone"],
                    as: "member_details",
                },
                {
                    model: Workspace,
                    as: "org_workspaces",
                },
                {
                    model: Expert,
                    as: "experts",
                    required: false,
                },
            ],
        });

        if (!organisation) {
            throw { message: "No organisation found, Please select a valid organisation", code: 422 };
        }

        const responseData = JSON.parse(JSON.stringify(organisation));
        responseData.member_details = responseData.member_details.filter((member) => member.OrganisationMember.type != "admin" && member.OrganisationMember.status == "active");

        responseData.member_details.forEach((member) => {
            member.organisation_role = member.OrganisationMember.type;
            delete member.OrganisationMember;
        });

        api("Fetched organisation successfully", res, responseData);
    };

    putOrganisation: RequestHandler = async (req: Request, res: Response) => {
        const organisation = await Organisation.findOne({
            where: { uuid: req.params.uuid },
        });

        if (!organisation) {
            throw { message: "No organisation found. Please select a valid organisation", code: 422 };
        }

        if (!res.locals.roles.includes("role-admin")) {
            if (res.locals.user.id !== organisation.added_by) {
                throw { message: "Invalid action, Please check your access to this action.", code: 422 };
            }
        }

        organisation.name = req.body.name ? req.body.name : organisation.name;
        organisation.logo = req.body.logo ? req.body.logo : organisation.getDataValue("logo");
        organisation.banner = req.body.banner ? req.body.banner : organisation.getDataValue("banner");
        organisation.brief = req.body.brief ? req.body.brief : organisation.brief;
        organisation.country_id = req.body.country_id ? req.body.country_id : organisation.country_id;
        organisation.state_id = req.body.state_id ? req.body.state_id : organisation.state_id;
        organisation.website = req.body.website ? req.body.website : organisation.website;

        organisation.description = req.body.description ? req.body.description : organisation.description;
        organisation.type = req.body.type ? req.body.type : organisation.type;
        organisation.key_programs = req.body.key_programs ? req.body.key_programs : organisation.key_programs;
        organisation.service_lines = req.body.service_lines ? req.body.service_lines : organisation.service_lines;
        organisation.category = req.body.category ? req.body.category : organisation.category;
        organisation.source = req.body.source ? req.body.source : organisation.source;
        organisation.budget = req.body.budget ? req.body.budget : organisation.budget;
        organisation.impact = req.body.impact ? req.body.impact : organisation.impact;

        organisation.is_partner = req.body.is_partner ? req.body.is_partner : organisation.is_partner;
        organisation.is_funder = req.body.is_funder ? req.body.is_funder : organisation.is_funder;
        organisation.is_contributor = req.body.is_contributor ? req.body.is_contributor : organisation.is_contributor;
        organisation.functions = req.body.functions ? req.body.functions : organisation.functions;

        // edit organisation admin details
        const admin = await User.findOne({
            where: { id: organisation.added_by },
        });

        admin.first_name = req.body.admin_first_name ? req.body.admin_first_name : admin.first_name;
        admin.last_name = req.body.admin_last_name ? req.body.admin_last_name : admin.last_name;

        // add experts
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

        await organisation.save();
        await admin.save();

        api("Organisation updated successfully", res, organisation);
    };

    deleteMember: RequestHandler = async (req: any, res: Response) => {
        // get organisation
        const organisation = await Organisation.findOne({
            where: { uuid: req.params.uuid },
            attributes: ["id", "name", "added_by"],
        });

        if (!organisation) {
            throw { message: "No organisation found. Please select a valid organisation", code: 422 };
        }

        // get user to be removed from organisation
        const user = await User.findOne({
            where: { uuid: req.query.member_uuid },
            attributes: ["id"],
        });

        if (!user) {
            throw { message: "No user found. Please select a valid user to be removed from organisation", code: 422 };
        }

        // remove user from organisation
        const organisationMember = await OrganisationMember.findOne({
            where: { user_id: user.id, organisation_id: organisation.id },
        });

        if (!organisationMember) {
            throw { message: `Selected user is not a member of ${organisation.name} organisation`, code: 422 };
        }

        if (organisationMember.type === "admin") {
            throw { message: "You can't remove admin from the organisation", code: 422 };
        }

        await organisationMember.destroy();

        const isAnyOrgMember = await OrganisationMember.findOne({
            where: { user_id: user.id },
            attributes: ["id"],
        });

        if (!isAnyOrgMember) {
            const role = await Role.findOne({ where: { slug: "role-organisation-member" } });
            await UserRole.destroy({
                where: { user_id: user.id, role_id: role.id },
            });
        }

        // mail organisation admin and removed user about the change
        await new Bull(`${process.env.REDIS_EMAIL_QUEUE}`).add({
            type: "email-organisation-admin-member-removed",
            data: {
                admin_id: organisation.added_by,
                organisation_id: organisation.id,
                user_id: user.id,
            },
        });

        await new Bull(`${process.env.REDIS_EMAIL_QUEUE}`).add({
            type: "email-organisation-member-removed",
            data: { user_id: user.id, organisation_id: organisation.id },
        });

        api("Member removed successfully", res, { organisationMember });
    };
}
