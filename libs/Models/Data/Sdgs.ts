import { DataTypes, Model, Optional } from "sequelize";

// Connection
import { sequelize } from "../../Loaders/database";

// Models

interface sdgsAttributes {
    id?: bigint;
    uuid?: string;
    name?: string;
    image?: string;

    created_at?: Date;
    updated_at?: Date;
    deleted_at?: Date;
}

export type sdgsCreationAttributes = Optional<sdgsAttributes, "id">;

export class Sdgs extends Model<sdgsAttributes, sdgsCreationAttributes> implements sdgsAttributes {
    public id!: bigint;
    public uuid!: string;
    public name!: string;
    public image!: string;

    public readonly created_at!: Date;
    public readonly updated_at!: Date;
    public deleted_at!: Date;
}

Sdgs.init(
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

        image: {
            allowNull: false,
            type: DataTypes.STRING,
            get() {
                return `${process.env.AWS_BASE_URL}` + `${this.getDataValue("image")}`;
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
        tableName: "sdgs",
        sequelize,
        underscored: true,
        paranoid: true,
        createdAt: "created_at",
        updatedAt: "updated_at",
        deletedAt: "deleted_at",
    }
);
