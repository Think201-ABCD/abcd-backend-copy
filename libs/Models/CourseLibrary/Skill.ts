import { DataTypes, Model, Optional } from "sequelize";

// Connection
import { sequelize } from "../../Loaders/database";

// Models

interface skillAttributes {
    id?: bigint;
    name?: string;
    status?: string;

    created_at?: Date;
    updated_at?: Date;
    deleted_at?: Date;
}

export type skillCreationAttributes = Optional<skillAttributes, "id">;

export class Skill extends Model<skillAttributes, skillCreationAttributes> implements skillAttributes {
    public id!: bigint;
    public name!: string;
    public status!: string;

    public readonly created_at!: Date;
    public readonly updated_at!: Date;
    public deleted_at!: Date;
}

Skill.init(
    {
        id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: DataTypes.BIGINT,
        },

        name: {
            allowNull: false,
            type: DataTypes.STRING,
        },

        status: {
            allowNull: false,
            type: DataTypes.STRING(50),
        },
    },
    {
        tableName: "skills",
        sequelize,
        underscored: true,
        paranoid: true,
        createdAt: "created_at",
        updatedAt: "updated_at",
        deletedAt: "deleted_at",
    }
);
