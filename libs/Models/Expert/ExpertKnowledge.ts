import { DataTypes, Model, Optional } from "sequelize";

// Connection
import { sequelize } from "../../Loaders/database";

// Models

interface expertKnowledgeAttributes {
    id?: bigint;
    expert_id?: bigint;
    knowledge_id?: bigint;

    created_at?: Date;
    updated_at?: Date;
}

export type expertKnowledgeCreationAttributes = Optional<expertKnowledgeAttributes, "id">;

export class ExpertKnowledge
    extends Model<expertKnowledgeAttributes, expertKnowledgeCreationAttributes>
    implements expertKnowledgeAttributes
{
    public id!: bigint;
    public expert_id!: bigint;
    public knowledge_id!: bigint;

    public readonly created_at!: Date;
    public readonly updated_at!: Date;
}

ExpertKnowledge.init(
    {
        id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: DataTypes.BIGINT,
        },

        expert_id: {
            allowNull: false,
            type: DataTypes.BIGINT,
            onUpdate: "CASCADE",
            onDelete: "CASCADE",
            references: {
                model: {
                    tableName: "experts",
                },
                key: "id",
            },
        },

        knowledge_id: {
            allowNull: false,
            type: DataTypes.BIGINT,
            onUpdate: "CASCADE",
            onDelete: "CASCADE",
            references: {
                model: {
                    tableName: "behaviours",
                },
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
        tableName: "expert_knowledges",
        sequelize,
        underscored: true,
        createdAt: "created_at",
        updatedAt: "updated_at",
    }
);
