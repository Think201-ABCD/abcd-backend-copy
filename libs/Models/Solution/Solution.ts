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
import { SubTopic } from "../Topic/SubTopic";
import { Topic } from "../Topic/Topic";
import { SolutionCountry } from "./SolutionCountry";
import { SolutionState } from "./SolutionState";

interface solutionAttributes {
    id?: bigint;
    source_country_id?: bigint;
    source_state_id?: bigint;
    added_by?: bigint;
    uuid?: string;
    title?: string;
    expiry?: Date;
    year?: string;
    confidence?: string;
    priority?: string;
    logo?: string;
    categories?: string | null;
    sub_categories?: string | null;
    status?: string;
    source_link?: string;
    evidence_type?: string;
    source_links?: string;

    created_at?: Date;
    updated_at?: Date;
    deleted_at?: Date;
}

export type solutionCreationAttributes = Optional<solutionAttributes, "id">;

export class Solution extends Model<solutionAttributes, solutionCreationAttributes> implements solutionAttributes {
    public id!: bigint;
    public source_country_id!: bigint;
    public source_state_id!: bigint;
    public added_by!: bigint;
    public uuid!: string;
    public title!: string;
    public expiry!: Date;
    public year!: string;
    public confidence!: string;
    public priority!: string;
    public logo!: string;
    public categories!: string | null;
    public sub_categories!: string | null;
    public status!: string;
    public source_link!: string;
    public evidence_type!: string;
    public source_links!: string;

    public readonly created_at!: Date;
    public readonly updated_at!: Date;
    public deleted_at!: Date;
}

Solution.init(
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
                model: {
                    tableName: "users",
                },
                key: "id",
            },
        },

        source_country_id: {
            allowNull: false,
            type: DataTypes.BIGINT,
            onUpdate: "CASCADE",
            onDelete: "CASCADE",
            references: {
                model: {
                    tableName: "countries",
                },
                key: "id",
            },
        },

        source_state_id: {
            allowNull: false,
            type: DataTypes.BIGINT,
            onUpdate: "CASCADE",
            onDelete: "CASCADE",
            references: {
                model: {
                    tableName: "states",
                },
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

        expiry: {
            allowNull: false,
            type: DataTypes.DATE,
        },

        year: {
            allowNull: true,
            type: DataTypes.STRING(20),
        },

        confidence: {
            allowNull: true,
            type: DataTypes.STRING(100),
        },

        priority: {
            allowNull: true,
            type: DataTypes.STRING(50),
        },

        logo: {
            allowNull: true,
            type: DataTypes.STRING,
            get() {
                if (this.getDataValue("logo")) {
                    return `${process.env.AWS_BASE_URL}` + `${this.getDataValue("logo")}`;
                }
                return null;
            },
        },

        categories: {
            allowNull: true,
            type: DataTypes.JSONB,
        },

        sub_categories: {
            allowNull: true,
            type: DataTypes.JSON,
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
            type: DataTypes.JSONB
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
        tableName: "solutions",
        sequelize,
        underscored: true,
        paranoid: true,
        createdAt: "created_at",
        updatedAt: "updated_at",
        deletedAt: "deleted_at",
    }
);

Solution.belongsTo(User, { as: "created_by", foreignKey: "added_by" });

// Source country/state
Solution.belongsTo(Country, { as: "source_country", foreignKey: "source_country_id" });
Solution.belongsTo(State, { as: "source_state", foreignKey: "source_state_id" });

// Countries/States
Solution.hasMany(SolutionCountry, { as: "solution_countries", foreignKey: "solution_id" });
Solution.hasMany(SolutionState, { as: "solution_states", foreignKey: "solution_id" });

// Outcome / Sub Outcome
Solution.belongsToMany(Outcome, { as: "outcomes", through: "solution_outcomes" });
Solution.belongsToMany(SubOutcome, { as: "sub_outcomes", through: "solution_outcomes" });

Outcome.belongsToMany(Solution, { as: "solutions", through: "solution_outcomes" });
SubOutcome.belongsToMany(Solution, { as: "solutions", through: "solution_outcomes" });

// Topic / Sub Topic
Solution.belongsToMany(Topic, { as: "topics", through: "solution_topics" });
Solution.belongsToMany(SubTopic, { as: "sub_topics", through: "solution_topics" });

Topic.belongsToMany(Solution, { as: "solutions", through: "solution_topics" });
SubTopic.belongsToMany(Solution, { as: "solutions", through: "solution_topics" });

// Barrier
Solution.belongsToMany(Barrier, { as: "barriers", through: "solutions_barriers" });
Barrier.belongsToMany(Solution, { as: "solutions", through: "solutions_barriers" });

Solution.belongsToMany(Behaviour, { through: "solution_behaviours", as: "behaviours" });
Behaviour.belongsToMany(Solution, { through: "solution_behaviours", as: "solutions" });
