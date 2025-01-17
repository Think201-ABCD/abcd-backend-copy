import { DataTypes, Model, Optional } from "sequelize";

// Connection
import { sequelize } from "../../Loaders/database";

// Models

interface organisationBehaviourAttributes {
    id?: bigint;
    organisation_id?: bigint | null;
    behaviour_id?: bigint;

    created_at?: Date;
    updated_at?: Date;
}

export type organisationBehaviourCreationAttributes = Optional<organisationBehaviourAttributes, "id">;

export class OrganisationBehaviour
    extends Model<organisationBehaviourAttributes, organisationBehaviourCreationAttributes>
    implements organisationBehaviourAttributes
{
    public id!: bigint;
    public organisation_id!: bigint | null;
    public behaviour_id!: bigint;

    public readonly created_at!: Date;
    public readonly updated_at!: Date;
}

OrganisationBehaviour.init(
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

        behaviour_id: {
            allowNull: true,
            type: DataTypes.BIGINT,
            onUpdate: "CASCADE",
            onDelete: "CASCADE",
            references: {
                model: {
                    tableName: "behaviours",
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
        tableName: "organisation_behaviours",
        sequelize,
        underscored: true,
        createdAt: "created_at",
        updatedAt: "updated_at",
    }
);
