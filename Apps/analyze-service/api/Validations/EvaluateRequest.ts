import { body, param } from "express-validator";

export const Validate: any = (reqType: string) => {
    switch (reqType) {
        case "postEvaluate": {
            return [
                body("proposal_type")
                    .notEmpty()
                    .withMessage("Please provide proposal type")
                    .isIn(["pdf", "text"])
                    .withMessage("Proposal type should be either pdf or text")
                    .custom((value, { req }) => {
                        if (req.body.proposal_type === "text" && !req.body.proposal_text_input) {
                            return Promise.reject("Please provide a proposal to be evaluated");
                        }
                        if (req.body.proposal_type === "pdf" && !req.files.proposal_pdf_file) {
                            return Promise.reject("Please provide a file to be evaluated");
                        }
                        return Promise.resolve();
                    }),

                body("proposal_text_input")
                    //
                    .optional()
                    .notEmpty()
                    .withMessage("Please provide a proposal to be evaluated")
                    .isString()
                    .withMessage("Please provide a valid proposal"),

                body("tor_type")
                    .notEmpty()
                    .withMessage("Please provide TOR type")
                    .isIn(["pdf", "text"])
                    .withMessage("TOR type should be either pdf or text")
                    .custom((value, { req }) => {
                        if (req.body.tor_type === "text" && !req.body.tor_text_input) {
                            return Promise.reject("Please provide a reference text for evaluation");
                        }
                        if (req.body.tor_type === "pdf" && !req.files.tor_pdf_file) {
                            return Promise.reject("Please provide a reference file for evaluation");
                        }
                        return Promise.resolve();
                    }),

                body("tor_text_input")
                    //
                    .optional()
                    .notEmpty()
                    .withMessage("Please provide a reference text for evaluation")
                    .isString()
                    .withMessage("Please provide a valid reference text"),

                body("nature_of_document")
                    .notEmpty()
                    .isString()
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
                body("send_in_mail").optional().notEmpty().isBoolean().toBoolean().withMessage("Please provide true or false"),
            ];
        }

        case "getSessionData": {
            return [param("session_id").notEmpty().isUUID().withMessage("Please provide a valid session id")];
        }

        case "downloadSessionData": {
            return [param("session_id").notEmpty().isUUID().withMessage("Please select a valid session to download")];
        }

        case "putSessionTitle": {
            return [
                param("session_id").notEmpty().isUUID().withMessage("Please select a valid session to edit"),
                body("session_title").notEmpty().isString().withMessage("Please provide a session title"),
            ];
        }

        case "postFeedback": {
            return [
                body("session_id").notEmpty().isUUID().withMessage("Please provide a valid session id"),

                body("feedback").notEmpty().withMessage("Please provide a feedback").bail().isBoolean().withMessage("Please provide a valid feedback "),

                body("feedback_note").optional().notEmpty().withMessage("Please provide a feedback note"),

                body("section")
                    //
                    .optional()
                    .notEmpty()
                    .withMessage("Please select a section")
                    .isIn(["P_Internal", "P_External", "P_Delta"])
                    .withMessage("Please select a valid section"),

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

        case "postFollowup": {
            return [
                body("session_id").notEmpty().isUUID().withMessage("Please provide a valid session id"),
                body("query").notEmpty().isString().withMessage("Please provide a valid query"),
                body("section")
                    //
                    .optional()
                    .notEmpty()
                    .withMessage("Please select a section")
                    .isIn(["P_Internal", "P_External", "P_Delta"])
                    .withMessage("Please select a valid section"),
            ];
        }
    }
};
