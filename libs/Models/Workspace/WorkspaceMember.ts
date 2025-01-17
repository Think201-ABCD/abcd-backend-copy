import { DataTypes, Model, Optional } from "sequelize";

// Connection
import { sequelize } from "../../Loaders/database";

// Models
import { User } from "../Auth/User";

interface workspaceMemberAttributes {
    id?: bigint;
    workspace_id?: bigint;
    user_id?: bigint | null;
    organisation_id?: bigint | null;
    role?: string;

    created_at?: Date;
    updated_at?: Date;
    deleted_at?: Date;
}

export type workspaceMemberCreationAttributes = Optional<workspaceMemberAttributes, "id">;

export class WorkspaceMember
    extends Model<workspaceMemberAttributes, workspaceMemberCreationAttributes>
    implements workspaceMemberAttributes
{
    public id!: bigint;
    public workspace_id!: bigint;
    public user_id!: bigint | null;
    public organisation_id!: bigint | null;
    public role!: string;

    public readonly created_at!: Date;
    public readonly updated_at!: Date;
    public deleted_at!: Date;
}

WorkspaceMember.init(
    {
        id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: DataTypes.BIGINT,
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

        role: {
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
        tableName: "workspace_members",
        sequelize,
        underscored: true,
        paranoid: true,
        createdAt: "created_at",
        updatedAt: "updated_at",
        deletedAt: "deleted_at",
    }
);

// User
WorkspaceMember.belongsTo(User, { as: "user", foreignKey: "user_id" });
