import { body, param, query } from "express-validator";

// Models
import { User } from "@redlof/libs/Models/Auth/User";

export const Validate: any = (reqType: string) => {
    switch (reqType) {
        case "validateUuid": {
            return [
                param("uuid").notEmpty().withMessage("Invalid request").bail().isUUID().withMessage("Invalid request"),
            ];
        }

        case "postOrganisation": {
            return [
                body("logo")
                    .notEmpty()
                    .withMessage("Please upload a logo")
                    .bail()
                    .isLength({ max: 255 })
                    .withMessage("Logo file upload path should not be greater than 255 characters")
                    .custom(async (logo, { req }) => {
                        if (
                            !("is_partner" in req.body) &&
                            !("is_funder" in req.body) &&
                            !("is_contributor" in req.body)
                        ) {
                            throw new Error("Please select the organisation type");
                        }

                        return true;
                    }),

                body("name")
                    .trim()
                    .notEmpty()
                    .withMessage("Please enter the organisation name")
                    .bail()
                    .isLength({ min: 3, max: 255 })
                    .withMessage("Organisation name must be greater than 3 and less than 50 characters")
                    .bail()
                    .matches(/^([a-zA-Z0-9_]+?)([-\s'][a-zA-Z0-9_]+)*?$/)
                    .withMessage(
                        "Organisation name can contain alphabets and dash only. No special characters and double space allowed"
                    ),

                body("brief")
                    .exists()
                    .withMessage("Please enter the brief")
                    .bail()
                    .isLength({ min: 3, max: 255 })
                    .withMessage("Brief must be greater than 3 and less than 255 characters"),

                body("description")
                    .optional()
                    .exists()
                    .withMessage("Please enter the description")
                    .bail()
                    .isLength({ min: 3, max: 40000 })
                    .withMessage("Description must be greater than 3 and less than 40000 characters"),

                body("is_partner").optional().isBoolean().withMessage("Invalid orgnisation type selection").toBoolean(),

                body("is_funder").optional().isBoolean().withMessage("Invalid orgnisation type selection").toBoolean(),

                body("is_contributor")
                    .optional()
                    .isBoolean()
                    .withMessage("Invalid orgnisation type selection")
                    .toBoolean(),

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

                body("budget")
                    .optional({ checkFalsy: true })
                    .notEmpty()
                    .withMessage("Please enter the budget")
                    .bail()
                    .isInt()
                    .withMessage("Invalid budget value"),

                body("impact")
                    .optional()
                    .exists()
                    .withMessage("Please enter the impact")
                    .bail()
                    .isLength({ min: 3, max: 40000 })
                    .withMessage("Impact must be greater than 3 and less than 40000 characters"),

                body("functions")
                    .optional()
                    .exists()
                    .withMessage("Please select the expertise or focus areas")
                    .bail()
                    .isArray({ min: 1 })
                    .withMessage("Please select the expertise or focus areas"),

                body("functions.*").trim().notEmpty().withMessage("Invalid expertise or focus area selection").bail(),

                body("first_name")
                    .optional()
                    .trim()
                    .notEmpty()
                    .withMessage("Please enter the first name")
                    .bail()
                    .isLength({ min: 3, max: 35 })
                    .withMessage("First name must be greater than 3 and less than 35 characters")
                    .bail()
                    .matches(/^([a-zA-Z]+?)([-\s'][a-zA-Z]+)*?$/)
                    .withMessage(
                        "First name can contain alphabets and dash only. No special characters and double space allowed"
                    ),

                body("last_name")
                    .optional()
                    .trim()
                    .notEmpty()
                    .withMessage("Please enter the last name")
                    .bail()
                    .isLength({ min: 3, max: 35 })
                    .withMessage("Last name must be greater than 3 and less than 35 characters")
                    .bail()
                    .matches(/^([a-zA-Z]+?)([-\s'][a-zA-Z]+)*?$/)
                    .withMessage(
                        "Last name can contain alphabets and dash only. No special characters and double space allowed"
                    ),

                body("admin_email")
                    .optional()
                    .exists()
                    .withMessage("Please enter the admin email address")
                    .bail()
                    .toLowerCase()
                    .isEmail()
                    .withMessage("Please enter the valid admin email address")
                    .bail()
                    /* eslint-disable no-useless-escape */
                    .matches(/^([\w\.\-]+)@([\w\-]+)((\.(\w){2,15})+)$/)
                    .withMessage("Please enter the valid admin email address")
                    .custom(async (email, { req }) => {
                        const user = await User.findOne({ where: { email: email } });

                        if (user) {
                            return Promise.reject("Given admin email address is already in use");
                        }

                        return;
                    }),

                body("type").optional().exists().withMessage("please add type of organisation"),

                body("website_link").optional().exists().withMessage("please add website_link of organisation"),

                body("key_programs").optional().exists().withMessage("please add key_programs of organisation"),

                body("service_lines").optional().exists().withMessage("please add service_lines of organisation"),

                body("country_id").optional().exists().withMessage("please provide coutry_id"),

                body("state_id").optional().exists().withMessage("please provide state_id"),

                body("expert_ids").optional({ checkFalsy: true }).isArray().withMessage("please select experts"),

                body("expert_ids.*")
                    .optional({ checkFalsy: true })
                    .notEmpty()
                    .withMessage("Please select the experts")
                    .bail()
                    .isInt({ min: 1 })
                    .withMessage("Invalid expert_id selected")
                    .toInt(),
            ];
        }

        case "putOrganisation": {
            return [
                body("logo")
                    .optional()
                    .notEmpty()
                    .withMessage("Please upload a logo")
                    .bail()
                    .isLength({ max: 255 })
                    .withMessage("Logo file upload path should not be greater than 255 characters"),

                body("name")
                    .optional()
                    .trim()
                    .notEmpty()
                    .withMessage("Please enter the organisation name")
                    .bail()
                    .isLength({ min: 3, max: 255 })
                    .withMessage("Organisation name must be greater than 3 and less than 50 characters")
                    .bail()
                    .matches(/^([a-zA-Z0-9_]+?)([-\s'][a-zA-Z0-9_]+)*?$/)
                    .withMessage(
                        "Organisation name can contain alphabets and dash only. No special characters and double space allowed"
                    ),

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

                body("budget")
                    .optional()
                    .notEmpty()
                    .withMessage("Please enter the budget")
                    .bail()
                    .isInt()
                    .withMessage("Invalid budget value"),

                body("impact")
                    .optional()
                    .exists()
                    .withMessage("Please enter the impact")
                    .bail()
                    .isLength({ min: 3, max: 40000 })
                    .withMessage("Impact must be greater than 3 and less than 40000 characters"),

                body("status")
                    .optional()
                    .exists()
                    .withMessage("Invalid status")
                    .bail()
                    .isIn(["active", "inactive"])
                    .withMessage("Invalid orgnisation status selection"),

                body("type").optional().exists().withMessage("please add type of organisation"),

                body("website_link").optional().exists().withMessage("please add website_link of organisation"),

                body("key_programs").optional().exists().withMessage("please add key_programs of organisation"),

                body("service_lines").optional().exists().withMessage("please add service_lines of organisation"),

                body("country_id").optional().exists().withMessage("please provide coutry_id"),

                body("state_id").optional().exists().withMessage("please provide state_id"),

                body("expert_ids").optional().isArray().withMessage("please select experts"),

                body("expert_ids.*")
                    .optional()
                    .notEmpty()
                    .withMessage("Please select the experts")
                    .bail()
                    .isInt({ min: 1 })
                    .withMessage("Invalid expert_id selected")
                    .toInt(),
            ];
        }

        case "postOrganisationMember": {
            return [
                param("uuid").notEmpty().withMessage("Invalid request").bail().isUUID().withMessage("Invalid request"),

                body("first_name")
                    .trim()
                    .notEmpty()
                    .withMessage("Please enter the first name")
                    .bail()
                    .isLength({ min: 3, max: 35 })
                    .withMessage("First name must be greater than 3 and less than 35 characters")
                    .bail()
                    .matches(/^([a-zA-Z]+?)([-\s'][a-zA-Z]+)*?$/)
                    .withMessage(
                        "First name can contain alphabets and dash only. No special characters and double space allowed"
                    ),

                body("last_name")
                    .trim()
                    .notEmpty()
                    .withMessage("Please enter the last name")
                    .bail()
                    .isLength({ min: 3, max: 35 })
                    .withMessage("Last name must be greater than 3 and less than 35 characters")
                    .bail()
                    .matches(/^([a-zA-Z]+?)([-\s'][a-zA-Z]+)*?$/)
                    .withMessage(
                        "Last name can contain alphabets and dash only. No special characters and double space allowed"
                    ),

                body("email")
                    .exists()
                    .withMessage("Please enter the email address")
                    .bail()
                    .toLowerCase()
                    .isEmail()
                    .withMessage("Please enter the valid email address")
                    .bail()
                    /* eslint-disable no-useless-escape */
                    .matches(/^([\w\.\-]+)@([\w\-]+)((\.(\w){2,15})+)$/)
                    .withMessage("Please enter the valid email address")
                    .custom(async (email, { req }) => {
                        const user = await User.findOne({ where: { email: email } });

                        if (user) {
                            return Promise.reject("Given email address is already in use");
                        }

                        return;
                    }),
            ];
        }

        case "putOrganisationMember": {
            return [
                param("uuid").notEmpty().withMessage("Invalid request").bail().isUUID().withMessage("Invalid request"),

                param("member_uuid")
                    .notEmpty()
                    .withMessage("Invalid request")
                    .bail()
                    .isUUID()
                    .withMessage("Invalid request"),

                body("status")
                    .optional()
                    .exists()
                    .withMessage("Invalid status")
                    .bail()
                    .isIn(["active", "inactive"])
                    .withMessage("Invalid member status selection"),
            ];
        }

        case "putOrganisationMemberType": {
            return [
                param("uuid")
                    .notEmpty()
                    .withMessage("Invalid request")
                    .bail()
                    .isUUID()
                    .withMessage("please enter valid uuid request"),

                param("member_uuid")
                    .notEmpty()
                    .withMessage("Invalid request")
                    .bail()
                    .isUUID()
                    .withMessage("please enter valid uuid request"),

                body("type")
                    .exists()
                    .withMessage("Invalid type")
                    .bail()
                    .isIn(["admin", "member"])
                    .withMessage("Type can be either admin or member"),
            ];
        }

        case "deleteOrganisationMember": {
            return [
                param("uuid")
                    .notEmpty()
                    .withMessage("Invalid request")
                    .bail()
                    .isUUID()
                    .withMessage("please enter valid uuid request"),

                param("member_uuid")
                    .notEmpty()
                    .withMessage("Invalid request")
                    .bail()
                    .isUUID()
                    .withMessage("please enter valid uuid request"),
            ];
        }

        case "postOrganisationTopics": {
            return [
                param("uuid").notEmpty().withMessage("Invalid request").bail().isUUID().withMessage("Invalid request"),

                body("topics")
                    .notEmpty()
                    .withMessage("Please select at least one topic")
                    .bail()
                    .isArray({ min: 1 })
                    .withMessage("Please select at least one topic"),

                body("topics.*")
                    .notEmpty()
                    .withMessage("Invalid topic selection")
                    .bail()
                    .isUUID()
                    .withMessage("Invalid topic selection"),
            ];
        }

        case "postOrganisationBehaviours": {
            return [
                param("uuid").notEmpty().withMessage("Invalid request").bail().isUUID().withMessage("Invalid request"),

                body("behaviours")
                    .notEmpty()
                    .withMessage("Please select at least one behaviour")
                    .bail()
                    .isArray({ min: 1 })
                    .withMessage("Please select at least one behaviour"),

                body("behaviours.*")
                    .notEmpty()
                    .withMessage("Invalid behaviour selection")
                    .bail()
                    .isUUID()
                    .withMessage("Invalid behaviour selection"),
            ];
        }
    }
};
