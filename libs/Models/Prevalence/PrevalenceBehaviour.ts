import { DataTypes, Model, Optional } from "sequelize";

// Connection
import { sequelize } from "../../Loaders/database";

// Models

interface prevalenceBehaviourAttributes {
    id?: bigint;
    prevalence_id?: bigint | null;
    behaviour_id?: bigint;

    created_at?: Date;
    updated_at?: Date;
}

export type prevalenceBehaviourCreationAttributes = Optional<prevalenceBehaviourAttributes, "id">;

export class PrevalenceBehaviour
    extends Model<prevalenceBehaviourAttributes, prevalenceBehaviourCreationAttributes>
    implements prevalenceBehaviourAttributes
{
    public id!: bigint;
    public prevalence_id!: bigint | null;
    public behaviour_id!: bigint;

    public readonly created_at!: Date;
    public readonly updated_at!: Date;
}

PrevalenceBehaviour.init(
    {
        id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: DataTypes.BIGINT,
        },

        prevalence_id: {
            allowNull: false,
            type: DataTypes.BIGINT,
            onUpdate: "CASCADE",
            onDelete: "CASCADE",
            references: {
                model: {
                    tableName: "prevalences",
                },
                key: "id",
            },
        },

        behaviour_id: {
            allowNull: true,
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
        tableName: "prevalence_behaviours",
        sequelize,
        underscored: true,
        createdAt: "created_at",
        updatedAt: "updated_at",
    }
);
