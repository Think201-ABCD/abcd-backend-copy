import { body, param, query } from "express-validator";

export const Validate: any = (reqType: string) => {
    switch (reqType) {
        case "postPreferences": {
            return [
                body("topics").optional().isArray({ max: 5 }).withMessage("Topics cannot exceed more than 5"),
                body("topics[*]").isUUID().withMessage("Please provide valid topic"),

                body("behaviours").optional().isArray({ max: 5 }).withMessage("Behaviours cannot exceed more than 5"),
                body("behaviours[*]").isUUID().withMessage("Please provide valid behaviour"),

                body("outcomes").optional().isArray({ max: 5 }).withMessage("Outcomes cannot exceed more than 5"),
                body("outcomes[*]").isUUID().withMessage("Please provide valid outcome"),

                query("user_uuid").optional().isUUID().withMessage("Please select a valid user"),
            ];
        }

        case "getMembers": {
            return [
                query("role")
                    .optional()
                    .isIn(["role-member", "role-organisation-admin", "role-organisation-member", "role-corpus-reviewer", "role-corpus-editor"])
                    .withMessage("Please select a valid role"),

                query("type").optional().isIn(["organisation_users", "non_organisation_users"]).withMessage("Please select a valid type"),
                query("status").optional().isIn(["active", "inactive", "pending", "yet_to_join"]).withMessage("Please select a valid status"),
                query("limit").optional().isInt({ min: 1 }).withMessage("Please enter a valid limit value"),
                query("page").optional().isInt({ min: 1 }).withMessage("Please enter a valid page value"),
            ];
        }

        case "getMember": {
            return [param("uuid").notEmpty().isUUID().withMessage("Please select a valid user")];
        }

        case "putMember": {
            return [
                param("uuid").notEmpty().isUUID().withMessage("Please select a valid user"),
                body("first_name")
                    .optional()
                    .bail()
                    .isLength({ max: 255 })
                    .withMessage("First name cannot be more than 255 characters")
                    .bail()
                    .trim()
                    .matches(/^[a-zA-Z ,.'-]*$/gm)
                    .withMessage("First Name must only contain alphabets"),

                body("last_name")
                    .optional()
                    .bail()
                    .isLength({ max: 255 })
                    .withMessage("Last name cannot be more than 255 characters")
                    .bail()
                    .trim()
                    .matches(/^[a-zA-Z ,.'-]*$/gm)
                    .withMessage("Last Name must only contain alphabets"),

                body("email")
                    .optional()
                    .isEmail()
                    .withMessage("Please enter a valid email")
                    .bail(),

                body("phone").optional().bail().isMobilePhone("any").withMessage("Please enter a valid phone number"),

                body("company").optional().isLength({ max: 255 }).withMessage("Company name cannot be more than 255 characters"),

                body("designation").optional().isLength({ max: 255 }).withMessage("Designation cannot be more than 255 characters"),
            ];
        }
    }
};
