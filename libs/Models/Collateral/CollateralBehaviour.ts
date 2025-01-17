import { DataTypes, Model, Optional } from "sequelize";

// Connection
import { sequelize } from "../../Loaders/database";

// Models

interface collateralBehaviourAttributes {
    id?: bigint;
    collateral_id?: bigint;
    behaviour_id?: bigint;

    created_at?: Date;
    updated_at?: Date;
}

export type collateralBehaviourCreationAttributes = Optional<collateralBehaviourAttributes, "id">;

export class CollateralBehaviour
    extends Model<collateralBehaviourAttributes, collateralBehaviourCreationAttributes>
    implements collateralBehaviourAttributes
{
    public id!: bigint;
    public collateral_id!: bigint;
    public behaviour_id!: bigint;

    public readonly created_at!: Date;
    public readonly updated_at!: Date;
}

CollateralBehaviour.init(
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

        behaviour_id: {
            allowNull: false,
            type: DataTypes.BIGINT,
            onUpdate: "CASCADE",
            onDelete: "CASCADE",
            references: {
                model: "behaviours",
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
        tableName: "collateral_behaviours",
        sequelize,
        underscored: true,
        createdAt: "created_at",
        updatedAt: "updated_at",
    }
);
