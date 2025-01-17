import { DataTypes, Model, Optional } from "sequelize";

// Connection
import { sequelize } from "../../Loaders/database";

// Models

interface courseOutcomeAttributes {
    id?: bigint;
    course_id?: bigint;
    outcome_id?: bigint | null;
    sub_outcome_id?: bigint | null;

    created_at?: Date;
    updated_at?: Date;
    deleted_at?: Date;
}

export type courseOutcomeCreationAttributes = Optional<courseOutcomeAttributes, "id">;

export class CourseOutcome extends Model<courseOutcomeAttributes, courseOutcomeCreationAttributes> implements courseOutcomeAttributes {
    public id!: bigint;
    public course_id!: bigint;
    public outcome_id!: bigint | null;
    public sub_outcome_id!: bigint | null;

    public readonly created_at!: Date;
    public readonly updated_at!: Date;
    public deleted_at!: Date;
}

CourseOutcome.init(
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

        outcome_id: {
            allowNull: true,
            type: DataTypes.BIGINT,
            onUpdate: "CASCADE",
            onDelete: "CASCADE",
            references: {
                model: "outcomes",
                key: "id",
            },
        },

        sub_outcome_id: {
            allowNull: true,
            type: DataTypes.BIGINT,
            onUpdate: "CASCADE",
            onDelete: "CASCADE",
            references: {
                model: "sub_outcomes",
                key: "id",
            },
        },
    },
    {
        tableName: "course_outcomes",
        sequelize,
        underscored: true,
        createdAt: "created_at",
        updatedAt: "updated_at",
        deletedAt: "deleted_at",
    }
);
