import { DataTypes, Model, Optional } from "sequelize";

// Connection
import { sequelize } from "../../Loaders/database";

// Models

interface barrierBehaviourAttributes {
    id?: bigint;
    barrier_id?: bigint;
    behaviour_id?: bigint | null;

    created_at?: Date;
    updated_at?: Date;
}

export type barrierBehaviourCreationAttributes = Optional<barrierBehaviourAttributes, "id">;

export class BarrierBehaviour
    extends Model<barrierBehaviourAttributes, barrierBehaviourCreationAttributes>
    implements barrierBehaviourAttributes
{
    public id!: bigint;
    public barrier_id!: bigint;
    public behaviour_id!: bigint | null;

    public readonly created_at!: Date;
    public readonly updated_at!: Date;
}

BarrierBehaviour.init(
    {
        id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: DataTypes.BIGINT,
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

        behaviour_id: {
            allowNull: true,
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
        tableName: "barrier_behaviours",
        sequelize,
        underscored: true,
        createdAt: "created_at",
        updatedAt: "updated_at",
    }
);
