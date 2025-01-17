import { Router, RequestHandler, Request, Response } from "express";
import { Op } from "sequelize";
import { v4 as uuidv4 } from "uuid";
import moment from "moment";

import { throwError } from "@redlof/libs/Exceptions/ValidationException";
import { Validate } from "../Validations/CourseRequest";
import { api } from "@redlof/libs/Helpers/helpers";
import { authorize } from "@redlof/libs/Middlewares/AuthenticationMiddleware";
import { getFilteredCourses } from "@redlof/libs/Helpers/DataFilterHelper";
import { postCourseRelations } from "@redlof/libs/Helpers/DataHelper";

// Models
import { Course } from "@redlof/libs/Models/CourseLibrary/Course";
import { Organisation } from "@redlof/libs/Models/Organisation/Organisation";
import { Outcome } from "@redlof/libs/Models/Outcome/Outcome";
import { SubOutcome } from "@redlof/libs/Models/Outcome/SubOutcome";
import { Topic } from "@redlof/libs/Models/Topic/Topic";
import { SubTopic } from "@redlof/libs/Models/Topic/SubTopic";
import { Barrier } from "@redlof/libs/Models/Barrier/Barrier";
import { Behaviour } from "@redlof/libs/Models/Behaviour/Behaviour";
import { Solution } from "@redlof/libs/Models/Solution/Solution";
import { Skill } from "@redlof/libs/Models/CourseLibrary/Skill";

export class CourseController {
    router;

    constructor() {
        this.router = Router();
        this.initializeRoutes();
    }

    initializeRoutes() {
        this.router.route("/").get(authorize(["role-all"]), Validate("listCourse"), throwError, this.listCourse);
        this.router.route("/:course_uuid").get(authorize(["role-all"]), Validate("getCourse"), throwError, this.getCourse);
        this.router.route("/").post(authorize(["role-admin"]), Validate("postCourse"), throwError, this.postCourse);
        this.router.route("/:course_uuid").put(authorize(["role-admin"]), Validate("putCourse"), throwError, this.putCourse);
        this.router.route("/:course_uuid").patch(authorize(["role-admin"]), Validate("patchCourseStatus"), throwError, this.patchCourseStatus);
        this.router.route("/:course_uuid").delete(authorize(["role-admin"]), Validate("deleteCourse"), throwError, this.deleteCourse);
        this.router.route("/skills/get").get(authorize(["role-all"]), this.getSkills);
    }

    listCourse: RequestHandler = async (req: any, res: Response) => {
        const query: any = {};

        if (req.query.status) {
            query.status = req.query.status;
        }

        if (req.query.search) {
            query.title = { [Op.iLike]: `%${req.query.search}%` };
        }

        if (req.query.certification && req.query.certification.length) {
            query.certification = { [Op.in]: req.query.certification };
        }

        if (req.query.level && req.query.level.length) {
            query.level = { [Op.in]: req.query.level };
        }

        if (req.query.enrollment_type && req.query.enrollment_type.length == 1) {
            if (req.query.enrollment_type[0] === "free") {
                query.fees = { [Op.eq]: 0 };
            } else if (req.query.enrollment_type[0] === "paid") {
                query.fees = { [Op.ne]: 0 };
            }
        }

        if (req.query.start_date) {
            query.start_date = { [Op.gte]: moment(req.query.start_date) };
        }

        if (req.query.end_date) {
            query.end_date = { [Op.lte]: moment(req.query.end_date) };
        }

        if (req.query.organisation_ids && req.query.organisation_ids.length) {
            query.organisation_id = { [Op.in]: req.query.organisation_ids };
        }

        // Get course ids if any filters applied
        const include = await getFilteredCourses(req.query);

        include.push({
            model: Organisation,
            as: "organisation",
            attributes: ["id", "uuid", "logo", "name"],
            required: false,
        });

        const { rows, count } = await Course.findAndCountAll({
            limit: req.query.limit ? req.query.limit : null,
            offset: req.query.page && req.query.limit ? (Number(req.query.page) - 1) * Number(req.query.limit) : 0,
            attributes: ["uuid", "id", "title", "status", "organisation_id", "fees", "is_paid", "start_date", "end_date", "course_overview", "banner", "created_at"],
            order: [["updated_at", "desc"]],
            where: query,
            include: include,
            subQuery: false,
            distinct: true,
        });

        const pages = req.query.limit ? count / Number(req.query.limit) : 1;

        return api("Fetched courses successfully", res, { total: count, pages: Math.ceil(pages), data: rows });
    };

