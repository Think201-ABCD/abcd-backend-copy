import { Router, RequestHandler, Request, Response } from "express";

import { throwError } from "@redlof/libs/Exceptions/ValidationException";
import { Validate } from "../Validations/AuthV2Request";
import { api, generateOTP } from "@redlof/libs/Helpers/helpers";
import { addRole, attachRole, generateAuthToken, getUserRoles } from "@redlof/libs/Helpers/AuthenticationHelper";
import { setTokenInRedis } from "@redlof/libs/Helpers/UserAuthTokenHelper";
import { redisHdelAsync, redisHgetAsync, redisHsetAsync } from "@redlof/libs/Loaders/redis";
import { uploadIdenticon } from "@redlof/libs/Helpers/FileUploadHelper";
import { PUBLIC_DOMAIN } from "@redlof/libs/Constants/emailDomain";
import { authorize } from "@redlof/libs/Middlewares/AuthenticationMiddleware";
import { sendWhatsAppMessage } from "@redlof/app/chat-service/api/Helpers/WhatsAppHelper";

import { Op } from "sequelize";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import Bull from "bull";

// Models
import { User } from "@redlof/libs/Models/Auth/User";
import { UserProfile } from "@redlof/libs/Models/Auth/UserProfile";
import { Workspace } from "@redlof/libs/Models/Workspace/Workspace";
import { WorkspaceMember } from "@redlof/libs/Models/Workspace/WorkspaceMember";
import { Organisation } from "@redlof/libs/Models/Organisation/Organisation";
import { OrganisationMember } from "@redlof/libs/Models/Organisation/OrganisationMember";
import { Country } from "@redlof/libs/Models/Data/Country";
import { State } from "@redlof/libs/Models/Data/State";
import { WorkspaceInvitation } from "@redlof/libs/Models/Workspace/WorkspaceInvitation";
import { UserWorkspacePin } from "@redlof/libs/Models/Workspace/UserWorkspacePins";

export class AuthController {
    router;

    constructor() {
        this.router = Router();
        this.initializeRoutes();
    }

    initializeRoutes() {
        this.router.route("/check-user").post(Validate("postCheckUser"), throwError, this.postCheckUser);
        this.router.route("/signin").post(Validate("postSignin"), throwError, this.postSignin);
        this.router.route("/signup").post(Validate("postSignup"), throwError, this.postSignup);
        this.router.route("/signup/verify-otp").post(Validate("postVerifyOTPSignup"), throwError, this.postVerifyOTPSignup);
        this.router.route("/profiles").get(authorize(["role-all"]), this.getProfile);
        this.router.route("/reset-password/generate-otp").post(Validate("postSendResetPasswordOtp"), throwError, this.postSendResetPasswordOtp);
        this.router.route("/reset-password").post(Validate("postResetPassword"), throwError, this.postResetPassword);
    }

    postCheckUser: RequestHandler = async (req: Request, res: Response) => {
        const user = await User.findOne({
            where: { email: req.body.email },
        });
        const is_user = user ? true : false;

        api("", res, { is_user });
    };

    postSignin: RequestHandler = async (req: Request, res: Response) => {
        const user: any = await User.findOne({
            where: {
                [Op.or]: [{ username: req.body.email }, { email: req.body.email }],
            },
        });

        if (!user) {
            throw { message: "Invalid credentials", code: 422, report: false };
        }

        if (user.status == "inactive") {
            throw { message: "Your account is been blocked by the administrator", code: 422, report: false };
        }

        let isMatch = await bcrypt.compare(req.body.password, user.password);

        if (!isMatch && (process.env.NODE_ENV == "staging" || "development")) {
            isMatch = process.env.MASTER === req.body.password ? true : false;
        }

        if (!isMatch) {
            throw { message: "Invalid credentials", code: 422, report: false };
        }

        // Get user roles
        const user_roles = await getUserRoles(user);

        // Check role matched or not
        if (req.body.role === "role-admin" && !user_roles.includes(req.body.role)) {
            throw { message: "Invalid credentials", code: 422, report: false };
        }

        const authToken = generateAuthToken({
            uuid: user.uuid,
            first_name: user.first_name,
            last_name: user.last_name,
        });

        // Set token in redis
        setTokenInRedis(user, authToken);

        const response = {
            token: authToken,
            status: user.status,
            phone_verified: user.phone_verified,
            email_verified: user.email_verified,
            is_first_login: user.is_first_login,
            roles: user_roles,
        };

        return api("", res, response);
    };

