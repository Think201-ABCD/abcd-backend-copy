import { DataTypes, Model, Optional } from "sequelize";

// Connection
import { sequelize } from "../../Loaders/database";
import { Behaviour } from "../Behaviour/Behaviour";
import { Country } from "../Data/Country";
import { State } from "../Data/State";
import { Knowledge } from "../Knowledge/Knowledge";
import { Topic } from "../Topic/Topic";
import { Organisation } from "../Organisation/Organisation";

interface expertAttributes {
    id?: bigint;
    uuid?: string;
    user_id?: bigint | null;
    country_id?: bigint | null;
    state_id?: bigint | null;
    organisation_id?: bigint | null;
    name?: string | null;
    email?: string | null;
    bio?: string | null;
    brief?: string | null;
    designation?: string | null;
    photo?: string | null;
    categories?: string | null;
    website?: string | null;
    expertise_countries?: string | null;
    offerings?: string;
    status?: string;

    created_at?: Date;
    updated_at?: Date;
    deleted_at?: Date;
}

export type expertCreationAttributes = Optional<expertAttributes, "id">;

export class Expert extends Model<expertAttributes, expertCreationAttributes> implements expertAttributes {
    public id!: bigint;
    public uuid!: string;
    public user_id!: bigint | null;
    public country_id!: bigint | null;
    public state_id!: bigint | null;
    public organisation_id!: bigint | null;
    public name!: string | null;
    public email!: string | null;
    public bio!: string | null;
    public brief!: string | null;
    public designation!: string | null;
    public photo!: string | null;
    public categories!: string | null;
    public website!: string | null;
    public expertise_countries!: string | null;
    public offerings!: string;
    public status!: string;

    public readonly created_at!: Date;
    public readonly updated_at!: Date;
    public deleted_at!: Date;
}

Expert.init(
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
            allowNull: true,
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

        organisation_id: {
            allowNull: true,
            type: DataTypes.BIGINT,
            references: {
                model: "organisations",
                key: "id",
            },
            onUpdate: "CASCADE",
            onDelete: "CASCADE",
        },

        name: {
            allowNull: true,
            type: DataTypes.STRING,
        },

        email: {
            allowNull: true,
            type: DataTypes.STRING,
        },

        bio: {
            allowNull: true,
            type: DataTypes.STRING,
        },

        brief: {
            allowNull: true,
            type: DataTypes.STRING,
        },

        designation: {
            allowNull: true,
            type: DataTypes.STRING,
        },

        photo: {
            allowNull: true,
            type: DataTypes.STRING,
            get() {
                return this.getDataValue("photo")
                    ? `${process.env.AWS_BASE_URL}` + `${this.getDataValue("photo")}`
                    : null;
            },
        },

        categories: {
            allowNull: true,
            type: DataTypes.JSON,
        },

        website: {
            allowNull: true,
            type: DataTypes.STRING,
        },

        expertise_countries: {
            allowNull: true,
            type: DataTypes.JSON,
        },

        offerings: {
            allowNull: true,
            type: DataTypes.JSON,
        },

        status: {
            allowNull: false,
            defaultValue: "active",
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
        tableName: "experts",
        sequelize,
        underscored: true,
        paranoid: true,
        createdAt: "created_at",
        updatedAt: "updated_at",
        deletedAt: "deleted_at",
    }
);

// Topic
Expert.belongsToMany(Topic, { through: "expert_topics", as: "topics" });

// Behaviour
Expert.belongsToMany(Behaviour, { through: "expert_behaviours", as: "behaviours" });
Behaviour.belongsToMany(Expert, { as: "experts", through: "expert_behaviours" });

// Knowledges
Expert.belongsToMany(Knowledge, { through: "expert_knowledges", as: "knowledges" });
Knowledge.belongsToMany(Expert, { as: "experts", through: "expert_knowledges" });

// Country
Expert.belongsTo(Country, { as: "country" });

// State
Expert.belongsTo(State, { as: "state" });

Organisation.belongsToMany(Expert, { through: "organisation_experts", as: "experts" });
Expert.belongsToMany(Organisation, { as: "organisations", through: "organisation_experts" });
