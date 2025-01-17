import { DataTypes, Model, Optional } from "sequelize";

// Connection
import { sequelize } from "../../Loaders/database";

// Models
import { State } from "../Data/State";

interface topicStatesAttributes {
    id?: bigint;
    topic_id?: bigint;
    sub_topic_id?: bigint;
    state_id?: bigint;
    country_id?: bigint;
    brief?: string | null;
    description?: string | null;
    banner?: string | null;
    banner_aws?: string | null;

    created_at?: Date;
    updated_at?: Date;
    deleted_at?: Date;
}

export type topicStatesCreationAttributes = Optional<topicStatesAttributes, "id">;

export class TopicState
    extends Model<topicStatesAttributes, topicStatesCreationAttributes>
    implements topicStatesAttributes
{
    public id!: bigint;
    public topic_id!: bigint;
    public sub_topic_id!: bigint;
    public state_id!: bigint;
    public country_id!: bigint;
    public brief!: string | null;
    public description!: string | null;
    public banner!: string | null;
    public banner_aws!: string | null;

    public readonly created_at!: Date;
    public readonly updated_at!: Date;
    public deleted_at!: Date;
}

TopicState.init(
    {
        id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: DataTypes.BIGINT,
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

        state_id: {
            allowNull: false,
            type: DataTypes.BIGINT,
            onUpdate: "CASCADE",
            onDelete: "CASCADE",
            references: {
                model: "states",
                key: "id",
            },
        },

        country_id: {
            allowNull: false,
            type: DataTypes.BIGINT,
            onUpdate: "CASCADE",
            onDelete: "CASCADE",
            references: {
                model: "countries",
                key: "id",
            },
        },

        brief: {
            allowNull: true,
            type: DataTypes.STRING,
        },

        description: {
            allowNull: true,
            type: DataTypes.TEXT,
        },

        banner: {
            allowNull: true,
            type: DataTypes.STRING,
            get() {
                return this.getDataValue("banner")
                    ? `${process.env.AWS_BASE_URL}` + `${this.getDataValue("banner")}`
                    : null;
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
        tableName: "topic_states",
        sequelize,
        underscored: true,
        paranoid: true,
        createdAt: "created_at",
        updatedAt: "updated_at",
        deletedAt: "deleted_at",
    }
);

TopicState.belongsTo(State, { as: "state", foreignKey: "state_id" });