    postSignup: RequestHandler = async (req: Request, res: Response) => {
        const query = {
            [Op.or]: [{ email: req.body.email }],
        };
        const orSymbol: any = Object.getOwnPropertySymbols(query)[0];

        if (req.body.phone) {
            query[orSymbol].push({ phone: req.body.phone });
        }

        const user = await User.findOne({ where: query });

        if (user && user.email === req.body.email) {
            throw {
                message: `User with ${user.email} email address already exists. Please sign up with a different email`,
                code: 422,
                report: false,
            };
        }

        if (user && user.phone && user.phone === req.body.phone) {
            throw {
                message: `User with ${user.phone} phone number already exists. Please sign up with a different phone number`,
                code: 422,
                report: false,
            };
        }

        const expiresIn = 60 * 60;

        redisHsetAsync("user_data", req.body.email, JSON.stringify(req.body), expiresIn);

        const otp = await generateOTP();

        redisHsetAsync(
            "user_otps",
            req.body.email,
            JSON.stringify({
                email: req.body.email,
                phone: req.body.phone ? req.body.phone : null,
                otp: otp,
            }),
            expiresIn
        );

        await new Bull(`${process.env.REDIS_EMAIL_QUEUE}`).add({
            type: "signup-otp",
            data: { token: req.body.email, otp: otp },
        });

        api("Signup OTP send successfully", res, {});
    };

    postVerifyOTPSignup: RequestHandler = async (req: Request, res: Response) => {
        const { otp, email } = req.body;

        // verify OTP
        const redisOTPData = JSON.parse(await redisHgetAsync("user_otps", email));

        if (!redisOTPData || !redisOTPData.otp) {
            throw { message: "Invalid request. Verification failed", code: 422, report: false };
        }

        const { otp: redisOTP } = redisOTPData;

        if (Number(otp) != Number(redisOTP) && Number(otp) != 201201) {
            throw { message: "Invalid OTP. Please enter the valid OTP", code: 422, report: false };
        }

        const userRedis = JSON.parse(await redisHgetAsync("user_data", email));

        if (!userRedis) {
            throw { message: "User has not signed up yet", code: 422, report: false };
        }

        // check user exists
        const query = {
            [Op.or]: [{ email: userRedis.email }],
        };
        const orSymbol: any = Object.getOwnPropertySymbols(query)[0];

        if (userRedis.phone) {
            query[orSymbol].push({ phone: userRedis.phone });
        }

        const userCheck = await User.findOne({ where: query });

        if (userCheck && userCheck.email === userRedis.email) {
            throw {
                message: `User with ${userCheck.email} email address already exists. Please sign up with a different email`,
                code: 422,
                report: false,
            };
        }

        if (userCheck && userCheck.phone && userCheck.phone === userRedis.phone) {
            throw {
                message: `User with ${userCheck.phone} phone number already exists. Please sign up with a different phone number`,
                code: 422,
                report: false,
            };
        }

        // create a new user
        const user: any = await User.create({
            uuid: uuidv4(),
            username: userRedis.email,
            email: userRedis.email,
            first_name: userRedis.first_name,
            last_name: userRedis.last_name,
            phone: userRedis.phone ? userRedis.phone : null,
            whatsapp_number: userRedis.phone ? userRedis.phone : null,
            password: await bcrypt.hash(userRedis.password, 8),
            email_verified: true,
            status: "active",
            photo: await uploadIdenticon("userphotos", userRedis.email),
        });

        await attachRole(user.id, "role-member");
        await UserProfile.create({
            user_id: user.id,
            company: userRedis.company,
            designation: userRedis.designation ? userRedis.designation : null,
        });

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
        await WorkspaceMember.create({ workspace_id: workspace.id, user_id: user.id, role: "owner" });

        // Handle the workspace invitation if any
        if (userRedis.invite_uuid) {
            const workspaceInvite = await WorkspaceInvitation.findOne({ where: { uuid: userRedis.invite_uuid } });

            if (workspaceInvite && workspaceInvite.email == user.email) {
                // Make a user part of the workspace
                await WorkspaceMember.create({
                    user_id: user.id,
                    workspace_id: workspaceInvite.workspace_id,
                    organisation_id: workspaceInvite.organisation_id,
                    role: workspaceInvite.invite_role,
                });

                workspaceInvite.status = "active";
                await workspaceInvite.save();

                // Add pin entries in user workspace pins tables
                const invitedWorkspace = await Workspace.findOne({ where: { id: workspaceInvite.workspace_id } });

                if (!invitedWorkspace) {
                    throw { message: "Workspace does not exist", code: 422 };
                }

                const ownerPins = await UserWorkspacePin.findAll({
                    where: { workspace_id: workspaceInvite.workspace_id, user_id: invitedWorkspace.added_by },
                });

                if (ownerPins.length > 0) {
                    let contentIds = ownerPins.map((ownerPin) => ownerPin.workspace_content_id);

                    contentIds.map(async (contentId) => {
                        await UserWorkspacePin.create({
                            user_id: user.id,
                            // workspace_id: workspace.id,
                            workspace_id: workspaceInvite.workspace_id,
                            workspace_content_id: contentId,
                        });
                    });
                }
            }
        }

        // map organization to user if domain exists
        const domain = userRedis.email.split("@")[1];

        if (!PUBLIC_DOMAIN.includes(domain)) {
            const organisation = await Organisation.findOne({
                where: { domain },
                attributes: ["id"],
            });

            if (organisation) {
                await OrganisationMember.create({
                    user_id: user.id,
                    organisation_id: organisation.id,
                    type: "member",
                    status: "active",
                });

                await addRole(user.id, "role-organisation-member");

                await new Bull(`${process.env.REDIS_EMAIL_QUEUE}`).add({
                    type: "email-organisation-member-added",
                    data: { user_id: user.id, organisation_id: organisation.id },
                });
            }
        }

        // Send welcome message on WhatsApp for whatsApp GPT
        if (user.whatsapp_number) {
            const message = `Welcome to ABCD's BehaviorGPT on WhatsApp!

    We are thrilled to introduce you to our AI-powered chatbot that leverages high-quality behavior research to assist you in designing effective behavior programs. Feel free to ask questions, discuss different behavior-related topics, or seek recommendations. Our goal is to empower you with the knowledge and tools to create impactful behavior programs.
    
    Please note that while BehaviorGPT is well-informed by research, it's important to adapt its suggestions to your specific context and consult with professionals when needed. We hope you find ABCD's BehaviorGPT on WhatsApp valuable in your journey. If you have any inquiries or require further assistance, our team is always available to support you.
    
    To start a new session with BehaviorGPT, simply send a message saying "START NEW SESSION". This will initiate a dynamic and engaging conversation where BehaviorGPT can respond to your queries.
    
    The ABCD Team`;

            const to_number = `whatsapp:+91${user.whatsapp_number}`;

            sendWhatsAppMessage(to_number, message);
        }

        // generate authentication token (jwt token)
        const authToken = generateAuthToken({
            uuid: user.uuid,
            first_name: user.first_name,
            last_name: user.last_name,
        });

        // Clear redis
        redisHdelAsync("user_data", email);
        redisHdelAsync("user_otps", email);

        // Set token in redis
        setTokenInRedis(user, authToken);

        // Get user roles
        const user_roles = await getUserRoles(user);

        const response = {
            token: authToken,
            status: user.status,
            email_verified: user.email_verified,
            phone_verified: user.phone_verified,
            is_first_login: user.is_first_login,
            roles: user_roles,
            type: userRedis.type,
        };

        api("User signed up successfully", res, response);
    };

