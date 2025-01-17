import { DataTypes, Model, Optional } from "sequelize";

// Connection
import { sequelize } from "../../Loaders/database";

// Models

interface organisationTopicAttributes {
    id?: bigint;
    organisation_id?: bigint;
    topic_id?: bigint | null;
    sub_topic_id?: bigint | null;

    created_at?: Date;
    updated_at?: Date;
}

export type organisationTopicCreationAttributes = Optional<organisationTopicAttributes, "id">;

export class OrganisationTopic
    extends Model<organisationTopicAttributes, organisationTopicCreationAttributes>
    implements organisationTopicAttributes
{
    public id!: bigint;
    public organisation_id!: bigint;
    public topic_id!: bigint | null;
    public sub_topic_id!: bigint | null;

    public readonly created_at!: Date;
    public readonly updated_at!: Date;
}

OrganisationTopic.init(
    {
        id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: DataTypes.BIGINT,
        },

        organisation_id: {
            allowNull: false,
            type: DataTypes.BIGINT,
            onUpdate: "CASCADE",
            onDelete: "CASCADE",
            references: {
                model: "organisations",
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
    },
    {
        tableName: "organisation_topics",
        sequelize,
        underscored: true,
        createdAt: "created_at",
        updatedAt: "updated_at",
    }
);
