import { body, query, param } from "express-validator";

export const Validate: any = (reqType: string) => {
    switch (reqType) {
        case "getPrompts": {
            return [
                query("prompt_label")
                    .optional()
                    .trim()
                    .isString()
                    .isIn(["P1", "P2", "P3", "P4", "P5"])

                    .withMessage("Please provide a valid prompt label"),
                query("doc_type")
                    .optional()
                    .trim()
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
                    .withMessage("Please provide a valid doc_type"),
            ];
        }

        case "putPrompts": {
            return [
                param("prompt_label")
                    .trim()
                    .notEmpty()
                    .withMessage("Please provide a prompt label")
                    .isString()
                    .isIn(["P1", "P2", "P3", "P4", "P5"])

                    .withMessage("Please provide a valid prompt label"),
                body().isArray().withMessage("Please provide a valid prompt details to update"),
                body("*[base_prompt]").optional().isString().withMessage("Please provide a valid base prompt"),
                body("*[customization_prompt]").optional().isString().withMessage("Please provide a valid customization_prompt"),
                body("*[doc_type]")
                    .trim()
                    .notEmpty()
                    .withMessage("Please provide document type")
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
                    .withMessage("Please provide a valid document type"),
            ];
        }

        case "getAnalyzerSummaryPrompts": {
            return [
                query("doc_type")
                    .optional()
                    .trim()
                    .notEmpty()
                    .withMessage("Please provide document type")
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
                    .withMessage("Please select a valid document type"),
            ];
        }

        case "putAnalyzerSummaryPrompts": {
            return [
                body().isArray().withMessage("Please provide a valid analyzer summary prompt details to update"),
                body("*[summary_prompt]").optional().isString().withMessage("Please provide a valid summary prompt"),
                body("*[doc_type]")
                    .trim()
                    .notEmpty()
                    .withMessage("Please provide document type")
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
                    .withMessage("Please provide a valid document type"),
            ];
        }

        case "getProposalSummaryPrompts": {
            return [
                query("doc_type")
                    .optional()
                    .trim()
                    .notEmpty()
                    .withMessage("Please provide document type")
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
                    .withMessage("Please select a valid document type"),
            ];
        }

        case "putProposalSummaryPrompts": {
            return [
                body().isArray().withMessage("Please provide a valid proposal summary prompt details to update"),
                body("*[proposal_prompt]").optional().isString().withMessage("Please provide a valid proposal prompt"),
                body("*[doc_type]")
                    .trim()
                    .notEmpty()
                    .withMessage("Please provide document type")
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
                    .withMessage("Please provide a valid document type"),
            ];
        }
    }
};
