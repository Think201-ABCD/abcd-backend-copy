import { DataTypes, Model, Optional } from "sequelize";

// Connection
import { sequelize } from "../../Loaders/database";

// Models

interface solutionBehaviourAttributes {
    id?: bigint;
    solution_id?: bigint | null;
    behaviour_id?: bigint;

    created_at?: Date;
    updated_at?: Date;
}

export type solutionBehaviourCreationAttributes = Optional<solutionBehaviourAttributes, "id">;

export class SolutionBehaviour
    extends Model<solutionBehaviourAttributes, solutionBehaviourCreationAttributes>
    implements solutionBehaviourAttributes
{
    public id!: bigint;
    public solution_id!: bigint | null;
    public behaviour_id!: bigint;

    public readonly created_at!: Date;
    public readonly updated_at!: Date;
}

SolutionBehaviour.init(
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

        behaviour_id: {
            allowNull: true,
            type: DataTypes.BIGINT,
            onUpdate: "CASCADE",
            onDelete: "CASCADE",
            references: {
                model: {
                    tableName: "behaviours",
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
        tableName: "solution_behaviours",
        sequelize,
        underscored: true,
        createdAt: "created_at",
        updatedAt: "updated_at",
    }
);
