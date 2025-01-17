import { DataTypes, Model, Optional } from "sequelize";

// Connection
import { sequelize } from "../../Loaders/database";

// Models

interface collateralStateAttributes {
    id?: bigint;
    collateral_id?: bigint;
    country_id?: bigint;
    state_id?: bigint;
    brief?: string | null;
    description?: string | null;

    created_at?: Date;
    updated_at?: Date;
    deleted_at?: Date;
}

export type collateralStateCreationAttributes = Optional<collateralStateAttributes, "id">;

export class CollateralState
    extends Model<collateralStateAttributes, collateralStateCreationAttributes>
    implements collateralStateAttributes
{
    public id!: bigint;
    public collateral_id!: bigint;
    public country_id!: bigint;
    public state_id!: bigint;
    public brief!: string | null;
    public description!: string | null;

    public readonly created_at!: Date;
    public readonly updated_at!: Date;
    public deleted_at!: Date;
}

CollateralState.init(
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

        state_id: {
            allowNull: false,
            type: DataTypes.BIGINT,
            onUpdate: "CASCADE",
            onDelete: "CASCADE",
            references: {
                model: "states",
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
        tableName: "collateral_states",
        sequelize,
        underscored: true,
        createdAt: "created_at",
        updatedAt: "updated_at",
        deletedAt: "deleted_at",
    }
);
