import { DataTypes, Model, Optional } from "sequelize";

// Connection
import { sequelize } from "../../Loaders/database";
import { OrganisationMember } from "./OrganisationMember";
import { Country } from "../Data/Country";
import { State } from "../Data/State";
import { User } from "../Auth/User";

// Models

interface organisationAttributes {
    id?: bigint;
    added_by?: bigint;
    country_id?: bigint;
    state_id?: bigint;
    uuid?: string;
    name?: string;
    logo?: string | null;
    brief?: string | null;
    description?: string | null;
    type?: string | null;
    website?: string | null;
    key_programs?: string | null;
    is_funder?: boolean;
    is_partner?: boolean;
    is_contributor?: boolean;
    category?: string | null;
    source?: string | null;
    budget?: number | null;
    service_lines?: string | null;
    impact?: string | null;
    functions?: string | null;
    status?: string;
    banner?: string | null;
    domain?: string | null;

    created_at?: Date;
    updated_at?: Date;
    deleted_at?: Date;
}

export type organisationCreationAttributes = Optional<organisationAttributes, "id">;

export class Organisation extends Model<organisationAttributes, organisationCreationAttributes> implements organisationAttributes {
    public id!: bigint;
    public added_by!: bigint;
    public country_id!: bigint;
    public state_id!: bigint;
    public uuid!: string;
    public name!: string;
    public logo!: string | null;
    public brief!: string | null;
    public description!: string | null;
    public type!: string | null;
    public website!: string | null; //website
    public key_programs!: string | null;
    public is_funder!: boolean;
    public is_partner!: boolean;
    public is_contributor!: boolean;
    public category!: string | null;
    public source!: string | null;
    public budget!: number | null;
    public service_lines!: string | null;
    public impact!: string | null;
    public functions!: string | null;
    public status!: string;
    public banner!: string | null;
    public domain!: string | null;

    public readonly created_at!: Date;
    public readonly updated_at!: Date;

    public deleted_at!: Date;
}

Organisation.init(
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

        country_id: {
            allowNull: true,
            type: DataTypes.BIGINT,
            references: {
                model: "countries",
                key: "id",
            },
            onUpdate: "CASCADE",
            onDelete: "CASCADE",
        },

        state_id: {
            allowNull: true,
            type: DataTypes.BIGINT,
            references: {
                model: "states",
                key: "id",
            },
            onUpdate: "CASCADE",
            onDelete: "CASCADE",
        },

        name: {
            allowNull: false,
            type: DataTypes.STRING,
        },

        logo: {
            allowNull: false,
            type: DataTypes.STRING,
            get() {
                return this.getDataValue("logo") ? `${process.env.AWS_BASE_URL}` + `${this.getDataValue("logo")}` : null;
            },
        },

        brief: {
            allowNull: true,
            type: DataTypes.STRING,
        },

        description: {
            allowNull: true,
            type: DataTypes.TEXT,
        },

        type: {
            allowNull: true,
            type: DataTypes.STRING,
        },

        website: {
            allowNull: true,
            type: DataTypes.STRING,
        },

        key_programs: {
            allowNull: true,
            type: DataTypes.STRING,
        },

        is_funder: {
            allowNull: false,
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },

        is_partner: {
            allowNull: false,
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },

        is_contributor: {
            allowNull: false,
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },

        category: {
            allowNull: true,
            type: DataTypes.STRING(100),
        },

        source: {
            allowNull: true,
            type: DataTypes.STRING,
        },

        budget: {
            allowNull: true,
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },

        service_lines: {
            allowNull: true,
            type: DataTypes.STRING,
        },

        impact: {
            allowNull: true,
            type: DataTypes.TEXT,
        },

        functions: {
            allowNull: true,
            type: DataTypes.JSONB,
        },

        status: {
            allowNull: false,
            defaultValue: "pending",
            type: DataTypes.STRING(50),
        },

        banner: {
            allowNull: true,
            type: DataTypes.STRING,
            get() {
                return this.getDataValue("banner") ? `${process.env.AWS_BASE_URL}${this.getDataValue("banner")}` : null;
            },
        },

        domain: {
            allowNull: true,
            type: DataTypes.STRING,
        },

        deleted_at: {
            allowNull: true,
            type: DataTypes.DATE,
        },
    },
    {
        tableName: "organisations",
        sequelize,
        underscored: true,
        paranoid: true,
        createdAt: "created_at",
        updatedAt: "updated_at",
        deletedAt: "deleted_at",
    }
);

Organisation.hasMany(OrganisationMember, { as: "members", foreignKey: "organisation_id" });
OrganisationMember.belongsTo(Organisation, { as: "organisation", foreignKey: "organisation_id" });

Organisation.belongsTo(Country, { as: "countries", foreignKey: "country_id" });
Organisation.belongsTo(State, { as: "states", foreignKey: "state_id" });

User.belongsToMany(Organisation, { through: OrganisationMember, as: "organisations" });
Organisation.belongsToMany(User, { through: OrganisationMember, as: "member_details" });
Organisation.belongsTo(User, { as: "admin", foreignKey: "added_by"})
