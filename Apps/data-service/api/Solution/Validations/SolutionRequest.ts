import { body, param, query } from "express-validator";
import { validateTitle } from "@redlof/libs/Exceptions/ValidationException";
import { Solution } from "@redlof/libs/Models/Solution/Solution";

export const Validate: any = (reqType: string) => {
    switch (reqType) {
        case "getSolutions": {
            return [
                query("status")
                    .optional()
                    .isIn(["draft", "unpublished", "published"])
                    .withMessage("Only allowed values for status are draft or published"),

                query("search").optional().isString().withMessage("Please enter valid search parameter"),
            ];
        }

        case "getSolution": {
            return [
                param("uuid").notEmpty().withMessage("Invalid request").bail().isUUID().withMessage("Invalid request"),

                query("country_id").optional().isInt().withMessage("Please select a valid country").toInt(),

                query("state_id").optional().isInt().withMessage("Please select a valid state").toInt(),
            ];
        }

        case "postSolution": {
            return [
                body("uuid")
                    .optional()
                    .notEmpty()
                    .withMessage("Invalid request")
                    .bail()
                    .isUUID()
                    .withMessage("Invalid request"),

                body("title")
                    .trim()
                    .notEmpty()
                    .withMessage("Please enter the title")
                    .bail()
                    .isLength({ max: 255 })
                    .withMessage("Title cannot be more than 255 characters")
                    .bail()
                    .custom(
                        async (value: any, { req }: any) =>
                            await validateTitle(Solution, value, req.body.uuid ? req.body.uuid : null)
                    ),

                body("logo")
                    .optional()
                    .trim()
                    .notEmpty()
                    .withMessage("Please upload a logo")
                    .bail()
                    .isLength({ max: 255 })
                    .withMessage("Invalid logo"),

                body("source_country_id")
                    .notEmpty()
                    .withMessage("Please select source country")
                    .bail()
                    .isInt({ min: 1 })
                    .withMessage("Invalid source country selected"),

                body("source_state_id")
                    .optional()
                    .notEmpty()
                    .withMessage("Please select source state")
                    .bail()
                    .isInt({ min: 1 })
                    .withMessage("Invalid source state selected"),

                body("expiry")
                    .notEmpty()
                    .withMessage("Please select the expiry date")
                    .bail()
                    .custom((expiryDate) => {
                        const d = new Date(expiryDate);

                        if (isNaN(d.getTime())) {
                            throw "Invalid start date";
                        }

                        if (new Date(expiryDate) < new Date()) {
                            throw new Error("Expiry date should be future date.");
                        }

                        return true;
                    }),

                body("source_links").optional().isArray().withMessage("Please provide valid source links"),
                body("source_links[*]").isString().isURL().withMessage("Please provide a valid source link"),

                body("development_year").optional().notEmpty().withMessage("Please select year of first development"),

                body("priority").optional().notEmpty().withMessage("Please select priority"),

                body("confidence").optional().notEmpty().withMessage("Please select confidence level"),

                body("evidence_type").optional().notEmpty().withMessage("Please select the evidence type"),

                body("categories")
                    .optional()
                    .notEmpty()
                    .withMessage("Please select the categories")
                    .bail()
                    .isArray()
                    .withMessage("Invalid categories selected"),

                body("sub_categories")
                    .optional()
                    .notEmpty()
                    .withMessage("Please select the sub category")
                    .bail()
                    .isArray()
                    .withMessage("Invalid sub categories selected"),

                body("outcome_ids")
                    .notEmpty()
                    .withMessage("Please select the outcomes")
                    .bail()
                    .isArray()
                    .withMessage("Invalid outcomes selected"),

                body("outcome_ids.*")
                    .notEmpty()
                    .withMessage("Please select the outcome")
                    .bail()
                    .isInt({ min: 1 })
                    .withMessage("Invalid outcome selected")
                    .toInt(),

                body("sub_outcome_ids")
                    .optional()
                    .notEmpty()
                    .withMessage("Please select the sub outcomes")
                    .bail()
                    .isArray()
                    .withMessage("Invalid sub outcomes selected"),

                body("sub_outcome_ids.*")
                    .notEmpty()
                    .withMessage("Please select the sub outcome")
                    .bail()
                    .isInt({ min: 1 })
                    .withMessage("Invalid sub outcome selected")
                    .toInt(),

                body("sub_topic_ids")
                    .optional()
                    .notEmpty()
                    .withMessage("Please select the sub topics")
                    .bail()
                    .isArray()
                    .withMessage("Invalid sub topics selected"),

                body("sub_topic_ids.*")
                    .notEmpty()
                    .withMessage("Please select the sub topic")
                    .bail()
                    .isInt({ min: 1 })
                    .withMessage("Invalid sub topic selected")
                    .toInt(),

                body("topic_ids")
                    .notEmpty()
                    .withMessage("Please select the topics")
                    .bail()
                    .isArray()
                    .withMessage("Invalid topics selected"),

                body("topic_ids.*")
                    .notEmpty()
                    .withMessage("Please select the topic")
                    .bail()
                    .isInt({ min: 1 })
                    .withMessage("Invalid topic selected")
                    .toInt(),

                body("country_ids")
                    .notEmpty()
                    .withMessage("Please select the countries for the solution")
                    .bail()
                    .isArray()
                    .withMessage("Invalid countries selected"),

                body("country_ids.*")
                    .notEmpty()
                    .withMessage("Please select the country")
                    .bail()
                    .isInt({ min: 1 })
                    .withMessage("Invalid country selected")
                    .toInt(),

                body("behaviour_ids")
                    .notEmpty()
                    .withMessage("Please select the behaviours for the solution")
                    .bail()
                    .isArray()
                    .withMessage("Invalid behaviours selected"),

                body("behaviour_ids.*")
                    .notEmpty()
                    .withMessage("Please select the behaviour")
                    .bail()
                    .isInt({ min: 1 })
                    .withMessage("Invalid behaviour selected")
                    .toInt(),

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
            ];
        }

        case "putSolutionCountry": {
            return [
                param("uuid").notEmpty().withMessage("Invalid request").bail().isUUID().withMessage("Invalid request"),

                body("solution_countries")
                    .notEmpty()
                    .withMessage("Please enter the country specific details for the solution")
                    .bail()
                    .isArray()
                    .withMessage("Invalid request"),

                body("solution_countries.*.country_id")
                    .notEmpty()
                    .withMessage("Please select the country")
                    .bail()
                    .isInt({ min: 1 })
                    .withMessage("Invalid country selected")
                    .toInt(),

                body("solution_countries.*.brief")
                    .optional({ checkFalsy: true })
                    .notEmpty()
                    .withMessage("Please enter a short description")
                    .bail()
                    .isLength({ max: 255 })
                    .withMessage("Short description cannot be greater 255 characters"),

                body("solution_countries.*.description")
                    .optional({ checkFalsy: true })
                    .notEmpty()
                    .withMessage("Please enter the country specific description for the solution")
                    .bail()
                    .isLength({ min: 10 })
                    .withMessage("Description must be 10 or more characters"),

                body("solution_countries.*.media")
                    .optional({ checkFalsy: true })
                    .notEmpty()
                    .withMessage("Please upload the media for the country solution")
                    .bail()
                    .isArray()
                    .withMessage("Invalid media uploaded"),

                body("solution_countries.*.media.*.type")
                    .isIn([
                        "video",
                        "image",
                        "audio",
                        "video_link",
                        "image_link",
                        "audio_link",
                        "youtube_link",
                        "document",
                    ])
                    .withMessage("Incorrect media type"),

                body("solution_countries.*.media.*.file")
                    .notEmpty()
                    .withMessage("Please upload the media file")
                    .bail()
                    .isLength({ max: 255 })
                    .withMessage("Media file upload path should not be greater than 255 characters"),

                body("solution_countries.*.media.*.file_name")
                    .optional()
                    .notEmpty()
                    .withMessage("Please upload the media file name")
                    .bail()
                    .isLength({ max: 255 })
                    .withMessage("Media file name should not be greater than 255 characters"),

                body("deleted_countries")
                    .optional()
                    .isArray()
                    .withMessage("Please mention the countries that are to be deleted"),
            ];
        }

        case "putSolutionStates": {
            return [
                param("uuid").notEmpty().withMessage("Invalid request").bail().isUUID().withMessage("Invalid request"),

                body("solution_states")
                    .notEmpty()
                    .withMessage("Please enter the state specific details for the solution")
                    .bail()
                    .isArray()
                    .withMessage("Invalid request"),

                body("solution_states.*.state_id")
                    .notEmpty()
                    .withMessage("Please select the state")
                    .bail()
                    .isInt({ min: 1 })
                    .withMessage("Invalid state selected")
                    .toInt(),

                body("solution_states.*.brief")
                    .optional({ checkFalsy: true })
                    .notEmpty()
                    .withMessage("Please enter the state specific brief for the solution")
                    .bail()
                    .isLength({ max: 255 })
                    .withMessage("Brief must be 255 or less characters"),

                body("solution_states.*.banner")
                    .optional({ checkFalsy: true })
                    .notEmpty()
                    .withMessage("Please add the banner")
                    .bail()
                    .isLength({ max: 255 })
                    .withMessage("Banner upload path must be 255 or less characters"),

                body("solution_states.*.description")
                    .optional({ checkFalsy: true })
                    .notEmpty()
                    .withMessage("Please enter the state specific description for the solution")
                    .bail()
                    .isLength({ min: 10 })
                    .withMessage("Description must be 10 or more characters"),

                body("solution_states.*.media")
                    .optional({ checkFalsy: true })
                    .notEmpty()
                    .withMessage("Please upload the media for the state solution")
                    .bail()
                    .isArray()
                    .withMessage("Invalid media uploaded"),

                body("solution_states.*.media.*.type")
                    .isIn([
                        "video",
                        "image",
                        "audio",
                        "video_link",
                        "image_link",
                        "audio_link",
                        "youtube_link",
                        "document",
                    ])
                    .withMessage("Incorrect media type"),

                body("solution_states.*.media.*.file")
                    .notEmpty()
                    .withMessage("Please upload the media file")
                    .bail()
                    .isLength({ max: 255 })
                    .withMessage("Media file upload path should not be greater than 255 characters"),

                body("solution_states.*.media.*.file_name")
                    .optional()
                    .notEmpty()
                    .withMessage("Please upload the media file name")
                    .bail()
                    .isLength({ max: 255 })
                    .withMessage("Media file name should not be greater than 255 characters"),

                body("deleted_states")
                    .optional()
                    .isArray()
                    .withMessage("Please mention the countries that are to be deleted"),
            ];
        }

        case "putSolutionStatus": {
            return [
                param("uuid").notEmpty().withMessage("Invalid request").bail().isUUID().withMessage("Invalid request"),

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
