import { DataTypes, Model, Optional } from "sequelize";

// Connection
import { sequelize } from "../../Loaders/database";

// Models

interface workspaceSolutionAttributes {
    id?: bigint;
    workspace_id?: bigint;
    solution_id?: bigint;

    created_at?: Date;
    updated_at?: Date;
}

export type workspaceSolutionCreationAttributes = Optional<workspaceSolutionAttributes, "id">;

export class WorkspaceSolution
    extends Model<workspaceSolutionAttributes, workspaceSolutionCreationAttributes>
    implements workspaceSolutionAttributes
{
    public id!: bigint;
    public workspace_id!: bigint;
    public solution_id!: bigint;

    public readonly created_at!: Date;
    public readonly updated_at!: Date;
}

WorkspaceSolution.init(
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
        tableName: "workspace_solutions",
        sequelize,
        underscored: true,
        createdAt: "created_at",
        updatedAt: "updated_at",
    }
);
