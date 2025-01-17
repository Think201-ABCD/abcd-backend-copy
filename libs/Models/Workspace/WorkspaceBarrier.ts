import { DataTypes, Model, Optional } from "sequelize";

// Connection
import { sequelize } from "../../Loaders/database";

// Models

interface workspaceBarrierAttributes {
    id?: bigint;
    workspace_id?: bigint;
    barrier_id?: bigint;

    created_at?: Date;
    updated_at?: Date;
}

export type workspaceBarrierCreationAttributes = Optional<workspaceBarrierAttributes, "id">;

export class WorkspaceBarrier
    extends Model<workspaceBarrierAttributes, workspaceBarrierCreationAttributes>
    implements workspaceBarrierAttributes
{
    public id!: bigint;
    public workspace_id!: bigint;
    public barrier_id!: bigint;

    public readonly created_at!: Date;
    public readonly updated_at!: Date;
}

WorkspaceBarrier.init(
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
        tableName: "workspace_barriers",
        sequelize,
        underscored: true,
        createdAt: "created_at",
        updatedAt: "updated_at",
    }
);