    //CR - NEED TO RELOOK AT THE RELATIONS(INCLUDES)
    getCourse: RequestHandler = async (req: Request, res: Response) => {
        const course: any = await Course.findOne({
            where: { uuid: req.params.course_uuid },
            attributes: { exclude: ["updated_at", "deleted_at"] },
            include: [
                {
                    model: Organisation,
                    as: "organisation",
                    attributes: ["id", "uuid", "logo", "name"],
                },
                {
                    model: Skill,
                    as: "skills",
                    attributes: ["id", "name", "status"],
                    through: { attributes: [] },
                    required: false,
                    where: { status: "active" },
                },
                {
                    as: "outcomes",
                    model: Outcome,
                    attributes: ["id", "uuid", "title", "status", "logo"],
                    through: { attributes: [] },
                    required: false,
                    where: { status: "published" },
                },
                {
                    as: "sub_outcomes",
                    model: SubOutcome,
                    attributes: ["id", "uuid", "title", "status", "logo"],
                    through: { attributes: [] },
                    required: false,
                    where: { status: "published" },
                },
                {
                    model: Topic,
                    as: "topics",
                    attributes: ["id", "uuid", "title", "logo"],
                    through: { attributes: [] },
                    required: false,
                    where: { status: "published" },
                },
                {
                    model: SubTopic,
                    as: "sub_topics",
                    attributes: ["id", "uuid", "title", "logo"],
                    through: { attributes: [] },
                    required: false,
                    where: { status: "published" },
                },
                {
                    model: Barrier,
                    as: "barriers",
                    attributes: ["id", "uuid", "title", "logo", "type"],
                    through: { attributes: [] },
                    required: false,
                    where: { status: "published" },
                },
                {
                    model: Behaviour,
                    as: "behaviours",
                    attributes: ["id", "uuid", "title", "logo"],
                    through: { attributes: [] },
                    required: false,
                    where: { status: "published" },
                },
                {
                    model: Solution,
                    as: "solutions",
                    attributes: ["id", "uuid", "title", "logo"],
                    through: { attributes: [] },
                    required: false,
                    where: { status: "published" },
                },
            ],
        });

        if (!course) {
            throw { message: "Course not found", code: 404 };
        }

        return api("Fetched course successfully", res, course);
    };

    postCourse: RequestHandler = async (req: Request, res: Response) => {
        let organisation;
        if (req.body.organisation_uuid) {
            organisation = await Organisation.findOne({
                where: { uuid: req.body.organisation_uuid },
                attributes: ["id"],
            });

            if (!organisation) {
                throw { message: "Please select a valid organisation", code: 404 };
            }
        }

        const course = await Course.create({
            uuid: uuidv4(),
            title: req.body.title,
            organisation_id: req.body.organisation_uuid ? organisation.id : null,
            banner: req.body.banner ? req.body.banner : null,
            course_overview: req.body.course_overview,
            enrollment_process: req.body.enrollment_process ? req.body.enrollment_process : null,
            course_modules: req.body.course_modules ? req.body.course_modules : null,
            why_this_course: req.body.why_this_course ? req.body.why_this_course : null,
            student_experience: req.body.student_experience ? req.body.student_experience : null,
            fees: req.body.fees ? req.body.fees : 0,
            certification: req.body.certification ? req.body.certification : null,
            level: req.body.level,
            start_date: req.body.start_date,
            end_date: req.body.end_date,
            external_link: req.body.external_link,
            miscellaneous_info: req.body.miscellaneous_info ? req.body.miscellaneous_info : null,
        });

        await postCourseRelations(req.body, course.id);

        api("Course added successfully", res, course);
    };

    putCourse: RequestHandler = async (req: Request, res: Response) => {
        let organisation;
        if (req.body.organisation_uuid) {
            organisation = await Organisation.findOne({
                where: { uuid: req.body.organisation_uuid },
                attributes: ["id"],
            });

            if (!organisation) {
                throw { message: "Please select a valid organisation", code: 404 };
            }
        }

        const course = await Course.findOne({
            where: { uuid: req.params.course_uuid },
        });

        if (!course) {
            throw { message: "Invalid request! Course not found", code: 404 };
        }

        course.title = req.body.title ? req.body.title : course.title;
        course.organisation_id = req.body.organisation_uuid ? organisation.id : course.organisation_id;
        course.banner = req.body.banner ? req.body.banner : course.getDataValue("banner");
        course.course_overview = req.body.course_overview ? req.body.course_overview : course.course_overview;
        course.enrollment_process = req.body.enrollment_process ? req.body.enrollment_process : course.enrollment_process;
        course.course_modules = req.body.course_modules ? req.body.course_modules : course.course_modules;
        course.why_this_course = req.body.why_this_course ? req.body.why_this_course : course.why_this_course;
        course.student_experience = req.body.student_experience ? req.body.student_experience : course.student_experience;
        course.fees = req.body.fees ? req.body.fees : course.fees;
        course.certification = req.body.certification ? req.body.certification : course.certification;
        course.level = req.body.level ? req.body.level : course.level;
        course.external_link = req.body.external_link ? req.body.external_link : course.external_link;
        course.miscellaneous_info = req.body.miscellaneous_info ? req.body.miscellaneous_info : course.miscellaneous_info;
        course.start_date = req.body.start_date ? req.body.start_date : course.start_date;
        course.end_date = req.body.end_date ? req.body.end_date : course.end_date;

        await postCourseRelations(req.body, course.id);
        await course.save();

        api("course updated successfully", res, course);
    };

    patchCourseStatus: RequestHandler = async (req: Request, res: Response) => {
        const course: any = await Course.findOne({ where: { uuid: req.params.course_uuid } });

        if (!course) {
            throw { message: "Course data not found", code: 404 };
        }

        if (course.status != "published" && req.body.status == "unpublished") {
            throw { message: "Action not allowed. Course data is not published yet", code: 422 };
        }

        if (course.status === req.body.status) {
            throw { message: `Invalid request, course already ${course.status}`, code: 422 };
        }

        const message = req.body.status == "published" ? "Course data published successfully" : "Course data unpublished successfully";

        course.status = req.body.status;

        await course.save();
        api(message, res, {});
    };

    getSkills: RequestHandler = async (req: Request, res: Response) => {
        const skills = await Skill.findAll({
            where: { status: "active" },
            attributes: ["id", "name"],
            order: [["name", "asc"]],
        });
        api("Fetched skills successfully", res, skills);
    };

    deleteCourse: RequestHandler = async (req: Request, res: Response) => {
        api("not active", res, {});
    };
}
