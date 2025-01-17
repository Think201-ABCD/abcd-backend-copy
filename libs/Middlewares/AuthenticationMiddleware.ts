import jwt from "jsonwebtoken";
import { RequestHandler } from "express";

// Helpers
import { apiException } from "../Helpers/helpers";
import { redisHgetAsync } from "../Loaders/redis";
import { getUserRoles } from "../Helpers/AuthenticationHelper";

// Models
import { User } from "../Models/Auth/User";
import { Role } from "../Models/Auth/Role";
import { getOrgainsationId } from "../Helpers/OrganisationHelper";

export const authorize = (roles: string[]) => {
    const middleware: RequestHandler = async (req, res, next) => {
        try {
            const headerToken: any = req.header("Authorization");

            if (!headerToken) {
                throw { message: "Authentication Failed, Please ensure you have logged in.", code: 401 };
            }

            const token = headerToken.replace("Bearer ", "");

            const verifiedToken: any = jwt.verify(token, `${process.env.TOKEN_SECRET}`);

            const authData: any = await redisHgetAsync(`${process.env.REDIS_AUTH_TOKENS}`, verifiedToken.uuid);

            if (!authData) {
                throw { message: "Authentication Failed, Please ensure you have logged in.", code: 401 };
            }

            // Set user data in res.locals, to be used in controllers
            const user: any = await User.findOne({
                where: { id: authData.user_id },
                include: [{ model: Role, as: "roles", required: false }],
            });

            if (!user) {
                throw { message: "Authentication Failed, Please ensure you have logged in.", code: 401 };
            }

            res.locals.user = user.toJSON();

            const orgId = getOrgainsationId(user.email);
            res.locals.user.orgId = orgId;

            res.locals.roles = await getUserRoles(user);

            const roles_intersection = roles.filter((value: string) => res.locals.roles.includes(value));

            if (!roles.includes("role-all") && roles_intersection.length == 0) {
                throw { message: "Invalid request, Please check your access to this operation.", code: 422 };
            }

            return next();
        } catch (e: any) {
            if (e.constructor.name === "TokenExpiredError") {
                return apiException(
                    "Authentication expired, Please log in to continue.",
                    res,
                    {},
                    e.code ? e.code : 401
                );
            }

            return apiException(e.message ? String(e.message) : String(e), res, {}, e.code ? e.code : 401);
        }
    };

    return middleware;
};
