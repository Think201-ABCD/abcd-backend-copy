import { DataTypes, Model, Optional } from "sequelize";

// Connection
import { sequelize } from "../../Loaders/database";

// Models

interface courseBarrierAttributes {
    id?: bigint;
    course_id?: bigint;
    barrier_id?: bigint;

    created_at?: Date;
    updated_at?: Date;
    deleted_at?: Date;
}

export type courseBarrierCreationAttributes = Optional<courseBarrierAttributes, "id">;

export class CourseBarrier extends Model<courseBarrierAttributes, courseBarrierCreationAttributes> implements courseBarrierAttributes {
    public id!: bigint;
    public course_id!: bigint;
    public barrier_id!: bigint;

    public readonly created_at!: Date;
    public readonly updated_at!: Date;
    public deleted_at!: Date;
}

CourseBarrier.init(
    {
        id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: DataTypes.BIGINT,
        },

        course_id: {
            allowNull: false,
            type: DataTypes.BIGINT,
            onUpdate: "CASCADE",
            onDelete: "CASCADE",
            references: {
                model: "courses",
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
        tableName: "course_barriers",
        sequelize,
        underscored: true,
        createdAt: "created_at",
        updatedAt: "updated_at",
        deletedAt: "deleted_at",
    }
);
