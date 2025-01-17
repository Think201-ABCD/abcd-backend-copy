import { body, param, query } from "express-validator";

// Exception
import { validateTitle } from "@redlof/libs/Exceptions/ValidationException";

// Models
import { Prevalence } from "@redlof/libs/Models/Prevalence/Prevalence";

export const Validate: any = (reqType: string) => {
    switch (reqType) {
        case "getPrevalences": {
            return [
                query("status")
                    .optional()
                    .isIn(["draft", "unpublished", "published"])
                    .withMessage("Only allowed values for status are draft or published"),

                query("search").optional().isString().withMessage("Please enter valid search parameter"),
            ];
        }

        case "getPrevalence": {
            return [
                param("uuid").notEmpty().withMessage("Invalid request").bail().isUUID().withMessage("Invalid request"),

                query("country_id").optional().isInt().withMessage("Please select a valid country").toInt(),

                query("state_id").optional().isInt().withMessage("Please select a valid state").toInt(),
            ];
        }

        case "postPrevalence": {
            return [
                body("uuid")
                    .optional()
                    .notEmpty()
                    .withMessage("Invalid request")
                    .bail()
                    .isUUID()
                    .withMessage("Invalid request"),

                body("name")
                    .trim()
                    .notEmpty()
                    .withMessage("Please enter the name")
                    .bail()
                    .isLength({ max: 255 })
                    .withMessage("Name cannot be more than 255 characters")
                    .bail()
                    .custom(
                        async (value: any, { req }: any) =>
                            await validateTitle(Prevalence, value, req.body.uuid ? req.body.uuid : null, "name")
                    ),

                body("license")
                    .trim()
                    .notEmpty()
                    .withMessage("Please select the license type")
                    .bail()
                    .isLength({ max: 255 })
                    .withMessage("Invalid license type selection"),

                body("behaviour_ids")
                    .notEmpty()
                    .withMessage("Please select the behaviours")
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
            ];
        }

        case "putPrevalenceDataSet": {
            return [
                param("uuid").notEmpty().withMessage("Invalid request").bail().isUUID().withMessage("Invalid request"),

                body("data_set")
                    .notEmpty()
                    .withMessage("Please enter the country or state specific details for the prevalence")
                    .bail()
                    .isArray()
                    .withMessage("Invalid request"),

                body("data_set.*.country_id")
                    .optional()
                    .notEmpty()
                    .withMessage("Please select at least one country")
                    .bail()
                    .isInt({ min: 1 })
                    .withMessage("Invalid country selected")
                    .toInt(),

                body("data_set.*.state_id")
                    .optional()
                    .notEmpty()
                    .withMessage("Please select at least one state")
                    .bail()
                    .isInt({ min: 1 })
                    .withMessage("Invalid state selected")
                    .toInt(),

                body("data_set.*.data")
                    .notEmpty()
                    .withMessage("Please enter at least one time range details for the prevalence")
                    .bail()
                    .isArray()
                    .withMessage("Invalid request"),

                body("data_set.*.data.*.start_year")
                    .notEmpty()
                    .withMessage("Please select the start year")
                    .bail()
                    .isInt({ min: 1 })
                    .withMessage("Invalid start year selected")
                    .toInt(),

                body("data_set.*.data.*.end_year")
                    .notEmpty()
                    .withMessage("Please select the end year")
                    .bail()
                    .isInt({ min: 1 })
                    .withMessage("Invalid end year selected")
                    .toInt(),

                body("data_set.*.data.*.meta")
                    .notEmpty()
                    .withMessage("Please enter key value data for the prevalence")
                    .bail()
                    .isArray()
                    .withMessage("Invalid request"),

                body("deleted_data")
                    .optional({ checkFalsy: true })
                    .isArray()
                    .withMessage("Please mention the countries or states data that are to be deleted"),
            ];
        }

        case "putPrevalenceStatus": {
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
