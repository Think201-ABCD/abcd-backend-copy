import { DataTypes, Model, Optional } from "sequelize";

// Connection
import { sequelize } from "../../Loaders/database";

// Models

interface barrierOutcomeAttributes {
    id?: bigint;
    barrier_id?: bigint;
    outcome_id?: bigint | null;
    sub_outcome_id?: bigint | null;

    created_at?: Date;
    updated_at?: Date;
}

export type barrierOutcomeCreationAttributes = Optional<barrierOutcomeAttributes, "id">;

export class BarrierOutcome
    extends Model<barrierOutcomeAttributes, barrierOutcomeCreationAttributes>
    implements barrierOutcomeAttributes
{
    public id!: bigint;
    public barrier_id!: bigint;
    public outcome_id!: bigint | null;
    public sub_outcome_id!: bigint | null;

    public readonly created_at!: Date;
    public readonly updated_at!: Date;
}

BarrierOutcome.init(
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
            type: DataTypes.BIGINT,
            onUpdate: "CASCADE",
            onDelete: "CASCADE",
            references: {
                model: "sub_outcomes",
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
        tableName: "barrier_outcomes",
        sequelize,
        underscored: true,
        createdAt: "created_at",
        updatedAt: "updated_at",
    }
);
