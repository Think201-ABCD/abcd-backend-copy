import { DataTypes, Model, Optional } from "sequelize";
import { v4 as uuidv4 } from "uuid";

// Connection
import { sequelize } from "../../Loaders/database";

interface BundleAttributes {
    id?: bigint;
    uuid?: string;
    name?: string | null;
    description?: string | null;
    banner?: string | null;

    created_at?: Date;
    updated_at?: Date;
    deleted_at?: Date;
}

export type BundleCreationAttributes = Optional<BundleAttributes, "id">;

export class Bundle extends Model<BundleAttributes, BundleCreationAttributes> implements BundleAttributes {
    public id!: bigint;
    public uuid!: string;
    public name!: string;
    public description!: string | null;
    public banner!: string | null;

    public readonly created_at!: Date;
    public readonly updated_at!: Date;
    public deleted_at!: Date;
}

Bundle.init(
    {
        id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: DataTypes.BIGINT,
        },

        uuid: {
            allowNull: false,
            type: DataTypes.UUID,
        },

        name: {
            allowNull: false,
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
                return this.getDataValue("banner") ? `${process.env.AWS_BASE_URL}${this.getDataValue("banner")}` : null;
            },
        },
    },
    {
        tableName: "bundles",
        sequelize,
        underscored: true,
        paranoid: true,
        createdAt: "created_at",
        updatedAt: "updated_at",
        deletedAt: "deleted_at",
    }
);
