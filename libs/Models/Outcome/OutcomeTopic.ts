import { DataTypes, Model, Optional } from "sequelize";

// Connection
import { sequelize } from "../../Loaders/database";

// Models

interface outcomeTopicsAttributes {
    id?: bigint;
    outcome_id?: bigint | null;
    sub_outcome_id?: bigint | null;
    topic_id?: bigint | null;
    sub_topic_id?: bigint | null;

    created_at?: Date;
    updated_at?: Date;
    deleted_at?: Date;
}

export type outcomeTopicsCreationAttributes = Optional<outcomeTopicsAttributes, "id">;

export class OutcomeTopic
    extends Model<outcomeTopicsAttributes, outcomeTopicsCreationAttributes>
    implements outcomeTopicsAttributes
{
    public id!: bigint;
    public outcome_id!: bigint | null;
    public sub_outcome_id!: bigint | null;
    public topic_id!: bigint | null;
    public sub_topic_id!: bigint | null;

    public readonly created_at!: Date;
    public readonly updated_at!: Date;
    public deleted_at!: Date;
}

OutcomeTopic.init(
    {
        id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: DataTypes.BIGINT,
        },

        outcome_id: {
            allowNull: true,
            type: DataTypes.BIGINT,
            onUpdate: "CASCADE",
            onDelete: "CASCADE",
            references: {
                model: "outcomes",
                key: "id",
            },
        },

        sub_outcome_id: {
            allowNull: true,
            onUpdate: "CASCADE",
            onDelete: "CASCADE",
            type: DataTypes.BIGINT,
            references: {
                model: "sub_outcomes",
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
            onUpdate: "CASCADE",
            onDelete: "CASCADE",
            type: DataTypes.BIGINT,
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
        tableName: "outcome_topics",
        sequelize,
        underscored: true,
        paranoid: true,
        createdAt: "created_at",
        updatedAt: "updated_at",
        deletedAt: "deleted_at",
    }
);
