import { DataTypes, Model, Optional } from "sequelize";

// Connection
import { sequelize } from "../../Loaders/database";

// Models
import { Tool } from "./Tool";

interface PersonaTaskStepAttributes {
    id?: bigint;
    persona_task_id?: bigint;
    tool_id?: bigint;
    sequence?: number;
    name?: string;
    description?: string;

    created_at?: Date;
    updated_at?: Date;
    deleted_at?: Date;
}

export type PersonaTaskStepCreationAttributes = Optional<PersonaTaskStepAttributes, "id">;

export class PersonaTaskStep extends Model<PersonaTaskStepAttributes, PersonaTaskStepCreationAttributes> implements PersonaTaskStepAttributes {
    public id!: bigint;
    public persona_task_id!: bigint;
    public tool_id!: bigint;
    public sequence!: number;
    public name!: string;
    public description!: string;

    public readonly created_at!: Date;
    public readonly updated_at!: Date;
    public deleted_at!: Date;
}

PersonaTaskStep.init(
    {
        id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: DataTypes.BIGINT,
        },

        persona_task_id: {
            allowNull: false,
            type: DataTypes.BIGINT,
            onUpdate: "CASCADE",
            onDelete: "CASCADE",
            references: {
                model: {
                    tableName: "persona_tasks",
                },
                key: "id",
            },
        },

        tool_id: {
            allowNull: true,
            type: DataTypes.BIGINT,
            onUpdate: "CASCADE",
            onDelete: "CASCADE",
            references: {
                model: {
                    tableName: "tools",
                },
                key: "id",
            },
        },

        sequence: {
            allowNull: false,
            type: DataTypes.SMALLINT,
        },

        name: {
            allowNull: false,
            type: DataTypes.STRING,
        },

        description: {
            allowNull: false,
            type: DataTypes.STRING(1000),
        },
    },
    {
        tableName: "persona_task_steps",
        sequelize,
        underscored: true,
        paranoid: true,
        createdAt: "created_at",
        updatedAt: "updated_at",
        deletedAt: "deleted_at",
    }
);

PersonaTaskStep.belongsTo(Tool, { as: "tool", foreignKey: "tool_id" });
