import { body, param, query } from "express-validator";

export const Validate: any = (reqType: string) => {
    switch (reqType) {
        case "getBehaviours": {
            return [
                query("status")
                    .optional()
                    .isIn(["draft", "unpublished", "published"])
                    .withMessage("Only allowed values for status are draft or published"),

                query("search").optional().isString().withMessage("Please enter valid search parameter"),
            ];
        }
    }
};
