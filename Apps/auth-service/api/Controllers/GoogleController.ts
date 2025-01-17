import { RequestHandler } from "express";
import { google } from "googleapis";
import { promisify } from "util";
import bcrypt from "bcryptjs";
import { OAuth2Client } from "google-auth-library";
import { v4 as uuidv4 } from "uuid";

// Helper
import { api, apiException } from "@redlof/libs/Helpers/helpers";
import * as tokenHelper from "@redlof/libs/Helpers/AuthenticationHelper";
import { redisHgetAsync, redisHsetAsync } from "@redlof/libs/Loaders/redis";

// Models
import { User } from "@redlof/libs/Models/Auth/User";
import { uploadFileFromUrl, uploadIdenticon } from "@redlof/libs/Helpers/FileUploadHelper";
import { mapUserRole } from "@redlof/libs/Helpers/RoleHelper";
import { setTokenInRedis } from "@redlof/libs/Helpers/UserAuthTokenHelper";
import Bull from "bull";

const scope = ["https://www.googleapis.com/auth/userinfo.profile", "https://www.googleapis.com/auth/userinfo.email"];

// Initialize google client
const googleAuthClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET, process.env.GOOGLE_REDIRECT_URL);

export const getSignInUrl: RequestHandler = async (req, res) => {
    const url = googleAuthClient.generateAuthUrl({ access_type: "offline", scope: scope });

    return api("", res, { redirect: url });
};

export const postGoogleSignIn: RequestHandler = async (req, res) => {
    /* eslint-disable prefer-const */
    let { code, role } = req.body;

    role = role ? "role-" + role : "role-expert";

    const { tokens } = await googleAuthClient.getToken({ code: decodeURIComponent(code) });

    googleAuthClient.setCredentials({ access_token: `${tokens.access_token}` });

    const authClient = google.oauth2({ auth: googleAuthClient, version: "v2" });

    const profileRequest = promisify(authClient.userinfo.get).bind(authClient);

    const { data }: any = await profileRequest();

    let user: any = await User.findOne({ where: { email: data.email } });

    if (user && user.status === "inactive") {
        throw { message: "Your access to the platform is restricted. Please contact administrator", code: 403, report: false };
    }

    // If exists do signin else do signup
    if (!user) {
        user = await User.create({
            uuid: uuidv4(),
            first_name: data.given_name,
            last_name: data.family_name,
            email: data.email,
            username: data.email,
            photo: data.picture ? await uploadFileFromUrl(data.picture, "userphotos") : await uploadIdenticon("userphotos", data.email),
            email_verified: true,
            password: await bcrypt.hash(Math.random().toString(36).slice(2), 8),
            status: "active",
        });

        // Send welcome email
        await new Bull(`${process.env.REDIS_EMAIL_QUEUE}`).add({
            type: "email-welcome",
            data: { user_id: user.id },
        });
    }

    // Get user roles
    const user_roles = await tokenHelper.getUserRoles(user);

    const authToken = await tokenHelper.generateAuthToken({
        uuid: user.uuid,
        first_name: user.first_name,
        last_name: user.last_name,
        role: role,
    });

    // Set token in redis
    setTokenInRedis(user, authToken);

    const response = {
        token: authToken,
        status: user.status,
        phone_verified: user.phone_verified,
        email_verified: user.email_verified,
        roles: user_roles,
    };

    return api("User signed in successfully", res, response);
};
