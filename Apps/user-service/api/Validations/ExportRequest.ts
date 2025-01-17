import { body, param, query } from "express-validator";

// Models
import { User } from "@redlof/libs/Models/Auth/User";

export const Validate: any = (reqType: string) => {
    switch (reqType) {
        case "postExpert": {
            return [
                // body("").custom((value: any, { req }: any) => {
                //     if (!req.body.topics) {
                //         throw new Error("Please select at least one preference.");
                //     }

                //     return true;
                // }),

                body("name")
                    .notEmpty()
                    .withMessage("Please enter the name")
                    .bail()
                    .isLength({ min: 3, max: 255 })
                    .withMessage("Name should be between 3 to 255 characters"),

                body("bio")
                    .notEmpty()
                    .withMessage("Please enter the bio")
                    .bail()
                    .isLength({ max: 255 })
                    .withMessage("Bio should be between 3 to 255 characters"),

                body("brief")
                    .optional()
                    .notEmpty()
                    .withMessage("Please enter the description")
                    .bail()
                    .isLength({ min: 3, max: 5000 })
                    .withMessage("Description should be between 3 to 5000 characters"),

                body("user_id")
                    .optional()
                    .notEmpty()
                    .withMessage("Please select the user")
                    .bail()
                    .isInt({ min: 1 })
                    .withMessage("Invalid user selection"),

                body("country_id")
                    .optional()
                    .notEmpty()
                    .withMessage("Please select the country")
                    .bail()
                    .isInt({ min: 1 })
                    .withMessage("Invalid country selection"),

                body("state_id")
                    .optional()
                    .notEmpty()
                    .withMessage("Please select the state")
                    .bail()
                    .isInt({ min: 1 })
                    .withMessage("Invalid state selection"),

                body("organisation_id")
                    .optional()
                    .notEmpty()
                    .withMessage("Please select the organisation")
                    .bail()
                    .isInt({ min: 1 })
                    .withMessage("Invalid organisation selection"),

                body("topics")
                    .optional()
                    .notEmpty()
                    .withMessage("Please select at least one topic")
                    .bail()
                    .isArray({ min: 1 })
                    .withMessage("Please select at least one topic")
                    .bail(),

                body("topics.*")
                    .notEmpty()
                    .withMessage("Invalid topic selection")
                    .bail()
                    .isInt()
                    .withMessage("Invalid topic selection"),

                body("behaviours")
                    .optional()
                    .notEmpty()
                    .withMessage("Please select at least one behaviour")
                    .bail()
                    .isArray({ min: 1 })
                    .withMessage("Please select at least one behaviour"),

                body("behaviours.*")
                    .optional()
                    .notEmpty()
                    .withMessage("Invalid behaviour selection")
                    .bail()
                    .isInt()
                    .withMessage("Invalid behaviour selection"),

                // body("knowledges")
                //     .optional()
                //     .withMessage("Please select at least one knowledge library")
                //     .bail()
                //     .isArray({ min: 1 })
                //     .withMessage("Please select at least one knowledge library"),

                body("knowledges.*")
                    .optional()
                    .notEmpty()
                    .withMessage("Invalid knowledge library selection")
                    .bail()
                    .isInt()
                    .withMessage("Invalid knowledge library selection"),
            ];
        }

        case "putExpert": {
            return [
                body("name")
                    .optional()
                    .notEmpty()
                    .withMessage("Please enter the name")
                    .bail()
                    .isLength({ min: 3, max: 255 })
                    .withMessage("Name should be between 3 to 255 characters"),

                body("bio")
                    .optional()
                    .notEmpty()
                    .withMessage("Please enter the bio")
                    .bail()
                    .isLength({ max: 255 })
                    .withMessage("Bio should be between 3 to 255 characters"),

                body("brief")
                    .optional()
                    .notEmpty()
                    .withMessage("Please enter the description")
                    .bail()
                    .isLength({ min: 3, max: 5000 })
                    .withMessage("Description should be between 3 to 5000 characters"),

                body("user_id")
                    .optional()
                    .notEmpty()
                    .withMessage("Please select the user")
                    .bail()
                    .isInt({ min: 1 })
                    .withMessage("Invalid user selection"),

                body("country_id")
                    .optional()
                    .notEmpty()
                    .withMessage("Please select the country")
                    .bail()
                    .isInt({ min: 1 })
                    .withMessage("Invalid country selection"),

                body("state_id")
                    .optional()
                    .notEmpty()
                    .withMessage("Please select the state")
                    .bail()
                    .isInt({ min: 1 })
                    .withMessage("Invalid state selection"),

                body("organisation_id")
                    .optional()
                    .notEmpty()
                    .withMessage("Please select the organisation")
                    .bail()
                    .isInt({ min: 1 })
                    .withMessage("Invalid organisation selection"),

                body("topics")
                    .optional()
                    .notEmpty()
                    .withMessage("Please select at least one topic")
                    .bail()
                    .isArray({ min: 1 })
                    .withMessage("Please select at least one topic")
                    .bail(),

                body("topics.*")
                    .notEmpty()
                    .withMessage("Invalid topic selection")
                    .bail()
                    .isInt()
                    .withMessage("Invalid topic selection"),

                body("behaviours")
                    .optional()
                    .notEmpty()
                    .withMessage("Please select at least one behaviour")
                    .bail()
                    .isArray({ min: 1 })
                    .withMessage("Please select at least one behaviour"),

                body("behaviours.*")
                    .notEmpty()
                    .withMessage("Invalid behaviour selection")
                    .bail()
                    .isInt()
                    .withMessage("Invalid behaviour selection"),

                body("knowledges")
                    .optional()
                    .notEmpty()
                    .withMessage("Please select at least one knowledge library")
                    .bail()
                    .isArray({ min: 1 })
                    .withMessage("Please select at least one knowledge library"),

                body("knowledges.*")
                    .notEmpty()
                    .withMessage("Invalid knowledge library selection")
                    .bail()
                    .isInt()
                    .withMessage("Invalid knowledge library selection"),
            ];
        }

        case "patchExpertStatus": {
            return [
                body("status")
                .notEmpty()
                .withMessage("Please select the user status")
                .bail()
                .isIn(["active", "inactive"])
                .withMessage("Invalid expert status"),
            ]
        }
    }
};
