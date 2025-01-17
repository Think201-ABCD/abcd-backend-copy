import { body, param, query } from "express-validator";

export const Validate: any = (reqType: string) => {
    switch (reqType) {
        case "getPersonas": {
            return [];
        }

        case "getPersona":{
            return [
                param("persona_uuid")
                .trim()
                .notEmpty()
                .withMessage("Please select a persona")
                .bail()
                .isUUID()
                .withMessage("Please select a valid persona"),
            ]
        }

        case "postPersonaSettings": {
            return [
                body("persona_uuid")
                .trim()
                .notEmpty()
                .withMessage("Please select a persona")
                .bail()
                .isUUID()
                .withMessage("Please select a valid persona"),

                body("task_uuids")
                .isArray({min:1})
                .withMessage("Please select atleast one task"),

                body("task_uuids[*]")
                .isUUID()
                .withMessage("Please select a valid task"),

                body("topic_uuids")
                .isArray({min:1})
                .withMessage("Please select atleast one topic"),

                body("topic_uuids[*]")
                .isUUID()
                .withMessage("Please select a valid topic"),
            ];
        }

        case "getPersonaSettings": {
            return [];
        }

        case "putPersonas": {
            return [
                param("persona_uuid")
                .trim()
                .notEmpty()
                .withMessage("Please select a persona")
                .bail()
                .isUUID()
                .withMessage("Please select a valid persona"),

                body("name")
                .optional()
                .trim()
                .notEmpty()
                .withMessage("Please enter the name of the persona")
                .bail()
                .isLength({ max: 255 })
                .withMessage("Name cannot be more than 255 characters"),

                body("description")
                .optional()
                .trim()
                .notEmpty()
                .withMessage("Please enter the description for the persona")
                .bail()
                .isLength({ max: 255 })
                .withMessage("Description cannot be more than 255 characters"),

                body("icon")
                .optional()
                .trim()
                .notEmpty()
                .withMessage("Please select icon for the persona")
                .bail()
                .isLength({ max: 255 })
                .withMessage("Icon URL cannot be more than 255 characters"),
            ];
        }

        case "deletePersonas": {
            return [
                param("persona_uuid")
                .trim()
                .notEmpty()
                .withMessage("Please select a persona")
                .bail()
                .isUUID()
                .withMessage("Please select a valid persona")
            ];
        }

        case "dumpCSVFile": {
            return [
                body("file").custom((value, { req }) => {
                    if (!req.file) {
                        return Promise.reject("CSV file is required");
                    }

                    if (req.file?.mimetype !== "text/csv") {
                        return Promise.reject("File type should be .csv");
                    }

                    return Promise.resolve();
                }),
            ];
        }

        case "postPersonaMappingDump": {
            return [];
        }
    }
};
