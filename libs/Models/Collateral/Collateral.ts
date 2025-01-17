import { DataTypes, Model, Optional } from "sequelize";

// Connection
import { sequelize } from "../../Loaders/database";

// Models
import { User } from "../Auth/User";
import { Barrier } from "../Barrier/Barrier";
import { Country } from "../Data/Country";
import { State } from "../Data/State";
import { Outcome } from "../Outcome/Outcome";
import { SubOutcome } from "../Outcome/SubOutcome";
import { SubTopic } from "../Topic/SubTopic";
import { Topic } from "../Topic/Topic";
import { CollateralCountry } from "./CollateralCountry";
import { CollateralState } from "./CollateralState";
import { Behaviour } from "./../Behaviour/Behaviour";
import { Solution } from "../Solution/Solution";
import { CollateralCategory } from "./CollateralCategory";

interface collateralAttributes {
    id?: bigint;
    added_by?: bigint;
    category_id?: bigint;
    sub_category_id?: bigint | null;
    uuid?: string;
    title?: string;
    logo?: string;
    organisations?: string;
    person?: string | null;
    languages?: string;
    source?: string;
    impact?: string | null;
    start_year?: number | null;
    end_year?: number | null;
    license?: string;
    expiry?: Date | null;
    confidence?: string | null;
    status?: string;

    created_at?: Date;
    updated_at?: Date;
    deleted_at?: Date;
}

export type collateralCreationAttributes = Optional<collateralAttributes, "id">;

export class Collateral
    extends Model<collateralAttributes, collateralCreationAttributes>
    implements collateralAttributes
{
    public id!: bigint;
    public added_by!: bigint;
    public category_id!: bigint;
    public sub_category_id!: bigint | null;
    public uuid!: string;
    public title!: string;
    public logo!: string;
    public organisations!: string;
    public person!: string | null;
    public languages!: string;
    public source!: string;
    public impact!: string | null;
    public start_year!: number | null;
    public end_year!: number | null;
    public license!: string;
    public expiry!: Date | null;
    public confidence!: string | null;
    public status!: string;

    public readonly created_at!: Date;
    public readonly updated_at!: Date;
    public deleted_at!: Date;
}

Collateral.init(
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
            allowNull: false,
            type: DataTypes.BIGINT,
            onUpdate: "CASCADE",
            onDelete: "CASCADE",
            references: {
                model: "collateral_categories",
                key: "id",
            },
        },

        sub_category_id: {
            allowNull: true,
            type: DataTypes.BIGINT,
            onUpdate: "CASCADE",
            onDelete: "CASCADE",
            references: {
                model: "collateral_categories",
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

        organisations: {
            allowNull: false,
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
            allowNull: false,
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

        license: {
            allowNull: false,
            type: DataTypes.STRING,
        },

        expiry: {
            allowNull: true,
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
        tableName: "collaterals",
        sequelize,
        underscored: true,
        paranoid: true,
        createdAt: "created_at",
        updatedAt: "updated_at",
        deletedAt: "deleted_at",
    }
);

Collateral.belongsTo(User, { as: "created_by", foreignKey: "added_by" });
Collateral.belongsTo(CollateralCategory, { as: "category" });

// Country / states
Collateral.hasMany(CollateralCountry, { as: "collateral_countries", foreignKey: "collateral_id" });
CollateralCountry.belongsTo(Country, { as: "country", foreignKey: "country_id" });
CollateralState.belongsTo(State, { as: "state", foreignKey: "state_id" });

// Outcome / Suboutcomes
Collateral.belongsToMany(Outcome, { as: "outcomes", through: "collateral_outcomes" });
Collateral.belongsToMany(SubOutcome, { as: "sub_outcomes", through: "collateral_outcomes" });

Outcome.belongsToMany(Collateral, { as: "collaterals", through: "collateral_outcomes" });
SubOutcome.belongsToMany(Collateral, { as: "collaterals", through: "collateral_outcomes" });

// Topic / Subtopics
Collateral.belongsToMany(Topic, { as: "topics", through: "collateral_topics" });
Collateral.belongsToMany(SubTopic, { as: "sub_topics", through: "collateral_topics" });

Topic.belongsToMany(Collateral, { as: "collaterals", through: "collateral_topics", foreignKey: "topic_id" });
SubTopic.belongsToMany(Collateral, { as: "collaterals", through: "collateral_topics", foreignKey: "sub_topic_id" });

// Barriers
Collateral.belongsToMany(Barrier, { as: "barriers", through: "collateral_barriers" });
Barrier.belongsToMany(Collateral, { as: "collaterals", through: "collateral_barriers" });

// Behaviour
Collateral.belongsToMany(Behaviour, { as: "behaviours", through: "collateral_behaviours" });
Behaviour.belongsToMany(Collateral, { as: "collaterals", through: "collateral_behaviours" });

// Solution
Collateral.belongsToMany(Solution, { as: "solutions", through: "collateral_solutions" });
Solution.belongsToMany(Collateral, { as: "collaterals", through: "collateral_solutions" });
