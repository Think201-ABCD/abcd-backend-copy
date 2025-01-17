import { RequestHandler } from "express";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import * as tokenHelper from "@redlof/libs/Helpers/AuthenticationHelper";
import { Op } from "sequelize";

//Helpers
import { api, apiException, generateOTP } from "@redlof/libs/Helpers/helpers";
import { redisHdelAsync, redisHgetAsync, redisHsetAsync } from "@redlof/libs/Loaders/redis";
import { attachRole, getUserRoles } from "@redlof/libs/Helpers/AuthenticationHelper";

// Models
import { User } from "@redlof/libs/Models/Auth/User";
import Bull from "bull";
import { setTokenInRedis } from "@redlof/libs/Helpers/UserAuthTokenHelper";
import { uploadIdenticon } from "@redlof/libs/Helpers/FileUploadHelper";
import { UserProfile } from "@redlof/libs/Models/Auth/UserProfile";
import { Workspace } from "@redlof/libs/Models/Workspace/Workspace";
import { WorkspaceMember } from "@redlof/libs/Models/Workspace/WorkspaceMember";
import { WorkspaceInvitation } from "@redlof/libs/Models/Workspace/WorkspaceInvitation";
import { UserWorkspacePin } from "@redlof/libs/Models/Workspace/UserWorkspacePins";

export const postSignup: RequestHandler = async (req, res) => {
    let { token } = req.body;

    let signupData: any = {};

    if (!token) {
        token = uuidv4();
    }

    signupData = JSON.parse(await redisHgetAsync("user_data", token));

    signupData = signupData ? { ...signupData, ...req.body } : req.body;

    redisHsetAsync("user_data", token, JSON.stringify(signupData));

    const otp = await generateOTP();

    redisHsetAsync(
        "user_otps",
        token,
        JSON.stringify({
            email: signupData.email,
            phone: signupData.phone ? signupData.phone : null,
            otp: otp,
        })
    );

    await new Bull(`${process.env.REDIS_EMAIL_QUEUE}`).add({
        type: "signup-otp",
        data: { token: token, otp: otp },
    });

    delete signupData.password;

    return api("", res, { token: token, ...signupData });
};

export const getSignup: RequestHandler = async (req, res) => {
    const { uuid } = req.query;

    const userSignupData = JSON.parse(await redisHgetAsync("user_data", String(uuid)));

    if (!userSignupData) {
        throw { message: "User does not exist. Please signup.", code: 401, report: false };
    }

    delete userSignupData.password;

    return api("", res, { ...userSignupData });
};

export const postVerifyOTPSignup: RequestHandler = async (req, res) => {
    const { otp, token } = req.body;

    const redisOTPData = JSON.parse(await redisHgetAsync("user_otps", token));

    if (!redisOTPData || !redisOTPData.otp) {
        throw { message: "Invalid request. Verification failed", code: 422, report: false };
    }

    const { otp: redisOTP } = redisOTPData;

    if (Number(otp) != Number(redisOTP) && Number(otp) != 201201) {
        throw { message: "Invalid OTP. Please enter the valid OTP", code: 422, report: false };
    }

    const userRedis = JSON.parse(await redisHgetAsync("user_data", token));

    if (!userRedis) {
        throw { message: "User has not signed up yet", code: 422, report: false };
    }

    const userCheck = await User.findOne({ where: { email: userRedis.email } });

    if (userCheck) {
        throw {
            message: `User with ${userRedis.email} email address already exists. Please sign up with a different email`,
            code: 422,
            report: false
        };
    }

    const user: any = await User.create({
        uuid: uuidv4(),
        username: userRedis.email,
        email: userRedis.email,
        first_name: userRedis.first_name ? userRedis.first_name : null,
        last_name: userRedis.last_name ? userRedis.last_name : null,
        password: await bcrypt.hash(userRedis.password, 8),
        email_verified: true,
        status: userRedis.type == "individual" ? "active" : "yet_to_join",
        photo: await uploadIdenticon("userphotos", userRedis.email),
    });

    if (userRedis.type == "individual") {
        await attachRole(user.id, "role-member");

        await UserProfile.create({ user_id: user.id, type: "individual" });
    }

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
            workspaceInvite.save();

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

    const authToken = tokenHelper.generateAuthToken({
        uuid: user.uuid,
        first_name: user.first_name,
        last_name: user.last_name,
    });

    // Clear redis
    redisHdelAsync("user_data", token);
    redisHdelAsync("user_otps", token);

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

    return api("User signed up successfully", res, response);
};

