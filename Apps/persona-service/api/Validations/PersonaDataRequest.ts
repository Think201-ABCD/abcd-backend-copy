import { body, param, query } from "express-validator";

export const Validate: any = (reqType: string) => {
    switch (reqType) {
        case "getTasks": {
            return [
                query("persona_uuid")
                .optional()
                .trim()
                .isUUID()
                .withMessage("Please provide a valid persona uuid")
            ];
        }

        case "getTaskSteps": {
            return [
                query("persona_uuid")
                .trim()
                .notEmpty()
                .withMessage("Please select a persona")
                .bail()
                .isUUID()
                .withMessage("Please select a valid persona"),

                param("task_uuid")
                .trim()
                .notEmpty()
                .withMessage("Please select a task")
                .bail()
                .isUUID()
                .withMessage("Please select a valid task")
            ];
        }

        case "getTools": {
            return [];
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

        case "putTask" : {
            return [
                param("task_uuid")
                .trim()
                .notEmpty()
                .withMessage("Please select a task")
                .bail()
                .isUUID()
                .withMessage("Please select a valid task"),

                body("name")
                .optional()
                .trim()
                .notEmpty()
                .withMessage("Please enter the name of the task")
                .bail()
                .isLength({ max: 255 })
                .withMessage("Name cannot be more than 255 characters"),

                body("config_name")
                .optional()
                .trim()
                .notEmpty()
                .withMessage("Please enter the configuration name of the task")
                .bail()
                .isLength({ max: 255 })
                .withMessage("Configuration name cannot be more than 255 characters"),

                body("description")
                .optional()
                .trim()
                .notEmpty()
                .withMessage("Please enter the description for the task")
                .bail()
                .isLength({ max: 255 })
                .withMessage("Description cannot be more than 255 characters"),

                body("icon")
                .optional()
                .trim()
                .notEmpty()
                .withMessage("Please select icon for the task")
                .bail()
                .isLength({ max: 255 })
                .withMessage("Icon URL cannot be more than 255 characters"),
            ];
        }

        case "deleteTask" : {
            return [
                param("task_uuid")
                .trim()
                .notEmpty()
                .withMessage("Please select a task to delete")
                .bail()
                .isUUID()
                .withMessage("Please select a valid task")
            ];
        }
    }
};
