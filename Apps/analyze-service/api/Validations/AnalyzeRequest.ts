import { body, param, query } from "express-validator";

export const Validate: any = (reqType: string) => {
    switch (reqType) {
        case "postAnalyze": {
            return [
                body("pdf_file").custom((value, { req }) => {
                    if (!req.file) {
                        return Promise.reject("Please provide a file to be analyzed");
                    }

                    return Promise.resolve();
                }),

                body("nature_of_document")
                    .notEmpty()
                    .isString()
                    .withMessage("Please select a documtnet nature")
                    .isIn([
                        "Policy Document",
                        "Investment or grant proposal",
                        "Research draft or proposal",
                        "Program design Document",
                        "Strategy recommendations",
                        "Media article or draft",
                        "School or college course outline",
                        "MEL approach",
                        "Product or service design",
                    ])
                    .withMessage("Please select a valid document nature"),

                body("user_role")
                    .notEmpty()
                    .isString()
                    .withMessage("Please select a user role")
                    .isIn([
                        "Philanthropy program officer",
                        "NGO leader",
                        "Impact consultant",
                        "Impact investor",
                        "Researcher",
                        "Journalist",
                        "Policy analyst",
                        "Bureaucrat",
                        "Product manager",
                        "Social entrepreneur",
                        "Student",
                    ])
                    .withMessage("Please provide valid role"),

                body("prompt_labels").optional().isArray().withMessage("Please provide valid prompt labels"),
                body("prompt_labels[*]").isIn(["P1", "P2", "P3", "P4", "P5"]).withMessage("Please select a valid prompt label"),
                body("send_in_mail").optional().notEmpty().isBoolean().toBoolean().withMessage("Please provide true or false"),
            ];
        }
        case "postAnalyzeText": {
            return [
                body("text_input").notEmpty().withMessage("Please provide the valid text to be analyzed"),

                body("nature_of_document")
                    .notEmpty()
                    .isString()
                    .withMessage("Please select a documtnet nature")
                    .isIn([
                        "Policy Document",
                        "Investment or grant proposal",
                        "Research draft or proposal",
                        "Program design Document",
                        "Strategy recommendations",
                        "Media article or draft",
                        "School or college course outline",
                        "MEL approach",
                        "Product or service design",
                    ])
                    .withMessage("Please select a valid document nature"),

                body("user_role")
                    .notEmpty()
                    .isString()
                    .withMessage("Please select a user role")
                    .isIn([
                        "Philanthropy program officer",
                        "NGO leader",
                        "Impact consultant",
                        "Impact investor",
                        "Researcher",
                        "Journalist",
                        "Policy analyst",
                        "Bureaucrat",
                        "Product manager",
                        "Social entrepreneur",
                        "Student",
                    ])
                    .withMessage("Please provide valid role"),

                body("prompt_labels").optional().isArray().withMessage("Please provide valid prompt labels"),
                body("prompt_labels[*]").isIn(["P1", "P2", "P3", "P4", "P5"]).withMessage("Please select a valid prompt label"),
                body("send_in_mail").optional().notEmpty().isBoolean().toBoolean().withMessage("Please provide true or false"),
            ];
        }

        case "postSessionFeedback": {
            return [
                body("session_id").notEmpty().isUUID().withMessage("Please provide a valid session ID"),
                body("feedback").notEmpty().withMessage("Please provide a feedback").bail().isBoolean().withMessage("Please provide a valid feedback "),
                body("feedback_note").optional().isString().withMessage("Please provide a feedback note"),
                body("section").optional().notEmpty().withMessage("Please select a section").isIn(["P0", "P1", "P2", "P3", "P4", "P5"]).withMessage("Please select a valid section"),
                body("response_id")
                    .optional()
                    .notEmpty()
                    .isUUID()
                    .withMessage("Please provide a valid response ID")
                    .custom((response_id, { req }) => {
                        if (req.body.section && response_id) {
                            throw new Error("Invalid request, select only one of section or response");
                        }
                        return true;
                    }),
            ];
        }

        case "getSessionData": {
            return [query("session_id").notEmpty().isUUID().withMessage("Please provide a valid Session ID")];
        }

        case "postFollowup": {
            return [
                body("session_id").notEmpty().isUUID().withMessage("Please provide a valid session ID"),
                body("question").notEmpty().isString().withMessage("Please provide a valid question"),
                body("section").optional().isIn(["P_Custom", "P0", "P1", "P2", "P3", "P4", "P5"]).withMessage("Please select a valid section"),
            ];
        }

        case "putSessionTitle": {
            return [
                param("session_id").notEmpty().isUUID().withMessage("Please select a valid session to edit"),
                body("session_title").notEmpty().isString().withMessage("Please provide a session title"),
            ];
        }

        case "downloadAnalysisData": {
            return [param("session_id").notEmpty().isUUID().withMessage("Please select a valid session to download")];
        }
    }
};
