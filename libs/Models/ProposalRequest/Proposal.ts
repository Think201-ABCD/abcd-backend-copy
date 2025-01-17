import { DataTypes, Model, Optional } from "sequelize";

// Connection
import { sequelize } from "../../Loaders/database";

// Models
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
import { ProposalCategory } from "./ProposalCategory";
import { ProposalCountry } from "./ProposalCountry";
import { ProposalState } from "./ProposalState";

interface proposalAttributes {
    id?: bigint;
    added_by?: bigint;
    uuid?: string;
    category_id?: bigint | null;
    sub_category_id?: bigint | null;
    organisation_id?: bigint;
    title?: string;
    logo?: string;
    brief?: string | null;
    description?: string | null;
    expiry?: Date | null;
    confidence?: string | null;
    person?: string | null;
    languages?: string;
    start_year?: number | null;
    end_year?: number | null;
    source?: string;
    experts?: string | null;
    funders?: string | null;
    partners?: string | null;
    status?: string;

    created_at?: Date;
    updated_at?: Date;
    deleted_at?: Date;
}

export type proposalCreationAttributes = Optional<proposalAttributes, "id">;

export class Proposal extends Model<proposalAttributes, proposalCreationAttributes> implements proposalAttributes {
    public id!: bigint;
    public added_by!: bigint;
    public uuid!: string;
    public category_id!: bigint | null;
    public sub_category_id!: bigint | null;
    public organisation_id!: bigint;
    public title!: string;
    public logo!: string;
    public brief!: string | null;
    public description!: string | null;
    public expiry!: Date | null;
    public confidence!: string | null;
    public person!: string | null;
    public languages!: string;
    public start_year!: number | null;
    public end_year!: number | null;
    public source!: string;
    public experts!: string | null;
    public funders!: string | null;
    public partners!: string | null;
    public status!: string;

    public readonly created_at!: Date;
    public readonly updated_at!: Date;
    public deleted_at!: Date;
}

Proposal.init(
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

        category_id: {
            allowNull: true,
            type: DataTypes.BIGINT,
            onUpdate: "CASCADE",
            onDelete: "CASCADE",
            references: {
                model: "proposal_categories",
                key: "id",
            },
        },

        sub_category_id: {
            allowNull: true,
            type: DataTypes.BIGINT,
            onUpdate: "CASCADE",
            onDelete: "CASCADE",
            references: {
                model: "proposal_categories",
                key: "id",
            },
        },

        organisation_id: {
            allowNull: false,
            type: DataTypes.BIGINT,
            onUpdate: "CASCADE",
            onDelete: "CASCADE",
            references: {
                model: "organisations",
                key: "id",
            },
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

        brief: {
            allowNull: true,
            type: DataTypes.STRING,
        },

        description: {
            allowNull: true,
            type: DataTypes.TEXT,
        },

        expiry: {
            allowNull: true,
            type: DataTypes.DATE,
        },

        confidence: {
            allowNull: true,
            type: DataTypes.STRING(100),
        },

        person: {
            allowNull: true,
            type: DataTypes.STRING,
        },

        languages: {
            allowNull: false,
            type: DataTypes.JSON,
        },

        start_year: {
            allowNull: true,
            type: DataTypes.SMALLINT,
        },

        end_year: {
            allowNull: true,
            type: DataTypes.SMALLINT,
        },

        source: {
            allowNull: false,
            type: DataTypes.STRING,
        },

        experts: {
            allowNull: true,
            type: DataTypes.JSON,
        },

        funders: {
            allowNull: true,
            type: DataTypes.JSON,
        },

        partners: {
            allowNull: true,
            type: DataTypes.JSON,
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
        tableName: "proposal_requests",
        sequelize,
        underscored: true,
        paranoid: true,
        createdAt: "created_at",
        updatedAt: "updated_at",
        deletedAt: "deleted_at",
    }
);

Proposal.belongsTo(User, { as: "created_by", foreignKey: "added_by" });

Proposal.belongsTo(ProposalCategory, { as: "category", foreignKey: "category_id" });
Proposal.belongsTo(ProposalCategory, { as: "sub_category", foreignKey: "sub_category_id" });

// Country / states
Proposal.hasMany(ProposalCountry, { as: "proposal_countries", foreignKey: "proposal_id" });
ProposalCountry.belongsTo(Country, { as: "country", foreignKey: "country_id" });
ProposalState.belongsTo(State, { as: "state", foreignKey: "state_id" });

// Outcome / Suboutcomes
Proposal.belongsToMany(Outcome, { as: "outcomes", through: "proposal_outcomes" });
Proposal.belongsToMany(SubOutcome, { as: "sub_outcomes", through: "proposal_outcomes" });

Outcome.belongsToMany(Proposal, { as: "proposals", through: "proposal_outcomes" });
SubOutcome.belongsToMany(Proposal, { as: "proposals", through: "proposal_outcomes" });

// Topic / Subtopics
Proposal.belongsToMany(Topic, { as: "topics", through: "proposal_topics" });
Proposal.belongsToMany(SubTopic, { as: "sub_topics", through: "proposal_topics" });

Topic.belongsToMany(Proposal, { as: "proposals", through: "proposal_topics" });
SubTopic.belongsToMany(Proposal, { as: "proposals", through: "proposal_topics" });

// Barriers
Proposal.belongsToMany(Barrier, { as: "barriers", through: "proposal_barriers" });
Barrier.belongsToMany(Proposal, { as: "proposals", through: "proposal_barriers" });

// Behaviour
Proposal.belongsToMany(Behaviour, { as: "behaviours", through: "proposal_behaviours" });
Behaviour.belongsToMany(Proposal, { as: "proposals", through: "proposal_behaviours" });

// Solution
Proposal.belongsToMany(Solution, { as: "solutions", through: "proposal_solutions" });
Solution.belongsToMany(Proposal, { as: "proposals", through: "proposal_solutions" });
