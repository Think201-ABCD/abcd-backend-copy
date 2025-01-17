import { body, param, query } from "express-validator";

export const Validate: any = (reqType: string) => {
    switch (reqType) {
        case "listCourse": {
            return [
                query("status")
                    .optional()
                    .isIn(["draft", "unpublished", "published"])
                    .withMessage("Only allowed values for status are draft or published"),
                
                query("limit").optional().isInt({ min: 1 }).withMessage("Please enter a valid limit value"),
                query("page").optional().isInt({ min: 1 }).withMessage("Please enter a valid page value"),

                query("search")
                    .optional()
                    .isString()
                    .withMessage("Please enter valid search parameter"),

                query("start_date")
                    .optional()
                    .isDate()
                    .withMessage("Please provide a valid start date"),

                query("end_date").optional().isDate().withMessage("Please provide a valid end date"),

                query("topic_ids").optional().isArray().withMessage("Invalid url"),
                query("topic_ids[*]").isInt({ min: 1 }).withMessage("Invalid topic selected"),

                query("sub_topic_ids").optional().isArray().withMessage("Invalid url"),
                query("sub_topic_ids[*]").isInt({ min: 1 }).withMessage("Invalid sub topic selected"),

                query("outcome_ids").optional().isArray().withMessage("Invalid url"),
                query("outcome_ids[*]").isInt({ min: 1 }).withMessage("Invalid outcome selected"),

                query("sub_outcome_ids").optional().isArray().withMessage("Invalid url"),
                query("sub_outcome_ids[*]").isInt({ min: 1 }).withMessage("Invalid sub outcome selected"),

                query("behaviour_ids").optional().isArray().withMessage("Invalid url"),
                query("behaviour_ids[*]").isInt({ min: 1 }).withMessage("Invalid behaviour selected"),

                query("solution_ids").optional().isArray().withMessage("Invalid url"),
                query("solution_ids[*]").isInt({ min: 1 }).withMessage("Invalid solution selected"),

                query("barrier_ids").optional().isArray().withMessage("Invalid url"),
                query("barrier_ids[*]").isInt({ min: 1 }).withMessage("Invalid barrier selected"),

                query("skill_ids").optional().isArray().withMessage("Invalid url"),
                query("skill_ids[*]").isInt({ min: 1 }).withMessage("Invalid skills selected"),

                query("organisation_ids").optional().isArray().withMessage("Invalid url"),
                query("organisation_ids[*]").isInt({ min: 1 }).withMessage("Invalid organisation selected"),

                query("level").optional().isArray().withMessage("Invalid url"),
                query("level[*]").optional().isIn(["Beginners", "Advanced", "Intermediate"]).withMessage("Invalid level selected"),

                query("enrollment_type").optional().isArray().withMessage("Invalid url"),
                query("enrollment_type[*]").isIn(["paid", "free"]).withMessage("Invalid enrollment type selected"),

                query("certification").optional().isArray().withMessage("Invalid url"),
                query("certification[*]").optional().isString().withMessage("Please enter valid certification parameter"),
            ];
        }

        case "getCourse": {
            return [
                param("course_uuid").trim().notEmpty().isUUID().withMessage("Please select a valid course")
            ];
        }

        case "postCourse": {
            return [
                body("title")
                    .trim()
                    .notEmpty()
                    .withMessage("Please enter course title")
                    .bail()
                    .isLength({ max: 255 })
                    .withMessage("Course title cannot be more than 255 characters"),

                body("course_overview")
                    .trim()
                    .notEmpty()
                    .withMessage("Please provide course overview details"),

                body("start_date")
                    .trim()
                    .notEmpty()
                    .withMessage("Please provide course start date")
                    .isDate()
                    .withMessage("Please provide a valid start date"),

                body("end_date")
                    .trim()
                    .notEmpty()
                    .withMessage("Please provide course end date")
                    .isDate()
                    .withMessage("Please provide a valid end date"),

                body("organisation_uuid")
                    .trim()
                    .optional()
                    .isUUID()
                    .withMessage("Please select a valid organisation"),

                body("banner")
                    .trim()
                    .optional()
                    .isString()
                    .withMessage("Please upload a banner image")
                    .isLength({ max: 255 })
                    .withMessage("Invalid banner image"),

                body("course_modules")
                    .optional()
                    .isArray()
                    .withMessage("Invalid course module details"),

                body("student_experience")
                    .optional()
                    .isArray()
                    .withMessage("Invalid student experience details"),

                body("fees")
                    .optional()
                    .isNumeric()
                    .withMessage("Please provide a valid fees amount"),

                body("level").notEmpty().isIn(["Beginners", "Advanced", "Intermediate"]).withMessage("Invalid level selected"),
                body("external_link").notEmpty().withMessage("Please provide an External link").isString().withMessage("Please provide a valid external link"),
                body("why_this_course")
                    .optional()
                    .bail()
                    .isLength({ min:3, max: 4000 })
                    .withMessage("why_this_course field should be between 3 to 4000 characters"),

                body("certification") 
                    .optional()
                    .isString()
                    .withMessage("Please enter valid certification detail"),

                body("topic_ids")
                    .optional()
                    .bail()
                    .isArray()
                    .withMessage("Invalid topics selected"),

                body("topic_ids[*]")
                    .bail()
                    .isInt({ min: 1 })
                    .withMessage("Invalid topic selected")
                    .toInt(),

                body("sub_topic_ids")
                    .optional()
                    .bail()
                    .isArray()
                    .withMessage("Invalid sub topics selected"),

                body("sub_topic_ids[*]")
                    .isInt({ min: 1 })
                    .withMessage("Invalid sub topic selected")
                    .toInt(),

                body("outcome_ids")
                    .optional()
                    .bail()
                    .isArray()
                    .withMessage("Invalid outcomes selected"),

                body("outcome_ids[*]")
                    .isInt({ min: 1 })
                    .withMessage("Invalid outcome selected")
                    .toInt(),

                body("sub_outcome_ids")
                    .optional()
                    .bail()
                    .isArray()
                    .withMessage("Invalid sub outcomes selected"),

                body("sub_outcome_ids[*]")
                    .isInt({ min: 1 })
                    .withMessage("Invalid sub outcome selected")
                    .toInt(),

                body("behaviour_ids")
                    .optional()
                    .bail()
                    .isArray()
                    .withMessage("Invalid behaviours selected"),

                body("behaviour_ids[*]")
                    .isInt({ min: 1 })
                    .withMessage("Invalid behaviour selected")
                    .toInt(),

                body("solution_ids")
                    .optional()
                    .bail()
                    .isArray()
                    .withMessage("Invalid solutions selected"),

                body("solution_ids[*]")
                    .isInt({ min: 1 })
                    .withMessage("Invalid solution selected")
                    .toInt(),

                body("barrier_ids")
                    .optional()
                    .bail()
                    .isArray()
                    .withMessage("Invalid barriers selected"),

                body("barrier_ids[*]")
                    .isInt({ min: 1 })
                    .withMessage("Invalid barrier selected")
                    .toInt(),

                body("skill_ids")
                    .optional()
                    .bail()
                    .isArray()
                    .withMessage("Invalid skills selected"),

                body("skill_ids[*]")
                    .isInt({ min: 1 })
                    .withMessage("Invalid skill selected")
                    .toInt(),
            ];
        }

        case "putCourse": {
            return [
                body("title")
                    .trim()
                    .optional()
                    .isLength({ max: 255 })
                    .withMessage("Course title cannot be more than 255 characters"),

                body("start_date")
                    .trim()
                    .optional()
                    .isDate()
                    .withMessage("Please provide a valid start date"),

                body("end_date")
                    .trim()
                    .optional()
                    .isDate()
                    .withMessage("Please provide a valid end date"),

                body("organisation_uuid")
                    .trim()
                    .optional()
                    .isUUID()
                    .withMessage("Please select a valid organisation"),

                body("banner")
                    .trim()
                    .optional()
                    .isString()
                    .withMessage("Please upload a banner image")
                    .isLength({ max: 255 })
                    .withMessage("Invalid banner image"),

                body("course_modules")
                    .optional()
                    .isArray()
                    .withMessage("Invalid course module details"),

                body("student_experience")
                    .optional()
                    .isArray()
                    .withMessage("Invalid student experience details"),

                body("fees")
                    .optional()
                    .isNumeric()
                    .withMessage("Please provide a valid fees amount"),

                body("level").optional().isIn(["Beginners", "Advanced", "Intermediate"]).withMessage("Invalid level selected"),
                body("external_link").optional().isString().withMessage("Please provide a valid link"),
    
                body("certification") 
                    .optional()
                    .isString()
                    .withMessage("Please enter valid certification detail"),

                body("topic_ids")
                    .optional()
                    .bail()
                    .isArray()
                    .withMessage("Invalid topics selected"),

                body("topic_ids[*]")
                    .bail()
                    .isInt({ min: 1 })
                    .withMessage("Invalid topic selected")
                    .toInt(),

                body("sub_topic_ids")
                    .optional()
                    .bail()
                    .isArray()
                    .withMessage("Invalid sub topics selected"),

                body("sub_topic_ids[*]")
                    .isInt({ min: 1 })
                    .withMessage("Invalid sub topic selected")
                    .toInt(),

                body("outcome_ids")
                    .optional()
                    .bail()
                    .isArray()
                    .withMessage("Invalid outcomes selected"),

                body("outcome_ids[*]")
                    .isInt({ min: 1 })
                    .withMessage("Invalid outcome selected")
                    .toInt(),

                body("sub_outcome_ids")
                    .optional()
                    .bail()
                    .isArray()
                    .withMessage("Invalid sub outcomes selected"),

                body("sub_outcome_ids[*]")
                    .isInt({ min: 1 })
                    .withMessage("Invalid sub outcome selected")
                    .toInt(),

                body("behaviour_ids")
                    .optional()
                    .bail()
                    .isArray()
                    .withMessage("Invalid behaviours selected"),

                body("behaviour_ids[*]")
                    .isInt({ min: 1 })
                    .withMessage("Invalid behaviour selected")
                    .toInt(),

                body("solution_ids")
                    .optional()
                    .bail()
                    .isArray()
                    .withMessage("Invalid solutions selected"),

                body("solution_ids[*]")
                    .isInt({ min: 1 })
                    .withMessage("Invalid solution selected")
                    .toInt(),

                body("barrier_ids")
                    .optional()
                    .bail()
                    .isArray()
                    .withMessage("Invalid barriers selected"),

                body("barrier_ids[*]")
                    .isInt({ min: 1 })
                    .withMessage("Invalid barrier selected")
                    .toInt(),

                body("skill_ids")
                    .optional()
                    .bail()
                    .isArray()
                    .withMessage("Invalid skills selected"),

                body("skill_ids[*]")
                    .isInt({ min: 1 })
                    .withMessage("Invalid skill selected")
                    .toInt(),
            ];
        }

        case "patchCourseStatus": {
            return [
                param("course_uuid").notEmpty().bail().isUUID().withMessage("Invalid request"),

                body("status")
                    .notEmpty()
                    .withMessage("Please enter the status")
                    .bail()
                    .isIn(["published", "unpublished"])
                    .withMessage("Only allowed values for status are published or unpublished"),
            ];
        }

        case "deleteCourse": {
            return [];
        }
    }
};
