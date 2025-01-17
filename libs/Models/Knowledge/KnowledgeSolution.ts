import { DataTypes, Model, Optional } from "sequelize";

// Connection
import { sequelize } from "../../Loaders/database";

// Models

interface knowledgeSolutionAttributes {
    id?: bigint;
    knowledge_id?: bigint;
    solution_id?: bigint;

    created_at?: Date;
    updated_at?: Date;
}

export type knowledgeSolutionCreationAttributes = Optional<knowledgeSolutionAttributes, "id">;

export class KnowledgeSolution
    extends Model<knowledgeSolutionAttributes, knowledgeSolutionCreationAttributes>
    implements knowledgeSolutionAttributes
{
    public id!: bigint;
    public knowledge_id!: bigint;
    public solution_id!: bigint;

    public readonly created_at!: Date;
    public readonly updated_at!: Date;
}

KnowledgeSolution.init(
    {
        id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: DataTypes.BIGINT,
        },

        knowledge_id: {
            allowNull: false,
            type: DataTypes.BIGINT,
            onUpdate: "CASCADE",
            onDelete: "CASCADE",
            references: {
                model: "knowledges",
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
        tableName: "knowledge_solutions",
        sequelize,
        underscored: true,
        createdAt: "created_at",
        updatedAt: "updated_at",
    }
);
