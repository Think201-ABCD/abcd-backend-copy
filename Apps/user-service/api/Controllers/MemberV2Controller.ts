import { Router, RequestHandler, Request, Response } from "express";
import { Op } from "sequelize";
import Bull from "bull";

import { throwError } from "@redlof/libs/Exceptions/ValidationException";
import { Validate } from "../Validations/MemberV2Request";
import { api } from "@redlof/libs/Helpers/helpers";
import { authorize } from "@redlof/libs/Middlewares/AuthenticationMiddleware";
import { sendWhatsAppMessage } from "@redlof/app/chat-service/api/Helpers/WhatsAppHelper";

// Models
import { UserBehaviour } from "@redlof/libs/Models/Individual/UserBehaviour";
import { Outcome } from "@redlof/libs/Models/Outcome/Outcome";
import { UserOutcome } from "@redlof/libs/Models/Individual/UserOutcome";
import { Behaviour } from "@redlof/libs/Models/Behaviour/Behaviour";
import { UserTopic } from "@redlof/libs/Models/Individual/UserTopic";
import { Topic } from "@redlof/libs/Models/Topic/Topic";
import { OrganisationMember } from "@redlof/libs/Models/Organisation/OrganisationMember";
import { Organisation } from "@redlof/libs/Models/Organisation/Organisation";
import { User } from "@redlof/libs/Models/Auth/User";
import { Role } from "@redlof/libs/Models/Auth/Role";
import { Workspace } from "@redlof/libs/Models/Workspace/Workspace";
import { UserProfile } from "@redlof/libs/Models/Auth/UserProfile";
import { PUBLIC_DOMAIN } from "@redlof/libs/Constants/emailDomain";
import { addRole, getUserRoles } from "@redlof/libs/Helpers/AuthenticationHelper";

export class MemberController {
    router;

    constructor() {
        this.router = Router();
        this.initializeRoutes();
    }

    initializeRoutes() {
        this.router.route("/preferences").post(Validate("postPreferences"), throwError, authorize(["role-admin", "role-member"]), this.postPreferences);
        this.router.route("/organisations").get(authorize(["role-all"]), this.getMemberOrganisations);

        this.router.route("/").get(Validate("getMembers"), throwError, authorize(["role-admin"]), this.getMembers);
        this.router.route("/:uuid").get(Validate("getMember"), throwError, authorize(["role-admin", "role-member"]), this.getMember);
        this.router.route("/:uuid").put(Validate("putMember"), throwError, authorize(["role-admin"]), this.putMember);
    }

    postPreferences: RequestHandler = async (req: any, res: Response) => {
        const roles = res.locals.roles;
        let user;

        // get user details
        if (roles.includes("role-admin")) {
            if (!req.query.user_uuid) {
                throw { message: "Please select a valid user", code: 422 };
            }

            user = await User.findOne({
                where: { uuid: req.query.user_uuid },
            });

            if (!user) {
                throw { message: "User not found. Please select a valid user", code: 422 };
            }
        } else {
            user = res.locals.user;
        }

        // add topics preferences
        if (req.body.topics) {
            const topics = await Topic.findAll({ where: { uuid: { [Op.in]: req.body.topics } } });

            // Remove old preferences
            await UserTopic.destroy({ where: { user_id: user.id } });

            if (topics.length > 0) {
                const data: any = [];

                for (const topic of topics) {
                    data.push({
                        user_id: user.id,
                        topic_id: topic.id,
                    });
                }

                await UserTopic.bulkCreate(data);
            }
        }

        // add behaviours preferences
        if (req.body.behaviours) {
            const behaviours = await Behaviour.findAll({ where: { uuid: { [Op.in]: req.body.behaviours } } });

            // Remove old preferences
            await UserBehaviour.destroy({ where: { user_id: user.id } });

            if (behaviours.length > 0) {
                const data: any = [];

                for (const behaviour of behaviours) {
                    data.push({
                        user_id: user.id,
                        behaviour_id: behaviour.id,
                    });
                }

                await UserBehaviour.bulkCreate(data);
            }
        }

        // add outcomes preferences
        if (req.body.outcomes) {
            const outcomes = await Outcome.findAll({ where: { uuid: { [Op.in]: req.body.outcomes } } });

            // Remove old preferences
            await UserOutcome.destroy({ where: { user_id: user.id } });

            if (outcomes.length > 0) {
                const data: any = [];

                for (const outcome of outcomes) {
                    data.push({
                        user_id: user.id,
                        outcome_id: outcome.id,
                    });
                }

                await UserOutcome.bulkCreate(data);
            }
        }
        api("Preferences updated successfully", res, {});
    };

