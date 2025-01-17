import { DataTypes, Model, Optional } from "sequelize";

// Connection
import { sequelize } from "../../Loaders/database";

// Models
import { User } from "../Auth/User";

interface workspaceInvitationAttributes {
    id?: bigint;
    uuid?: string;
    workspace_id?: bigint;
    organisation_id?: bigint | null;
    user_id?: bigint | null;

    name?: string;
    email?: string;
    status?: string;
    invite_role?: string;

    created_at?: Date;
    updated_at?: Date;
    deleted_at?: Date;
}

export type workspaceInvitationCreationAttributes = Optional<workspaceInvitationAttributes, "id">;

export class WorkspaceInvitation
    extends Model<workspaceInvitationAttributes, workspaceInvitationCreationAttributes>
    implements workspaceInvitationAttributes
{
    public id!: bigint;
    public uuid!: string;
    public workspace_id!: bigint;
    public organisation_id!: bigint | null;
    public user_id!: bigint | null;

    public name!: string;
    public email!: string;
    public status!: string;
    public invite_role!: string;

    public readonly created_at!: Date;
    public readonly updated_at!: Date;
    public deleted_at!: Date;
}

WorkspaceInvitation.init(
    {
        id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: DataTypes.BIGINT,
        },

        uuid: {
            allowNull: false,
            type: DataTypes.UUID,
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

        organisation_id: {
            allowNull: true,
            onUpdate: "CASCADE",
            onDelete: "CASCADE",
            type: DataTypes.BIGINT,
            references: {
                model: {
                    tableName: "organisations",
                },
                key: "id",
            },
        },

        user_id: {
            allowNull: true,
            type: DataTypes.BIGINT,
            references: {
                model: "users",
                key: "id",
            },
            onUpdate: "CASCADE",
            onDelete: "CASCADE",
        },

        name: {
            allowNull: true,
            type: DataTypes.STRING,
        },

        email: {
            allowNull: false,
            type: DataTypes.STRING,
        },

        status: {
            allowNull: false,
            type: DataTypes.STRING,
            defaultValue: "pending",
        },

        invite_role: {
            allowNull: true,
            type: DataTypes.STRING,
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
        tableName: "workspace_invitations",
        sequelize,
        underscored: true,
        paranoid: true,
        createdAt: "created_at",
        updatedAt: "updated_at",
        deletedAt: "deleted_at",
    }
);

// User
WorkspaceInvitation.belongsTo(User, { as: "user", foreignKey: "user_id" });
