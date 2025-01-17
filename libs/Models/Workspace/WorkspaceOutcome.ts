import { DataTypes, Model, Optional } from "sequelize";

// Connection
import { sequelize } from "../../Loaders/database";

// Models

interface workspaceOutcomeAttributes {
    id?: bigint;
    workspace_id?: bigint;
    outcome_id?: bigint | null;
    sub_outcome_id?: bigint | null;

    created_at?: Date;
    updated_at?: Date;
}

export type workspaceOutcomeCreationAttributes = Optional<workspaceOutcomeAttributes, "id">;

export class WorkspaceOutcome
    extends Model<workspaceOutcomeAttributes, workspaceOutcomeCreationAttributes>
    implements workspaceOutcomeAttributes
{
    public id!: bigint;
    public workspace_id!: bigint;
    public outcome_id!: bigint | null;
    public sub_outcome_id!: bigint | null;

    public readonly created_at!: Date;
    public readonly updated_at!: Date;
}

WorkspaceOutcome.init(
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
                model: {
                    tableName: "workspaces",
                },
                key: "id",
            },
        },

        outcome_id: {
            allowNull: true,
            type: DataTypes.BIGINT,
            onUpdate: "CASCADE",
            onDelete: "CASCADE",
            references: {
                model: {
                    tableName: "outcomes",
                },
                key: "id",
            },
        },

        sub_outcome_id: {
            allowNull: true,
            onUpdate: "CASCADE",
            onDelete: "CASCADE",
            type: DataTypes.BIGINT,
            references: {
                model: {
                    tableName: "sub_outcomes",
                },
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
        tableName: "workspace_outcomes",
        sequelize,
        underscored: true,
        createdAt: "created_at",
        updatedAt: "updated_at",
    }
);
