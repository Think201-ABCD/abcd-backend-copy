import { DataTypes, Model, Optional } from "sequelize";

// Connection
import { sequelize } from "../../Loaders/database";

// Models

interface collateralSolutionAttributes {
    id?: bigint;
    collateral_id?: bigint;
    solution_id?: bigint;

    created_at?: Date;
    updated_at?: Date;
}

export type collateralSolutionCreationAttributes = Optional<collateralSolutionAttributes, "id">;

export class CollateralSolution
    extends Model<collateralSolutionAttributes, collateralSolutionCreationAttributes>
    implements collateralSolutionAttributes
{
    public id!: bigint;
    public collateral_id!: bigint;
    public solution_id!: bigint;

    public readonly created_at!: Date;
    public readonly updated_at!: Date;
}

CollateralSolution.init(
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

        solution_id: {
            allowNull: false,
            type: DataTypes.BIGINT,
            onUpdate: "CASCADE",
            onDelete: "CASCADE",
            references: {
                model: "solutions",
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
        tableName: "collateral_solutions",
        sequelize,
        underscored: true,
        createdAt: "created_at",
        updatedAt: "updated_at",
    }
);
