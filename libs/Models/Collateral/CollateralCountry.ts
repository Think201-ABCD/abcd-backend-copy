import { DataTypes, Model, Optional } from "sequelize";

// Connection
import { sequelize } from "../../Loaders/database";

// Models

interface collateralCountryAttributes {
    id?: bigint;
    collateral_id?: bigint;
    country_id?: bigint;
    brief?: string | null;
    description?: string | null;

    created_at?: Date;
    updated_at?: Date;
    deleted_at?: Date;
}

export type collateralCountryCreationAttributes = Optional<collateralCountryAttributes, "id">;

export class CollateralCountry
    extends Model<collateralCountryAttributes, collateralCountryCreationAttributes>
    implements collateralCountryAttributes
{
    public id!: bigint;
    public collateral_id!: bigint;
    public country_id!: bigint;
    public brief!: string | null;
    public description!: string | null;

    public readonly created_at!: Date;
    public readonly updated_at!: Date;
    public deleted_at!: Date;
}

CollateralCountry.init(
    {
        id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: DataTypes.BIGINT,
        },

        collateral_id: {
            allowNull: false,
            type: DataTypes.BIGINT,
            onUpdate: "CASCADE",
            onDelete: "CASCADE",
            references: {
                model: "collaterals",
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
            type: DataTypes.STRING,
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
        tableName: "collateral_countries",
        sequelize,
        underscored: true,
        createdAt: "created_at",
        updatedAt: "updated_at",
        deletedAt: "deleted_at",
    }
);
