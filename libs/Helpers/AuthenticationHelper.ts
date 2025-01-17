import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";

// Helpers
import { uploadFileFromUrl } from "./FileUploadHelper";

// Models
import { User, usersCreationAttributes } from "../Models/Auth/User";
import { UserRole } from "../Models/Auth/UserRole";
import { Role } from "../Models/Auth/Role";

export const generateAuthToken = (payload: any) => {
    try {
        return jwt.sign(payload, `${process.env.TOKEN_SECRET}`, { expiresIn: `${process.env.TOKEN_EXPIRY_HOURS}h` });
    } catch (e) {
        throw String(e);
    }
};

export const userSignUp = async (userProfile: any) => {
    try {
        const photoPath: any = await uploadFileFromUrl(userProfile.picture, "userphotos");

        const userData: usersCreationAttributes = {
            uuid: uuidv4(),
            first_name: userProfile.given_name,
            last_name: userProfile.family_name,
            email: userProfile.email,
            username: userProfile.email,
            photo: photoPath,
            password: await bcrypt.hash(Math.random().toString(36).slice(2), 8),
            status: "active",
        };

        return await User.create(userData);
    } catch (e) {
        throw String(e);
    }
};

// Get User roles
export const getUserRoles = async (user: User) => {
    return [
        ...(await UserRole.findAll({
            where: { user_id: user.id },
            attributes: ["role_id"],
            include: [{ model: Role, as: "role", required: true }],
        })),
    ].map((userRoles: any) => userRoles.role.slug);
};

// Attache a role to new user
export const attachRole = async (user_id: bigint, roleSlug: string) => {
    const role: any = await Role.findOne({ where: { slug: roleSlug } });

    if (!role) {
        throw { message: "Invalid role", code: 422 };
    }

    // Remove the old role if any
    await UserRole.destroy({ where: { user_id: user_id }, force: true });

    // Attache the new role
    await UserRole.create({ user_id: user_id, role_id: role.id });

    return true;
};

// Add a new role to the existing user
export const addRole = async (user_id: bigint, roleSlug: string) => {
    const role: any = await Role.findOne({ where: { slug: roleSlug } });

    if (!role) {
        throw { message: "Invalid role", code: 422 };
    }

    let mapped = await UserRole.findOne({
        where: {
            user_id: user_id,
            role_id: role.id,
        },
    });

    if (!mapped) {
        // Attache the new role
        await UserRole.create({ user_id: user_id, role_id: role.id });
        return true;
    }

    return false;
};
