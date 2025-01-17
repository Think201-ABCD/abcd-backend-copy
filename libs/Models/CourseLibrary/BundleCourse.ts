import { DataTypes, Model, Optional } from "sequelize";

// Connection
import { sequelize } from "../../Loaders/database";

// Models

interface BundleCourseAttributes {
    id?: bigint;
    bundle_id?: bigint;
    course_id?: bigint;

    created_at?: Date;
    updated_at?: Date;
    deleted_at?: Date;
}

export type BundleCourseCreationAttributes = Optional<BundleCourseAttributes, "id">;

export class BundleCourse extends Model<BundleCourseAttributes, BundleCourseCreationAttributes> implements BundleCourseAttributes {
    public id!: bigint;
    public bundle_id!: bigint;
    public course_id!: bigint;

    public readonly created_at!: Date;
    public readonly updated_at!: Date;
    public deleted_at!: Date;
}

BundleCourse.init(
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
                model: {
                    tableName: "courses",
                },
                key: "id",
            },
        },

        bundle_id: {
            allowNull: false,
            type: DataTypes.BIGINT,
            onUpdate: "CASCADE",
            onDelete: "CASCADE",
            references: {
                model: {
                    tableName: "bundles",
                },
                key: "id",
            },
        },
    },
    {
        tableName: "bundle_courses",
        sequelize,
        underscored: true,
        createdAt: "created_at",
        updatedAt: "updated_at",
        deletedAt: "deleted_at",
    }
);
