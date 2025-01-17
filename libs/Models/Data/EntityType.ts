import { DataTypes, Model, Optional } from "sequelize";

// Connection
import { sequelize } from "../../Loaders/database";

interface entityTypeAttributes {
    id?: bigint;
    name?: string;
    entity?: string;
    status?: string;

    created_at?: Date;
    updated_at?: Date;
}

export type entityTypeCreationAttributes = Optional<entityTypeAttributes, "id">;

export class EntityType
    extends Model<entityTypeAttributes, entityTypeCreationAttributes>
    implements entityTypeAttributes
{
    public id!: bigint;
    public name!: string;
    public entity!: string;
    public status!: string;

    public readonly created_at!: Date;
    public readonly updated_at!: Date;
}

EntityType.init(
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

        entity: {
            allowNull: false,
            type: DataTypes.STRING,
        },

        status: {
            allowNull: false,
            type: DataTypes.STRING(50),
            defaultValue: "active",
        },

        created_at: {
            allowNull: false,
            type: DataTypes.DATE,
        },

        updated_at: {
            allowNull: false,
            type: DataTypes.DATE,
        },
    },
    {
        tableName: "entity_types",
        sequelize,
        underscored: true,
        paranoid: true,
        timestamps: false,
    }
);
