import express from "express";
import { authorize } from "@redlof/libs/Middlewares/AuthenticationMiddleware";
import { User } from "@redlof/libs/Models/Auth/User";
import { Role } from "@redlof/libs/Models/Auth/Role";
import { Validate } from "../Validations/validations";
import { throwError } from "@redlof/libs/Exceptions/ValidationException";
import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcryptjs";
import { uploadIdenticon } from "@redlof/libs/Helpers/FileUploadHelper";
import { addRole, attachRole } from "@redlof/libs/Helpers/AuthenticationHelper";
import { UserProfile } from "@redlof/libs/Models/Auth/UserProfile";
import { api } from "@redlof/libs/Helpers/helpers";
import Bull from "bull";
import { Op } from "sequelize";
import { Corpus } from "@redlof/libs/Models/Corpus/Corpus";
var generator = require("generate-password");

export class CorpusUserController {
    router;

    constructor() {
        this.router = express.Router();
        this.initializeRoutes();
    }

    initializeRoutes = () => {
        this.router.route("/add").post(authorize(["role-admin"]), Validate("addCorpusUser"), throwError, this.addCorpusUser);

        this.router.route("/make").post(authorize(["role-admin"]), Validate("makeCorpusUser"), throwError, this.makeCorpusUser);

        this.router.route("/list").get(authorize(["role-admin"]), Validate("getCorpusUsers"), throwError, this.getCorpusUsers);
    };

    addCorpusUser = async (req, res) => {
        let role_slug = req.body.role == "editor" ? "role-corpus-editor" : "role-corpus-reviewer";

        let role = await Role.findOne({
            where: {
                slug: role_slug,
            },
        });

        if (!role) {
            throw {
                message: "Invalid role",
                code: 422,
            };
        }

        let newPassword = generator.generate({
            length: 10,
        });

        const user: any = await User.create({
            uuid: uuidv4(),
            username: req.body.email,
            email: req.body.email,
            first_name: req.body.first_name ? req.body.first_name : null,
            last_name: req.body.last_name ? req.body.last_name : null,
            password: await bcrypt.hash(newPassword, 8),
            email_verified: true,
            status: "yet_to_join",
            photo: await uploadIdenticon("userphotos", req.body.email),
        });

        await attachRole(user.id, role.slug);

        await UserProfile.create({ user_id: user.id, type: "individual" });

        await new Bull(`${process.env.REDIS_EMAIL_QUEUE}`).add({
            type: "email-corpus-editor-invite",
            data: { user_id: user.id, password: newPassword },
        });

        return api(`Invitation sent to ${user.first_name}`, res, {});
    };

    makeCorpusUser = async (req: any, res) => {
        // Check if the user
        let users = await User.findAll({
            where: {
                uuid: { [Op.in]: req.body.user_uuid },
            },
        });

        let role_slug = req.body.role == "editor" ? "role-corpus-editor" : "role-corpus-reviewer";

        for (const user of users) {
            await addRole(user.id, role_slug);

            await new Bull(`${process.env.REDIS_EMAIL_QUEUE}`).add({
                type: "email-corpus-editor-invite",
                data: { user_id: user.id },
            });
        }

        // Todo - sending Email

        return api(`Sucessfully mapped ${req.body.role} role to ${users.length} user(s)`, res, {});
    };

    getCorpusUsers = async (req, res) => {
        const roleSlug = req.query.role === "editor" ? "role-corpus-editor" : "role-corpus-reviewer";
        const query: any = {};
        let updatedUsers = [];

        if (req.query.status) {
            query.status = req.query.status;
        }

        const users = await User.findAll({
            where: query,
            attributes: ["uuid", "id", "first_name", "last_name", "email", "created_at", "status"],
            include: [{ model: Role, as: "roles", where: { slug: roleSlug }, attributes: ["name"] }],
        });

        for (const user of users) {
            let data: any = {
                uuid: user.uuid,
                id: user.id,
                name: `${user.first_name} ${user.last_name}`,
                email: user.email,
                joining_date: user.created_at,
                status: user.status,
            };

            if ((req.query.role = "editor" && req.query.status != "yet_to_join")) {
                const contentCount = await Corpus.count({ where: { user_id: user.id } });
                data.content_count = contentCount;
            }

            updatedUsers.push(data);
        }

        return api(`Corpus user list`, res, updatedUsers);
    };
}
