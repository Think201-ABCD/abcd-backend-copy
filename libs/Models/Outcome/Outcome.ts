import { DataTypes, Model, Optional } from "sequelize";

// Connection
import { sequelize } from "../../Loaders/database";

// Models
import { User } from "../Auth/User";
import { OutcomeCountry } from "./OutcomeCountry";
import { OutcomeState } from "./OutcomeState";
import { SubOutcome } from "./SubOutcome";
import { SubTopic } from "../Topic/SubTopic";
import { Topic } from "../Topic/Topic";

interface outcomesAttributes {
    id?: bigint;
    added_by?: bigint;
    uuid?: string;
    title?: string;
    types?: string | null;
    expiry?: Date;
    logo?: string;
    status?: string;

    created_at?: Date;
    updated_at?: Date;
    deleted_at?: Date;
}

export type outcomesCreationAttributes = Optional<outcomesAttributes, "id">;

export class Outcome extends Model<outcomesAttributes, outcomesCreationAttributes> implements outcomesAttributes {
    public id!: bigint;
    public added_by!: bigint;
    public uuid!: string;
    public title!: string;
    public types!: string | null;
    public expiry!: Date;
    public logo!: string;
    public status!: string;

    public readonly created_at!: Date;
    public readonly updated_at!: Date;
    public deleted_at!: Date;
}

Outcome.init(
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

        types: {
            allowNull: true,
            type: DataTypes.JSON,
        },

        expiry: {
            allowNull: false,
            type: DataTypes.DATE,
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
        tableName: "outcomes",
        sequelize,
        underscored: true,
        paranoid: true,
        createdAt: "created_at",
        updatedAt: "updated_at",
        deletedAt: "deleted_at",
    }
);

Outcome.belongsTo(User, { as: "created_by", foreignKey: "added_by" });

// Sub-outcomes
Outcome.belongsToMany(SubOutcome, { through: "sub_outcome_outcomes", as: "sub_outcomes" });
SubOutcome.belongsToMany(Outcome, { through: "sub_outcome_outcomes", as: "outcomes" });

// Topic/Sub-Topic
Outcome.belongsToMany(Topic, { through: "outcome_topics", as: "topics", foreignKey: "outcome_id" });
Outcome.belongsToMany(SubTopic, { through: "outcome_topics", as: "sub_topics", foreignKey: "outcome_id" });
Topic.belongsToMany(Outcome, { through: "outcome_topics", as: "outcomes", foreignKey: "topic_id" });
SubTopic.belongsToMany(Outcome, { through: "outcome_topics", as: "outcomes", foreignKey: "sub_topic_id" });

// Countries/States
Outcome.hasMany(OutcomeCountry, { as: "outcome_countries", foreignKey: "outcome_id" });
Outcome.hasMany(OutcomeState, { as: "outcome_states", foreignKey: "outcome_id" });
