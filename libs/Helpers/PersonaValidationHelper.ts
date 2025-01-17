import { body } from "express-validator";
import { validationResult } from "express-validator";
import { taskStepKeys } from "../Constants/personaData";

export const validatePersonaMappingDump = async (req) => {
    await body("dump[*].persona_slug")
        //
        .trim()
        .notEmpty()
        .withMessage("Please provide persona slug")
        .bail()
        .isLength({ max: 255 })
        .withMessage("Cannot be more than 255 characters")
        .run(req);

    await body("dump[*].task_slug")
        //
        .trim()
        .notEmpty()
        .withMessage("Please provide task slug")
        .bail()
        .isLength({ max: 255 })
        .withMessage("Cannot be more than 255 characters")
        .run(req);

    await body("dump[*].select_task_default")
        .notEmpty()
        .withMessage("Please provide selected task default field")
        .toBoolean()
        .isBoolean()
        .withMessage("Value should be either 'TRUE' or 'FALSE'")
        .run(req);

    await body("dump[*].popup_title")
        //
        .trim()
        .notEmpty()
        .withMessage("Please provide popup title")
        .bail()
        .isLength({ max: 255 })
        .withMessage("Cannot be more than 255 characters")
        .run(req);

    await body("dump[*].popup_description")
        .trim()
        .notEmpty()
        .withMessage("Please provide popup description")
        .bail()
        .isLength({ max: 1000 })
        .withMessage("Cannot be more than 1000 characters")
        .run(req);

    await body("dump[*]")
        .custom((data, { req }) => {
            for (const stepKey of taskStepKeys) {
                if (!data[stepKey.name]) continue;

                if (!data[stepKey.description]) {
                    return Promise.reject("Please provide step description");
                }
            }

            return Promise.resolve();
        })
        .run(req);

    return _getValidationResults(req);
};

export const validatePersonaDump = async (req) => {
    await body("dump[*].name")
        //
        .trim()
        .notEmpty()
        .withMessage("Please provide persona name")
        .bail()
        .isLength({ max: 255 })
        .withMessage("Cannot be more than 255 characters")
        .run(req);

    await body("dump[*].slug")
        //
        .trim()
        .notEmpty()
        .withMessage("Please provide persona slug")
        .bail()
        .isLength({ max: 255 })
        .withMessage("Cannot be more than 255 characters")
        .run(req);

    await body("dump[*].description")
        //
        .trim()
        .notEmpty()
        .withMessage("Please provide persona description")
        .bail()
        .isLength({ max: 1000 })
        .withMessage("Cannot be more than 1000 characters")
        .run(req);

    return _getValidationResults(req);
};

export const validateTaskDump = async (req) => {
    await body("dump[*].name")
        //
        .trim()
        .notEmpty()
        .withMessage("Please provide task name")
        .bail()
        .isLength({ max: 255 })
        .withMessage("Cannot be more than 255 characters")
        .run(req);

    await body("dump[*].config_name")
        //
        .trim()
        .notEmpty()
        .withMessage("Please provide task config name")
        .bail()
        .isLength({ max: 255 })
        .withMessage("Cannot be more than 255 characters")
        .run(req);

    await body("dump[*].slug")
        //
        .trim()
        .notEmpty()
        .withMessage("Please provide task slug")
        .bail()
        .isLength({ max: 255 })
        .withMessage("Cannot be more than 255 characters")
        .run(req);

    await body("dump[*].description")
        //
        .trim()
        .notEmpty()
        .withMessage("Please provide task description")
        .bail()
        .isLength({ max: 1000 })
        .withMessage("Cannot be more than 1000 characters")
        .run(req);

    return _getValidationResults(req);
};

export const validateToolDump = async (req) => {
    await body("dump[*].name")
        //
        .trim()
        .notEmpty()
        .withMessage("Please provide tool name")
        .bail()
        .isLength({ max: 255 })
        .withMessage("Cannot be more than 255 characters")
        .run(req);

    await body("dump[*].config_name")
        //
        .trim()
        .notEmpty()
        .withMessage("Please provide tool config name")
        .bail()
        .isLength({ max: 255 })
        .withMessage("Cannot be more than 255 characters")
        .run(req);

    await body("dump[*].slug")
        //
        .trim()
        .notEmpty()
        .withMessage("Please provide tool slug")
        .bail()
        .isLength({ max: 255 })
        .withMessage("Cannot be more than 255 characters")
        .run(req);

    await body("dump[*].description")
        //
        .trim()
        .notEmpty()
        .withMessage("Please provide tool description")
        .bail()
        .isLength({ max: 1000 })
        .withMessage("Cannot be more than 1000 characters")
        .run(req);

    return _getValidationResults(req);
};

const _getValidationResults = (req) => {
    const errorsResult = validationResult.withDefaults({
        formatter: (error) => {
            return {
                value: error.value,
                message: error.msg,
                param: error.param,
                location: error.location,
            };
        },
    });

    if (!errorsResult(req).isEmpty()) {
        return errorsResult(req).array();
    }

    return [];
};
