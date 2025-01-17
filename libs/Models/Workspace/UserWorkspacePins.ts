import { DataTypes, Model, Optional } from "sequelize";
import { v4 as uuidv4 } from "uuid";

// Connection
import { sequelize } from "../../Loaders/database";

// Models
import { User } from "../Auth/User";
import { UserWorkspaceContent } from "./UserWorkspaceContent";
import { Workspace } from "./Workspace";

interface userWorkspacePinsAttributes {
    id?: bigint;
    user_id?: bigint;
    workspace_id?: bigint;
    workspace_content_id?: bigint;

    created_at?: Date;
    updated_at?: Date;
    deleted_at?: Date;
}

export type userWorkspacePinsCreationAttributes = Optional<userWorkspacePinsAttributes, "id">;

export class UserWorkspacePin
    extends Model<userWorkspacePinsAttributes, userWorkspacePinsCreationAttributes>
    implements userWorkspacePinsAttributes
{
    public id!: bigint;
    public user_id!: bigint;
    public workspace_id!: bigint;
    public workspace_content_id!: bigint;

    public readonly created_at!: Date;
    public readonly updated_at!: Date;
    public deleted_at!: Date;
}

UserWorkspacePin.init(
    {
        id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: DataTypes.BIGINT,
        },

        user_id: {
            allowNull: false,
            type: DataTypes.BIGINT,
            references: {
                model: "users",
                key: "id",
            },
            onUpdate: "CASCADE",
            onDelete: "CASCADE",
        },

        workspace_id: {
            allowNull: false,
            type: DataTypes.BIGINT,
            references: {
                model: "workspaces",
                key: "id",
            },
            onUpdate: "CASCADE",
            onDelete: "CASCADE",
        },

        workspace_content_id: {
            allowNull: false,
            type: DataTypes.BIGINT,
            references: {
                model: "user_workspace_contents",
                key: "id",
            },
            onUpdate: "CASCADE",
            onDelete: "CASCADE",
        },

        created_at: {
            allowNull: false,
            type: DataTypes.DATE,
        },

        updated_at: {
            allowNull: false,
            type: DataTypes.DATE,
        },

        deleted_at: {
            allowNull: true,
            type: DataTypes.DATE,
        },
    },
    {
        tableName: "user_workspace_pins",
        sequelize,
        underscored: true,
        paranoid: true,
        createdAt: "created_at",
        updatedAt: "updated_at",
        deletedAt: "deleted_at",
    }
);

UserWorkspacePin.belongsTo(User, { as: "user", foreignKey: "user_id" });
UserWorkspacePin.belongsTo(UserWorkspaceContent, { as: "workspace_content", foreignKey: "workspace_content_id" });
UserWorkspacePin.belongsTo(Workspace, { as: "workspace", foreignKey: "workspace_id" });
