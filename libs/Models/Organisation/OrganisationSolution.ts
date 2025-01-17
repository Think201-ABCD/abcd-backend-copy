import { DataTypes, Model, Optional } from "sequelize";

// Connection
import { sequelize } from "../../Loaders/database";

// Models

interface OrganisationSolutionAttributes {
    id?: bigint;
    organization_id?: bigint | null;
    solution_id?: bigint;

    created_at?: Date;
    updated_at?: Date;
}

export type OrganisationSolutionCreationAttributes = Optional<OrganisationSolutionAttributes, "id">;

export class OrganisationSolution
    extends Model<OrganisationSolutionAttributes, OrganisationSolutionCreationAttributes>
    implements OrganisationSolutionAttributes
{
    public id!: bigint;
    public organization_id!: bigint | null;
    public solution_id!: bigint;

    public readonly created_at!: Date;
    public readonly updated_at!: Date;
}

OrganisationSolution.init(
    {
        id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: DataTypes.BIGINT,
        },

        organization_id: {
            allowNull: false,
            type: DataTypes.BIGINT,
            onUpdate: "CASCADE",
            onDelete: "CASCADE",
            references: {
                model: {
                    tableName: "organizations",
                },
                key: "id",
            },
        },

        solution_id: {
            allowNull: true,
            type: DataTypes.BIGINT,
            onUpdate: "CASCADE",
            onDelete: "CASCADE",
            references: {
                model: {
                    tableName: "solutions",
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
        tableName: "organization_solutions",
        sequelize,
        underscored: true,
        createdAt: "created_at",
        updatedAt: "updated_at",
    }
);
