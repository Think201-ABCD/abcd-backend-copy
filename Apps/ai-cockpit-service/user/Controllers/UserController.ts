import { RequestHandler, Request, Response } from "express";

import { ApiBaseController } from "@redlof/libs/Classes/ApiBaseController";
import { Validate } from "../Validations/UserRequest";
import { throwError } from "@redlof/libs/Exceptions/ValidationException";
import { api } from "@redlof/libs/Helpers/helpers";
import { authorize } from "@redlof/libs/Middlewares/AuthenticationMiddleware";

// Models
import { User } from "@redlof/libs/Models/Auth/User";
import { Role } from "@redlof/libs/Models/Auth/Role";
import { Op } from "sequelize";

export class UserController extends ApiBaseController {
    constructor() {
        super();
        this.initializeRoutes();
    }

    // Initialise the routes
    initializeRoutes = () => {
        // Public
        this.router.route("/").get(authorize(["role-cockpit-admin"]), Validate("getAllUsers"), throwError, this.getAllUsers);
    };

    getAllUsers: RequestHandler = async (req: Request, res: Response) => {
        const query: any = {};

        if (req.query.status) {
            query.status = req.query.status;
        }
        const { rows: users, count }: any = await User.findAndCountAll({
            limit: req.query.limit ? Number(req.query.limit) : null,
            offset: req.query.page && req.query.limit ? (Number(req.query.page) - 1) * Number(req.query.limit) : 0,
            order: [["created_at", "DESC"]],
            distinct: true,
            where: query,

            attributes: {
                exclude: ["password"],
            },

            include: [
                {
                    model: Role,
                    where: { name: { [Op.notIn]: ["role-admin", "role-cockpit-admin"] } },
                    attributes: [],
                    as: "roles",
                },
            ],
        });

        const pages = req.query.limit ? count / Number(req.query.limit) : 1;
        api("Fetched all users successfully", res, { total: count, pages: Math.ceil(pages), data: users });
    };
}
