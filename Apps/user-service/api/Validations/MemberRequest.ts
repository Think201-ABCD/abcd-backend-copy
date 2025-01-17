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

        case "postMemberPreferences": {
            return [
                param("uuid").notEmpty().withMessage("Invalid request").bail().isUUID().withMessage("Invalid request"),

                body("").custom((value: any, { req }: any) => {
                    if (!req.body.topics && !req.body.behaviours) {
                        throw new Error("Please select at least one preference.");
                    }

                    return true;
                }),

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
                    .isUUID()
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
                    .isUUID()
                    .withMessage("Invalid behaviour selection"),
            ];
        }
    }
};
