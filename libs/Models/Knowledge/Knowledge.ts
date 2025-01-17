import { DataTypes, Model, Optional } from "sequelize";

// Connection
import { sequelize } from "../../Loaders/database";
import { User } from "../Auth/User";
import { Barrier } from "../Barrier/Barrier";
import { Behaviour } from "../Behaviour/Behaviour";
import { Country } from "../Data/Country";
import { State } from "../Data/State";
import { Outcome } from "../Outcome/Outcome";
import { SubOutcome } from "../Outcome/SubOutcome";
import { Solution } from "../Solution/Solution";
import { SubTopic } from "../Topic/SubTopic";
import { Topic } from "../Topic/Topic";
import { KnowledgeCategory } from "./KnowledgeCategory";
import { KnowledgeCountry } from "./KnowledgeCountry";
import { KnowledgeState } from "./KnowledgeState";

// Models

interface knowledgeAttributes {
    id?: bigint;
    added_by?: bigint;
    knowledge_ids?: string | null;
    category_id?: bigint | null;
    sub_category_id?: bigint | null;
    uuid?: string;
    title?: string;
    type?: string;
    logo?: string;
    organisations?: string;
    person?: string | null;
    languages?: string;
    source?: string | null;
    impact?: string | null;
    start_year?: number | null;
    end_year?: number | null;
    budget?: string | null;
    expiry?: Date;
    confidence?: string | null;
    status?: string;
    organisation_ids?: string;

    created_at?: Date;
    updated_at?: Date;
    deleted_at?: Date;
}

export type knowledgeCreationAttributes = Optional<knowledgeAttributes, "id">;

export class Knowledge extends Model<knowledgeAttributes, knowledgeCreationAttributes> implements knowledgeAttributes {
    public id!: bigint;
    public added_by!: bigint;
    public knowledge_ids!: string | null;
    public category_id!: bigint | null;
    public sub_category_id!: bigint | null;
    public uuid!: string;
    public title!: string;
    public type!: string;
    public logo!: string;
    public organisations!: string;
    public person!: string | null;
    public languages!: string;
    public source!: string | null;
    public impact!: string | null;
    public start_year!: number | null;
    public end_year!: number | null;
    public budget!: string | null;
    public expiry!: Date;
    public confidence!: string | null;
    public status!: string;
    public organisation_ids!: string;

    public readonly created_at!: Date;
    public readonly updated_at!: Date;
    public deleted_at!: Date;
}

Knowledge.init(
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

        knowledge_ids: {
            allowNull: true,
            type: DataTypes.JSON,
        },

        category_id: {
            allowNull: true,
            type: DataTypes.BIGINT,
            onUpdate: "CASCADE",
            onDelete: "CASCADE",
            references: {
                model: "knowledge_categories",
                key: "id",
            },
        },

        sub_category_id: {
            allowNull: true,
            type: DataTypes.BIGINT,
            onUpdate: "CASCADE",
            onDelete: "CASCADE",
            references: {
                model: "knowledge_categories",
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

        type: {
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

        organisations: {
            allowNull: false,
            type: DataTypes.JSON,
        },

        organisation_ids: {
            allowNull: true,
            type: DataTypes.JSON,
        },

        person: {
            allowNull: true,
            type: DataTypes.STRING,
        },

        languages: {
            allowNull: false,
            type: DataTypes.JSON,
        },

        source: {
            allowNull: true,
            type: DataTypes.STRING,
        },

        impact: {
            allowNull: true,
            type: DataTypes.TEXT,
        },

        start_year: {
            allowNull: true,
            type: DataTypes.SMALLINT,
        },

        end_year: {
            allowNull: true,
            type: DataTypes.SMALLINT,
        },

        budget: {
            allowNull: true,
            type: DataTypes.STRING,
        },

        expiry: {
            allowNull: false,
            type: DataTypes.DATE,
        },

        confidence: {
            allowNull: true,
            type: DataTypes.STRING(100),
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
        tableName: "knowledges",
        sequelize,
        underscored: true,
        paranoid: true,
        createdAt: "created_at",
        updatedAt: "updated_at",
        deletedAt: "deleted_at",
    }
);

Knowledge.belongsTo(User, { as: "created_by", foreignKey: "added_by" });

Knowledge.belongsTo(KnowledgeCategory, { as: "category", foreignKey: "category_id" });
Knowledge.belongsTo(KnowledgeCategory, { as: "sub_category", foreignKey: "sub_category_id" });

// Country / states
Knowledge.hasMany(KnowledgeCountry, { as: "knowledge_countries", foreignKey: "knowledge_id" });
KnowledgeCountry.belongsTo(Country, { as: "country", foreignKey: "country_id" });
KnowledgeState.belongsTo(State, { as: "state", foreignKey: "state_id" });

// Outcome / Suboutcomes
Knowledge.belongsToMany(Outcome, { as: "outcomes", through: "knowledge_outcomes" });
Knowledge.belongsToMany(SubOutcome, { as: "sub_outcomes", through: "knowledge_outcomes" });

Outcome.belongsToMany(Knowledge, { as: "knowledges", through: "knowledge_outcomes" });
SubOutcome.belongsToMany(Knowledge, { as: "knowledges", through: "knowledge_outcomes" });

// Topic / Subtopics
Knowledge.belongsToMany(Topic, { as: "topics", through: "knowledge_topics" });
Knowledge.belongsToMany(SubTopic, { as: "sub_topics", through: "knowledge_topics" });

Topic.belongsToMany(Knowledge, { as: "knowledges", through: "knowledge_topics", foreignKey: "topic_id" });
SubTopic.belongsToMany(Knowledge, { as: "knowledges", through: "knowledge_topics", foreignKey: "sub_topic_id" });

// Barriers
Knowledge.belongsToMany(Barrier, { as: "barriers", through: "knowledge_barriers" });
Barrier.belongsToMany(Knowledge, { as: "knowledges", through: "knowledge_barriers" });

// Behaviour
Knowledge.belongsToMany(Behaviour, { as: "behaviours", through: "knowledge_behaviours" });
Behaviour.belongsToMany(Knowledge, { as: "knowledges", through: "knowledge_behaviours" });

// Solution
Knowledge.belongsToMany(Solution, { as: "solutions", through: "knowledge_solutions" });
Solution.belongsToMany(Knowledge, { as: "knowledges", through: "knowledge_solutions" });
