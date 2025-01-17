import { DataTypes, Model, Optional } from "sequelize";

// Connection
import { sequelize } from "../../Loaders/database";
import { User } from "../Auth/User";
import { OutcomeCountry } from "./OutcomeCountry";
import { OutcomeState } from "./OutcomeState";
import { SubTopic } from "../Topic/SubTopic";
import { Topic } from "../Topic/Topic";

// Models

interface subOutcomesAttributes {
    id?: bigint;
    added_by?: bigint;
    uuid?: string;
    title?: string;
    logo?: string;
    expiry?: Date;
    status?: string;

    created_at?: Date;
    updated_at?: Date;
    deleted_at?: Date;
}

export type subOutcomesCreationAttributes = Optional<subOutcomesAttributes, "id">;

export class SubOutcome
    extends Model<subOutcomesAttributes, subOutcomesCreationAttributes>
    implements subOutcomesAttributes
{
    public id!: bigint;
    public added_by!: bigint;
    public uuid!: string;
    public title!: string;
    public logo!: string;
    public expiry!: Date;
    public status!: string;

    public readonly created_at!: Date;
    public readonly updated_at!: Date;
    public deleted_at!: Date;
}

SubOutcome.init(
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

        expiry: {
            allowNull: false,
            type: DataTypes.DATE,
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
        tableName: "sub_outcomes",
        sequelize,
        underscored: true,
        paranoid: true,
        createdAt: "created_at",
        updatedAt: "updated_at",
        deletedAt: "deleted_at",
    }
);

SubOutcome.belongsTo(User, { as: "created_by", foreignKey: "added_by" });

// Coutries / States
SubOutcome.hasMany(OutcomeCountry, { as: "outcome_countries", foreignKey: "sub_outcome_id" });
SubOutcome.hasMany(OutcomeState, { as: "outcome_state", foreignKey: "sub_outcome_id" });

// Topic / Sub topics
SubOutcome.belongsToMany(Topic, { through: "outcome_topics", as: "topics", foreignKey: "sub_outcome_id" });
SubOutcome.belongsToMany(SubTopic, { through: "outcome_topics", as: "sub_topics", foreignKey: "sub_outcome_id" });

Topic.belongsToMany(SubOutcome, { through: "outcome_topics", as: "sub_outcomes", foreignKey: "topic_id" });
SubTopic.belongsToMany(SubOutcome, { through: "outcome_topics", as: "sub_outcomes", foreignKey: "sub_topic_id" });
