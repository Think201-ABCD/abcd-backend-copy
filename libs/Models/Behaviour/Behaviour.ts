import { DataTypes, Model, Optional } from "sequelize";

// Connection
import { sequelize } from "../../Loaders/database";
import { User } from "../Auth/User";
import { Barrier } from "../Barrier/Barrier";
import { Country } from "../Data/Country";
import { State } from "../Data/State";
import { Organisation } from "../Organisation/Organisation";
import { Outcome } from "../Outcome/Outcome";
import { SubOutcome } from "../Outcome/SubOutcome";
import { SubTopic } from "../Topic/SubTopic";
import { Topic } from "../Topic/Topic";
import { BehaviourCategory } from "./BehaviourCategory";
import { BehaviourCountry } from "./BehaviourCountry";
import { BehaviourState } from "./BehaviourState";

// Models

interface behaviourAttributes {
    id?: bigint;
    added_by?: bigint;
    category_id?: bigint | null;
    sub_category_id?: bigint | null;
    uuid?: string;
    title?: string;
    logo?: string;
    status?: string;

    created_at?: Date;
    updated_at?: Date;
    deleted_at?: Date;
}

export type behaviourCreationAttributes = Optional<behaviourAttributes, "id">;

export class Behaviour extends Model<behaviourAttributes, behaviourCreationAttributes> implements behaviourAttributes {
    public id!: bigint;
    public added_by!: bigint;
    public category_id!: bigint | null;
    public sub_category_id!: bigint | null;
    public uuid!: string;
    public title!: string;
    public logo!: string;
    public status!: string;

    public readonly created_at!: Date;
    public readonly updated_at!: Date;
    public deleted_at!: Date;
}

Behaviour.init(
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

        category_id: {
            allowNull: true,
            type: DataTypes.BIGINT,
            onUpdate: "CASCADE",
            onDelete: "CASCADE",
            references: {
                model: "behaviour_categories",
                key: "id",
            },
        },

        sub_category_id: {
            allowNull: true,
            type: DataTypes.BIGINT,
            onUpdate: "CASCADE",
            onDelete: "CASCADE",
            references: {
                model: "behaviour_categories",
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
        tableName: "behaviours",
        sequelize,
        underscored: true,
        paranoid: true,
        createdAt: "created_at",
        updatedAt: "updated_at",
        deletedAt: "deleted_at",
    }
);

Behaviour.belongsTo(User, { as: "created_by", foreignKey: "added_by" });

Behaviour.belongsTo(BehaviourCategory, { as: "category", foreignKey: "category_id" });
Behaviour.belongsTo(BehaviourCategory, { as: "sub_category", foreignKey: "sub_category_id" });

// Country / State
Behaviour.hasMany(BehaviourCountry, { as: "behaviour_countries", foreignKey: "behaviour_id" });
BehaviourCountry.belongsTo(Country, { as: "country", foreignKey: "country_id" });
Behaviour.hasMany(BehaviourState, { as: "behaviour_states", foreignKey: "behaviour_id" });
BehaviourState.belongsTo(State, { as: "state", foreignKey: "state_id" });

// Outcome / Sub Outcome
Behaviour.belongsToMany(Outcome, { as: "outcomes", through: "behaviour_outcomes" });
Outcome.belongsToMany(Behaviour, { as: "behaviours", through: "behaviour_outcomes" });

Behaviour.belongsToMany(SubOutcome, { as: "sub_outcomes", through: "behaviour_outcomes" });
SubOutcome.belongsToMany(Behaviour, { as: "behaviours", through: "behaviour_outcomes" });

// Topic / Sub Topic
Behaviour.belongsToMany(Topic, { as: "topics", through: "behaviour_topics" });
Behaviour.belongsToMany(SubTopic, { as: "sub_topics", through: "behaviour_topics" });

Topic.belongsToMany(Behaviour, { as: "behaviours", through: "behaviour_topics" });
SubTopic.belongsToMany(Behaviour, { as: "behaviours", through: "behaviour_topics" });

// Barriers
Behaviour.belongsToMany(Barrier, { as: "barriers", through: "barrier_behaviours" });
Barrier.belongsToMany(Behaviour, { through: "barrier_behaviours", as: "behaviours" });

// Organisations
Behaviour.belongsToMany(Organisation, { as: "organisations", through: "organisation_behaviours" });
