import { DataTypes, Model, Optional } from "sequelize";

// Connection
import { sequelize } from "../../Loaders/database";

// Models

interface collateralBarrierAttributes {
    id?: bigint;
    collateral_id?: bigint;
    barrier_id?: bigint;

    created_at?: Date;
    updated_at?: Date;
}

export type collateralBarrierCreationAttributes = Optional<collateralBarrierAttributes, "id">;

export class CollateralBarrier
    extends Model<collateralBarrierAttributes, collateralBarrierCreationAttributes>
    implements collateralBarrierAttributes
{
    public id!: bigint;
    public collateral_id!: bigint;
    public barrier_id!: bigint;

    public readonly created_at!: Date;
    public readonly updated_at!: Date;
}

CollateralBarrier.init(
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

        barrier_id: {
            allowNull: false,
            type: DataTypes.BIGINT,
            onUpdate: "CASCADE",
            onDelete: "CASCADE",
            references: {
                model: "barriers",
                key: "id",
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
    },
    {
        tableName: "collateral_barriers",
        sequelize,
        underscored: true,
        createdAt: "created_at",
        updatedAt: "updated_at",
    }
);