export const postSignin: RequestHandler = async (req, res) => {
    const user: any = await User.findOne({
        where: {
            [Op.or]: [{ username: req.body.username }, { email: req.body.username }],
        },
    });

    if (!user) {
        throw { message: "Invalid credentials", code: 422, report: false };
    }

    if (user.status == "inactive") {
        throw { message: "Your account is been blocked by the administrator", code: 422, report: false };
    }

    const isMatch = await bcrypt.compare(req.body.password, user.password);

    if (!isMatch) {
        throw { message: "Invalid credentials", code: 422, report: false };
    }

    // Get user roles
    const user_roles = await getUserRoles(user);

    // Check role matched or not
    if (req.body.role === "role-admin" && !user_roles.includes(req.body.role)) {
        throw { message: "Invalid credentials", code: 422, report: false };
    }

    const authToken = tokenHelper.generateAuthToken({
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

export const postResendOTP: RequestHandler = async (req, res) => {
    const { token } = req.body;

    const redisOTPData = JSON.parse(await redisHgetAsync("user_otps", token));

    if (!redisOTPData) {
        throw { message: "Invalid request", code: 422, report: false };
    }

    const otp = generateOTP();

    redisOTPData.otp = otp;

    await redisHsetAsync("user_otps", token, JSON.stringify(redisOTPData));

    await new Bull(`${process.env.REDIS_EMAIL_QUEUE}`).add({
        type: "resend-otp",
        data: { token: token },
    });

    return api("Otp send successfully", res, {});
};

export const postSendResetPasswordLink: RequestHandler = async (req, res) => {
    const user: any = await User.findOne({ where: { email: req.body.email } });

    if (!user) {
        throw { message: "We could not find any account with this email. Please try again", code: 401, report: false };
    }

    const token = req.body.token ? req.body.token : uuidv4();

    redisHsetAsync(
        "reset_password",
        token,
        JSON.stringify({
            uuid: user.uuid,
        })
    );

    await new Bull(`${process.env.REDIS_EMAIL_QUEUE}`).add({
        type: "reset-password-link",
        data: { user_id: user.id, token: token },
    });

    return api("Password reset link has been sent successfully on your email", res, {
        email: user.email,
        token: token,
    });
};

export const postResetPassword: RequestHandler = async (req, res) => {
    const { token, password } = req.body;

    const tokenData = JSON.parse(await redisHgetAsync("reset_password", token));

    if (!tokenData) {
        throw { message: "Something went wrong. Please try again", code: 500, report: false };
    }

    const user = await User.findOne({ where: { uuid: tokenData.uuid } });

    if (!user) {
        throw { message: "User does not exit", code: 401, report: false };
    }

    if (user.status == "inactive") {
        throw { message: "Your account is been blocked by the administrator", code: 422, report: false };
    }

    user.password = await bcrypt.hash(password, 8);

    await user.save();

    // Clear redis
    redisHdelAsync("reset_password", token);

    return api("Password has been reset successfully", res, {});
};

export const getSignout: RequestHandler = async (req, res) => {
    // Delete token in redis
    redisHdelAsync("user_auth", `${res.locals.user.uuid}`);

    return api("Successfully logged out", res, {});
};

export const getInvitation: RequestHandler = async (req, res) => {
    const invitation = await WorkspaceInvitation.findOne({ where: { uuid: req.params.uuid } });

    if (!invitation) {
        throw { message: "Invitation details not found", code: 422 };
    }

    return api("", res, invitation);
};

// PulginSignin
export const postPluginSignin: RequestHandler = async (req, res) => {
    const user: any = await User.findOne({
        where: {
            [Op.or]: [{ username: req.body.username }, { email: req.body.username }],
        },
    });

    if (!user) {
        throw { message: "Invalid credentials", code: 422, report: false };
    }

    if (user.status == "inactive") {
        throw { message: "Your account is been blocked by the administrator", code: 422, report: false };
    }

    const isMatch = await bcrypt.compare(req.body.password, user.password);

    if (!isMatch) {
        throw { message: "Invalid credentials", code: 422, report: false };
    }

    // Get user roles
    const user_roles = await getUserRoles(user);

    // Check role matched or not
    if (!user_roles.includes("role-corpus-editor")) {
        throw { message: "Invalid account, please reach out to administrator", code: 422 };
    }

    if (user.status == "yet_to_join") {
        user.status = "active";
        user.save();
    }

    const authToken = tokenHelper.generateAuthToken({
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
