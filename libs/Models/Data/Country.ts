import { DataTypes, Model, Optional } from "sequelize";

// Connection
import { sequelize } from "../../Loaders/database";

// Models

interface countriesAttributes {
    id?: bigint;
    name?: string;
    code?: string | null;
    phone_code?: string | null;
    currency?: string | null;
    status?: string;
}

export type countriesCreationAttributes = Optional<countriesAttributes, "id">;

export class Country extends Model<countriesAttributes, countriesCreationAttributes> implements countriesAttributes {
    public id!: bigint;
    public name!: string;
    public code!: string | null;
    public phone_code!: string | null;
    public currency!: string | null;
    public status!: string;
}

Country.init(
    {
        id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: DataTypes.BIGINT,
        },

        name: {
            allowNull: false,
            type: DataTypes.STRING(50),
        },

        code: {
            allowNull: true,
            type: DataTypes.STRING(10),
        },

        phone_code: {
            allowNull: true,
            type: DataTypes.STRING(50),
        },

        currency: {
            allowNull: true,
            type: DataTypes.STRING(50),
        },

        status: {
            allowNull: false,
            type: DataTypes.STRING(50),
        },
    },
    {
        tableName: "countries",
        sequelize,
        underscored: true,
        paranoid: true,
        timestamps: false,
    }
);
