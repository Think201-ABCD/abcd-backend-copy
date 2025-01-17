import { Request, RequestHandler, Response } from "express";
import { Op } from "sequelize";

// Test
import Bull from "bull";

// models
import { User } from "@redlof/libs/Models/Auth/User";
import { Role } from "@redlof/libs/Models/Auth/Role";
import { UserRole } from "@redlof/libs/Models/Auth/UserRole";
import { UserWorkspaceContent } from "@redlof/libs/Models/Workspace/UserWorkspaceContent";

export const publicTestFuction: RequestHandler = async (req: any, res) => {
    const workspaceUserContent: any = await UserWorkspaceContent.findAll();

    for (const content of workspaceUserContent) {
        // const logo = content.logo?.replace("https://abcd-prod-s3.s3.ap-south-1.amazonaws.com/", "")
        // content.setDataValue("logo", logo)
    }

    res.json(workspaceUserContent);
};

export const mapRoleMember: RequestHandler = async (req: Request, res: Response) => {
    const usersWithRole = [
        ...(await User.findAll({
            attributes: ["id"],
            include: [
                {
                    model: Role,
                    as: "roles",
                    where: { slug: "role-member" },
                    required: true,
                },
            ],
        })),
    ].map((user) => user.id);

    const usersWithoutRole = await User.findAll({
        attributes: ["id"],
        where: { id: { [Op.notIn]: usersWithRole } },
    });

    const role = await Role.findOne({
        where: { slug: "role-member" },
    });

    const userRoleCreationData: any = [];

    usersWithoutRole.forEach((user: any) => {
        userRoleCreationData.push({
            user_id: user.id,
            role_id: role.id,
        });
    });

    await UserRole.bulkCreate(userRoleCreationData);

    res.send({ message: "success", count_added: usersWithoutRole.length, users_with_role: usersWithRole.length });
};
