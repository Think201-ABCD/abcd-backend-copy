import { body, param, query } from "express-validator";

export const Validate: any = (reqType: string) => {
    switch (reqType) {
        case "postOrganisation": {
            return [
                body("name")
                    .trim()
                    .notEmpty()
                    .withMessage("Please enter the organisation name")
                    .bail()
                    .isLength({ min: 3, max: 50 })
                    .withMessage("Organisation name must be greater than 3 and less than 50 characters"),

                body("logo")
                    .trim()
                    .notEmpty()
                    .withMessage("Please upload a logo of the organisation")
                    .bail()
                    .isLength({ max: 255 })
                    .withMessage("Logo file upload path should not be greater than 255 characters"),

                body("brief").notEmpty().withMessage("Please enter the brief").bail().isLength({ min: 3, max: 20000 }).withMessage("Brief must be greater than 3 and less than 20000 characters"),
                body("country_id").notEmpty().isInt().withMessage("Please select a valid country"),
                body("state_id").notEmpty().isInt().withMessage("Please select a valid state"),
            ];
        }

        case "patchOrganisationStatus": {
            return [
                body("status").notEmpty().isIn(["active", "inactive"]).withMessage("Please provide a valid status"),
                param("uuid").notEmpty().isUUID().withMessage("Please select an organization"),
            ];
        }

        case "postAddMembers": {
            return [
                param("uuid").notEmpty().isUUID().withMessage("Please select an organisation"),
                body("users").notEmpty().isArray().withMessage("Please select atleast one user"),
                body("users[*]").isUUID().withMessage("Please select a valid user"),
            ];
        }

        case "getNonMembers": {
            return [param("uuid").notEmpty().isUUID().withMessage("Please select an organisation")];
        }

        case "getOrganisations": {
            return [
                query("status").optional().isIn(["pending", "active", "inactive"]).withMessage("Please provide a valid status"),
                query("type").optional().isIn(["funder", "contributor", "partner"]).withMessage("Please provide a valid type"),
                query("limit").optional().isInt({ min: 1 }).withMessage("Please enter a valid limit value"),
                query("page").optional().isInt({ min: 1 }).withMessage("Please enter a valid page value"),
            ];
        }

        case "getOrganisation": {
            return [param("uuid").notEmpty().isUUID().withMessage("Please select an organisation")];
        }

        case "putOrganisation": {
            return [
                param("uuid").notEmpty().isUUID().withMessage("Please select a valid organisation"),

                body("name")
                    .trim()
                    .optional()
                    .notEmpty()
                    .withMessage("Please enter the organisation name")
                    .isLength({ min: 3, max: 50 })
                    .withMessage("Organisation name must be greater than 3 and less than 50 characters")
                    .bail()
                    .matches(/^([a-zA-Z0-9_]+?)([-\s'][a-zA-Z0-9_]+)*?$/)
                    .withMessage("Organisation name can contain alphabets and dash only. No special characters and double space allowed"),

                body("logo")
                    .trim()
                    .optional()
                    .notEmpty()
                    .withMessage("Please upload a logo")
                    .bail()
                    .isLength({ max: 255 })
                    .withMessage("Logo file upload path should not be greater than 255 characters"),

                body("banner").trim().optional().isLength({ max: 255 }).withMessage("Banner file upload path should not be greater than 255 characters"),

                body("brief").optional().isLength({ min: 3, max: 20000 }).withMessage("Brief must be greater than 3 and less than 20000 characters"),

                body("country_id").optional().isInt().withMessage("Please select a valid country"),

                body("state_id").optional().isInt().withMessage("Please select a valid state"),

                body("description")
                    .optional()
                    .exists()
                    .withMessage("Please enter the description")
                    .bail()
                    .isLength({ min: 3, max: 40000 })
                    .withMessage("Description must be greater than 3 and less than 40000 characters"),

                body("source")
                    .optional()
                    .notEmpty()
                    .withMessage("Please enter the source")
                    .bail()
                    .isLength({ min: 3, max: 255 })
                    .withMessage("Source must be greater than 3 and less than 255 characters"),

                body("category")
                    .optional()
                    .notEmpty()
                    .withMessage("Please enter the category")
                    .bail()
                    .isLength({ min: 3, max: 255 })
                    .withMessage("Category must be greater than 3 and less than 255 characters"),

                body("budget").optional().notEmpty().withMessage("Please enter the budget").bail().isInt().withMessage("Invalid budget value"),

                body("impact")
                    .optional()
                    .exists()
                    .withMessage("Please enter the impact")
                    .bail()
                    .isLength({ min: 3, max: 40000 })
                    .withMessage("Impact must be greater than 3 and less than 40000 characters"),

                body("type").optional().exists().withMessage("please add type of organisation"),

                body("website").optional().exists().withMessage("please add website_link of organisation"),

                body("key_programs").optional().exists().withMessage("please add key_programs of organisation"),

                body("service_lines").optional().exists().withMessage("please add service_lines of organisation"),

                body("expert_ids").optional().isArray().withMessage("please select experts"),

                body("expert_ids[*]").optional().bail().isInt({ min: 1 }).withMessage("Invalid expert_id selected").toInt(),

                body("functions").optional().isArray().withMessage("Please select the expertise or focus areas"),

                body("functions[*]").trim().optional().isString().withMessage("Invalid expertise or focus area selection").bail(),

                body("admin_first_name")
                    .optional()
                    .trim()
                    .notEmpty()
                    .withMessage("Please enter the Admin first name")
                    .bail()
                    .isLength({ min: 3, max: 35 })
                    .withMessage("First name must be greater than 3 and less than 35 characters")
                    .bail()
                    .matches(/^([a-zA-Z]+?)([-\s'][a-zA-Z]+)*?$/)
                    .withMessage("First name can contain alphabets and dash only. No special characters and double space allowed"),

                body("admin_last_name")
                    .optional()
                    .trim()
                    .notEmpty()
                    .withMessage("Please enter the Admin last name")
                    .bail()
                    .isLength({ min: 1, max: 35 })
                    .withMessage("Last name must be greater than 1 and less than 35 characters")
                    .bail()
                    .matches(/^([a-zA-Z]+?)([-\s'][a-zA-Z]+)*?$/)
                    .withMessage("Last name can contain alphabets and dash only. No special characters and double space allowed"),

                body("is_partner").optional().isBoolean().withMessage("Invalid orgnisation type selection").toBoolean(),

                body("is_funder").optional().isBoolean().withMessage("Invalid orgnisation type selection").toBoolean(),

                body("is_contributor").optional().isBoolean().withMessage("Invalid orgnisation type selection").toBoolean(),
            ];
        }

        case "deleteMember": {
            return [param("uuid").notEmpty().isUUID().withMessage("Please select a valid organisation"), query("member_uuid").notEmpty().isUUID().withMessage("Please select a valid user")];
        }
    }
};
