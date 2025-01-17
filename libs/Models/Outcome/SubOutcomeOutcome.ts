import { DataTypes, Model, Optional } from "sequelize";

// Connection
import { sequelize } from "../../Loaders/database";

// Models

interface subOutcomeOutcomesAttributes {
    id?: bigint;
    outcome_id?: bigint;
    sub_outcome_id?: bigint;
}

export type subOutcomeOutcomesCreationAttributes = Optional<subOutcomeOutcomesAttributes, "id">;

export class SubOutcomeOutcome
    extends Model<subOutcomeOutcomesAttributes, subOutcomeOutcomesCreationAttributes>
    implements subOutcomeOutcomesAttributes
{
    public id!: bigint;
    public outcome_id!: bigint;
    public sub_outcome_id!: bigint;
}

SubOutcomeOutcome.init(
    {
        id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: DataTypes.BIGINT,
        },

        outcome_id: {
            allowNull: false,
            type: DataTypes.BIGINT,
            onUpdate: "CASCADE",
            onDelete: "CASCADE",
            references: {
                model: "outcomes",
                key: "id",
            },
        },

        sub_outcome_id: {
            allowNull: false,
            type: DataTypes.BIGINT,
            onUpdate: "CASCADE",
            onDelete: "CASCADE",
            references: {
                model: "sub_outcomes",
                key: "id",
            },
        },
    },
    {
        tableName: "sub_outcome_outcomes",
        sequelize,
        underscored: true,
        createdAt: "created_at",
        updatedAt: "updated_at",
    }
);
