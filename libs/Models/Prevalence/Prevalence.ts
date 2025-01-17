import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../Loaders/database";
import { User } from "../Auth/User";
import { Behaviour } from "../Behaviour/Behaviour";
import { PrevalenceCountry } from "./PrevalenceCountry";

// Models

interface prevalenceAttributes {
    id?: bigint;
    uuid?: string;
    added_by?: bigint;
    name?: string;

    license?: string | null;
    status?: string;

    created_at?: Date;
    updated_at?: Date;
    deleted_at?: Date;
}

export type prevelenceCreationAttributes = Optional<prevalenceAttributes, "id">;

export class Prevalence
    extends Model<prevalenceAttributes, prevelenceCreationAttributes>
    implements prevalenceAttributes
{
    public id!: bigint;
    public uuid!: string;
    public added_by!: bigint;
    public name!: string;

    public license!: string | null;
    public status!: string;

    public readonly created_at!: Date;
    public readonly updated_at!: Date;
    public deleted_at!: Date;
}

Prevalence.init(
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

        added_by: {
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

        name: {
            allowNull: false,
            type: DataTypes.STRING,
        },

        license: {
            allowNull: true,
            type: DataTypes.STRING,
        },

        status: {
            allowNull: false,
            type: DataTypes.STRING(50),
            defaultValue: "draft",
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
        tableName: "prevalences",
        sequelize,
        underscored: true,
        paranoid: true,
        createdAt: "created_at",
        updatedAt: "updated_at",
        deletedAt: "deleted_at",
    }
);

Prevalence.belongsTo(User, { as: "created_by", foreignKey: "added_by" });
Prevalence.hasMany(PrevalenceCountry, { as: "prevalence_countries", foreignKey: "prevalence_id" });

Prevalence.belongsToMany(Behaviour, { through: "prevalence_behaviours", as: "behaviours" });
Behaviour.belongsToMany(Prevalence, { through: "prevalence_behaviours", as: "prevalences" });
