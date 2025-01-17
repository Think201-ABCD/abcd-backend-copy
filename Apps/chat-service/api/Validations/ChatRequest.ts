import { body, param, query } from "express-validator";

export const Validate: any = (reqType: string) => {
    switch (reqType) {
        case "postMessage": {
            return [body("question").isString().withMessage("Please enter a new question")];
        }
        case "postFeedback": {
            return [body("response_id").isString().withMessage("Please enter a new question")];
        }
        case "postWhatsAppNumberUpdate": {
            return [body("whatsapp_number")
                .notEmpty().withMessage("Please enter a number")
                .bail().isInt().withMessage("Invalid number")];
        }
    }
};
