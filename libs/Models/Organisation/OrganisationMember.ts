import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../Loaders/database";
import { User } from "../Auth/User";

// Models

interface OrganisationMemberAttributes {
    id?: bigint;
    user_id?: bigint;
    organisation_id?: bigint;
    type?: string | null;
    status?: string;

    created_at?: Date;
    updated_at?: Date;
    deleted_at?: Date;
}

type OrganisationMemberCreationAttributes = Optional<OrganisationMemberAttributes, "id">;

export class OrganisationMember
    extends Model<OrganisationMemberAttributes, OrganisationMemberCreationAttributes>
    implements OrganisationMemberAttributes
{
    public id!: bigint;
    public user_id!: bigint;
    public organisation_id!: bigint;
    public type!: string | null;
    public status!: string;

    public readonly created_at!: Date;
    public readonly updated_at!: Date;
    public deleted_at!: Date;
}

OrganisationMember.init(
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

        organisation_id: {
            allowNull: false,
            onUpdate: "CASCADE",
            onDelete: "CASCADE",
            type: DataTypes.BIGINT,
            references: {
                model: {
                    tableName: "organisations",
                },
                key: "id",
            },
        },

        type: {
            allowNull: true,
            type: DataTypes.STRING(100),
        },

        status: {
            allowNull: false,
            defaultValue: "pending",
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
        tableName: "organisation_members",
        sequelize,
        underscored: true,
        paranoid: true,
        createdAt: "created_at",
        updatedAt: "updated_at",
        deletedAt: "deleted_at",
    }
);

OrganisationMember.belongsTo(User, { as: "user", foreignKey: "user_id" });
User.hasOne(OrganisationMember, { as: "organisation_member", foreignKey: "user_id" });
User.hasMany(OrganisationMember, {as: "member_organisations", foreignKey: "user_id"})
