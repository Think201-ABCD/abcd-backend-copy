import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../Loaders/database";
import { User } from "../Auth/User";

interface AnalyserMailRequestAttributes {
    id?: bigint;
    uuid?: string;
    user_id?: bigint;
    user_file_name?: string;
    user_file?: string;
    response_file?: string;
    type?: string;
    source?: string;
    status?: string;

    created_at?: Date;
    updated_at?: Date;
    deleted_at?: Date;
}

type AnalyserMailRequestCreationAttributes = Optional<AnalyserMailRequestAttributes, "id">;

export class AnalyserMailRequest extends Model<AnalyserMailRequestAttributes, AnalyserMailRequestCreationAttributes> implements AnalyserMailRequestAttributes {
    public id!: bigint;
    public uuid!: string;
    public user_id!: bigint;
    public user_file_name!: string;
    public user_file!: string;
    public response_file!: string;
    public type!: string;
    public source!: string;
    public status!: string;

    public readonly created_at!: Date;
    public readonly updated_at!: Date;
    public deleted_at!: Date;
}

AnalyserMailRequest.init(
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

        user_id: {
            allowNull: false,
            onUpdate: "CASCADE",
            onDelete: "CASCADE",
            type: DataTypes.BIGINT,
            references: {
                model: {
                    tableName: "users",
                },
                key: "id",
            },
        },
        user_file_name: {
            allowNull: false,
            type: DataTypes.STRING,
        },
        user_file: {
            allowNull: false,
            type: DataTypes.STRING,
        },

        response_file: {
            allowNull: true,
            type: DataTypes.STRING,
        },

        type: {
            allowNull: true,
            type: DataTypes.STRING(50),
        },

        source: {
            allowNull: true,
            type: DataTypes.STRING(50),
        },

        status: {
            allowNull: true,
            type: DataTypes.STRING(50),
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
        tableName: "analyser_mail_requests",
        sequelize,
        underscored: true,
        paranoid: true,
        createdAt: "created_at",
        updatedAt: "updated_at",
        deletedAt: "deleted_at",
    }
);

AnalyserMailRequest.belongsTo(User, { foreignKey: "user_id", as: "user" });
