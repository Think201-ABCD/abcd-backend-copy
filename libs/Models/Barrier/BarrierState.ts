import { DataTypes, Model, Optional } from "sequelize";

// Connection
import { sequelize } from "../../Loaders/database";

// Models

interface barrierStateAttributes {
    id?: bigint;
    barrier_id?: bigint;
    country_id?: bigint;
    state_id?: bigint;
    brief?: string | null;
    description?: string | null;
    banner?: string | null;

    created_at?: Date;
    updated_at?: Date;
    deleted_at?: Date;
}

export type barrierStateCreationAttributes = Optional<barrierStateAttributes, "id">;

export class BarrierState
    extends Model<barrierStateAttributes, barrierStateCreationAttributes>
    implements barrierStateAttributes
{
    public id!: bigint;
    public barrier_id!: bigint;
    public country_id!: bigint;
    public state_id!: bigint;
    public brief!: string | null;
    public description!: string | null;
    public banner!: string | null;

    public readonly created_at!: Date;
    public readonly updated_at!: Date;
    public deleted_at!: Date;
}

BarrierState.init(
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
        tableName: "barrier_states",
        sequelize,
        underscored: true,
        createdAt: "created_at",
        updatedAt: "updated_at",
        deletedAt: "deleted_at",
    }
);
