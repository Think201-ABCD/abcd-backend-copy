import { DataTypes, Model, Optional } from "sequelize";

// Connection
import { sequelize } from "../../Loaders/database";

// Models

interface BehaviourJourneyBarrierAttributes {
    id?: bigint;
    behaviour_journey_id?: bigint | null;
    behaviour_journey_stage_id?: bigint | null;
    barrier_id?: bigint | null;

    created_at?: Date;
    updated_at?: Date;
}

export type BehaviourJourneyBarrierCreationAttributes = Optional<BehaviourJourneyBarrierAttributes, "id">;

export class BehaviourJourneyBarrier
    extends Model<BehaviourJourneyBarrierAttributes, BehaviourJourneyBarrierCreationAttributes>
    implements BehaviourJourneyBarrierAttributes
{
    public id!: bigint;
    public behaviour_journey_id!: bigint | null;
    public behaviour_journey_stage_id!: bigint | null;
    public barrier_id!: bigint | null;

    public readonly created_at!: Date;
    public readonly updated_at!: Date;
}

BehaviourJourneyBarrier.init(
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

        barrier_id: {
            allowNull: false,
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
        tableName: "behaviour_journey_barriers",
        sequelize,
        underscored: true,
        createdAt: "created_at",
        updatedAt: "updated_at",
    }
);
