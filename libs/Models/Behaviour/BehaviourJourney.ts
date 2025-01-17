import { DataTypes, Model, Optional } from "sequelize";

// Connection
import { sequelize } from "../../Loaders/database";

// Models
import { User } from "../Auth/User";
import { Country } from "../Data/Country";
import { State } from "../Data/State";
import { Behaviour } from "./Behaviour";
import { BehaviourJourneyStage } from "./BehaviourJourneyStage";

interface BehaviourJourneyAttributes {
    id?: bigint;
    added_by?: bigint;
    uuid?: string;
    behaviour_id?: bigint | null;
    country_id?: bigint | null;
    state_id?: bigint | null;
    title?: string;
    description?: string;
    banner?: string;
    stages?: number;
    status?: string;

    created_at?: Date;
    updated_at?: Date;
    deleted_at?: Date;
}

export type BehaviourJourneyCreationAttributes = Optional<BehaviourJourneyAttributes, "id">;

export class BehaviourJourney
    extends Model<BehaviourJourneyAttributes, BehaviourJourneyCreationAttributes>
    implements BehaviourJourneyAttributes
{
    public id!: bigint;
    public added_by!: bigint;
    public uuid!: string;
    public behaviour_id!: bigint | null;
    public country_id!: bigint | null;
    public state_id!: bigint | null;
    public title!: string;
    public description!: string;
    public banner!: string;
    public stages!: number;
    public status!: string;

    public readonly created_at!: Date;
    public readonly updated_at!: Date;
    public deleted_at!: Date;
}

BehaviourJourney.init(
    {
        id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: DataTypes.BIGINT,
        },

        uuid: {
            allowNull: false,
            type: DataTypes.UUID,
        },

        added_by: {
            allowNull: false,
            type: DataTypes.BIGINT,
            onUpdate: "CASCADE",
            onDelete: "CASCADE",
            references: {
                model: {
                    tableName: "users",
                },
                key: "id",
            },
        },

        behaviour_id: {
            allowNull: false,
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

        country_id: {
            allowNull: false,
            type: DataTypes.BIGINT,
            onUpdate: "CASCADE",
            onDelete: "CASCADE",
            references: {
                model: {
                    tableName: "countries",
                },
                key: "id",
            },
        },

        state_id: {
            allowNull: true,
            type: DataTypes.BIGINT,
            onUpdate: "CASCADE",
            onDelete: "CASCADE",
            references: {
                model: {
                    tableName: "states",
                },
                key: "id",
            },
        },

        title: {
            allowNull: false,
            type: DataTypes.STRING,
        },

        description: {
            allowNull: true,
            type: DataTypes.TEXT,
        },

        banner: {
            allowNull: false,
            type: DataTypes.STRING,
            get() {
                return `${process.env.AWS_BASE_URL}` + `${this.getDataValue("banner")}`;
            },
        },

        stages: {
            allowNull: false,
            type: DataTypes.INTEGER,
            defaultValue: 1,
        },

        status: {
            allowNull: false,
            type: DataTypes.STRING(50),
            defaultValue: "draft",
        },

        created_at: {
            allowNull: false,
            type: DataTypes.DATE,
        },

        updated_at: {
            allowNull: false,
            type: DataTypes.DATE,
        },

        deleted_at: {
            allowNull: true,
            type: DataTypes.DATE,
        },
    },
    {
        tableName: "behaviour_journeys",
        sequelize,
        underscored: true,
        paranoid: true,
        createdAt: "created_at",
        updatedAt: "updated_at",
        deletedAt: "deleted_at",
    }
);

// Country and State
BehaviourJourney.belongsTo(Country, { as: "country", foreignKey: "country_id" });
BehaviourJourney.belongsTo(State, { as: "state", foreignKey: "state_id" });

BehaviourJourney.belongsTo(User, { as: "created_by", foreignKey: "added_by" });
BehaviourJourney.belongsTo(Behaviour, { as: "behaviour", foreignKey: "behaviour_id" });

// Stages
BehaviourJourney.hasMany(BehaviourJourneyStage, { as: "behaviour_journey_stages", foreignKey: "behaviour_journey_id" });
