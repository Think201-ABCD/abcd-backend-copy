import { DataTypes, Model, Optional } from "sequelize";

// Connection
import { sequelize } from "../../Loaders/database";
import { SubTopic } from "./SubTopic";
import { Topic } from "../Topic/Topic";

// Models

interface subTopicTopicsAttributes {
    id?: bigint;
    topic_id?: bigint;
    sub_topic_id?: bigint;
}

export type subTopicTopicsCreationAttributes = Optional<subTopicTopicsAttributes, "id">;

export class SubTopicTopic
    extends Model<subTopicTopicsAttributes, subTopicTopicsCreationAttributes>
    implements subTopicTopicsAttributes
{
    public id!: bigint;
    public topic_id!: bigint;
    public sub_topic_id!: bigint;
}

SubTopicTopic.init(
    {
        id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: DataTypes.BIGINT,
        },

        topic_id: {
            allowNull: false,
            type: DataTypes.BIGINT,
            onUpdate: "CASCADE",
            onDelete: "CASCADE",
            references: {
                model: "topics",
                key: "id",
            },
        },

        sub_topic_id: {
            allowNull: false,
            type: DataTypes.BIGINT,
            onUpdate: "CASCADE",
            onDelete: "CASCADE",
            references: {
                model: "sub_topics",
                key: "id",
            },
        },
    },
    {
        tableName: "sub_topic_topics",
        sequelize,
        underscored: true,
        createdAt: "created_at",
        updatedAt: "updated_at",
        deletedAt: "deleted_at",
    }
);

// SubTopicTopic.belongsTo(Topic, { foreignKey: 'topic_id', as: 'topic' })

// SubTopicTopic.belongsTo(SubTopic, { foreignKey: 'sub_topic_id', as: 'sub_topic' })
