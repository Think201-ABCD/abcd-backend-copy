import { DataTypes, Model, Optional } from "sequelize";

// Connection
import { sequelize } from "../../Loaders/database";

// Models

interface workspaceProposalAttributes {
    id?: bigint;
    workspace_id?: bigint;
    proposal_id?: bigint;

    created_at?: Date;
    updated_at?: Date;
}

export type workspaceProposalCreationAttributes = Optional<workspaceProposalAttributes, "id">;

export class WorkspaceProposal
    extends Model<workspaceProposalAttributes, workspaceProposalCreationAttributes>
    implements workspaceProposalAttributes
{
    public id!: bigint;
    public workspace_id!: bigint;
    public proposal_id!: bigint;

    public readonly created_at!: Date;
    public readonly updated_at!: Date;
}

WorkspaceProposal.init(
    {
        id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: DataTypes.BIGINT,
        },

        workspace_id: {
            allowNull: false,
            type: DataTypes.BIGINT,
            onUpdate: "CASCADE",
            onDelete: "CASCADE",
            references: {
                model: "workspaces",
                key: "id",
            },
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
        tableName: "workspace_proposals",
        sequelize,
        underscored: true,
        createdAt: "created_at",
        updatedAt: "updated_at",
    }
);
