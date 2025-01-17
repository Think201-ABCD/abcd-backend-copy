import { DataTypes, Model, Optional } from "sequelize";

// Connection
import { sequelize } from "../../Loaders/database";

// Models

interface behaviourStateAttributes {
    id?: bigint;
    behaviour_id?: bigint;
    country_id?: bigint;
    state_id?: bigint;
    description?: string | null;
    brief?: string | null;
    banner?: string | null;
    prevalence?: string | null;

    created_at?: Date;
    updated_at?: Date;
    deleted_at?: Date;
}

export type behaviourStateCreationAttributes = Optional<behaviourStateAttributes, "id">;

export class BehaviourState
    extends Model<behaviourStateAttributes, behaviourStateCreationAttributes>
    implements behaviourStateAttributes
{
    public id!: bigint;
    public behaviour_id!: bigint;
    public country_id!: bigint;
    public state_id!: bigint;
    public description!: string | null;
    public brief!: string | null;
    public banner!: string | null;
    public prevalence!: string | null;

    public readonly created_at!: Date;
    public readonly updated_at!: Date;
    public deleted_at!: Date;
}

BehaviourState.init(
    {
        id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: DataTypes.BIGINT,
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

        country_id: {
            allowNull: false,
            type: DataTypes.BIGINT,
            onUpdate: "CASCADE",
            onDelete: "CASCADE",
            references: {
                model: "countries",
                key: "id",
            },
        },

        state_id: {
            allowNull: false,
            type: DataTypes.BIGINT,
            onUpdate: "CASCADE",
            onDelete: "CASCADE",
            references: {
                model: "states",
                key: "id",
            },
        },

        brief: {
            allowNull: true,
            type: DataTypes.STRING,
        },

        description: {
            allowNull: true,
            type: DataTypes.TEXT,
        },

        banner: {
            allowNull: true,
            type: DataTypes.STRING,
            get() {
                return this.getDataValue("banner")
                    ? `${process.env.AWS_BASE_URL}` + `${this.getDataValue("banner")}`
                    : null;
            },
        },

        prevalence: {
            allowNull: true,
            type: DataTypes.JSON,
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
        tableName: "behaviour_states",
        sequelize,
        underscored: true,
        createdAt: "created_at",
        updatedAt: "updated_at",
        deletedAt: "deleted_at",
    }
);
