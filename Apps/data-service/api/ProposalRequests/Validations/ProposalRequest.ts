import { body, param, query } from "express-validator";
import { validateTitle } from "@redlof/libs/Exceptions/ValidationException";
import { Proposal } from "@redlof/libs/Models/ProposalRequest/Proposal";

export const Validate: any = (reqType: string) => {
    switch (reqType) {
        case "getProposals": {
            return [
                query("status")
                    .optional()
                    .isIn(["draft", "unpublished", "published"])
                    .withMessage("Only allowed values for status are draft or published"),

                query("search").optional().isString().withMessage("Please enter valid search parameter"),
            ];
        }

        case "getProposal": {
            return [
                param("uuid").notEmpty().withMessage("Invalid request").bail().isUUID().withMessage("Invalid request"),

                query("country_id").optional().isInt().withMessage("Please select a valid country").toInt(),

                query("state_id").optional().isInt().withMessage("Please select a valid state").toInt(),
            ];
        }

        case "postProposal": {
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
                            await validateTitle(Proposal, value, req.body.uuid ? req.body.uuid : null)
                    ),

                body("logo")
                    .optional()
                    .trim()
                    .notEmpty()
                    .withMessage("Please upload a logo")
                    .bail()
                    .isLength({ max: 255 })
                    .withMessage("Invalid logo"),

                body("category_id")
                    .optional({ checkFalsy: true })
                    .notEmpty()
                    .withMessage("Please select the category")
                    .bail()
                    .isInt()
                    .withMessage("Invalid category selected")
                    .toInt(),

                body("sub_category_id")
                    .optional({ checkFalsy: true })
                    .notEmpty()
                    .withMessage("Please select the sub category")
                    .bail()
                    .isInt()
                    .withMessage("Invalid sub categories selected")
                    .toInt(),

                body("organisation_id")
                    .notEmpty()
                    .withMessage("Please select the owner organisation")
                    .bail()
                    .isInt()
                    .withMessage("Invalid organisation selected")
                    .toInt(),

                body("brief")
                    .optional({ checkFalsy: true })
                    .notEmpty()
                    .withMessage("Please enter a short description")
                    .bail()
                    .isLength({ max: 255 })
                    .withMessage("Short description cannot be greater 255 characters"),

                body("description")
                    .optional({ checkFalsy: true })
                    .notEmpty()
                    .withMessage("Please enter the description for the proposal request")
                    .bail()
                    .isLength({ min: 10 })
                    .withMessage("Description must be 10 or more characters"),

                body("expiry")
                    .optional({ checkFalsy: true })
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

                body("person")
                    .optional({ checkFalsy: true })
                    .isLength({ max: 255 })
                    .withMessage("Key persons should be 255 or less characters"),

                body("confidence")
                    .optional({ checkFalsy: true })
                    .notEmpty()
                    .withMessage("please select the confidence"),

                body("language_ids")
                    .notEmpty()
                    .withMessage("Please select the languages")
                    .bail()
                    .isArray()
                    .withMessage("Invalid languages"),

                body("language_ids.*").isInt({ min: 1 }).withMessage("Invalid language selected").toInt(),

                body("start_year")
                    .optional({ checkFalsy: true })
                    .isInt({ min: 1947, max: 9999 })
                    .withMessage("Invalid start year"),

                body("end_year")
                    .optional({ checkFalsy: true })
                    .isInt({ min: 1947, max: 9999 })
                    .withMessage("Invalid end year"),

                body("source")
                    .notEmpty()
                    .withMessage("Please mention the source")
                    .bail()
                    .isLength({ max: 255 })
                    .withMessage("Source cannot be more than 255 characters"),

                body("experts")
                    .optional({ checkFalsy: true })
                    .notEmpty()
                    .withMessage("Please select the experts")
                    .bail()
                    .isArray()
                    .withMessage("Invalid languages"),

                body("experts.*").isInt({ min: 1 }).withMessage("Invalid language selected").toInt(),

                body("funders")
                    .optional({ checkFalsy: true })
                    .notEmpty()
                    .withMessage("Please select the funders")
                    .bail()
                    .isArray()
                    .withMessage("Invalid languages"),

                body("funders.*").isInt({ min: 1 }).withMessage("Invalid language selected").toInt(),

                body("partners")
                    .optional({ checkFalsy: true })
                    .notEmpty()
                    .withMessage("Please select the partners")
                    .bail()
                    .isArray()
                    .withMessage("Invalid languages"),

                body("partners.*").isInt({ min: 1 }).withMessage("Invalid language selected").toInt(),

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

                body("sub_topic_ids")
                    .optional({ checkFalsy: true })
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

                body("outcome_ids")
                    .optional({ checkFalsy: true })
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
                    .optional({ checkFalsy: true })
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

                body("country_ids")
                    .notEmpty()
                    .withMessage("Please select the countries for the topic")
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
                    .withMessage("Please select the behaviours associated")
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
                    .optional({ checkFalsy: true })
                    .notEmpty()
                    .withMessage("Please select the barriers associated")
                    .bail()
                    .isArray()
                    .withMessage("Invalid barriers selected"),

                body("barrier_ids.*")
                    .notEmpty()
                    .withMessage("Please select the barrier")
                    .bail()
                    .isInt({ min: 1 })
                    .withMessage("Invalid barrier selected")
                    .toInt(),

                body("solution_ids")
                    .optional({ checkFalsy: true })
                    .notEmpty()
                    .withMessage("Please select the solutions associated")
                    .bail()
                    .isArray()
                    .withMessage("Invalid solutions selected"),

                body("solution_ids.*")
                    .notEmpty()
                    .withMessage("Please select the solution")
                    .bail()
                    .isInt({ min: 1 })
                    .withMessage("Invalid solution selected")
                    .toInt(),
            ];
        }

        case "putProposalCountry": {
            return [
                param("uuid").notEmpty().withMessage("Invalid request").bail().isUUID().withMessage("Invalid request"),

                body("proposal_countries")
                    .notEmpty()
                    .withMessage("Please enter the country specific details for knowledge data")
                    .bail()
                    .isArray()
                    .withMessage("Invalid request"),

                body("proposal_countries.*.country_id")
                    .notEmpty()
                    .withMessage("Please select the country")
                    .bail()
                    .isInt({ min: 1 })
                    .withMessage("Invalid country selected")
                    .toInt(),

                body("proposal_countries.*.banner")
                    .optional({ checkFalsy: true })
                    .notEmpty()
                    .withMessage("Please upload the banner")
                    .bail()
                    .isLength({ max: 255 })
                    .withMessage("Banner cannot be greater 255 characters"),

                body("proposal_countries.*.brief")
                    .optional({ checkFalsy: true })
                    .notEmpty()
                    .withMessage("Please enter a short description")
                    .bail()
                    .isLength({ max: 255 })
                    .withMessage("Short description cannot be greater 255 characters"),

                body("proposal_countries.*.description")
                    .optional({ checkFalsy: true })
                    .notEmpty()
                    .withMessage("Please enter the country specific description for knowledge data")
                    .bail()
                    .isLength({ min: 10 })
                    .withMessage("Description must be 10 or more characters"),

                body("proposal_countries.*.media")
                    .optional({ checkFalsy: true })
                    .notEmpty()
                    .withMessage("Please upload the media for the country knowledge data")
                    .bail()
                    .isArray()
                    .withMessage("Invalid media uploaded"),

                body("proposal_countries.*.media.*.type")
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

                body("proposal_countries.*.media.*.file")
                    .notEmpty()
                    .withMessage("Please upload the media file")
                    .bail()
                    .isLength({ max: 255 })
                    .withMessage("Media file upload path should not be greater than 255 characters"),

                body("proposal_countries.*.media.*.file_name")
                    .optional({ checkFalsy: true })
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

        case "putProposalStates": {
            return [
                param("uuid").notEmpty().withMessage("Invalid request").bail().isUUID().withMessage("Invalid request"),

                body("proposal_states")
                    .notEmpty()
                    .withMessage("Please enter the state specific details for the knowledge data")
                    .bail()
                    .isArray()
                    .withMessage("Invalid request"),

                body("proposal_states.*.state_id")
                    .notEmpty()
                    .withMessage("Please select the state")
                    .bail()
                    .isInt({ min: 1 })
                    .withMessage("Invalid state selected")
                    .toInt(),

                body("proposal_states.*.banner")
                    .optional({ checkFalsy: true })
                    .notEmpty()
                    .withMessage("Please upload the banner")
                    .bail()
                    .isLength({ max: 255 })
                    .withMessage("Banner cannot be greater 255 characters"),

                body("proposal_states.*.brief")
                    .optional({ checkFalsy: true })
                    .notEmpty()
                    .withMessage("Please enter the state specific brief for the knowledge data")
                    .bail()
                    .isLength({ max: 255 })
                    .withMessage("Brief must be 255 or less characters"),

                body("proposal_states.*.description")
                    .optional({ checkFalsy: true })
                    .notEmpty()
                    .withMessage("Please enter the state specific description for the knowledge data")
                    .bail()
                    .isLength({ min: 10 })
                    .withMessage("Description must be 10 or more characters"),

                body("proposal_states.*.media")
                    .optional({ checkFalsy: true })
                    .notEmpty()
                    .withMessage("Please upload the media for the state knowledge data")
                    .bail()
                    .isArray()
                    .withMessage("Invalid media uploaded"),

                body("proposal_states.*.media.*.type")
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

                body("proposal_states.*.media.*.file")
                    .notEmpty()
                    .withMessage("Please upload the media file")
                    .bail()
                    .isLength({ max: 255 })
                    .withMessage("Media file upload path should not be greater than 255 characters"),

                body("proposal_states.*.media.*.file_name")
                    .optional({ checkFalsy: true })
                    .notEmpty()
                    .withMessage("Please upload the media file name")
                    .bail()
                    .isLength({ max: 255 })
                    .withMessage("Media file name should not be greater than 255 characters"),

                body("deleted_states")
                    .optional()
                    .isArray()
                    .withMessage("Please mention the countries that are to be deleted"),

                body("deleted_states.*").optional().isInt({ min: 1 }).withMessage("Invalid state selected").toInt(),
            ];
        }

        case "putProposalStatus": {
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
