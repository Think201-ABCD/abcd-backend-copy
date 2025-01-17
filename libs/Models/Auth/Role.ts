import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../Loaders/database";

interface roleAttributes {
    id?: bigint;
    slug?: string;
    name?: string;

    created_at?: Date;
    updated_at?: Date;
    deleted_at?: Date;
}

type roleCreationAttributes = Optional<roleAttributes, "id">;

export class Role extends Model<roleAttributes, roleCreationAttributes> implements roleAttributes {
    public id!: bigint;
    public slug!: string;
    public name!: string;

    public readonly created_at!: Date;
    public readonly updated_at!: Date;
    public deleted_at!: Date;
}

Role.init(
    {
        id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: DataTypes.BIGINT,
        },

        name: {
            allowNull: false,
            type: DataTypes.CHAR(50),
        },

        slug: {
            allowNull: false,
            type: DataTypes.CHAR(50),
            unique: {
                name: "slug",
                msg: "Slug should be unique",
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
        tableName: "roles",
        sequelize,
        underscored: true,
        paranoid: true,
        createdAt: "created_at",
        updatedAt: "updated_at",
        deletedAt: "deleted_at",
    }
);