    getMemberOrganisations: RequestHandler = async (req: Request, res: Response) => {
        const user = res.locals.user;

        let organisationMember: any = await OrganisationMember.findAll({
            where: { user_id: user.id, status: "active" },
            include: [
                {
                    model: Organisation,
                    where: { status: "active" },
                    attributes: ["uuid", "name", "brief", "logo"],
                    as: "organisation",
                    required: true,
                },
            ],
        });

        organisationMember = JSON.parse(JSON.stringify(organisationMember));

        const organisation = organisationMember.map((data) => {
            data.organisation.role = data.type;
            return data.organisation;
        });

        api("User organisations fetched successfully", res, organisation);
    };

    getMembers: RequestHandler = async (req: any, res: Response) => {
        const include: any = [
            {
                model: UserProfile,
                as: "profile",
                attributes: ["id", "company", "designation", "status", "country_id", "state_id"],
            },
        ];

        if (req.query.role) {
            include.push({
                model: Role,
                where: { slug: req.query.role },
                as: "roles",
                required: true,
            });
        }

        if (req.query.type) {
            include.push({
                model: OrganisationMember,
                where: { status: "active" },
                attributes: ["user_id", "organisation_id", "status"],
                as: "member_organisations",
                required: false,
            });
        }

        let query: any = {};
        if (req.query.status) {
            query.status = req.query.status;
        }

        const { rows, count } = await User.findAndCountAll({
            where: query,
            limit: req.query.limit ? req.query.limit : null,
            offset: req.query.page && req.query.limit ? (Number(req.query.page) - 1) * Number(req.query.limit) : 0,
            attributes: ["uuid", "first_name", "last_name", "phone", "status", "email", "created_at", "updated_at"],
            order: [["created_at", "desc"]],
            include: include,
            distinct: true,
        });

        let responseData: any = rows;

        if (req.query.type) {
            responseData = responseData.filter((user: any) => (req.query.type === "organisation_users" ? user.member_organisations.length : !user.member_organisations.length));
        }

        if (req.query.role || req.query.type) {
            responseData = responseData.map((data) => {
                return {
                    uuid: data.uuid,
                    first_name: data.first_name,
                    last_name: data.last_name,
                    phone: data.phone,
                    email: data.email,
                    profile: data.profile,
                    created_at: data.created_at,
                    updated_at: data.updated_at,
                };
            });
        }

        const pages = req.query.limit ? count / Number(req.query.limit) : 1;
        api("Members fetched successfully", res, { total: responseData.length, pages: Math.ceil(pages), data: responseData });
    };

    getMember: RequestHandler = async (req: Request, res: Response) => {
        const user = await User.findOne({
            where: { uuid: req.params.uuid },
            attributes: ["photo", "uuid", "first_name", "last_name", "phone", "email", "gender", "dob", "status"],
            include: [
                {
                    model: UserProfile,
                    as: "profile",
                    attributes: ["id", "company", "designation", "status", "country_id", "state_id", "type"],
                    required: false,
                },
                {
                    model: Organisation,
                    as: "organisations",
                    required: false,
                },
                {
                    model: Workspace,
                    as: "user_workspaces",
                    include: [
                        {
                            model: Organisation,
                            attributes: ["name", "uuid"],
                            as: "organisation",
                        },
                    ],
                    required: false,
                },
            ],
        });

        const responseData = JSON.parse(JSON.stringify(user));
        responseData.organisations = responseData.organisations.map((data) => {
            return {
                logo: data.logo,
                added_by: data.added_by,
                uuid: data.uuid,
                name: data.name,
                domain: data.domain,
                role: data.OrganisationMember.type,
            };
        });

        responseData.user_workspaces = responseData.user_workspaces.map((data) => {
            return {
                uuid: data.uuid,
                logo: data.logo,
                name: data.name,
                type: data.type,
                role: data.WorkspaceMember.role,
                organisation: data.organisation ? data.organisation.name : null,
                organistion_uuid: data.organisation ? data.organisation.uuid : null,
            };
        });
        api("Member fetched successfully", res, responseData);
    };

