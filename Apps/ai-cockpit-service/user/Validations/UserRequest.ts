import { body, query } from "express-validator";

export const Validate: any = (reqType: string) => {
    switch (reqType) {
        case "getAllUsers": {
            return [
                query("limit").optional().isInt({ min: 1 }).withMessage("Please enter a valid limit value"),
                query("page").optional().isInt({ min: 1 }).withMessage("Please enter a valid page value"),
                query("status").optional().notEmpty().isIn(["pending", "active", "inactive"]).withMessage("Please select a valid status"),
            ];
        }
    }
};
