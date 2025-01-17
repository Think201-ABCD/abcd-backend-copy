import { DataTypes, Model, Optional } from "sequelize";

// Connection
import { sequelize } from "../../Loaders/database";

// Models

interface userTopicAttributes {
    id?: bigint;
    user_id?: bigint;
    topic_id?: bigint | null;
    sub_topic_id?: bigint | null;

    created_at?: Date;
    updated_at?: Date;
}

export type userTopicCreationAttributes = Optional<userTopicAttributes, "id">;

export class UserTopic extends Model<userTopicAttributes, userTopicCreationAttributes> implements userTopicAttributes {
    public id!: bigint;
    public user_id!: bigint;
    public topic_id!: bigint | null;
    public sub_topic_id!: bigint | null;

    public readonly created_at!: Date;
    public readonly updated_at!: Date;
}

UserTopic.init(
    {
        id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: DataTypes.BIGINT,
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
        tableName: "user_topics",
        sequelize,
        underscored: true,
        createdAt: "created_at",
        updatedAt: "updated_at",
    }
);
