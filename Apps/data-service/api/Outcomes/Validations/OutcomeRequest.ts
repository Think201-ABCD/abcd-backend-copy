import { body, param, query } from "express-validator";
import { validateTitle } from "@redlof/libs/Exceptions/ValidationException";
import { Outcome } from "@redlof/libs/Models/Outcome/Outcome";

export const Validate: any = (reqType: string) => {
    switch (reqType) {
        case "getOutcomes": {
            return [
                query("status")
                    .optional()
                    .isIn(["draft", "unpublished", "published"])
                    .withMessage("Only allowed values for status are draft or published"),

                query("search").optional().isString().withMessage("Please enter valid search parameter"),
            ];
        }

        case "getOutcome": {
            return [
                param("uuid").notEmpty().withMessage("Invalid request").bail().isUUID().withMessage("Invalid request"),

                query("country_id").optional().isInt().withMessage("Please select a valid country").toInt(),

                query("state_id").optional().isInt().withMessage("Please select a valid state").toInt(),
            ];
        }

        case "postOutcome": {
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
                            await validateTitle(Outcome, value, req.body.uuid ? req.body.uuid : null)
                    ),

                body("logo")
                    .optional()
                    .trim()
                    .notEmpty()
                    .withMessage("Please upload a logo")
                    .bail()
                    .isLength({ max: 255 })
                    .withMessage("Invalid logo"),

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

                body("types")
                    .optional()
                    .notEmpty()
                    .withMessage("Please select the types")
                    .bail()
                    .isArray({ min: 1 })
                    .withMessage("Please select at least one type"),

                body("types.*")
                    .trim()
                    .notEmpty()
                    .withMessage("Invalid outcome type selected")
                    .bail()
                    .isLength({ min: 3, max: 255 })
                    .withMessage("Invalid outcome type selected")
                    .bail()
                    .isIn(["Health", "Social", "Financial", "Environmental"])
                    .withMessage("Outcome types can only be Health, Social, Financial or Environmental"),

                body("country_ids")
                    .notEmpty()
                    .withMessage("Please select the countries for the topic")
                    .bail()
                    .isArray()
                    .withMessage("Invalid countries selected"),

                body("country_ids.*")
                    .notEmpty()
                    .withMessage("Invalid country selected")
                    .bail()
                    .isInt({ min: 1 })
                    .withMessage("Invalid country selected")
                    .toInt(),

                body("topic_ids")
                    .notEmpty()
                    .withMessage("Please enter the country specific details for the topic")
                    .bail()
                    .isArray()
                    .withMessage("Invalid country specific details"),

                body("topic_ids.*")
                    .notEmpty()
                    .withMessage("Please select the topic")
                    .bail()
                    .isInt({ min: 1 })
                    .withMessage("Invalid topic selected")
                    .toInt(),

                body("sub_topic_ids")
                    .optional()
                    .notEmpty()
                    .withMessage("Please enter the country specific details for the topic")
                    .bail()
                    .isArray()
                    .withMessage("Invalid country specific details"),

                body("sub_topic_ids.*")
                    .notEmpty()
                    .withMessage("Please select the sub topic")
                    .bail()
                    .isInt({ min: 1 })
                    .withMessage("Invalid sub topic selected")
                    .toInt(),
            ];
        }

        case "putOutcomeCountry": {
            return [
                param("uuid").notEmpty().withMessage("Invalid request").bail().isUUID().withMessage("Invalid request"),

                body("outcome_countries")
                    .notEmpty()
                    .withMessage("Please enter the country specific details for the outcome")
                    .bail()
                    .isArray()
                    .withMessage("Invalid request"),

                body("outcome_countries.*.country_id")
                    .notEmpty()
                    .withMessage("Please select the country")
                    .bail()
                    .isInt({ min: 1 })
                    .withMessage("Invalid country selected")
                    .toInt(),

                body("outcome_countries.*.brief")
                    .optional({ checkFalsy: true })
                    .notEmpty()
                    .withMessage("Please enter a short description")
                    .bail()
                    .isLength({ max: 255 })
                    .withMessage("Short description cannot be greater 255 characters"),

                body("outcome_countries.*.description")
                    .optional({ checkFalsy: true })
                    .notEmpty()
                    .withMessage("Please enter the country specific description for the outcome")
                    .bail()
                    .isLength({ min: 10 })
                    .withMessage("Description must be 10 or more characters"),

                body("outcome_countries.*.media")
                    .optional({ checkFalsy: true })
                    .notEmpty()
                    .withMessage("Please upload the media for the country outcome")
                    .bail()
                    .isArray()
                    .withMessage("Invalid media uploaded"),

                body("outcome_countries.*.media.*.type")
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

                body("outcome_countries.*.media.*.file")
                    .notEmpty()
                    .withMessage("Please upload the media file")
                    .bail()
                    .isLength({ max: 255 })
                    .withMessage("Media file upload path should not be greater than 255 characters"),

                body("outcome_countries.*.media.*.file_name")
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

                body("deleted_countries.*")
                    .optional()
                    .isInt({ min: 1 })
                    .withMessage("Invalid country selected")
                    .toInt(),
            ];
        }

        case "putOutcomeStates": {
            return [
                param("uuid").notEmpty().withMessage("Invalid request").bail().isUUID().withMessage("Invalid request"),

                body("outcome_states")
                    .notEmpty()
                    .withMessage("Please enter the state specific details for the outcome")
                    .bail()
                    .isArray()
                    .withMessage("Invalid request"),

                body("outcome_states.*.state_id")
                    .notEmpty()
                    .withMessage("Please select the state")
                    .bail()
                    .isInt({ min: 1 })
                    .withMessage("Invalid state selected")
                    .toInt(),

                body("outcome_states.*.brief")
                    .optional({ checkFalsy: true })
                    .notEmpty()
                    .withMessage("Please enter the state specific brief for the outcome")
                    .bail()
                    .isLength({ max: 255 })
                    .withMessage("Brief must be 255 or less characters"),

                body("outcome_states.*.description")
                    .optional({ checkFalsy: true })
                    .notEmpty()
                    .withMessage("Please enter the state specific description for the outcome")
                    .bail()
                    .isLength({ min: 10 })
                    .withMessage("Description must be 10 or more characters"),

                body("outcome_states.*.media")
                    .optional({ checkFalsy: true })
                    .notEmpty()
                    .withMessage("Please upload the media for the state outcome")
                    .bail()
                    .isArray()
                    .withMessage("Invalid media uploaded"),

                body("outcome_states.*.media.*.type")
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

                body("outcome_states.*.media.*.file")
                    .notEmpty()
                    .withMessage("Please upload the media file")
                    .bail()
                    .isLength({ max: 255 })
                    .withMessage("Media file upload path should not be greater than 255 characters"),

                body("outcome_states.*.media.*.file_name")
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

        case "putOutcomeStatus": {
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
