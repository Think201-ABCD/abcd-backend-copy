import { DataTypes, Model, Optional } from "sequelize";

// Connection
import { sequelize } from "../../Loaders/database";
import { Country } from "../Data/Country";

// Models

interface outcomeCountriesAttributes {
    id?: bigint;
    outcome_id?: bigint | null;
    sub_outcome_id?: bigint | null;
    country_id?: bigint;
    brief?: string | null;
    description?: string | null;
    banner?: string | null;

    created_at?: Date;
    updated_at?: Date;
    deleted_at?: Date;
}

export type outcomeCountriesCreationAttributes = Optional<outcomeCountriesAttributes, "id">;

export class OutcomeCountry
    extends Model<outcomeCountriesAttributes, outcomeCountriesCreationAttributes>
    implements outcomeCountriesAttributes
{
    public id!: bigint;
    public outcome_id!: bigint | null;
    public sub_outcome_id!: bigint | null;
    public country_id!: bigint;
    public brief!: string | null;
    public description!: string | null;
    public banner!: string | null;

    public readonly created_at!: Date;
    public readonly updated_at!: Date;
    public deleted_at!: Date;
}

OutcomeCountry.init(
    {
        id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: DataTypes.BIGINT,
        },

        outcome_id: {
            allowNull: true,
            type: DataTypes.BIGINT,
            onUpdate: "CASCADE",
            onDelete: "CASCADE",
            references: {
                model: "outcomes",
                key: "id",
            },
        },

        sub_outcome_id: {
            allowNull: true,
            onUpdate: "CASCADE",
            onDelete: "CASCADE",
            type: DataTypes.BIGINT,
            references: {
                model: "sub_outcomes",
                key: "id",
            },
        },

        country_id: {
            allowNull: false,
            type: DataTypes.BIGINT,
            onUpdate: "CASCADE",
            onDelete: "CASCADE",
            references: {
                model: "countries",
                key: "id",
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

        banner: {
            allowNull: true,
            type: DataTypes.STRING,
            get() {
                return this.getDataValue("banner")
                    ? `${process.env.AWS_BASE_URL}` + `${this.getDataValue("banner")}`
                    : null;
            },
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
        tableName: "outcome_countries",
        sequelize,
        underscored: true,
        paranoid: true,
        createdAt: "created_at",
        updatedAt: "updated_at",
        deletedAt: "deleted_at",
    }
);

// Country
OutcomeCountry.belongsTo(Country, { as: "country", foreignKey: "country_id" });
