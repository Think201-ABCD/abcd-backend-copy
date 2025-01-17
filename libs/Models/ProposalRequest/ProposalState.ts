import { DataTypes, Model, Optional } from "sequelize";

// Connection
import { sequelize } from "../../Loaders/database";

// Models

interface proposalStateAttributes {
    id?: bigint;
    proposal_id?: bigint;
    country_id?: bigint;
    state_id?: bigint;
    banner?: string | null;
    brief?: string | null;
    description?: string | null;

    created_at?: Date;
    updated_at?: Date;
    deleted_at?: Date;
}

export type proposalStateCreationAttributes = Optional<proposalStateAttributes, "id">;

export class ProposalState
    extends Model<proposalStateAttributes, proposalStateCreationAttributes>
    implements proposalStateAttributes
{
    public id!: bigint;
    public proposal_id!: bigint;
    public country_id!: bigint;
    public state_id!: bigint;
    public banner!: string | null;
    public brief!: string | null;
    public description!: string | null;

    public readonly created_at!: Date;
    public readonly updated_at!: Date;
    public deleted_at!: Date;
}

ProposalState.init(
    {
        id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: DataTypes.BIGINT,
        },

        proposal_id: {
            allowNull: false,
            type: DataTypes.BIGINT,
            onUpdate: "CASCADE",
            onDelete: "CASCADE",
            references: {
                model: "proposal_requests",
                key: "id",
            },
        },

        country_id: {
            allowNull: false,
            type: DataTypes.BIGINT,
            onUpdate: "CASCADE",
            onDelete: "CASCADE",
            references: {
                model: "countries",
                key: "id",
            },
        },

        state_id: {
            allowNull: false,
            type: DataTypes.BIGINT,
            onUpdate: "CASCADE",
            onDelete: "CASCADE",
            references: {
                model: "states",
                key: "id",
            },
        },

        banner: {
            allowNull: true,
            type: DataTypes.STRING,
            get() {
                return this.getDataValue("banner")
                    ? `${process.env.AWS_BASE_URL}` + `${this.getDataValue("banner")}`
                    : null;
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
        tableName: "proposal_states",
        sequelize,
        underscored: true,
        createdAt: "created_at",
        updatedAt: "updated_at",
        deletedAt: "deleted_at",
    }
);
