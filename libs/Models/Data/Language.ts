import { DataTypes, Model, Optional } from "sequelize";

// Connection
import { sequelize } from "../../Loaders/database";

// Models

interface languagesAttributes {
    id?: bigint;
    country_id?: bigint;
    name?: string;
    status?: string;
}

export type languagesCreationAttributes = Optional<languagesAttributes, "id">;

export class Language extends Model<languagesAttributes, languagesCreationAttributes> implements languagesAttributes {
    public id!: bigint;
    public country_id!: bigint;
    public name!: string;
    public status!: string;
}

Language.init(
    {
        id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: DataTypes.BIGINT,
        },

        country_id: {
            allowNull: false,
            onUpdate: "CASCADE",
            onDelete: "CASCADE",
            type: DataTypes.BIGINT,
            references: {
                model: "countries",
                key: "id",
            },
        },

        name: {
            allowNull: false,
            type: DataTypes.STRING(50),
        },

        status: {
            allowNull: false,
            type: DataTypes.STRING(50),
        },
    },
    {
        tableName: "languages",
        sequelize,
        underscored: true,
        paranoid: true,
        timestamps: false,
    }
);
