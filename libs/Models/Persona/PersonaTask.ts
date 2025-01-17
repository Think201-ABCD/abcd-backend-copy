import { DataTypes, Model, Optional } from "sequelize";

// Connection
import { sequelize } from "../../Loaders/database";

// Models
import { PersonaTaskStep } from "./PersonaTaskStep";

interface PersonaTaskAttributes {
    id?: bigint;
    persona_id?: bigint;
    task_id?: bigint;
    select_default?: boolean;
    name?: string;
    description?: string;

    created_at?: Date;
    updated_at?: Date;
    deleted_at?: Date;
}

export type PersonaTaskCreationAttributes = Optional<PersonaTaskAttributes, "id">;

export class PersonaTask extends Model<PersonaTaskAttributes, PersonaTaskCreationAttributes> implements PersonaTaskAttributes {
    public id!: bigint;
    public persona_id!: bigint;
    public task_id!: bigint;
    public select_default!: boolean;
    public name!: string;
    public description?: string;

    public readonly created_at!: Date;
    public readonly updated_at!: Date;
    public deleted_at!: Date;
}

PersonaTask.init(
    {
        id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: DataTypes.BIGINT,
        },

        persona_id: {
            allowNull: false,
            type: DataTypes.BIGINT,
            onUpdate: "CASCADE",
            onDelete: "CASCADE",
            references: {
                model: {
                    tableName: "personas",
                },
                key: "id",
            },
        },

        task_id: {
            allowNull: false,
            type: DataTypes.BIGINT,
            onUpdate: "CASCADE",
            onDelete: "CASCADE",
            references: {
                model: {
                    tableName: "tasks",
                },
                key: "id",
            },
        },

        select_default: {
            allowNull: false,
            defaultValue: false,
            type: DataTypes.BOOLEAN,
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
        tableName: "persona_tasks",
        sequelize,
        underscored: true,
        paranoid: true,
        createdAt: "created_at",
        updatedAt: "updated_at",
        deletedAt: "deleted_at",
    }
);

// Associations
PersonaTask.hasMany(PersonaTaskStep, { as: "task_steps", foreignKey: "persona_task_id" });
