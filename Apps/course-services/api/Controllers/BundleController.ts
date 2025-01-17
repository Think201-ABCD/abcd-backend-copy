import { Router, RequestHandler, Request, Response } from "express";
import { Op } from "sequelize";
import { v4 as uuidv4 } from "uuid";

import { throwError } from "@redlof/libs/Exceptions/ValidationException";
import { Validate } from "../Validations/BundleRequest";
import { api } from "@redlof/libs/Helpers/helpers";
import { authorize } from "@redlof/libs/Middlewares/AuthenticationMiddleware";

// Models
import { Bundle } from "@redlof/libs/Models/CourseLibrary/Bundle";
import { Course } from "@redlof/libs/Models/CourseLibrary/Course";
import { BundleCourse } from "@redlof/libs/Models/CourseLibrary/BundleCourse";
import { Organisation } from "@redlof/libs/Models/Organisation/Organisation";

export class BundleController {
    router;

    constructor() {
        this.router = Router();
        this.initializeRoutes();
    }

    initializeRoutes() {
        this.router.route("/").get(authorize(["role-all"]), Validate("listBundle"), throwError, this.listBundle);
        this.router.route("/").post(authorize(["role-admin"]), Validate("postBundle"), throwError, this.postBundle);
        this.router.route("/:bundle_uuid").get(authorize(["role-all"]), Validate("getBundle"), throwError, this.getBundle);
        this.router.route("/:bundle_uuid").put(authorize(["role-admin"]), Validate("putBundle"), throwError, this.putBundle);
        this.router.route("/:bundle_uuid").delete(authorize(["role-admin"]), Validate("deleteBundle"), throwError, this.deleteBundle);

        this.router.route("/:bundle_uuid/add-course").post(authorize(["role-admin"]), Validate("postBundleCourse"), throwError, this.postBundleCourse);
        this.router.route("/:bundle_uuid/remove-course/:course_uuid").delete(authorize(["role-admin"]), Validate("deleteBundleCourse"), throwError, this.deleteBundleCourse);
    }

    listBundle: RequestHandler = async (req: any, res: Response) => {
        const query: any = {};

        if (req.query.search) {
            query.name = { [Op.iLike]: `%${req.query.search}%` };
        }

        const { rows, count } = await Bundle.findAndCountAll({
            where: query,
            limit: req.query.limit ? req.query.limit : null,
            offset: req.query.page && req.query.limit ? (Number(req.query.page) - 1) * Number(req.query.limit) : 0,
            order: [["created_at", "desc"]],
        });

        const pages = req.query.limit ? count / Number(req.query.limit) : 1;
        api("Course bundles fetched successfully", res, { total: count, pages: Math.ceil(pages), data: rows });
    };

    postBundle: RequestHandler = async (req: Request, res: Response) => {
        const [bundle, created] = await Bundle.findOrCreate({
            where: { name: req.body.name },
            defaults: {
                uuid: uuidv4(),
                description: req.body.description,
                banner: req.body.banner ? req.body.banner : null,
            },
        });

        if (!created) {
            throw { message: `Bundle with name ${req.body.name} already exist`, code: 422, report: false };
        }
        api("Course Bundle added successfully", res, bundle);
    };

    getBundle: RequestHandler = async (req: Request, res: Response) => {
        const bundle = await Bundle.findOne({
            where: { uuid: req.params.bundle_uuid },
            include: [
                {
                    model: Course,
                    attributes: ["uuid", "id", "title", "course_overview", "banner", "status", "organisation_id", "fees", "is_paid", "start_date", "end_date", "created_at"],
                    as: "courses",
                    through: { attributes: [] },
                    include: [
                        {
                            model: Organisation,
                            as: "organisation",
                            attributes: ["id", "uuid", "logo", "name"],
                            required: false,
                        },
                    ],
                },
            ],
        });

        if (!bundle) {
            throw { message: "Bundle not found. Invalid request", code: 404 };
        }
        api("Successfull", res, bundle);
    };

    putBundle: RequestHandler = async (req: Request, res: Response) => {
        const bundle = await Bundle.findOne({
            where: { uuid: req.params.bundle_uuid },
        });

        if (!bundle) {
            throw { message: "Bundle not found. Invalid request", code: 404 };
        }

        bundle.name = req.body.name ? req.body.name : bundle.name;
        bundle.description = req.body.description ? req.body.description : bundle.description;
        bundle.banner = req.body.banner ? req.body.banner : bundle.getDataValue("banner");
        await bundle.save();
        api("Bundle updated successfully", res, bundle);
    };

    deleteBundle: RequestHandler = async (req: Request, res: Response) => {
        const bundle = await Bundle.findOne({
            where: { uuid: req.params.bundle_uuid },
        });

        if (!bundle) {
            throw { message: "Bundle not found. Invalid request", code: 404 };
        }

        await BundleCourse.destroy({ where: { bundle_id: bundle.id } });

        await bundle.destroy();

        api(`Bundle ${bundle.name} removed successfully`, res, {});
    };

    postBundleCourse: RequestHandler = async (req: Request, res: Response) => {
        const bundle = await Bundle.findOne({
            where: { uuid: req.params.bundle_uuid },
            attributes: ["id", "name"],
        });

        if (!bundle) {
            throw { message: "Bundle not found. Invalid request", code: 404 };
        }

        const courses = [
            ...(await Course.findAll({
                where: { uuid: { [Op.in]: req.body.course_uuids }, status: "published" },
                attributes: ["id"],
            })),
        ].map((data: any) => parseInt(data.id));

        if (courses.length === 0) {
            throw { message: "Please select atleast one valid course to be added", code: 422 };
        }

        const all_course_ids = [
            ...(await BundleCourse.findAll({
                where: { bundle_id: bundle.id },
            })),
        ].map((t: any) => parseInt(t.course_id));

        const BundleCourseToBeAdded = courses.filter((t: any) => !all_course_ids.includes(t));

        const BundleCourseCreate: any = [];

        for (const id of BundleCourseToBeAdded) {
            BundleCourseCreate.push({ bundle_id: bundle.id, course_id: id });
        }

        await BundleCourse.bulkCreate(BundleCourseCreate);
        api(`Courses added to bundle ${bundle.name}`, res, {});
    };

    deleteBundleCourse: RequestHandler = async (req: Request, res: Response) => {
        const bundle = await Bundle.findOne({
            where: { uuid: req.params.bundle_uuid },
            attributes: ["id", "name"],
        });

        if (!bundle) {
            throw { message: "Bundle not found. Please select a valild bundle", code: 404 };
        }

        const course = await Course.findOne({
            where: { uuid: req.params.course_uuid },
            attributes: ["id", "title"],
        });

        if (!course) {
            throw { message: "Course not found. Please select a valild course", code: 404 };
        }

        const bundleCourse = await BundleCourse.findOne({
            where: { bundle_id: bundle.id, course_id: course.id },
        });

        if (!bundleCourse) {
            throw { message: `Course ${course.title} is not part of bundle ${bundle.name}`, code: 422 };
        }
        await bundleCourse.destroy();
        api(`Course removed from bundle ${bundle.name}`, res, {});
    };
}
