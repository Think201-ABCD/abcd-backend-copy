import { DataTypes, Model, Optional } from "sequelize";

// Connection
import { sequelize } from "../../Loaders/database";

// Models

interface collateralTopicAttributes {
    id?: bigint;
    collateral_id?: bigint;
    topic_id?: bigint | null;
    sub_topic_id?: bigint | null;

    created_at?: Date;
    updated_at?: Date;
    deleted_at?: Date;
}

export type collateralTopicCreationAttributes = Optional<collateralTopicAttributes, "id">;

export class CollateralTopic
    extends Model<collateralTopicAttributes, collateralTopicCreationAttributes>
    implements collateralTopicAttributes
{
    public id!: bigint;
    public collateral_id!: bigint;
    public topic_id!: bigint | null;
    public sub_topic_id!: bigint | null;

    public readonly created_at!: Date;
    public readonly updated_at!: Date;
    public deleted_at!: Date;
}

CollateralTopic.init(
    {
        id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: DataTypes.BIGINT,
        },

        collateral_id: {
            allowNull: false,
            type: DataTypes.BIGINT,
            onUpdate: "CASCADE",
            onDelete: "CASCADE",
            references: {
                model: "collaterals",
                key: "id",
            },
        },

        topic_id: {
            allowNull: true,
            type: DataTypes.BIGINT,
            onUpdate: "CASCADE",
            onDelete: "CASCADE",
            references: {
                model: "topics",
                key: "id",
            },
        },

        sub_topic_id: {
            allowNull: true,
            type: DataTypes.BIGINT,
            onUpdate: "CASCADE",
            onDelete: "CASCADE",
            references: {
                model: "sub_topics",
                key: "id",
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
        tableName: "collateral_topics",
        sequelize,
        underscored: true,
        createdAt: "created_at",
        updatedAt: "updated_at",
    }
);
