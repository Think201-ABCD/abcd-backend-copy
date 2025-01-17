import { body, param, query } from "express-validator";
import _ from "lodash";

// Models
import { User } from "@redlof/libs/Models/Auth/User";

export const Validate: any = (reqType: string) => {
    switch (reqType) {
        case "validateUuid": {
            return [
                param("uuid").notEmpty().withMessage("Invalid request").bail().isUUID().withMessage("Invalid request"),
            ];
        }

        case "getWorkspaces": {
            return [
                query("showcase")
                .optional()
                    .isBoolean()
                    .withMessage("Please provide a boolean value for showcase")
                    .toBoolean()
            ]
        }

        case "postWorkspace": {
            return [
                body("logo")
                    .notEmpty()
                    .withMessage("Please upload a logo")
                    .bail()
                    .isLength({ max: 255 })
                    .withMessage("Logo file upload path should not be greater than 255 characters"),

                body("name")
                    .trim()
                    .notEmpty()
                    .withMessage("Please enter the workspace name")
                    .bail()
                    .isLength({ min: 3, max: 255 })
                    .withMessage("workspace name must be atleast 3 and atmost 255 characters"),

                body("description")
                    .optional()
                    .exists()
                    .withMessage("Please enter the description")
                    .bail()
                    .isLength({ min: 3, max: 1000 })
                    .withMessage("Description must be atleast 3 and atmost 1000 characters"),

                body("banner")
                    .optional()
                    .notEmpty()
                    .withMessage("Please upload a banner")
                    .bail()
                    .isLength({ max: 255 })
                    .withMessage("Banner file upload path should not be greater than 255 characters"),

                body("share_text")
                    .optional()
                    .exists()
                    .withMessage("Please enter the message for sharing")
                    .bail()
                    .isLength({ min: 3, max: 1000 })
                    .withMessage("Sharign text must be atleast 3 and atmost 1000 characters"),

                body('showcase')
                    .optional()
                    .isBoolean()
                    .withMessage("Please provide a boolean value for showcase")
            ];
        }

        case "putWorkspace": {
            return [
                param("uuid").notEmpty().withMessage("Invalid request").bail().isUUID().withMessage("Invalid request"),

                body("logo")
                    .optional()
                    .notEmpty()
                    .withMessage("Please upload a logo")
                    .bail()
                    .isLength({ max: 255 })
                    .withMessage("Logo file upload path should not be greater than 255 characters"),

                body("name")
                    .optional()
                    .trim()
                    .notEmpty()
                    .withMessage("Please enter the workspace name")
                    .bail()
                    .isLength({ min: 3, max: 255 })
                    .withMessage("workspace name must be atleast 3 and atmost 255 characters"),

                body("description")
                    .optional()
                    .exists()
                    .withMessage("Please enter the description")
                    .bail()
                    .isLength({ min: 3, max: 1000 })
                    .withMessage("Description must be atleast 3 and atmost 1000 characters"),

                body("banner")
                    .optional()
                    .notEmpty()
                    .withMessage("Please upload a banner")
                    .bail()
                    .isLength({ max: 255 })
                    .withMessage("Banner file upload path should not be greater than 255 characters"),

                body("status")
                    .optional()
                    .exists()
                    .withMessage("Invalid status")
                    .bail()
                    .isIn(["active", "inactive"])
                    .withMessage("Invalid workspace status selection"),

                body('showcase')
                    .optional()
                    .isBoolean()
                    .withMessage("Please provide a boolean value for showcase")
            ];
        }

        case "deleteWorkspaceMember": {
            return [
                param("uuid").notEmpty().withMessage("Invalid request").bail().isUUID().withMessage("Invalid request"),

                param("id").notEmpty().withMessage("Invalid member id").bail().isInt().withMessage("Invalid member id"),
            ];
        }

        case "postWorkspaceContent": {
            return [
                param("uuid").notEmpty().withMessage("Invalid request").bail().isUUID().withMessage("Invalid request"),

                body("entity_uuid")
                    .notEmpty()
                    .withMessage("Invalid content uuid")
                    .bail()
                    .isUUID()
                    .withMessage("Invalid content uuid"),

                body("entity_type")
                    .notEmpty()
                    .withMessage("Please specify the content type")
                    .bail()
                    .isIn([
                        "proposals",
                        "collaterals",
                        "knowledges",
                        "barriers",
                        "behaviours",
                        "solutions",
                        "outcomes",
                        "sub_outcomes",
                        "topics",
                        "sub_topics",
                        "courses",
                    ])
                    .withMessage("Invalid content type"),
            ];
        }

        case "postWorkspaceInvitations": {
            return [
                param("uuid").notEmpty().withMessage("Invalid request").bail().isUUID().withMessage("Invalid request"),

                body("role").optional().isIn(["admin", "editor"]).withMessage("Please provide valid role"),

                body("members")
                    .notEmpty()
                    .withMessage("Please add at least one invitation details")
                    .bail()
                    .isArray({ min: 1 })
                    .withMessage("Please add at least one invitation details")
                    .custom(async (members: any, { req }: any) => {
                        const hasDup = _.uniqBy(members, (member: any) => member.email).length !== members.length;

                        if (hasDup) {
                            throw new Error("Duplicate email address entered");
                        }

                        return true;
                    }),

                body("members.*.name")
                    .optional()
                    .notEmpty()
                    .withMessage("Please enter the member name")
                    .bail()
                    .isLength({ max: 255 })
                    .withMessage("Member name cannot be more than 255 characters"),

                body("members.*.email")
                    .toLowerCase()
                    .notEmpty()
                    .withMessage("Please enter member email ID")
                    .bail()
                    .isEmail()
                    .withMessage("Please enter a valid email"),
            ];
        }

        case "postWorkspaceAddContents": {
            return [
                param("uuid").notEmpty().withMessage("Invalid request").bail().isUUID().withMessage("Invalid request"),

                body("user_id").notEmpty().withMessage("Please enter the user id"),

                body("description").notEmpty().withMessage("Please enter the description"),

                body("type")
                    .notEmpty()
                    .withMessage("Please specify the type")
                    .bail()
                    .isIn([
                        "proposals",
                        "collaterals",
                        "knowledges",
                        "barriers",
                        "behaviours",
                        "solutions",
                        "outcomes",
                        "sub_outcomes",
                        "topics",
                        "sub_topics",
                    ])
                    .withMessage("Invalid type"),
            ];
        }

        case "addRole": {
            return [
                param("uuid")
                    .notEmpty()
                    .withMessage("Please provide workspace uuid")
                    .bail()
                    .isUUID()
                    .withMessage("Invalid workspace uuid"),

                param("user_uuid")
                    .notEmpty()
                    .withMessage("Please provide user uuid")
                    .bail()
                    .isUUID()
                    .withMessage("Invalid user uuid"),

                body("role")
                    .notEmpty()
                    .withMessage("Please provide role")
                    .bail()
                    .isIn(["admin", "editor"])
                    .withMessage("Please pass valid role"),
            ];
        }
    }
};
