import { RequestHandler, Request, Response } from "express";
import bcrypt from "bcryptjs";
import Bull from "bull";

import { ApiBaseController } from "@redlof/libs/Classes/ApiBaseController";
import { throwError } from "@redlof/libs/Exceptions/ValidationException";
import { api, generateOTP } from "@redlof/libs/Helpers/helpers";
import { redisHdelAsync, redisHgetAsync, redisHsetAsync } from "@redlof/libs/Loaders/redis";
import { generateAuthToken, getUserRoles } from "@redlof/libs/Helpers/AuthenticationHelper";
import { authorize } from "@redlof/libs/Middlewares/AuthenticationMiddleware";
import { Validate } from "../Validations/AuthRequest";

// Models
import { User } from "@redlof/libs/Models/Auth/User";

export class AuthController extends ApiBaseController {
    constructor() {
        super();
        this.initializeRoutes();
    }

    // Initialise the routes
    initializeRoutes = () => {
        // Public
        this.router.route("/signin").post(Validate("postSignin"), throwError, this.postSignin);
        this.router.route("/signout").get(authorize(["role-cockpit-admin"]), this.getSignOut);
        this.router.route("/profile").get(authorize(["role-cockpit-admin"]), this.getProfile);
        this.router.route("/reset-password/generate-otp").post(Validate("postSendResetPasswordOtp"), throwError, this.postSendResetPasswordOtp);
        this.router.route("/reset-password").post(Validate("postResetPassword"), throwError, this.postResetPassword);
        this.router.route("/change-password").put(authorize(["role-cockpit-admin"]), Validate("changePassword"), throwError, this.postChangePassword);
    };

    postSignin: RequestHandler = async (req: Request, res: Response) => {
        const user: any = await User.findOne({ where: { email: req.body.email.toLowerCase() } });

        if (!user) {
            throw { message: "User with the email does not exist", code: 401, report: false };
        }
        
        // Get user roles
        const user_roles = await getUserRoles(user);

        // check role matched or not
        if (!user_roles.includes("role-cockpit-admin")) {
            throw { message: "Invalid action, Please check your access to this action.", code: 401, report: false };
        }

        if (user.status == "inactive") {
            throw { message: "Your account is been blocked by the administrator", code: 401, report: false };
        }

        const isMatch = await bcrypt.compare(req.body.password, user.password);

        if (!isMatch) {
            throw { message: "Password is incorrect", code: 401, report: false };
        }

        const authToken = generateAuthToken({
            uuid: user.uuid,
            name: user.name,
            entity: "user",
        });

        // Set token in redis
        redisHsetAsync(`${process.env.REDIS_AUTH_TOKENS}`, `${user.uuid}`, { user_id: user.id, token: authToken });

        const response = {
            token: authToken,
            status: user.status,
            roles: user_roles,
        };

        api("User signin successfully", res, response);
    };

    getSignOut: RequestHandler = async (req: Request, res: Response) => {
        const user = res.locals.user;

        // Delete token in redis
        redisHdelAsync(`${process.env.REDIS_AUTH_TOKENS}`, `${user.uuid}`);
        api("User signout successfully", res, {});
    };

    getProfile: RequestHandler = async (req: Request, res: Response) => {
        const user = await User.findByPk(res.locals.user.id, {
            attributes: { exclude: ["password"] },
        });

        api("Profile fetched successfully", res, user);
    };

    postSendResetPasswordOtp: RequestHandler = async (req, res) => {
        const user: any = await User.findOne({ where: { email: req.body.email.toLowerCase() } });

        if (!user) {
            throw { message: "We could not find any account with this email. Please try again", code: 401, report: false };
        }

        const otp = await generateOTP();
        await redisHsetAsync("reset_password", user.uuid, otp);

        await new Bull(`${process.env.REDIS_COCKPIT_EMAIL_QUEUE}`).add({
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

        const redisOtp = await redisHgetAsync("reset_password", user.uuid);
        if (!redisOtp) {
            throw { message: "Something went wrong. Please try again", code: 500, report: false };
        }

        if (redisOtp !== Number(otp)) {
            throw { message: "Invalid OTP provided", code: 422, report: false };
        }

        user.password = await bcrypt.hash(password, 8);
        await user.save();

        // Clear redis
        redisHdelAsync("reset_password", user.uuid);

        return api("Password has been reset successfully", res, {});
    };

    postChangePassword = async (req, res) => {
        const user = await User.findOne({ where: { id: res.locals.user.id } });

        if (!user) {
            throw { message: "User does not have access for this operation", code: 422 };
        }

        let isMatch = await bcrypt.compare(req.body.old_password, user.password);
        if (!isMatch) {
            throw { message: "Please provide correct old password", code: 422, report: false };
        }

        isMatch = await bcrypt.compare(req.body.new_password, user.password);
        if (isMatch) {
            throw { message: "New password must be different from the old password", code: 422, report: false };
        }

        const newPassword = await bcrypt.hash(req.body.new_password, 8);
        user.password = newPassword;
        await user.save();

        return api("Password has been changed successfully", res, {});
    };
}
