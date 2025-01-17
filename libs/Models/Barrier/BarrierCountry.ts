import { DataTypes, Model, Optional } from "sequelize";

// Connection
import { sequelize } from "../../Loaders/database";

// Models

interface barrierCountryAttributes {
    id?: bigint;
    barrier_id?: bigint;
    country_id?: bigint;
    brief?: string | null;
    description?: string | null;
    banner?: string | null;

    created_at?: Date;
    updated_at?: Date;
    deleted_at?: Date;
}

export type barrierCountryCreationAttributes = Optional<barrierCountryAttributes, "id">;

export class BarrierCountry
    extends Model<barrierCountryAttributes, barrierCountryCreationAttributes>
    implements barrierCountryAttributes
{
    public id!: bigint;
    public barrier_id!: bigint;
    public country_id!: bigint;
    public brief!: string | null;
    public description!: string | null;
    public banner!: string | null;

    public readonly created_at!: Date;
    public readonly updated_at!: Date;
    public deleted_at!: Date;
}

BarrierCountry.init(
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

        brief: {
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
        tableName: "barrier_countries",
        sequelize,
        underscored: true,
        createdAt: "created_at",
        updatedAt: "updated_at",
        deletedAt: "deleted_at",
    }
);