    putMember: RequestHandler = async (req: Request, res: Response) => {
        const user = await User.findOne({
            where: { uuid: req.params.uuid },
            attributes: {
                exclude: ["password"],
            },
        });

        if (!user) {
            throw { message: "User not found", code: 422 };
        }

        if (req.body.email) {
            const email_exists = await User.findOne({
                where: { email: req.body.email, uuid: { [Op.ne]: req.params.uuid } },
            });

            if (email_exists) {
                throw { message: "Email is taken. Please enter another email id", code: 422, report: false };
            }
        }

        if (req.body.phone) {
            const phone_exists = await User.findOne({
                where: { phone: req.body.phone, uuid: { [Op.ne]: req.params.uuid } },
            });

            if (phone_exists) {
                throw { message: "Phone number is taken. Please enter another phone number", code: 422, report: false };
            }
        }

        const prev_domain = user.email.split("@")[1];
        const curr_domain = req.body.email ? req.body.email.split("@")[1] : prev_domain;
        const phone_change = req.body.phone && req.body.phone != user.phone ? true : false;

        user.first_name = req.body.first_name ? req.body.first_name : user.first_name;
        user.last_name = req.body.last_name ? req.body.last_name : user.last_name;
        user.email = req.body.email ? req.body.email : user.email;
        user.phone = req.body.phone ? req.body.phone : user.phone;
        user.whatsapp_number = req.body.phone ? req.body.phone : user.whatsapp_number;
        await user.save();

        const [userProfile, created] = await UserProfile.findOrCreate({
            where: { user_id: user.id },
        });

        userProfile.company = req.body.company ? req.body.company : userProfile.company;
        userProfile.designation = req.body.designation ? req.body.designation : userProfile.designation;
        await userProfile.save();

        // map organization to user if domain exists
        if (curr_domain != prev_domain && !PUBLIC_DOMAIN.includes(curr_domain)) {
            const organisation = await Organisation.findOne({
                where: { domain: curr_domain },
                attributes: ["id"],
            });

            if (organisation) {
                const [orgMember, created] = await OrganisationMember.findOrCreate({
                    where: {
                        user_id: user.id,
                        organisation_id: organisation.id,
                        status: "active",
                    },
                    defaults: {
                        type: "member",
                    },
                });

                if (created) {
                    const roles = await getUserRoles(user);
                    if (!roles.includes("role-organisation-member")) {
                        await addRole(user.id, "role-organisation-member");
                    }

                    await new Bull(`${process.env.REDIS_EMAIL_QUEUE}`).add({
                        type: "email-organisation-member-added",
                        data: { user_id: user.id, organisation_id: organisation.id },
                    });
                }
            }
        }

        // Send welcome message on WhatsApp for whatsApp GPT on new number
        if (phone_change) {
            const message = `Welcome to ABCD's BehaviorGPT on WhatsApp!

    We are thrilled to introduce you to our AI-powered chatbot that leverages high-quality behavior research to assist you in designing effective behavior programs. Feel free to ask questions, discuss different behavior-related topics, or seek recommendations. Our goal is to empower you with the knowledge and tools to create impactful behavior programs.
    
    Please note that while BehaviorGPT is well-informed by research, it's important to adapt its suggestions to your specific context and consult with professionals when needed. We hope you find ABCD's BehaviorGPT on WhatsApp valuable in your journey. If you have any inquiries or require further assistance, our team is always available to support you.
    
    To start a new session with BehaviorGPT, simply send a message saying "START NEW SESSION". This will initiate a dynamic and engaging conversation where BehaviorGPT can respond to your queries.
    
    The ABCD Team`;

            const to_number = `whatsapp:+91${user.whatsapp_number}`;

            sendWhatsAppMessage(to_number, message);
        }

        api("Member updated successfully", res, { user, userProfile });
    };
}
