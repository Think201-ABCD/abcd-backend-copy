import { DataTypes, Model, Optional } from "sequelize";
import { v4 as uuidv4 } from "uuid";

// Connection
import { sequelize } from "../../Loaders/database";

// Models
import { User } from "../Auth/User";

interface workspaceContentAttributes {
    id?: bigint;
    uuid?: string;
    workspace_id?: bigint;
    user_id?: bigint;
    description?: string;
    type?: string | null;
    image?: string[];
    entity_id?: bigint;
    logo?: string;
    title?: string;
    files?: JSON;
    images?: JSON;

    created_at?: Date;
    updated_at?: Date;
    deleted_at?: Date;
}

export type userWorkspaceContentCreationAttributes = Optional<workspaceContentAttributes, "id">;

export class UserWorkspaceContent
    extends Model<workspaceContentAttributes, userWorkspaceContentCreationAttributes>
    implements workspaceContentAttributes
{
    public id!: bigint;
    public uuid!: string;
    public workspace_id!: bigint;
    public user_id!: bigint;
    public description: string;
    public type!: string | null;
    public image: string[];
    public entity_id: bigint;
    public logo: string;
    public title: string;
    public files: JSON;
    public images: JSON;

    public readonly created_at!: Date;
    public readonly updated_at!: Date;
    public deleted_at!: Date;
}

UserWorkspaceContent.init(
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
            unique: true,
        },

        workspace_id: {
            allowNull: false,
            type: DataTypes.BIGINT,
            onUpdate: "CASCADE",
            onDelete: "CASCADE",
            references: {
                model: "workspaces",
                key: "id",
            },
        },

        user_id: {
            allowNull: false,
            type: DataTypes.BIGINT,
            onUpdate: "CASCADE",
            onDelete: "CASCADE",
            references: {
                model: "users",
                key: "id",
            },
        },

        description: {
            allowNull: true,
            type: DataTypes.TEXT,
        },

        type: {
            allowNull: false,
            type: DataTypes.STRING,
        },

        logo: {
            type: DataTypes.STRING,
            allowNull: true,
            get() {
                return `${process.env.AWS_BASE_URL}` + `${this.getDataValue("logo")}`;
            },
        },

        title: {
            type: DataTypes.STRING,
            allowNull: true,
        },

        entity_id: {
            allowNull: true,
            type: DataTypes.BIGINT,
        },

        files: {
            allowNull: true,
            type: DataTypes.JSON,
        },

        images: {
            allowNull: true,
            type: DataTypes.JSON,
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
        tableName: "user_workspace_contents",
        sequelize,
        underscored: true,
        paranoid: true,
        createdAt: "created_at",
        updatedAt: "updated_at",
        deletedAt: "deleted_at",
    }
);

UserWorkspaceContent.belongsTo(User, { as: "user", foreignKey: "user_id" });
