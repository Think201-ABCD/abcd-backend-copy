import { User } from "@redlof/libs/Models/Auth/User";
import { body, query } from "express-validator";

export const Validate: any = (reqType: string) => {
    switch (reqType) {
        case "addCorpusUser": {
            return [
                body("role").notEmpty().isIn(["editor", "reviewer"]).bail().withMessage("Please provide a valid role"),
                body("first_name")
                    .notEmpty()
                    .withMessage("Please enter your first name")
                    .bail()
                    .isLength({ max: 255 })
                    .withMessage("First name cannot be more than 255 characters")
                    .bail()
                    .isAlpha()
                    .withMessage("First name cannot contain numbers"),

                body("last_name")
                    .notEmpty()
                    .withMessage("Please enter your last name")
                    .bail()
                    .isLength({ max: 255 })
                    .withMessage("Last name cannot be more than 255 characters")
                    .bail()
                    .isAlpha()
                    .withMessage("Last name cannot contain numbers"),

                body("email")
                    .notEmpty()
                    .withMessage("Please enter your email ID")
                    .bail()
                    .isEmail()
                    .withMessage("Please enter a valid email")
                    .bail()
                    .custom(async (email: any, { req }: any) => {
                        const user: any = await User.findOne({ where: { email: email } });

                        if (user) {
                            return Promise.reject("Email is taken. Please enter another email id");
                        }

                        return Promise.resolve();
                    }),
            ];
        }

        case "makeCorpusUser": {
            return [
                body("role").notEmpty().isIn(["editor", "reviewer"]).bail().withMessage("Please provide a valid role"),
                body("user_uuid")
                    .notEmpty()
                    .withMessage("Please select the user")
                    .bail()
                    .isUUID()
                    .withMessage("Invalid user selected"),
            ];
        }

        case "getCorpusUsers": {
            return [
                query("role").notEmpty().isIn(["editor", "reviewer"]).bail().withMessage("Please provide a valid role"),

                query("status")
                    .optional()
                    .notEmpty()
                    .isIn(["active", "inactive", "yet_to_join"])
                    .withMessage("Please select valid status"),
            ];
        }

        case "addCorpus": {
            return [
                body("corpus_type")
                    .notEmpty()
                    .isIn(["url", "file"])
                    .bail()
                    .withMessage("Please provide a valid corpus type"),
            ];
        }

        case "updateStatus": {
            return [
                body("status")
                    .notEmpty()
                    .isIn(["approved", "rejected", "yet_to_review"])
                    .bail()
                    .withMessage("Please provide a valid corpus status"),
                body("uuid").notEmpty().bail().withMessage("Please provide a valid corpus Id"),
            ];
        }

        case "editCorpus": {
            return [body("uuid").notEmpty().bail().withMessage("Please provide a valid corpus UUID")];
        }
    }
};
