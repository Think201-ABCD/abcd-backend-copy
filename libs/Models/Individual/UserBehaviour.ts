import { DataTypes, Model, Optional } from "sequelize";

// Connection
import { sequelize } from "../../Loaders/database";

// Models

interface userBehaviourAttributes {
    id?: bigint;
    user_id?: bigint | null;
    behaviour_id?: bigint;

    created_at?: Date;
    updated_at?: Date;
}

export type userBehaviourCreationAttributes = Optional<userBehaviourAttributes, "id">;

export class UserBehaviour
    extends Model<userBehaviourAttributes, userBehaviourCreationAttributes>
    implements userBehaviourAttributes
{
    public id!: bigint;
    public user_id!: bigint | null;
    public behaviour_id!: bigint;

    public readonly created_at!: Date;
    public readonly updated_at!: Date;
}

UserBehaviour.init(
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
        tableName: "user_behaviours",
        sequelize,
        underscored: true,
        createdAt: "created_at",
        updatedAt: "updated_at",
    }
);
