import { body, param, query } from "express-validator";

// Models
import { User } from "@redlof/libs/Models/Auth/User";

export const Validate: any = (reqType: string) => {
    switch (reqType) {
        case "getUsers": {
            return [
                query("status")
                    .optional()
                    .notEmpty()
                    .withMessage("Please provide status")
                    .bail()
                    .isIn(["active", "inactive", "yet_to_join"])
                    .withMessage("Please provide valid status"),
            ];
        }
    }
};
