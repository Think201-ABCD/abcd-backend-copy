import { DataTypes, Model, Optional } from "sequelize";

// Connection
import { sequelize } from "../../Loaders/database";

// Models

interface proposalSolutionAttributes {
    id?: bigint;
    proposal_id?: bigint;
    solution_id?: bigint;

    created_at?: Date;
    updated_at?: Date;
}

export type proposalSolutionCreationAttributes = Optional<proposalSolutionAttributes, "id">;

export class ProposalSolution
    extends Model<proposalSolutionAttributes, proposalSolutionCreationAttributes>
    implements proposalSolutionAttributes
{
    public id!: bigint;
    public proposal_id!: bigint;
    public solution_id!: bigint;

    public readonly created_at!: Date;
    public readonly updated_at!: Date;
}

ProposalSolution.init(
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

        solution_id: {
            allowNull: false,
            type: DataTypes.BIGINT,
            onUpdate: "CASCADE",
            onDelete: "CASCADE",
            references: {
                model: "solutions",
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
        tableName: "proposal_solutions",
        sequelize,
        underscored: true,
        createdAt: "created_at",
        updatedAt: "updated_at",
    }
);
