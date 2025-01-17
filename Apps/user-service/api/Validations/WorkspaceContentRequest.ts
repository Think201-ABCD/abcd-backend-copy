import { body, param, query } from "express-validator";

// Models
import { User } from "@redlof/libs/Models/Auth/User";

export const Validate: any = (reqType: string) => {
    switch (reqType) {
        case "getEntities": {
            return [
                param("uuid")
                    .notEmpty()
                    .withMessage("Please provide workspace id")
                    .bail()
                    .withMessage("Invalid workspace id"),

                query("topic_ids")
                    .optional()
                    .notEmpty()
                    .withMessage("Please provide topic id")
                    .bail()
                    .withMessage("Invalid topic id"),

                query("behavior_ids")
                    .optional()
                    .notEmpty()
                    .withMessage("Please provide behavior id")
                    .bail()
                    .withMessage("Invalid behavior id"),

                query("added_by")
                    .optional()
                    .notEmpty()
                    .withMessage("Please provide user id")
                    .bail()
                    .withMessage("Invalid user id"),

                query("category").optional().notEmpty().withMessage("Please provide category slug"),
            ];
        }

        case "addContents": {
            return [
                param("uuid")
                    .notEmpty()
                    .withMessage("Please provide workspace id")
                    .bail()
                    .isUUID()
                    .withMessage("Invalid workspace id"),

                body("entity_slug").notEmpty().withMessage("Please provide entity slug"),

                body("content_uuids").notEmpty().withMessage("Please provide content uuids"),

                body("content_uuids.*").notEmpty().isUUID().withMessage("Please valid content uuid"),
            ];
        }

        case "addCustomContent": {
            return [
                param("uuid")
                    .notEmpty()
                    .withMessage("Please provide workspace id")
                    .bail()
                    .isUUID()
                    .withMessage("Invalid workspace id"),

                body("title")
                .notEmpty()
                .withMessage("Please provide title")
                .isLength({ max: 255 })
                .withMessage("Title cannot be more than 255 characters"),

                body("logo").notEmpty().withMessage("Please provide logo"),

                body("category").notEmpty().withMessage("Please provide category"),

                body("description").notEmpty().withMessage("Please provide description"),

                body("images").optional().notEmpty().isArray().withMessage("Please provide images"),

                body("images.*").notEmpty().isString().withMessage("Please valid image"),

                body("files").optional().notEmpty().isArray().withMessage("Please provide files"),

                body("files.*").notEmpty().isString().withMessage("Please valid file"),
            ];
        }

        case "getBehaviors": {
            return [
                body("topic_uuids").isArray().withMessage("Please provide topic uuids"),

                body("topic_uuids.*").isUUID().withMessage("Invalid uuid"),
            ];
        }

        case "getMembers": {
            return [body("email").optional().notEmpty().withMessage("Please provide email alphabets")];
        }

        case "getEntity": {
            return [
                param("uuid")
                    .notEmpty()
                    .withMessage("Please provide workspace uuid")
                    .bail()
                    .isUUID()
                    .withMessage("Invalid workspace uuid"),

                param("entity_uuid")
                    .notEmpty()
                    .withMessage("Please provide entity uuid")
                    .bail()
                    .isUUID()
                    .withMessage("Invalid entity uuid"),
            ];
        }

        case "pinEntity": {
            return [
                param("uuid")
                    .notEmpty()
                    .withMessage("Please provide workspace uuid")
                    .bail()
                    .isUUID()
                    .withMessage("Invalid workspace uuid"),

                param("content_uuid")
                    .notEmpty()
                    .withMessage("Please provide content uuid")
                    .bail()
                    .isUUID()
                    .withMessage("Invalid content uuid"),
            ];
        }

        case "updateEntity": {
            return [
                param("uuid")
                    .notEmpty()
                    .withMessage("Please provide workspace uuid")
                    .bail()
                    .isUUID()
                    .withMessage("Invalid workspace uuid"),

                param("entity_uuid")
                    .notEmpty()
                    .withMessage("Please provide entity uuid")
                    .bail()
                    .isUUID()
                    .withMessage("Invalid entity uuid"),

                body("description").optional().notEmpty().withMessage("Please provide description"),

                body("image.*").optional().notEmpty().withMessage("Please provide image"),
            ];
        }

        case "deleteEntity": {
            return [
                param("uuid")
                    .notEmpty()
                    .withMessage("Please provide workspace uuid")
                    .bail()
                    .isUUID()
                    .withMessage("Invalid workspace uuid"),

                param("entity_uuid")
                    .notEmpty()
                    .withMessage("Please provide entity uuid")
                    .bail()
                    .isUUID()
                    .withMessage("Invalid entity uuid"),
            ];
        }

        case "filterEntities": {
            return [
                body("searched_entity")
                    .notEmpty()
                    .withMessage("Please provide entity to be searched")
                    .bail()
                    .isIn([
                        "barrier",
                        "behaviour",
                        "collateral-library",
                        "knowledge-library",
                        "outcome",
                        "sub-outcome",
                        "project-and-proposal",
                        "solution",
                        "topic",
                        "sub-topic",
                    ])
                    .withMessage("Please provide valid entity to be searched"),

                body("filter_data").optional().notEmpty().isArray().withMessage("Please provide filter data"),

                body("filter_data.*.entity")
                    .notEmpty()
                    .withMessage("Please provide filter data entity name")
                    .bail()
                    .isIn([
                        "barrier",
                        "behaviour",
                        "collateral-library",
                        "knowledge-library",
                        "outcome",
                        "sub-outcome",
                        "project-and-proposal",
                        "solution",
                        "topic",
                        "sub-topic",
                    ])
                    .withMessage("Please provide valid filter data entity name"),

                body("filter_data.*.entity_ids")
                    .notEmpty()
                    .isArray()
                    .withMessage("Please provide filter data entity uuids"),

                body("filter_data.*.entity_ids.*")
                    .notEmpty()
                    .withMessage("Please provide filter data entity uuids")
                    .bail()
                    .isUUID()
                    .withMessage("PLease provide valid uuid in filter data entity id"),
            ];
        }
    }
};
