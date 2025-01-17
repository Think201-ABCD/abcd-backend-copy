import { DataTypes, Model, Optional } from "sequelize";

// Connection
import { sequelize } from "../../Loaders/database";

// Models

interface knowledgeBarrierAttributes {
    id?: bigint;
    knowledge_id?: bigint;
    barrier_id?: bigint;

    created_at?: Date;
    updated_at?: Date;
}

export type knowledgeBarrierCreationAttributes = Optional<knowledgeBarrierAttributes, "id">;

export class KnowledgeBarrier
    extends Model<knowledgeBarrierAttributes, knowledgeBarrierCreationAttributes>
    implements knowledgeBarrierAttributes
{
    public id!: bigint;
    public knowledge_id!: bigint;
    public barrier_id!: bigint;

    public readonly created_at!: Date;
    public readonly updated_at!: Date;
}

KnowledgeBarrier.init(
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

        barrier_id: {
            allowNull: false,
            type: DataTypes.BIGINT,
            onUpdate: "CASCADE",
            onDelete: "CASCADE",
            references: {
                model: "barriers",
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
        tableName: "knowledge_barriers",
        sequelize,
        underscored: true,
        createdAt: "created_at",
        updatedAt: "updated_at",
    }
);
