import { body, param, query } from "express-validator";

import { Topic } from "@redlof/libs/Models/Topic/Topic";
import { validateTitle } from "@redlof/libs/Exceptions/ValidationException";

export const Validate: any = (reqType: string) => {
    switch (reqType) {
        case "getTopics": {
            return [
                query("status")
                    .optional()
                    .isIn(["draft", "unpublished", "published"])
                    .withMessage("Only allowed values for status are draft or published"),

                query("search").optional().isString().withMessage("Please enter valid search parameter"),
            ];
        }

        case "getTopic": {
            return [
                param("uuid").notEmpty().withMessage("Invalid request").bail().isUUID().withMessage("Invalid request"),

                query("country_id").optional().isInt().withMessage("Please select a valid country").toInt(),

                query("state_id").optional().isInt().withMessage("Please select a valid state").toInt(),
            ];
        }

        case "postTopic": {
            return [
                body("uuid")
                    .optional()
                    .notEmpty()
                    .withMessage("Invalid request")
                    .bail()
                    .isUUID()
                    .withMessage("Invalid request"),

                body("title")
                    .notEmpty()
                    .withMessage("Please enter the title of the topic")
                    .bail()
                    .isLength({ max: 255 })
                    .withMessage("Title cannot be more than 255 characters")
                    .bail()
                    .custom(
                        async (value: any, { req }: any) =>
                            await validateTitle(Topic, value, req.body.uuid ? req.body.uuid : null)
                    ),

                body("logo")
                    .optional()
                    .notEmpty()
                    .withMessage("Please upload a logo")
                    .bail()
                    .isLength({ max: 255 })
                    .withMessage("Logo file upload path should not be greater than 255 characters"),

                body("sdgs")
                    .notEmpty()
                    .withMessage("Please select the sustainable development goals associated with the form")
                    .bail()
                    .isArray()
                    .withMessage("Invalid goals selected"),

                body("sdgs.*")
                    .notEmpty()
                    .withMessage("Invalid goal selected")
                    .bail()
                    .isInt({ min: 1 })
                    .withMessage("Invalid goal selected")
                    .toInt(),

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
            ];
        }

        case "putTopicCountry": {
            return [
                param("uuid").notEmpty().withMessage("Invalid request").bail().isUUID().withMessage("Invalid request"),

                body("topic_country")
                    .notEmpty()
                    .withMessage("Please enter the country specific details for the topic")
                    .bail()
                    .isArray()
                    .withMessage("Invalid country specific details"),

                body("topic_country.*.country_id")
                    .notEmpty()
                    .withMessage("Please select the country")
                    .bail()
                    .isInt({ min: 1 })
                    .withMessage("Invalid country selected")
                    .toInt(),

                body("topic_country.*.brief")
                    .optional({ checkFalsy: true })
                    .notEmpty()
                    .withMessage("Please enter a short description")
                    .bail()
                    .isLength({ max: 255 })
                    .withMessage("Short description cannot be greater 255 characters"),

                body("topic_country.*.description")
                    .optional({ checkFalsy: true })
                    .notEmpty()
                    .withMessage("Please enter the country specific description for the topic")
                    .bail()
                    .isLength({ min: 10 })
                    .withMessage("Description must be 10 or more characters"),

                body("topic_country.*.banner")
                    .optional({ checkFalsy: true })
                    .notEmpty()
                    .withMessage("Please upload a banner")
                    .bail()
                    .isLength({ max: 255 })
                    .withMessage("Banner file upload path should not be greater than 255 characters"),

                body("topic_country.*.media")
                    .optional({ checkFalsy: true })
                    .notEmpty()
                    .withMessage("Please upload the media for the country topic")
                    .bail()
                    .isArray()
                    .withMessage("Invalid media uploaded"),

                body("topic_country.*.media.*.type")
                    .isIn(["video", "image", "audio", "video_link", "image_link", "youtube_link", "document"])
                    .withMessage("Incorrect media type"),

                body("topic_country.*.media.*.file")
                    .notEmpty()
                    .withMessage("Please upload the media file")
                    .bail()
                    .isLength({ max: 255 })
                    .withMessage("Media file upload path should not be greater than 255 characters"),

                body("topic_country.*.media.*.file_name")
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

        case "putTopicState": {
            return [
                param("uuid").notEmpty().withMessage("Invalid request").bail().isUUID().withMessage("Invalid request"),

                body("topic_state")
                    .notEmpty()
                    .withMessage("Please enter the state specific details for the topic")
                    .bail()
                    .isArray()
                    .withMessage("Invalid state specific details"),

                body("topic_state.*.state_id")
                    .notEmpty()
                    .withMessage("Please select the state")
                    .bail()
                    .isInt({ min: 1 })
                    .withMessage("Invalid state selected")
                    .toInt(),

                body("topic_state.*.brief")
                    .optional({ checkFalsy: true })
                    .notEmpty()
                    .withMessage("Please enter state specific brief for the topic")
                    .bail()
                    .isLength({ max: 255 })
                    .withMessage("Brief must be 255 or less characters"),

                body("topic_state.*.description")
                    .optional({ checkFalsy: true })
                    .notEmpty()
                    .withMessage("Please enter state specific description for the topic")
                    .bail()
                    .isLength({ min: 10 })
                    .withMessage("Description must be 10 or more characters"),

                body("topic_state.*.banner")
                    .optional({ checkFalsy: true })
                    .notEmpty()
                    .withMessage("Please upload a banner")
                    .bail()
                    .isLength({ max: 255 })
                    .withMessage("Banner file upload path should not be greater than 255 characters"),

                body("topic_state.*.media")
                    .optional({ checkFalsy: true })
                    .notEmpty()
                    .withMessage("Please upload the media for the state topic")
                    .bail()
                    .isArray()
                    .withMessage("Invalid media uploaded"),

                body("topic_state.*.media.*.type")
                    .isIn(["video", "image", "audio", "video_link", "image_link", "youtube_link", "document"])
                    .withMessage("Incorrect media type"),

                body("topic_state.*.media.*.file")
                    .notEmpty()
                    .withMessage("Please upload the media file")
                    .bail()
                    .isLength({ max: 255 })
                    .withMessage("Media file upload path should not be greater than 255 characters"),

                body("topic_state.*.media.*.file_name")
                    .optional()
                    .notEmpty()
                    .withMessage("Please upload the media file name")
                    .bail()
                    .isLength({ max: 255 })
                    .withMessage("Media file name should not be greater than 255 characters"),

                body("deleted_states")
                    .optional()
                    .isArray()
                    .withMessage("Please mention the states that are to be deleted"),

                body("deleted_states.*").optional().isInt({ min: 1 }).withMessage("Invalid state selected").toInt(),
            ];
        }

        case "putTopicStatus": {
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
