import { DataTypes, Model, Optional } from "sequelize";

// Connection
import { sequelize } from "../../Loaders/database";
import { Topic } from "../Topic/Topic";

// Models

interface expertTopicAttributes {
    id?: bigint;
    expert_id?: bigint;
    topic_id?: bigint | null;
    sub_topic_id?: bigint | null;

    created_at?: Date;
    updated_at?: Date;
}

export type expertTopicCreationAttributes = Optional<expertTopicAttributes, "id">;

export class ExpertTopic
    extends Model<expertTopicAttributes, expertTopicCreationAttributes>
    implements expertTopicAttributes
{
    public id!: bigint;
    public expert_id!: bigint;
    public topic_id!: bigint | null;
    public sub_topic_id!: bigint | null;

    public readonly created_at!: Date;
    public readonly updated_at!: Date;
}

ExpertTopic.init(
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
                model: "experts",
                key: "id",
            },
        },

        topic_id: {
            allowNull: true,
            type: DataTypes.BIGINT,
            onUpdate: "CASCADE",
            onDelete: "CASCADE",
            references: {
                model: "topics",
                key: "id",
            },
        },

        sub_topic_id: {
            allowNull: true,
            type: DataTypes.BIGINT,
            onUpdate: "CASCADE",
            onDelete: "CASCADE",
            references: {
                model: "sub_topics",
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
        tableName: "expert_topics",
        sequelize,
        underscored: true,
        createdAt: "created_at",
        updatedAt: "updated_at",
    }
);

ExpertTopic.belongsTo(Topic, { foreignKey: "topic_id", as: "topic" });
