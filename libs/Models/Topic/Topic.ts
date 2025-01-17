import { DataTypes, Model, Optional } from "sequelize";

// Connection
import { sequelize } from "../../Loaders/database";

// Models
import { User } from "../Auth/User";
import { Outcome } from "../Outcome/Outcome";
import { SubTopic } from "./SubTopic";
import { TopicCountry } from "./TopicCountry";
import { TopicState } from "./TopicState";

interface topicsAttributes {
    id?: bigint;
    added_by?: bigint;
    uuid?: string;
    title?: string;
    sdgs?: string;
    logo?: string;
    logo_aws?: string;
    status?: string;

    created_at?: Date;
    updated_at?: Date;
    deleted_at?: Date;
}

export type topicsCreationAttributes = Optional<topicsAttributes, "id">;

export class Topic extends Model<topicsAttributes, topicsCreationAttributes> implements topicsAttributes {
    public id!: bigint;
    public added_by!: bigint;
    public uuid!: string;
    public title!: string;
    public sdgs!: string;
    public logo!: string;
    public logo_aws!: string;
    public status!: string;

    public readonly created_at!: Date;
    public readonly updated_at!: Date;
    public deleted_at!: Date;
}

Topic.init(
    {
        id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: DataTypes.BIGINT,
        },

        added_by: {
            allowNull: false,
            type: DataTypes.BIGINT,
            onUpdate: "CASCADE",
            onDelete: "CASCADE",
            references: {
                model: "users",
                key: "id",
            },
        },

        uuid: {
            allowNull: false,
            type: DataTypes.UUID,
        },

        title: {
            allowNull: false,
            type: DataTypes.STRING,
        },

        sdgs: {
            allowNull: false,
            type: DataTypes.JSON,
        },

        logo: {
            allowNull: false,
            type: DataTypes.STRING,
            get() {
                return `${process.env.AWS_BASE_URL}` + `${this.getDataValue("logo")}`;
            },
        },

        status: {
            allowNull: false,
            type: DataTypes.STRING(50),
            defaultValue: "draft",
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
        tableName: "topics",
        sequelize,
        underscored: true,
        paranoid: true,
        createdAt: "created_at",
        updatedAt: "updated_at",
        deletedAt: "deleted_at",
    }
);

Topic.belongsTo(User, { as: "created_by", foreignKey: "added_by" });

// Sub Topics
SubTopic.belongsToMany(Topic, { through: "sub_topic_topics", as: "topics" });
Topic.belongsToMany(SubTopic, { through: "sub_topic_topics", as: "sub_topics" });

// Countries/States
Topic.hasMany(TopicCountry, { as: "topic_country", foreignKey: "topic_id" });
Topic.hasMany(TopicState, { as: "topic_state", foreignKey: "topic_id" });
