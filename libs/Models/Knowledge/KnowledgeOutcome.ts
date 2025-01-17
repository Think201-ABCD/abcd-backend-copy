import { DataTypes, Model, Optional } from "sequelize";

// Connection
import { sequelize } from "../../Loaders/database";

// Models

interface knowledgeOutcomeAttributes {
    id?: bigint;
    knowledge_id?: bigint;
    outcome_id?: bigint | null;
    sub_outcome_id?: bigint | null;

    created_at?: Date;
    updated_at?: Date;
}

export type knowledgeOutcomeCreationAttributes = Optional<knowledgeOutcomeAttributes, "id">;

export class KnowledgeOutcome
    extends Model<knowledgeOutcomeAttributes, knowledgeOutcomeCreationAttributes>
    implements knowledgeOutcomeAttributes
{
    public id!: bigint;
    public knowledge_id!: bigint;
    public outcome_id!: bigint | null;
    public sub_outcome_id!: bigint | null;

    public readonly created_at!: Date;
    public readonly updated_at!: Date;
}

KnowledgeOutcome.init(
    {
        id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: DataTypes.BIGINT,
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

        outcome_id: {
            allowNull: true,
            type: DataTypes.BIGINT,
            onUpdate: "CASCADE",
            onDelete: "CASCADE",
            references: {
                model: "outcomes",
                key: "id",
            },
        },

        sub_outcome_id: {
            allowNull: true,
            type: DataTypes.BIGINT,
            onUpdate: "CASCADE",
            onDelete: "CASCADE",
            references: {
                model: "sub_outcomes",
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
        tableName: "knowledge_outcomes",
        sequelize,
        underscored: true,
        createdAt: "created_at",
        updatedAt: "updated_at",
    }
);
