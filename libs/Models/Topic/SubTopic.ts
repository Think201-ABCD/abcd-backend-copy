import { DataTypes, Model, Optional } from "sequelize";

// Connection
import { sequelize } from "../../Loaders/database";

// Models
import { User } from "../Auth/User";
import { TopicCountry } from "./TopicCountry";
import { TopicState } from "./TopicState";

interface subTopicsAttributes {
    id?: bigint;
    added_by?: bigint;
    uuid?: string;
    title?: string;
    logo?: string;
    logo_aws?: string;
    status?: string;

    created_at?: Date;
    updated_at?: Date;
    deleted_at?: Date;
}

export type subTopicsCreationAttributes = Optional<subTopicsAttributes, "id">;

export class SubTopic extends Model<subTopicsAttributes, subTopicsCreationAttributes> implements subTopicsAttributes {
    public id!: bigint;
    public added_by!: bigint;
    public uuid!: string;
    public title!: string;
    public logo!: string;
    public logo_aws!: string;
    public status!: string;

    public readonly created_at!: Date;
    public readonly updated_at!: Date;
    public deleted_at!: Date;
}

SubTopic.init(
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
        tableName: "sub_topics",
        sequelize,
        underscored: true,
        paranoid: true,
        createdAt: "created_at",
        updatedAt: "updated_at",
        deletedAt: "deleted_at",
    }
);

SubTopic.hasMany(TopicCountry, { as: "topic_country", foreignKey: "sub_topic_id" });
SubTopic.hasMany(TopicState, { as: "topic_state", foreignKey: "sub_topic_id" });
SubTopic.belongsTo(User, { as: "created_by", foreignKey: "added_by" });
