import { DataTypes, Model, Optional } from "sequelize";

// Connection
import { sequelize } from "../../Loaders/database";

// Models

interface knowledgeBehaviourAttributes {
    id?: bigint;
    knowledge_id?: bigint;
    behaviour_id?: bigint;

    created_at?: Date;
    updated_at?: Date;
}

export type knowledgeBehaviourCreationAttributes = Optional<knowledgeBehaviourAttributes, "id">;

export class KnowledgeBehaviour
    extends Model<knowledgeBehaviourAttributes, knowledgeBehaviourCreationAttributes>
    implements knowledgeBehaviourAttributes
{
    public id!: bigint;
    public knowledge_id!: bigint;
    public behaviour_id!: bigint;

    public readonly created_at!: Date;
    public readonly updated_at!: Date;
}

KnowledgeBehaviour.init(
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

        behaviour_id: {
            allowNull: false,
            type: DataTypes.BIGINT,
            onUpdate: "CASCADE",
            onDelete: "CASCADE",
            references: {
                model: "behaviours",
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
        tableName: "knowledge_behaviours",
        sequelize,
        underscored: true,
        createdAt: "created_at",
        updatedAt: "updated_at",
    }
);
