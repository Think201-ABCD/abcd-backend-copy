import { DataTypes, Model, Optional } from "sequelize";

// Connection
import { sequelize } from "../../Loaders/database";
import { User } from "../Auth/User";
import { Organisation } from "../Organisation/Organisation";

// Models
import { WorkspaceMember } from "./WorkspaceMember";
import { UserWorkspaceContent } from "./UserWorkspaceContent";

interface workspaceAttributes {
    id?: bigint;
    uuid?: string;
    added_by?: bigint;
    organisation_id?: bigint;
    name?: string;
    description?: string | null;
    logo?: string;
    banner?: string | null;
    type?: string | null;
    status?: string;
    share_text?: string;
    showcase?: string;

    created_at?: Date;
    updated_at?: Date;
    deleted_at?: Date;
}

export type workspaceCreationAttributes = Optional<workspaceAttributes, "id">;

export class Workspace extends Model<workspaceAttributes, workspaceCreationAttributes> implements workspaceAttributes {
    public id!: bigint;
    public uuid!: string;
    public added_by!: bigint;
    public organisation_id!: bigint;
    public name!: string;
    public description!: string | null;
    public logo!: string;
    public banner!: string | null;
    public type!: string | null;
    public status!: string;
    public share_text!: string;
    public showcase!: string;

    public readonly created_at!: Date;
    public readonly updated_at!: Date;
    public deleted_at!: Date;
}

Workspace.init(
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

        added_by: {
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

        name: {
            allowNull: false,
            type: DataTypes.STRING,
        },

        description: {
            allowNull: true,
            type: DataTypes.STRING(1000),
        },

        logo: {
            allowNull: false,
            type: DataTypes.STRING,
            get() {
                return `${process.env.AWS_BASE_URL}` + `${this.getDataValue("logo")}`;
            },
        },

        banner: {
            allowNull: true,
            type: DataTypes.STRING,
            get() {
                const banner = this.getDataValue("banner");

                if (banner) {
                    return `${process.env.AWS_BASE_URL}` + `${this.getDataValue("banner")}`;
                }

                return `${process.env.AWS_BASE_URL}` + `${process.env.DEFAULT_WORKSPACE_BANNER}`;
            },
        },

        type: {
            allowNull: false,
            type: DataTypes.STRING,
            defaultValue: "personal",
        },

        status: {
            allowNull: false,
            type: DataTypes.STRING,
            defaultValue: "active",
        },

        share_text: {
            allowNull: false,
            type: DataTypes.STRING(1000),
        },

        showcase: {
            allowNull: false,
            defaultValue: false,
            type: DataTypes.BOOLEAN,
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
        tableName: "workspaces",
        sequelize,
        underscored: true,
        paranoid: true,
        createdAt: "created_at",
        updatedAt: "updated_at",
        deletedAt: "deleted_at",
    }
);

Workspace.belongsTo(User, { as: "created_by", foreignKey: "added_by" });
//through this user able to create multiple workspaces
User.hasMany(Workspace, { as: "workspaces", foreignKey: "added_by" });
// Organisation
Workspace.belongsTo(Organisation, { as: "organisation", foreignKey: "organisation_id" });

// Workspace members
Workspace.hasMany(WorkspaceMember, { as: "members", foreignKey: "workspace_id" });
WorkspaceMember.belongsTo(Workspace, { as: "workspace", foreignKey: "workspace_id" });

// User workspace content
Workspace.hasMany(UserWorkspaceContent, { as: "entities", foreignKey: "workspace_id" });
UserWorkspaceContent.belongsTo(Workspace, { as: "workspace", foreignKey: "workspace_id" });

User.belongsToMany(Workspace, { through: WorkspaceMember, as: "user_workspaces" });
Organisation.hasMany(Workspace, { as: "org_workspaces", foreignKey: "organisation_id" });
