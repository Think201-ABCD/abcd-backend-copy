import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../Loaders/database";

// Models
import { Role } from "./Role";

interface userRoleAttributes {
    id?: bigint;
    user_id?: bigint;
    role_id?: bigint;

    created_at?: Date;
    updated_at?: Date;
    deleted_at?: Date;
}

type userRoleCreationAttributes = Optional<userRoleAttributes, "id">;

export class UserRole extends Model<userRoleAttributes, userRoleCreationAttributes> implements userRoleAttributes {
    public id!: bigint;
    public user_id!: bigint;
    public role_id!: bigint;

    public readonly created_at!: Date;
    public readonly updated_at!: Date;
    public deleted_at!: Date;
}

UserRole.init(
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
            references: {
                model: "users",
                key: "id",
            },
            onUpdate: "CASCADE",
            onDelete: "CASCADE",
        },

        role_id: {
            allowNull: false,
            type: DataTypes.BIGINT,
            references: {
                model: "users",
                key: "id",
            },
            onUpdate: "CASCADE",
            onDelete: "CASCADE",
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
        tableName: "user_roles",
        sequelize,
        underscored: true,
        paranoid: true,
        createdAt: "created_at",
        updatedAt: "updated_at",
        deletedAt: "deleted_at",
    }
);

UserRole.belongsTo(Role, { foreignKey: "role_id", as: "role" });
