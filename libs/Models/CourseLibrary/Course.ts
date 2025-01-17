import { DataTypes, Model, Optional } from "sequelize";

// Connection
import { sequelize } from "../../Loaders/database";

// Models
import { Barrier } from "../Barrier/Barrier";
import { Behaviour } from "../Behaviour/Behaviour";
import { Outcome } from "../Outcome/Outcome";
import { SubOutcome } from "../Outcome/SubOutcome";
import { Solution } from "../Solution/Solution";
import { SubTopic } from "../Topic/SubTopic";
import { Topic } from "../Topic/Topic";
import { Bundle } from "./Bundle";
import { Organisation } from "../Organisation/Organisation";
import { Skill } from "./Skill";

interface CourseAttributes {
    id?: bigint;
    organisation_id?: bigint;
    uuid?: string;
    title?: string | null;
    course_overview?: string | null;
    enrollment_process?: string | null;
    course_modules?: JSON | null;
    why_this_course?: string | null;
    status?: string;
    student_experience?: JSON | null;
    start_date?: Date | null;
    end_date?: Date | null;
    fees?: bigint;
    is_paid?: boolean;
    banner?: string | null;
    certification?: string | null;
    level?: string | null;
    external_link?: string | null;
    miscellaneous_info?: string | null;

    created_at?: Date;
    updated_at?: Date;
    deleted_at?: Date;
}

export type CourseCreationAttributes = Optional<CourseAttributes, "id">;

export class Course extends Model<CourseAttributes, CourseCreationAttributes> implements CourseAttributes {
    public id!: bigint;
    public organisation_id!: bigint;
    public uuid!: string;
    public title!: string;
    public course_overview!: string | null;
    public enrollment_process!: string | null;
    public course_modules!: JSON | null;
    public why_this_course!: string;
    public status!: string;
    public student_experience!: JSON;
    public start_date!: Date | null;
    public end_date!: Date | null;
    public fees!: bigint;
    public is_paid!: boolean;
    public banner!: string | null;
    public certification!: string | null;
    public level!: string | null;
    public external_link!: string | null;
    public miscellaneous_info!: string | null;

    public readonly created_at!: Date;
    public readonly updated_at!: Date;
    public deleted_at!: Date;
}

Course.init(
    {
        id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: DataTypes.BIGINT,
        },

        uuid: {
            allowNull: false,
            type: DataTypes.UUID,
        },

        organisation_id: {
            allowNull: true,
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

        title: {
            allowNull: false,
            type: DataTypes.STRING,
        },

        course_overview: {
            allowNull: true,
            type: DataTypes.TEXT,
        },

        enrollment_process: {
            allowNull: true,
            type: DataTypes.TEXT,
        },

        course_modules: {
            allowNull: true,
            type: DataTypes.JSONB,
        },

        why_this_course: {
            allowNull: true,
            type: DataTypes.TEXT,
        },

        status: {
            allowNull: false,
            type: DataTypes.STRING(50),
            defaultValue: "draft",
        },

        student_experience: {
            allowNull: true,
            type: DataTypes.JSONB,
        },

        start_date: {
            allowNull: true,
            type: DataTypes.DATE,
        },

        end_date: {
            allowNull: true,
            type: DataTypes.DATE,
        },

        fees: {
            allowNull: false,
            type: DataTypes.BIGINT,
            defaultValue: 0,
        },

        is_paid: {
            type: DataTypes.VIRTUAL,
            get() {
                return Number(this.getDataValue("fees")) == 0 ? false : true;
            },
        },

        banner: {
            allowNull: true,
            type: DataTypes.STRING,
            get() {
                return this.getDataValue("banner") ? `${process.env.AWS_BASE_URL}${this.getDataValue("banner")}` : null;
            },
        },

        certification: {
            allowNull: true,
            type: DataTypes.STRING,
        },

        level: {
            allowNull: true,
            type: DataTypes.STRING,
        },

        external_link: {
            allowNull: true,
            type: DataTypes.STRING,
        },

        miscellaneous_info: {
            allowNull: true,
            type: DataTypes.TEXT,
        },
    },
    {
        tableName: "courses",
        sequelize,
        underscored: true,
        paranoid: true,
        createdAt: "created_at",
        updatedAt: "updated_at",
        deletedAt: "deleted_at",
    }
);

// Outcome / Suboutcomes
Course.belongsToMany(Outcome, { as: "outcomes", through: "course_outcomes" });
Course.belongsToMany(SubOutcome, { as: "sub_outcomes", through: "course_outcomes" });

Outcome.belongsToMany(Course, { as: "courses", through: "course_outcomes" });
SubOutcome.belongsToMany(Course, { as: "courses", through: "course_outcomes" });

// Topic / Subtopics
Course.belongsToMany(Topic, { as: "topics", through: "course_topics" });
Course.belongsToMany(SubTopic, { as: "sub_topics", through: "course_topics" });

Topic.belongsToMany(Course, { as: "courses", through: "course_topics", foreignKey: "topic_id" });
SubTopic.belongsToMany(Course, { as: "courses", through: "course_topics", foreignKey: "sub_topic_id" });

// Barriers
Course.belongsToMany(Barrier, { as: "barriers", through: "course_barriers" });
Barrier.belongsToMany(Course, { as: "courses", through: "course_barriers" });

// Behaviour
Course.belongsToMany(Behaviour, { as: "behaviours", through: "course_behaviours" });
Behaviour.belongsToMany(Course, { as: "courses", through: "course_behaviours" });

// Solution
Course.belongsToMany(Solution, { as: "solutions", through: "course_solutions" });
Solution.belongsToMany(Course, { as: "courses", through: "course_solutions" });

// Skills
Course.belongsToMany(Skill, { as: "skills", through: "course_skills" });
Skill.belongsToMany(Course, { as: "courses", through: "course_skills" });

Bundle.belongsToMany(Course, { as: "courses", through: "bundle_courses" });

Course.belongsTo(Organisation, { as: "organisation", foreignKey: "organisation_id" });
