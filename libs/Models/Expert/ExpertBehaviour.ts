import { DataTypes, Model, Optional } from "sequelize";

// Connection
import { sequelize } from "../../Loaders/database";

// Models

interface expertBehaviourAttributes {
    id?: bigint;
    expert_id?: bigint;
    behaviour_id?: bigint;

    created_at?: Date;
    updated_at?: Date;
}

export type expertBehaviourCreationAttributes = Optional<expertBehaviourAttributes, "id">;

export class ExpertBehaviour
    extends Model<expertBehaviourAttributes, expertBehaviourCreationAttributes>
    implements expertBehaviourAttributes
{
    public id!: bigint;
    public expert_id!: bigint;
    public behaviour_id!: bigint;

    public readonly created_at!: Date;
    public readonly updated_at!: Date;
}

ExpertBehaviour.init(
    {
        id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: DataTypes.BIGINT,
        },

        expert_id: {
            allowNull: false,
            type: DataTypes.BIGINT,
            onUpdate: "CASCADE",
            onDelete: "CASCADE",
            references: {
                model: {
                    tableName: "experts",
                },
                key: "id",
            },
        },

        behaviour_id: {
            allowNull: false,
            type: DataTypes.BIGINT,
            onUpdate: "CASCADE",
            onDelete: "CASCADE",
            references: {
                model: {
                    tableName: "behaviours",
                },
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
        tableName: "expert_behaviours",
        sequelize,
        underscored: true,
        createdAt: "created_at",
        updatedAt: "updated_at",
    }
);
