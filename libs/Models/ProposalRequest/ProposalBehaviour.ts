import { DataTypes, Model, Optional } from "sequelize";

// Connection
import { sequelize } from "../../Loaders/database";

// Models

interface proposalBehaviourAttributes {
    id?: bigint;
    proposal_id?: bigint;
    behaviour_id?: bigint;

    created_at?: Date;
    updated_at?: Date;
}

export type proposalBehaviourCreationAttributes = Optional<proposalBehaviourAttributes, "id">;

export class ProposalBehaviour
    extends Model<proposalBehaviourAttributes, proposalBehaviourCreationAttributes>
    implements proposalBehaviourAttributes
{
    public id!: bigint;
    public proposal_id!: bigint;
    public behaviour_id!: bigint;

    public readonly created_at!: Date;
    public readonly updated_at!: Date;
}

ProposalBehaviour.init(
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

        behaviour_id: {
            allowNull: false,
            type: DataTypes.BIGINT,
            onUpdate: "CASCADE",
            onDelete: "CASCADE",
            references: {
                model: "behaviours",
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
        tableName: "proposal_behaviours",
        sequelize,
        underscored: true,
        createdAt: "created_at",
        updatedAt: "updated_at",
    }
);
