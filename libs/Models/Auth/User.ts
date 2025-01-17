import { DataTypes, Model, Optional } from "sequelize";
import { v4 as uuidv4 } from "uuid";

// Connection
import { sequelize } from "../../Loaders/database";

// Models
import { Role } from "./Role";
import { UserProfile } from "./UserProfile";

interface usersAttributes {
    id?: bigint;
    uuid?: string;
    first_name?: string | null;
    last_name?: string | null;
    username?: string;
    email?: string | null;
    phone?: string | null;
    password?: string;
    gender?: string | null;
    photo?: string | null;
    banner?: string | null;
    dob?: Date | null;
    bio?: string | null;
    email_verified?: boolean;
    phone_verified?: boolean;
    force_password?: boolean;
    status?: string;
    is_first_login?: boolean;
    whatsapp_number?: bigint;
    whatsapp_session_id?: string;

    created_at?: Date;
    updated_at?: Date;
    deleted_at?: Date;
}

export type usersCreationAttributes = Optional<usersAttributes, "id">;

export class User extends Model<usersAttributes, usersCreationAttributes> implements usersAttributes {
    public id!: bigint;
    public uuid!: string;
    public first_name!: string | null;
    public last_name!: string | null;
    public username!: string;
    public email!: string | null;
    public phone!: string | null;
    public password!: string;
    public gender!: string | null;
    public photo!: string | null;
    public banner!: string | null;
    public dob!: Date | null;
    public bio!: string | null;
    public email_verified!: boolean;
    public phone_verified!: boolean;
    public force_password!: boolean;
    public status!: string;
    public is_first_login!: boolean;
    public whatsapp_number!: bigint;
    public whatsapp_session_id!: string;

    public readonly created_at!: Date;
    public readonly updated_at!: Date;
    public deleted_at!: Date;
}

User.init(
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
            defaultValue: uuidv4(),
        },

        first_name: {
            allowNull: true,
            type: DataTypes.STRING,
        },

        last_name: {
            allowNull: true,
            type: DataTypes.STRING,
        },

        username: {
            allowNull: false,
            type: DataTypes.STRING,
            unique: true,
        },

        email: {
            allowNull: true,
            type: DataTypes.STRING,
            unique: true,
        },

        phone: {
            allowNull: true,
            type: DataTypes.STRING,
        },

        password: {
            allowNull: false,
            type: DataTypes.STRING,
        },

        gender: {
            allowNull: true,
            type: DataTypes.STRING(50),
        },

        photo: {
            allowNull: true,
            type: DataTypes.STRING,
            get() {
                return this.getDataValue("photo") ? `${process.env.AWS_BASE_URL}` + `${this.getDataValue("photo")}` : null;
            },
        },

        banner: {
            allowNull: true,
            type: DataTypes.STRING,
            get() {
                const banner = this.getDataValue("banner");

                if (banner) {
                    return `${process.env.AWS_BASE_URL}` + `${this.getDataValue("banner")}`;
                }

                return `${process.env.AWS_BASE_URL}` + `${process.env.DEFAULT_USER_PROFILE_BANNER}`;
            },
        },

        dob: {
            allowNull: true,
            type: DataTypes.DATE,
        },

        bio: {
            allowNull: true,
            type: DataTypes.STRING,
        },

        phone_verified: {
            allowNull: false,
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },

        email_verified: {
            allowNull: false,
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },

        force_password: {
            allowNull: false,
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },

        status: {
            allowNull: false,
            type: DataTypes.STRING,
            defaultValue: "active",
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

        is_first_login: {
            allowNull: false,
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },

        whatsapp_number: {
            allowNull: true,
            type: DataTypes.BIGINT,
        },

        whatsapp_session_id: {
            allowNull: true,
            type: DataTypes.STRING,
        },
    },
    {
        tableName: "users",
        sequelize,
        underscored: true,
        paranoid: true,
        createdAt: "created_at",
        updatedAt: "updated_at",
        deletedAt: "deleted_at",
    }
);

User.belongsToMany(Role, { through: "user_roles", as: "roles" });
User.hasOne(UserProfile, { as: "profile", foreignKey: "user_id" });
