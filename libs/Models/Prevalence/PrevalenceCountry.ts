import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../Loaders/database";
import { Country } from "../Data/Country";
import { State } from "../Data/State";

// Models

interface prevalenceCountryAttributes {
    id?: bigint;
    prevalence_id?: bigint;
    country_id?: bigint;
    state_id?: bigint;
    start_year?: number;
    end_year?: number;

    meta?: string;
    status?: string;

    created_at?: Date;
    updated_at?: Date;
    deleted_at?: Date;
}

export type prevelenceCountryCreationAttributes = Optional<prevalenceCountryAttributes, "id">;

export class PrevalenceCountry
    extends Model<prevalenceCountryAttributes, prevelenceCountryCreationAttributes>
    implements prevalenceCountryAttributes
{
    public id!: bigint;
    public prevalence_id!: bigint;
    public country_id!: bigint;
    public state_id!: bigint;
    public start_year!: number;
    public end_year!: number;

    public meta!: string;
    public status!: string;

    public readonly created_at!: Date;
    public readonly updated_at!: Date;
    public deleted_at!: Date;
}

PrevalenceCountry.init(
    {
        id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: DataTypes.BIGINT,
        },

        prevalence_id: {
            allowNull: false,
            type: DataTypes.BIGINT,
            onUpdate: "CASCADE",
            onDelete: "CASCADE",
            references: {
                model: {
                    tableName: "prevalences",
                },
                key: "id",
            },
        },

        country_id: {
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

        state_id: {
            allowNull: true,
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

        start_year: {
            allowNull: true,
            type: DataTypes.SMALLINT,
        },

        end_year: {
            allowNull: true,
            type: DataTypes.SMALLINT,
        },

        meta: {
            allowNull: false,
            type: DataTypes.JSONB,
        },

        status: {
            allowNull: false,
            type: DataTypes.STRING(50),
            defaultValue: "active",
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
        tableName: "prevalence_countries",
        sequelize,
        underscored: true,
        paranoid: true,
        createdAt: "created_at",
        updatedAt: "updated_at",
        deletedAt: "deleted_at",
    }
);

PrevalenceCountry.belongsTo(Country, { as: "country", foreignKey: "country_id" });
PrevalenceCountry.belongsTo(State, { as: "state", foreignKey: "state_id" });
