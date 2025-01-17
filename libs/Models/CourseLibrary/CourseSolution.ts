import { DataTypes, Model, Optional } from "sequelize";

// Connection
import { sequelize } from "../../Loaders/database";

// Models

interface courseSolutionAttributes {
    id?: bigint;
    course_id?: bigint;
    solution_id?: bigint;

    created_at?: Date;
    updated_at?: Date;
    deleted_at?: Date;
}

export type courseSolutionCreationAttributes = Optional<courseSolutionAttributes, "id">;

export class CourseSolution extends Model<courseSolutionAttributes, courseSolutionCreationAttributes> implements courseSolutionAttributes {
    public id!: bigint;
    public course_id!: bigint;
    public solution_id!: bigint;

    public readonly created_at!: Date;
    public readonly updated_at!: Date;
    public deleted_at!: Date;
}

CourseSolution.init(
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
    },
    {
        tableName: "course_solutions",
        sequelize,
        underscored: true,
        createdAt: "created_at",
        updatedAt: "updated_at",
        deletedAt: "deleted_at",
    }
);
