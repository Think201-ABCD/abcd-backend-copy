import { DataTypes, Model, Optional } from "sequelize";

// Connection
import { sequelize } from "../../Loaders/database";

// Models

interface statesAttributes {
    id?: bigint;
    country_id?: bigint;
    name?: string;
    code?: string | null;
    status?: string;
}

export type statesCreationAttributes = Optional<statesAttributes, "id">;

export class State extends Model<statesAttributes, statesCreationAttributes> implements statesAttributes {
    public id!: bigint;
    public country_id!: bigint;
    public name!: string;
    public code!: string | null;
    public status!: string;
}

State.init(
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

        code: {
            allowNull: true,
            type: DataTypes.STRING(10),
        },

        status: {
            allowNull: false,
            type: DataTypes.STRING(50),
        },
    },
    {
        tableName: "states",
        sequelize,
        underscored: true,
        paranoid: true,
        timestamps: false,
    }
);
