import { Op } from "sequelize";

// Models
import { User } from "../Models/Auth/User";
import { UserRole } from "../Models/Auth/UserRole";
import { Role } from "../Models/Auth/Role";

// Get User roles
export const getUserRoles = async (user: User) => {
    const user_role_ids = await UserRole.findAll({
        where: {
            user_id: user.id,
        },
        attributes: ["role_id"],
    }).then((user_roles) => user_roles.map((user_role) => Number(user_role.role_id)));

    const user_roles = await Role.findAll({
        where: {
            id: {
                [Op.in]: user_role_ids,
            },
        },
    }).then((roles) => roles.map((role) => role.slug));

    return user_roles;
};

// Map Role to User
export const mapUserRole = async (user: User, role_string: string) => {
    const role = await Role.findOne({
        where: {
            slug: role_string,
        },
    });

    if (!role) {
        throw "Invalid Role";
    }

    await UserRole.create({
        user_id: user.id,
        role_id: role.id,
    });
};
