import { DataTypes, Model, Optional } from "sequelize";

// Connection
import { sequelize } from "../../Loaders/database";

// Models

interface expertCategoryAttributes {
    id?: bigint;
    parent_id?: bigint | null;
    name?: string;

    created_at?: Date;
    updated_at?: Date;
    deleted_at?: Date;
}

export type expertCategoryCreationAttributes = Optional<expertCategoryAttributes, "id">;

export class ExpertCategory
    extends Model<expertCategoryAttributes, expertCategoryCreationAttributes>
    implements expertCategoryAttributes
{
    public id!: bigint;
    public parent_id!: bigint | null;
    public name!: string;

    public readonly created_at!: Date;
    public readonly updated_at!: Date;
    public deleted_at!: Date;
}

ExpertCategory.init(
    {
        id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: DataTypes.BIGINT,
        },

        parent_id: {
            allowNull: true,
            type: DataTypes.BIGINT,
            onUpdate: "CASCADE",
            onDelete: "CASCADE",
            references: {
                model: "expert_categories",
                key: "id",
            },
        },

        name: {
            allowNull: false,
            type: DataTypes.STRING,
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
        tableName: "expert_categories",
        sequelize,
        underscored: true,
        paranoid: true,
        createdAt: "created_at",
        updatedAt: "updated_at",
        deletedAt: "deleted_at",
    }
);
