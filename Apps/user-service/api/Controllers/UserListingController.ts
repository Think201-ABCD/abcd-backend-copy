import { api } from "@redlof/libs/Helpers/helpers";
import { Role } from "@redlof/libs/Models/Auth/Role";
import { User } from "@redlof/libs/Models/Auth/User";
import { RequestHandler } from "express";
import moment from "moment";
import { Op } from "sequelize";
import { Parser } from "json2csv";
import { Organisation } from "@redlof/libs/Models/Organisation/Organisation";
import { Workspace } from "@redlof/libs/Models/Workspace/Workspace";

export const getUsers: RequestHandler = async (req, res) => {
    const query: any = {};

    if (req.query.status) {
        query.status = req.query.status;
    }

    const users = await User.findAll({
        where: query,
    });

    return api("", res, users);
};

export const downloadUsersDetails: RequestHandler = async (req, res) => {
    let role_query: any = {
        slug: { [Op.notIn]: ["role-admin", "role-cockpit-admin"] },
    };

    const users = await User.findAll({
        attributes: {
            exclude: ["password"],
        },
        include: [
            {
                model: Role,
                where: role_query,
                attributes: ["name", "slug"],
                through: {
                    attributes: [],
                },
                as: "roles",
                required: true,
            },
            {
                model: Organisation,
                as: "organisations",
                attributes: ["id", "name", "domain", "added_by"],
                through: {
                    attributes: ["status", "type"],
                },
            },
            {
                model: Workspace,
                as: "workspaces",
                attributes: ["name"],
            },
        ],
    });

    const fields: any = [
        { label: "First Name", value: "first_name" },
        { label: "Last Name", value: "last_name" },
        { label: "Username", value: "username" },
        { label: "Email", value: "email" },
        { label: "Phone Number", value: "phone" },
        { label: "Primary Organisation", value: "organisation" },
        { label: "Organisation Role", value: "organisation_role" },
        { label: "Organisation Status", value: "organisation_status" },
        { label: "Gender", value: "gender" },
        { label: "Date of Birth", value: "date_of_birth" },
        { label: "Phone Verified", value: "phone_verified" },
        { label: "Email Verified", value: "email_verified" },
        { label: "Status", value: "status" },
        { label: "Joined On", value: "created_at" },
        { label: "User Workspaces", value: "workspaces" },
    ];

    const data: any = users.map((user: any) => {
        const domain = user.email.split("@")[1];

        const primaryOrganisation = user?.organisations.filter((organisation: any) => organisation.domain === domain || organisation.added_by === user.id);
        const userWorkspaces = user?.workspaces.map((workspace: any) => workspace.name);

        return {
            first_name: user.first_name,
            last_name: user.last_name,
            username: user.username,
            email: user.email,
            phone: user.phone ? user.phone : "N/A",
            organisation: primaryOrganisation.length ? primaryOrganisation[0]?.name : "N/A",
            organisation_role: primaryOrganisation.length ? primaryOrganisation[0]?.OrganisationMember?.type : "N/A",
            organisation_status: primaryOrganisation.length ? primaryOrganisation[0]?.OrganisationMember?.status : "N/A",
            gender: user.gender ? user.gender : "N/A",
            date_of_birth: user.dob ? user.dob : "N/A",
            phone_verified: user.phone_verified ? user.phone_verfied : "N/A",
            email_verified: user.email_verified ? user.email_verified : "N/A",
            status: user.status,
            created_at: moment(user.created_at).format("YYYY-MM-DD"),
            workspaces: userWorkspaces.length ? userWorkspaces.join(", ") : "N/A",
        };
    });

    const json2csv = new Parser({ fields });
    const csv = json2csv.parse(data);

    res.header("Content-Type", "text/csv");
    res.attachment("Users-details.csv");

    return res.send(csv);
};
