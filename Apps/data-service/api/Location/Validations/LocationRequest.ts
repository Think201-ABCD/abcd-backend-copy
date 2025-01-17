import { body, param, query } from "express-validator";

export const Validate: any = (reqType: string) => {
    switch (reqType) {
        case "getStates": {
            return [
                query("country_id")
                    .optional()
                    .notEmpty()
                    .withMessage("Please mention the country for which states are to be fetched")
                    .bail()
                    .isInt({ min: 1 })
                    .withMessage("Invalid country")
                    .toInt(),
            ];
        }
    }
};
