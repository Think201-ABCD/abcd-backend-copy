import { DataTypes, Model, Optional } from "sequelize";

// Connection
import { sequelize } from "../../Loaders/database";

// Models

interface courseSkillAttributes {
    id?: bigint;
    course_id?: bigint;
    skill_id?: bigint;

    created_at?: Date;
    updated_at?: Date;
    deleted_at?: Date;
}

export type courseSkillCreationAttributes = Optional<courseSkillAttributes, "id">;

export class CourseSkill extends Model<courseSkillAttributes, courseSkillCreationAttributes> implements courseSkillAttributes {
    public id!: bigint;
    public course_id!: bigint;
    public skill_id!: bigint;

    public readonly created_at!: Date;
    public readonly updated_at!: Date;
    public deleted_at!: Date;
}

CourseSkill.init(
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

        skill_id: {
            allowNull: false,
            type: DataTypes.BIGINT,
            onUpdate: "CASCADE",
            onDelete: "CASCADE",
            references: {
                model: "skills",
                key: "id",
            },
        },
    },
    {
        tableName: "course_skills",
        sequelize,
        underscored: true,
        createdAt: "created_at",
        updatedAt: "updated_at",
        deletedAt: "deleted_at",
    }
);
