import { DataTypes, Model, Optional } from "sequelize";

// Connection
import { sequelize } from "../../Loaders/database";

// Models

interface organisationExpertAttributes {
    id?: bigint;
    organisation_id?: bigint | null;
    expert_id?: bigint;

    created_at?: Date;
    updated_at?: Date;
}

export type organisationExpertCreationAttributes = Optional<organisationExpertAttributes, "id">;

export class OrganisationExpert
    extends Model<organisationExpertAttributes, organisationExpertCreationAttributes>
    implements organisationExpertAttributes
{
    public id!: bigint;
    public organisation_id!: bigint | null;
    public expert_id!: bigint;

    public readonly created_at!: Date;
    public readonly updated_at!: Date;
}

OrganisationExpert.init(
    {
        id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: DataTypes.BIGINT,
        },

        organisation_id: {
            allowNull: false,
            type: DataTypes.BIGINT,
            onUpdate: "CASCADE",
            onDelete: "CASCADE",
            references: {
                model: {
                    tableName: "organisations",
                },
                key: "id",
            },
        },

        expert_id: {
            allowNull: true,
            type: DataTypes.BIGINT,
            onUpdate: "CASCADE",
            onDelete: "CASCADE",
            references: {
                model: {
                    tableName: "experts",
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
        tableName: "organisation_experts",
        sequelize,
        underscored: true,
        createdAt: "created_at",
        updatedAt: "updated_at",
    }
);
