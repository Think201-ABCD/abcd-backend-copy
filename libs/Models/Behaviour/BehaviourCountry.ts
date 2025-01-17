import { DataTypes, Model, Optional } from "sequelize";

// Connection
import { sequelize } from "../../Loaders/database";

// Models

interface behaviourCountryAttributes {
    id?: bigint;
    behaviour_id?: bigint;
    country_id?: bigint;
    brief?: string | null;
    description?: string | null;
    banner?: string | null;

    created_at?: Date;
    updated_at?: Date;
    deleted_at?: Date;
}

export type behaviourCountryCreationAttributes = Optional<behaviourCountryAttributes, "id">;

export class BehaviourCountry
    extends Model<behaviourCountryAttributes, behaviourCountryCreationAttributes>
    implements behaviourCountryAttributes
{
    public id!: bigint;
    public behaviour_id!: bigint;
    public country_id!: bigint;
    public brief!: string | null;
    public description!: string | null;
    public banner!: string | null;

    public readonly created_at!: Date;
    public readonly updated_at!: Date;
    public deleted_at!: Date;
}

BehaviourCountry.init(
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
        tableName: "behaviour_countries",
        sequelize,
        underscored: true,
        createdAt: "created_at",
        updatedAt: "updated_at",
        deletedAt: "deleted_at",
    }
);