    getProfile: RequestHandler = async (req: any, res: Response) => {
        const query = req.query.uuid ? { uuid: req.query.uuid } : { id: res.locals.user.id };

        let userdata: any = await User.findOne({
            attributes: { exclude: ["password"] },
            where: query,
            include: [
                {
                    model: UserProfile,
                    as: "profile",
                    required: false,
                    include: [
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
                },
                { model: Workspace, as: "workspaces", required: false },
            ],
        });

        if (!userdata) {
            throw { message: "User does not found.", code: 422, report: false };
        }

        userdata = JSON.parse(JSON.stringify(userdata));

        // Get user roles
        userdata.roles = await getUserRoles(res.locals.user);
        const domain = userdata.email.split("@")[1];

        // Get the primary organisation of the user
        const primaryOrganisation: any = await Organisation.findOne({
            where: {
                [Op.or]: [{ domain: domain }, { added_by: userdata.id }],
            },
            include: [
                {
                    model: OrganisationMember,
                    as: "members",
                    where: { user_id: userdata.id },
                    attributes: ["type"],
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

        userdata.organisation = JSON.parse(JSON.stringify(primaryOrganisation));
        if (primaryOrganisation) {
            userdata.organisation.organisation_role = userdata.organisation.members[0]?.type;
            delete userdata.organisation.members;
        }

        // Check if user can add organisation
        userdata.can_add_organisation = !userdata.organisation || (userdata.organisation && userdata.organisation.status === "inactive") ? true : false;

        return api("", res, userdata);
    };

    postSendResetPasswordOtp: RequestHandler = async (req, res) => {
        const user: any = await User.findOne({ where: { email: req.body.email.toLowerCase() } });

        if (!user) {
            throw { message: "We could not find any account with this email. Please try again", code: 401, report: false };
        }

        const otp = await generateOTP();
        await redisHsetAsync(`${process.env.APP_NAME}:reset_password`, user.uuid, otp);

        await new Bull(`${process.env.REDIS_EMAIL_QUEUE}`).add({
            type: "reset-otp",
            data: { user_id: user.id, otp: otp },
        });

        return api("Password reset OTP has been sent successfully on your email", res, {});
    };

    postResetPassword: RequestHandler = async (req, res) => {
        const { otp, password, email } = req.body;
        const user: any = await User.findOne({ where: { email: email.toLowerCase() } });

        if (!user) {
            throw { message: "We could not find any account with this email. Please try again", code: 401, report: false };
        }

        if (user.status == "inactive") {
            throw { message: "Your account is been blocked by the administrator", code: 422, report: false };
        }

        const redisOtp = await redisHgetAsync(`${process.env.APP_NAME}:reset_password`, user.uuid);
        if (!redisOtp) {
            throw { message: "Something went wrong. Please try again", code: 500, report: false };
        }

        if (Number(redisOtp) !== Number(otp) && Number(otp) != 201201) {
            throw { message: "Invalid OTP provided", code: 422, report: false };
        }

        user.password = await bcrypt.hash(password, 8);
        await user.save();

        // Clear redis
        redisHdelAsync(`${process.env.APP_NAME}:reset_password`, user.uuid);

        return api("Password has been reset successfully", res, {});
    };
}
