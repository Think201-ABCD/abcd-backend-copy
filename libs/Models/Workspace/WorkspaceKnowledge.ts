import { DataTypes, Model, Optional } from "sequelize";

// Connection
import { sequelize } from "../../Loaders/database";

// Models

interface workspaceKnowledgeAttributes {
    id?: bigint;
    workspace_id?: bigint;
    knowledge_id?: bigint;

    created_at?: Date;
    updated_at?: Date;
}

export type workspaceKnowledgeCreationAttributes = Optional<workspaceKnowledgeAttributes, "id">;

export class WorkspaceKnowledge
    extends Model<workspaceKnowledgeAttributes, workspaceKnowledgeCreationAttributes>
    implements workspaceKnowledgeAttributes
{
    public id!: bigint;
    public workspace_id!: bigint;
    public knowledge_id!: bigint;

    public readonly created_at!: Date;
    public readonly updated_at!: Date;
}

WorkspaceKnowledge.init(
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
            onUpdate: "CASCADE",
            onDelete: "CASCADE",
            references: {
                model: "workspaces",
                key: "id",
            },
        },

        knowledge_id: {
            allowNull: false,
            type: DataTypes.BIGINT,
            onUpdate: "CASCADE",
            onDelete: "CASCADE",
            references: {
                model: "knowledges",
                key: "id",
            },
        },

        created_at: {
            allowNull: false,
            type: DataTypes.DATE,
        },

        updated_at: {
            allowNull: false,
            type: DataTypes.DATE,
        },
    },
    {
        tableName: "workspace_knowledges",
        sequelize,
        underscored: true,
        createdAt: "created_at",
        updatedAt: "updated_at",
    }
);
