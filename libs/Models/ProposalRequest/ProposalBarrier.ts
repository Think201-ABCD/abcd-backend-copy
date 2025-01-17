import { DataTypes, Model, Optional } from "sequelize";

// Connection
import { sequelize } from "../../Loaders/database";

// Models

interface proposalBarrierAttributes {
    id?: bigint;
    proposal_id?: bigint;
    barrier_id?: bigint;

    created_at?: Date;
    updated_at?: Date;
}

export type proposalBarrierCreationAttributes = Optional<proposalBarrierAttributes, "id">;

export class ProposalBarrier
    extends Model<proposalBarrierAttributes, proposalBarrierCreationAttributes>
    implements proposalBarrierAttributes
{
    public id!: bigint;
    public proposal_id!: bigint;
    public barrier_id!: bigint;

    public readonly created_at!: Date;
    public readonly updated_at!: Date;
}

ProposalBarrier.init(
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

        barrier_id: {
            allowNull: false,
            type: DataTypes.BIGINT,
            onUpdate: "CASCADE",
            onDelete: "CASCADE",
            references: {
                model: "barriers",
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
        tableName: "proposal_barriers",
        sequelize,
        underscored: true,
        createdAt: "created_at",
        updatedAt: "updated_at",
    }
);
