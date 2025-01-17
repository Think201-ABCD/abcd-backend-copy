import { DataTypes, Model, Optional } from "sequelize";

// Connection
import { sequelize } from "../../Loaders/database";

// Models

interface BehaviourJourneySolutionAttributes {
    id?: bigint;
    behaviour_journey_id?: bigint | null;
    behaviour_journey_stage_id?: bigint | null;
    solution_id?: bigint | null;

    created_at?: Date;
    updated_at?: Date;
}

export type BehaviourJourneySolutionCreationAttributes = Optional<BehaviourJourneySolutionAttributes, "id">;

export class BehaviourJourneySolution
    extends Model<BehaviourJourneySolutionAttributes, BehaviourJourneySolutionCreationAttributes>
    implements BehaviourJourneySolutionAttributes
{
    public id!: bigint;
    public behaviour_journey_id!: bigint | null;
    public behaviour_journey_stage_id!: bigint | null;
    public solution_id!: bigint | null;

    public readonly created_at!: Date;
    public readonly updated_at!: Date;
}

BehaviourJourneySolution.init(
    {
        id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: DataTypes.BIGINT,
        },

        behaviour_journey_id: {
            allowNull: false,
            type: DataTypes.BIGINT,
            onUpdate: "CASCADE",
            onDelete: "CASCADE",
            references: {
                model: {
                    tableName: "behaviour_journeys",
                },
                key: "id",
            },
        },

        behaviour_journey_stage_id: {
            allowNull: false,
            type: DataTypes.BIGINT,
            onUpdate: "CASCADE",
            onDelete: "CASCADE",
            references: {
                model: {
                    tableName: "behaviour_journey_stages",
                },
                key: "id",
            },
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
        tableName: "behaviour_journey_solutions",
        sequelize,
        underscored: true,
        createdAt: "created_at",
        updatedAt: "updated_at",
    }
);
