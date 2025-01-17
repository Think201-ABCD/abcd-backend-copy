import { DataTypes, Model, Optional } from "sequelize";

// Connection
import { sequelize } from "../../Loaders/database";

// Models
import { PersonaTask } from "./PersonaTask";
import { Task } from "./Task";

interface PersonaAttributes {
    id?: bigint;
    uuid?: string;
    name?: string;
    slug?: string;
    icon?: string | null;
    description?: string;

    created_at?: Date;
    updated_at?: Date;
    deleted_at?: Date;
}

export type PersonaCreationAttributes = Optional<PersonaAttributes, "id">;

export class Persona extends Model<PersonaAttributes, PersonaCreationAttributes> implements PersonaAttributes {
    public id!: bigint;
    public uuid!: string;
    public name!: string;
    public slug!: string;
    public icon!: string | null;
    public description!: string;

    public readonly created_at!: Date;
    public readonly updated_at!: Date;
    public deleted_at!: Date;
}

Persona.init(
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
        tableName: "personas",
        sequelize,
        underscored: true,
        paranoid: true,
        createdAt: "created_at",
        updatedAt: "updated_at",
        deletedAt: "deleted_at",
    }
);

// Associations
Persona.hasMany(PersonaTask, { as: "tasks_info", foreignKey: "persona_id" });
Persona.belongsToMany(Task, { as: "tasks", through: "persona_tasks" });
