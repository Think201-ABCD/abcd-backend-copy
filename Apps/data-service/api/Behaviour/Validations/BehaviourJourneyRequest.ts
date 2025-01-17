import { body, param, query } from "express-validator";

// Exception
import { validateTitle } from "@redlof/libs/Exceptions/ValidationException";

// Models
import { BehaviourJourney } from "@redlof/libs/Models/Behaviour/BehaviourJourney";

export const Validate: any = (reqType: string) => {
    switch (reqType) {
        case "getBehaviourJourneys": {
            return [
                param("uuid").notEmpty().withMessage("Invalid request").bail().isUUID().withMessage("Invalid request"),

                query("country_id").optional().isInt().withMessage("Please select a valid country").toInt(),

                query("state_id").optional().isInt().withMessage("Please select a valid state").toInt(),
            ];
        }

        case "postBehaviourJourney": {
            return [
                body("uuid")
                    .optional()
                    .notEmpty()
                    .withMessage("Invalid request")
                    .bail()
                    .isUUID()
                    .withMessage("Invalid request"),

                body("country_id")
                    .notEmpty()
                    .withMessage("Please select the country")
                    .bail()
                    .isInt({ min: 1 })
                    .withMessage("Invalid country selected")
                    .toInt(),

                body("state_id")
                    .optional()
                    .notEmpty()
                    .withMessage("Please select the state")
                    .bail()
                    .isInt({ min: 1 })
                    .withMessage("Invalid state selected")
                    .toInt(),

                body("title")
                    .trim()
                    .notEmpty()
                    .withMessage("Please enter the title")
                    .bail()
                    .isLength({ max: 255 })
                    .withMessage("Title cannot be more than 255 characters"),

                body("description")
                    .optional()
                    .trim()
                    .notEmpty()
                    .withMessage("Please enter the description")
                    .bail()
                    .isLength({ max: 1000 })
                    .withMessage("Invalid input, description can be upto 1000 characters"),

                body("banner")
                    .optional({ checkFalsy: true })
                    .notEmpty()
                    .withMessage("Please upload a banner image")
                    .bail()
                    .isLength({ max: 255 })
                    .withMessage("Invalid banner image"),

                body("stages")
                    .notEmpty()
                    .withMessage("Please enter the max number of stages.")
                    .bail()
                    .isInt({ min: 1, max: 8 })
                    .withMessage("Journey stages should be min 1 and max 8")
                    .toInt(),
            ];
        }

        case "putBehaviourJourneyStage": {
            return [
                param("uuid").notEmpty().withMessage("Invalid request").bail().isUUID().withMessage("Invalid request"),

                param("journey_uuid")
                    .notEmpty()
                    .withMessage("Invalid journey uuid")
                    .bail()
                    .isUUID()
                    .withMessage("Invalid journey uuid"),

                param("stage_id")
                    .notEmpty()
                    .withMessage("Please select the journey stage")
                    .bail()
                    .isInt()
                    .withMessage("Please select a valid journey stage")
                    .toInt(),

                body("title")
                    .optional()
                    .trim()
                    .notEmpty()
                    .withMessage("Please enter the title")
                    .bail()
                    .isLength({ max: 255 })
                    .withMessage("Title cannot be more than 255 characters"),

                body("description")
                    .optional()
                    .trim()
                    .notEmpty()
                    .withMessage("Please enter the description")
                    .bail()
                    .isLength({ max: 1000 })
                    .withMessage("Invalid input, description can be upto 1000 characters"),

                body("banner")
                    .optional()
                    .trim()
                    .notEmpty()
                    .withMessage("Please upload a banner image")
                    .bail()
                    .isLength({ max: 255 })
                    .withMessage("Invalid banner image"),

                body("barrier_ids")
                    .optional()
                    .notEmpty()
                    .withMessage("Please select the barriers for the solution")
                    .bail()
                    .isArray()
                    .withMessage("Invalid barriers selected"),

                body("barrier_ids.*")
                    .optional()
                    .notEmpty()
                    .withMessage("Please select the barrier")
                    .bail()
                    .isInt({ min: 1 })
                    .withMessage("Invalid barrier selected")
                    .toInt(),

                body("solution_ids")
                    .optional()
                    .notEmpty()
                    .withMessage("Please select the solutions for the solution")
                    .bail()
                    .isArray()
                    .withMessage("Invalid solutions selected"),

                body("solution_ids.*")
                    .optional()
                    .notEmpty()
                    .withMessage("Please select the solution")
                    .bail()
                    .isInt({ min: 1 })
                    .withMessage("Invalid solution selected")
                    .toInt(),
            ];
        }

        case "putBehaviourJourneyStatus": {
            return [
                param("uuid").notEmpty().withMessage("Invalid request").bail().isUUID().withMessage("Invalid request"),

                param("journey_uuid")
                    .notEmpty()
                    .withMessage("Invalid journey uuid")
                    .bail()
                    .isUUID()
                    .withMessage("Invalid journey uuid"),

                body("status")
                    .notEmpty()
                    .withMessage("Please enter the status")
                    .bail()
                    .isIn(["published", "unpublished"])
                    .withMessage("Only allowed values for status are published or unpublished"),
            ];
        }
    }
};
