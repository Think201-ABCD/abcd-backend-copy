import { DataTypes, Model, Optional } from "sequelize";

// Connection
import { sequelize } from "../../Loaders/database";
import { Barrier } from "../Barrier/Barrier";
import { Solution } from "../Solution/Solution";

// Models

interface BehaviourJourneyStageAttributes {
    id?: bigint;
    behaviour_journey_id?: bigint | null;
    title?: string;
    description?: string;
    banner?: string;
    sequence?: number;

    created_at?: Date;
    updated_at?: Date;
}

export type BehaviourJourneyStageCreationAttributes = Optional<BehaviourJourneyStageAttributes, "id">;

export class BehaviourJourneyStage
    extends Model<BehaviourJourneyStageAttributes, BehaviourJourneyStageCreationAttributes>
    implements BehaviourJourneyStageAttributes
{
    public id!: bigint;
    public behaviour_journey_id!: bigint | null;
    public title!: string;
    public description!: string;
    public banner!: string;
    public sequence!: number;

    public readonly created_at!: Date;
    public readonly updated_at!: Date;
}

BehaviourJourneyStage.init(
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

        title: {
            allowNull: true,
            type: DataTypes.STRING,
        },

        description: {
            allowNull: true,
            type: DataTypes.STRING,
        },

        banner: {
            allowNull: true,
            type: DataTypes.STRING,
            get() {
                return `${process.env.AWS_BASE_URL}` + `${this.getDataValue("banner")}`;
            },
        },

        sequence: {
            allowNull: false,
            type: DataTypes.INTEGER,
            defaultValue: 1,
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
        tableName: "behaviour_journey_stages",
        sequelize,
        underscored: true,
        createdAt: "created_at",
        updatedAt: "updated_at",
    }
);

BehaviourJourneyStage.belongsToMany(Barrier, { as: "barriers", through: "behaviour_journey_barriers" });

BehaviourJourneyStage.belongsToMany(Solution, { as: "solutions", through: "behaviour_journey_solutions" });
