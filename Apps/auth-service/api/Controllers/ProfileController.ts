import { RequestHandler } from "express";
import { v4 as uuidv4 } from "uuid";
import Bull from "bull";

//Helpers
import { api, apiException } from "@redlof/libs/Helpers/helpers";
import { attachRole, getUserRoles } from "@redlof/libs/Helpers/AuthenticationHelper";

// Models
import { User } from "@redlof/libs/Models/Auth/User";
import { Organisation } from "@redlof/libs/Models/Organisation/Organisation";
import { OrganisationMember } from "@redlof/libs/Models/Organisation/OrganisationMember";
import { uploadIdenticon } from "@redlof/libs/Helpers/FileUploadHelper";
import { UserProfile } from "@redlof/libs/Models/Auth/UserProfile";
import { Role } from "@redlof/libs/Models/Auth/Role";
import { Country } from "@redlof/libs/Models/Data/Country";
import { State } from "@redlof/libs/Models/Data/State";
import { Workspace } from "@redlof/libs/Models/Workspace/Workspace";

export const getProfile: RequestHandler = async (req: any, res) => {
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

    userdata = userdata.toJSON();

    // Get user roles
    userdata.roles = await getUserRoles(res.locals.user);

    if (userdata.roles.includes("role-member")) {
        return api("", res, userdata);
    }

    // Get the organisation of the member
    const organisationMember: any = await OrganisationMember.findOne({
        where: { user_id: userdata.id },
        include: [
            {
                model: Organisation,
                as: "organisation",
                required: true,
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
        ],
    });

    userdata.organisation = organisationMember?.organisation;

    return api("", res, userdata);
};

export const putProfile: RequestHandler = async (req: any, res) => {
    const query = req.query.uuid ? { uuid: req.query.uuid } : { id: res.locals.user.id };

    if (req.query.uuid && !res.locals.roles.includes("role-admin")) {
        throw { message: "Invalid action, Please check your access to this action.", code: 422, report: false };
    }

    const user = await User.findOne({
        attributes: { exclude: ["password"] },
        where: query,
    });

    if (!user) {
        throw { message: "User does not found.", code: 422,report: false };
    }

    user.first_name = req.body.first_name ? req.body.first_name : user.first_name;
    user.last_name = req.body.last_name ? req.body.last_name : user.last_name;
    user.photo = req.body.photo ? req.body.photo : user.getDataValue("photo");
    user.banner = req.body.banner ? req.body.banner : user.getDataValue("banner");
    user.status = req.body.status ? req.body.status : user.status;
    await user.save();

    const profile: any = await UserProfile.findOne({ where: { user_id: user.id } });

    profile.type = req.body?.type ? req.body?.type : profile?.type;
    profile.designation = req.body?.designation ? req.body?.designation : profile?.designation;
    profile.state_id = req.body?.state_id ? req.body?.state_id : profile?.state_id;
    profile.country_id = req.body?.country_id ? req.body?.country_id : profile?.country_id;
    await profile.save();

    return api("Profile updated successfully.", res, {});
};

export const postOrganisationProfile: RequestHandler = async (req, res) => {
    const { organisation_uuid, name, logo, category, country_id, state_id } = req.body;
    let organisation: any;

    // Check if the member is already a part of any organisation
    const orgMember = await OrganisationMember.count({ where: { user_id: res.locals.user.id } });

    if (orgMember > 0) {
        throw { message: "It seems that you are already a part of organisation.", code: 422 };
    }

    // Create/update the profile
    let profile = await UserProfile.findOne({ where: { user_id: res.locals.user.id } });

    if (!profile) {
        profile = new UserProfile({ user_id: res.locals.user.id });
    }

    profile.type = "organisation";
    await profile.save();

    // Update the user status to pending
    await User.update({ status: "pending" }, { where: { id: res.locals.user.id } });

    if (organisation_uuid) {
        organisation = await Organisation.findOne({ where: { uuid: organisation_uuid } });

        if (!organisation) {
            throw { message: "Organisation not found", code: 422 };
        }

        if (res.locals.roles.includes("role-member")) {
            throw { message: "Unauthorized, Please check your access to this action.", code: 422 };
        }

        // Assign a role as organisation member
        await attachRole(res.locals.user.id, "role-organisation-member");

        const orgMember = await OrganisationMember.create({
            organisation_id: organisation.id,
            user_id: res.locals.user.id,
            type: "member",
            status: "pending",
        });

        // TODO : Send request to organisation admin or to super admin

        let admin: any = await OrganisationMember.findOne({
            where: { organisation_id: organisation.id, type: "admin" },
        });

        if (!admin) {
            admin = await User.findOne({
                include: [{ model: Role, as: "roles", required: true, where: { slug: "role-admin" } }],
            });
            // Request would go to super admin
            orgMember.status = "admin-pending";
            await orgMember.save();
            await new Bull(`${process.env.REDIS_EMAIL_QUEUE}`).add({
                type: "organisation-member-request-first",
                data: {
                    user_id: res.locals.user.id,
                    organisation_id: organisation.id,
                    admin_id: admin.user_id ? admin.user_id : admin.id,
                },
            });
        }

        if (admin) {
            await new Bull(`${process.env.REDIS_EMAIL_QUEUE}`).add({
                type: "organisation-member-request",
                data: {
                    user_id: res.locals.user.id,
                    organisation_id: organisation.id,
                    admin_id: admin.user_id ? admin.user_id : admin.id,
                },
            });
        }

        return api("", res, organisation);
    }

    // Check if the user has any organisations
    const orgCheck = await Organisation.count({});

    profile.country_id = country_id;
    profile.state_id = state_id;
    await profile.save();

    await attachRole(res.locals.user.id, "role-organisation-admin");

    // Create company and map a user as admin
    organisation = await Organisation.create({
        uuid: uuidv4(),
        added_by: res.locals.user.id,
        country_id: country_id,
        state_id: state_id,
        name: name,
        logo: logo ? logo : await uploadIdenticon("profiles", req.body.name),
        description: req.body.description,
        category: category,
        status: "pending",
    });

    await OrganisationMember.create({
        organisation_id: organisation.id,
        user_id: res.locals.user.id,
        type: "admin",
    });

    return api("", res, organisation);
};

export const postFirstTimeSignin: RequestHandler = async (req: any, res) => {
    const query = req.query.uuid ? { uuid: req.query.uuid } : { id: res.locals.user.id };

    const user = await User.findOne({
        where: query,
    });

    if (!user) {
        throw { message: "User does not found.", code: 422, report: false };
    }

    user.is_first_login = true;

    await user.save();

    return api("", res, {});
};

export const getBasicProfile: RequestHandler = async (req: any, res) => {
    let userdata = await User.findOne({
        where: {
            id: res.locals.user.id,
        },
        attributes: { exclude: ["password"] },
    });

    return api("", res, userdata);
};
