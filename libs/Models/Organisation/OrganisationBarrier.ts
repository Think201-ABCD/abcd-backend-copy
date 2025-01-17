import { DataTypes, Model, Optional } from "sequelize";

// Connection
import { sequelize } from "../../Loaders/database";

// Models

interface OrganisationBarrierAttributes {
    id?: bigint;
    organization_id?: bigint | null;
    barrier_id?: bigint;

    created_at?: Date;
    updated_at?: Date;
}

export type OrganisationBarrierCreationAttributes = Optional<OrganisationBarrierAttributes, "id">;

export class OrganisationBarrier
    extends Model<OrganisationBarrierAttributes, OrganisationBarrierCreationAttributes>
    implements OrganisationBarrierAttributes
{
    public id!: bigint;
    public organization_id!: bigint | null;
    public barrier_id!: bigint;

    public readonly created_at!: Date;
    public readonly updated_at!: Date;
}

OrganisationBarrier.init(
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

        barrier_id: {
            allowNull: true,
            type: DataTypes.BIGINT,
            onUpdate: "CASCADE",
            onDelete: "CASCADE",
            references: {
                model: {
                    tableName: "barriers",
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
        tableName: "organization_barriers",
        sequelize,
        underscored: true,
        createdAt: "created_at",
        updatedAt: "updated_at",
    }
);
