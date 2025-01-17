import { body, param, query } from "express-validator";

export const Validate: any = (reqType: string) => {
    switch (reqType) {
        case "putProfile": {
            return [
                body("first_name")
                    .optional()
                    .notEmpty()
                    .withMessage("Please enter your first name")
                    .bail()
                    .isLength({ max: 255 })
                    .withMessage("First name cannot be more than 255 characters")
                    .bail()
                    .isAlpha()
                    .withMessage("First name must not contain any spaces, number or special characters"),

                body("last_name")
                    .optional()
                    .notEmpty()
                    .withMessage("Please enter your last name")
                    .bail()
                    .isLength({ max: 255 })
                    .withMessage("Last name cannot be more than 255 characters")
                    .bail()
                    .isAlpha()
                    .withMessage("Last name must not contain any number or special characters"),

                body("photo")
                    .optional()
                    .notEmpty()
                    .withMessage("Please upload the profile picture")
                    .bail()
                    .isLength({ max: 255 })
                    .withMessage("Invalid profile picture"),

                body("country_id")
                    .optional()
                    .notEmpty()
                    .withMessage("Please select the country")
                    .bail()
                    .isInt()
                    .withMessage("Invalid country selection"),

                body("state_id")
                    .optional()
                    .notEmpty()
                    .withMessage("Please select the state")
                    .bail()
                    .isInt()
                    .withMessage("Invalid state selection"),

                body("type")
                    .optional()
                    .notEmpty()
                    .withMessage("Please select the user type")
                    .bail()
                    .isIn(["organisation", "individual", "expert"])
                    .withMessage("Invalid user type"),

                body("status")
                    .optional()
                    .notEmpty()
                    .withMessage("Please select the user status")
                    .bail()
                    .isIn(["active", "inactive"])
                    .withMessage("Invalid user status"),

                body("designation")
                    .optional()
                    .notEmpty()
                    .withMessage("Please enter your designation")
                    .bail()
                    .isLength({ max: 255 })
                    .withMessage("Designation cannot be more than 255 characters"),
            ];
        }

        case "postOrganisation": {
            return [
                body("").custom(async (val, { req }) => {
                    /* eslint-disable no-prototype-builtins */
                    if (!req.body.hasOwnProperty("name") && !req.body.hasOwnProperty("organisation_uuid")) {
                        throw new Error("Please select or create an organisation");
                    }

                    return true;
                }),

                body("organisation_uuid")
                    .optional()
                    .if((value: any, req: any) => !req.req.body.name)
                    .notEmpty()
                    .withMessage("Please select the organisation")
                    .bail()
                    .isUUID()
                    .withMessage("Invalid organisation selection"),

                body("name")
                    .optional()
                    .if((value: any, req: any) => req.req.body.name)
                    .notEmpty()
                    .withMessage("Please enter organisation name")
                    .bail()
                    .isLength({ max: 255 })
                    .withMessage("Organisation name cannot be more than 255 characters"),

                body("logo")
                    .if((value: any, req: any) => req.req.body.name)
                    .optional()
                    .notEmpty()
                    .withMessage("Please upload organisation logo")
                    .bail()
                    .isLength({ max: 255 })
                    .withMessage("Invalid organisation logo"),

                body("category")
                    .if((value: any, req: any) => req.req.body.name)
                    .notEmpty()
                    .withMessage("Please select the category")
                    .bail()
                    .isLength({ min: 3, max: 255 })
                    .withMessage("Category must be atleast 3 and atmost 255 characters"),

                body("country_id")
                    .if((value: any, req: any) => req.req.body.name)
                    .notEmpty()
                    .withMessage("Please select the country")
                    .bail()
                    .isInt()
                    .withMessage("Invalid country selection"),

                body("state_id")
                    .if((value: any, req: any) => req.req.body.name)
                    .notEmpty()
                    .withMessage("Please select the state")
                    .bail()
                    .isInt()
                    .withMessage("Invalid state selection"),
            ];
        }
    }
};
