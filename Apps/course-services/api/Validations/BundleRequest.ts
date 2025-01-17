import { body, param, query } from "express-validator";

export const Validate: any = (reqType: string) => {
    switch (reqType) {
        case "listBundle": {
            return [
                query("search").optional().isString().withMessage("Please enter valid search parameter"),
                query("limit").optional().isInt({ min: 1 }).withMessage("Please enter a valid limit value"),
                query("page").optional().isInt({ min: 1 }).withMessage("Please enter a valid page value"),
            ];
        }

        case "getBundle": {
            return [param("bundle_uuid").notEmpty().isUUID().withMessage("Please select a valid bundle")];
        }

        case "postBundle": {
            return [
                body("name").trim().notEmpty().withMessage("Please provide a name for the bundle").bail().isLength({ max: 255 }).withMessage("Bundle name cannot be more than 255 characters"),
                body("description").trim().notEmpty().withMessage("Please provide a description for the bundle").isString().withMessage("Bundle description should be string"),
                body("banner").trim().optional().isString().withMessage("Please upload a banner image").isLength({ max: 255 }).withMessage("Invalid banner image"),
            ];
        }

        case "putBundle": {
            return [
                param("bundle_uuid").trim().notEmpty().isUUID().withMessage("Please select a valid bundle"),
                body("name").trim().optional().isLength({ max: 255 }).withMessage("Bundle name cannot be more than 255 characters"),
                body("description").trim().optional().isString().withMessage("Bundle description should be string"),
                body("banner").trim().optional().isString().withMessage("Please upload a banner image").isLength({ max: 255 }).withMessage("Invalid banner image"),
            ];
        }

        case "deleteBundle": {
            return [];
        }

        case "postBundleCourse": {
            return [
                param("bundle_uuid").notEmpty().isUUID().withMessage("Please select a valid bundle"),
                body("course_uuids").isArray().withMessage("Invalid course selected"),
                body("course_uuids[*]").isUUID().withMessage("Please select a valid course")
            ];

        }

        case "deleteBundleCourse": {
            return [
                param("bundle_uuid").notEmpty().isUUID().withMessage("Please select a valid bundle"),
                param("course_uuid").notEmpty().isUUID().withMessage("Please select a valid course")
            ];
        }
    }
};
