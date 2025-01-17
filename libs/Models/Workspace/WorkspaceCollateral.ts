import { DataTypes, Model, Optional } from "sequelize";

// Connection
import { sequelize } from "../../Loaders/database";

// Models

interface workspaceCollateralAttributes {
    id?: bigint;
    workspace_id?: bigint;
    collateral_id?: bigint;

    created_at?: Date;
    updated_at?: Date;
}

export type workspaceCollateralCreationAttributes = Optional<workspaceCollateralAttributes, "id">;

export class WorkspaceCollateral
    extends Model<workspaceCollateralAttributes, workspaceCollateralCreationAttributes>
    implements workspaceCollateralAttributes
{
    public id!: bigint;
    public workspace_id!: bigint;
    public collateral_id!: bigint;

    public readonly created_at!: Date;
    public readonly updated_at!: Date;
}

WorkspaceCollateral.init(
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

        collateral_id: {
            allowNull: false,
            type: DataTypes.BIGINT,
            onUpdate: "CASCADE",
            onDelete: "CASCADE",
            references: {
                model: "collaterals",
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
        tableName: "workspace_collaterals",
        sequelize,
        underscored: true,
        createdAt: "created_at",
        updatedAt: "updated_at",
    }
);
