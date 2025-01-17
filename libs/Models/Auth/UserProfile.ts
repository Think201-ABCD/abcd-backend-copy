import { DataTypes, Model, Optional } from "sequelize";

// Connection
import { sequelize } from "../../Loaders/database";
import { Country } from "../Data/Country";
import { State } from "../Data/State";

interface userProfileAttributes {
    id?: bigint;
    user_id?: bigint;
    country_id?: bigint;
    state_id?: bigint;
    type?: string;
    company?: string;
    designation?: string;
    status?: string;

    created_at?: Date;
    updated_at?: Date;
    deleted_at?: Date;
}

export type userProfileCreationAttributes = Optional<userProfileAttributes, "id">;

export class UserProfile
    extends Model<userProfileAttributes, userProfileCreationAttributes>
    implements userProfileAttributes
{
    public id!: bigint;
    public user_id!: bigint;
    public country_id!: bigint;
    public state_id!: bigint;
    public type!: string;
    public company!: string;
    public designation!: string;
    public status!: string;

    public readonly created_at!: Date;
    public readonly updated_at!: Date;
    public deleted_at!: Date;
}

UserProfile.init(
    {
        id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: DataTypes.BIGINT,
        },

        user_id: {
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

        country_id: {
            allowNull: true,
            type: DataTypes.BIGINT,
            references: {
                model: "countries",
                key: "id",
            },
            onUpdate: "CASCADE",
            onDelete: "CASCADE",
        },

        state_id: {
            allowNull: true,
            type: DataTypes.BIGINT,
            references: {
                model: "states",
                key: "id",
            },
            onUpdate: "CASCADE",
            onDelete: "CASCADE",
        },

        type: {
            allowNull: true,
            type: DataTypes.STRING(100),
        },

        company: {
            allowNull: true,
            type: DataTypes.STRING
        },

        designation: {
            allowNull: true,
            type: DataTypes.STRING,
        },

        status: {
            allowNull: false,
            defaultValue: "active",
            type: DataTypes.STRING(50),
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
        tableName: "user_profiles",
        sequelize,
        underscored: true,
        paranoid: true,
        createdAt: "created_at",
        updatedAt: "updated_at",
        deletedAt: "deleted_at",
    }
);

UserProfile.belongsTo(Country, { as: "countries", foreignKey: "country_id" });
UserProfile.belongsTo(State, { as: "states", foreignKey: "state_id" });
