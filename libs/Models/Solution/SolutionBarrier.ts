import { DataTypes, Model, Optional } from "sequelize";

// Connection
import { sequelize } from "../../Loaders/database";

// Models

interface solutionBarrierAttributes {
    id?: bigint;
    solution_id?: bigint | null;
    barrier_id?: bigint;

    created_at?: Date;
    updated_at?: Date;
}

export type solutionBarrierCreationAttributes = Optional<solutionBarrierAttributes, "id">;

export class SolutionBarrier
    extends Model<solutionBarrierAttributes, solutionBarrierCreationAttributes>
    implements solutionBarrierAttributes
{
    public id!: bigint;
    public solution_id!: bigint | null;
    public barrier_id!: bigint;

    public readonly created_at!: Date;
    public readonly updated_at!: Date;
}

SolutionBarrier.init(
    {
        id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: DataTypes.BIGINT,
        },

        solution_id: {
            allowNull: false,
            type: DataTypes.BIGINT,
            onUpdate: "CASCADE",
            onDelete: "CASCADE",
            references: {
                model: {
                    tableName: "solutions",
                },
                key: "id",
            },
        },

        barrier_id: {
            allowNull: true,
            type: DataTypes.BIGINT,
            onUpdate: "CASCADE",
            onDelete: "CASCADE",
            references: {
                model: {
                    tableName: "barriers",
                },
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
        tableName: "solutions_barriers",
        sequelize,
        underscored: true,
        createdAt: "created_at",
        updatedAt: "updated_at",
    }
);
