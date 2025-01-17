import { DataTypes, Model, Optional } from "sequelize";

// Connection
import { sequelize } from "../../Loaders/database";

// Models
import { Persona } from "./Persona";

interface UserPersonaAttributes {
    id?: bigint;
    user_id?: bigint;
    persona_id?: bigint;
    tasks?: JSON;
    topics?: JSON;

    created_at?: Date;
    updated_at?: Date;
    deleted_at?: Date;
}

export type UserPersonaCreationAttributes = Optional<UserPersonaAttributes, "id">;

export class UserPersona extends Model<UserPersonaAttributes, UserPersonaCreationAttributes> implements UserPersonaAttributes {
    public id!: bigint;
    public user_id!: bigint;
    public persona_id!: bigint;
    public tasks!: JSON;
    public topics!: JSON;

    public readonly created_at!: Date;
    public readonly updated_at!: Date;
    public deleted_at!: Date;
}

UserPersona.init(
    {
        id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: DataTypes.BIGINT,
        },

        user_id: {
            allowNull: false,
            type: DataTypes.BIGINT,
            onUpdate: "CASCADE",
            onDelete: "CASCADE",
            references: {
                model: {
                    tableName: "users",
                },
                key: "id",
            },
        },

        persona_id: {
            allowNull: true,
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

        tasks: {
            allowNull: false,
            type: DataTypes.JSONB,
        },

        topics: {
            allowNull: false,
            type: DataTypes.JSONB,
        },
    },
    {
        tableName: "user_personas",
        sequelize,
        underscored: true,
        paranoid: true,
        createdAt: "created_at",
        updatedAt: "updated_at",
        deletedAt: "deleted_at",
    }
);

UserPersona.belongsTo(Persona, { as: "persona", foreignKey: "persona_id" });
