import { DataTypes, Model, Optional } from "sequelize";

// Connection
import { sequelize } from "../../Loaders/database";
import { User } from "../Auth/User";
import { Country } from "../Data/Country";
import { State } from "../Data/State";
import { Outcome } from "../Outcome/Outcome";
import { SubOutcome } from "../Outcome/SubOutcome";
import { SubTopic } from "../Topic/SubTopic";
import { Topic } from "../Topic/Topic";
import { BarrierCategory } from "./BarrierCategory";
import { BarrierCountry } from "./BarrierCountry";
import { BarrierState } from "./BarrierState";

// Models

interface barrierAttributes {
    id?: bigint;
    uuid?: string;
    added_by?: bigint;
    category_id?: bigint;
    sub_category_id?: bigint | null;
    title?: string;
    expiry?: Date;
    type?: string | null;
    confidence?: string | null;
    logo?: string;
    status?: string;
    source_link?: string;
    evidence_type?: string;
    source_links?:string|null;

    created_at?: Date;
    updated_at?: Date;
    deleted_at?: Date;
}

export type barrierCreationAttributes = Optional<barrierAttributes, "id">;

export class Barrier extends Model<barrierAttributes, barrierCreationAttributes> implements barrierAttributes {
    public id!: bigint;
    public uuid!: string;
    public added_by!: bigint;
    public category_id!: bigint;
    public sub_category_id!: bigint | null;
    public title!: string;
    public expiry!: Date;
    public type!: string | null;
    public confidence!: string | null;
    public logo!: string;
    public status!: string;
    public source_link!: string;
    public evidence_type!: string;
    public source_links!: string|null;

    public readonly created_at!: Date;
    public readonly updated_at!: Date;
    public deleted_at!: Date;
}

Barrier.init(
    {
        id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: DataTypes.BIGINT,
        },

        uuid: {
            allowNull: false,
            type: DataTypes.UUID,
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
            allowNull: false,
            type: DataTypes.BIGINT,
            onUpdate: "CASCADE",
            onDelete: "CASCADE",
            references: {
                model: "barrier_categories",
                key: "id",
            },
        },

        sub_category_id: {
            allowNull: true,
            type: DataTypes.BIGINT,
            onUpdate: "CASCADE",
            onDelete: "CASCADE",
            references: {
                model: "barrier_categories",
                key: "id",
            },
        },

        title: {
            allowNull: false,
            type: DataTypes.STRING,
        },

        expiry: {
            allowNull: false,
            type: DataTypes.DATE,
        },

        type: {
            allowNull: true,
            type: DataTypes.STRING,
        },

        confidence: {
            allowNull: true,
            type: DataTypes.STRING(100),
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

        source_link: {
            allowNull: true,
            type: DataTypes.STRING,
        },

        evidence_type: {
            allowNull: true,
            type: DataTypes.STRING,
        },

        source_links: {
            allowNull: true,
            type: DataTypes.JSONB,
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
        tableName: "barriers",
        sequelize,
        underscored: true,
        paranoid: true,
        createdAt: "created_at",
        updatedAt: "updated_at",
        deletedAt: "deleted_at",
    }
);

Barrier.belongsTo(User, { as: "created_by", foreignKey: "added_by" });

// Topic / Sub Topic
Barrier.belongsToMany(Topic, { through: "barrier_topics", as: "topics" });
Barrier.belongsToMany(SubTopic, { through: "barrier_topics", as: "sub_topics" });
Topic.belongsToMany(Barrier, { through: "barrier_topics", as: "barriers" });
SubTopic.belongsToMany(Barrier, { through: "barrier_topics", as: "barriers" });

Barrier.belongsTo(BarrierCategory, { as: "category", foreignKey: "category_id" });
Barrier.belongsTo(BarrierCategory, { as: "sub_category", foreignKey: "sub_category_id" });

// Country / State
Barrier.hasMany(BarrierCountry, { as: "barrier_countries", foreignKey: "barrier_id" });
BarrierCountry.belongsTo(Country, { as: "country", foreignKey: "country_id" });

BarrierState.belongsTo(State, { as: "state", foreignKey: "state_id" });
Barrier.belongsToMany(State, { through: "barrier_states", as: "states" });

// Outcome / Sub outcome
Barrier.belongsToMany(Outcome, { as: "outcomes", through: "barrier_outcomes" });
Barrier.belongsToMany(SubOutcome, { as: "sub_outcomes", through: "barrier_outcomes" });

Outcome.belongsToMany(Barrier, { as: "barriers", through: "barrier_outcomes" });
SubOutcome.belongsToMany(Barrier, { as: "barriers", through: "barrier_outcomes" });
