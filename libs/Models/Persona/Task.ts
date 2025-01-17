import { DataTypes, Model, Optional } from "sequelize";

// Connection
import { sequelize } from "../../Loaders/database";

// Models
import { PersonaTask } from "./PersonaTask";

interface TaskAttributes {
    id?: bigint;
    uuid?: string;
    name?: string;
    config_name?: string;
    slug?: string;
    icon?: string | null;
    description?: string;

    created_at?: Date;
    updated_at?: Date;
    deleted_at?: Date;
}

export type TaskCreationAttributes = Optional<TaskAttributes, "id">;

export class Task extends Model<TaskAttributes, TaskCreationAttributes> implements TaskAttributes {
    public id!: bigint;
    public uuid!: string;
    public name!: string;
    public config_name!: string;
    public slug!: string;
    public icon!: string | null;
    public description!: string;

    public readonly created_at!: Date;
    public readonly updated_at!: Date;
    public deleted_at!: Date;
}

Task.init(
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

        config_name: {
            allowNull: false,
            type: DataTypes.STRING,
        },

        slug: {
            allowNull: false,
            unique: true,
            type: DataTypes.STRING,
        },

        icon: {
            allowNull: true,
            type: DataTypes.STRING,
            get() {
                if (this.getDataValue("icon")) {
                    return `${process.env.AWS_BASE_URL}${this.getDataValue("icon")}`;
                }
                return null;
            },
        },

        description: {
            allowNull: false,
            type: DataTypes.STRING(1000),
        },
    },
    {
        tableName: "tasks",
        sequelize,
        underscored: true,
        paranoid: true,
        createdAt: "created_at",
        updatedAt: "updated_at",
        deletedAt: "deleted_at",
    }
);

Task.hasMany(PersonaTask, { as: "task_personas", foreignKey: "task_id" });
