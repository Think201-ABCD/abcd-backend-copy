import { body, param } from "express-validator";

export const Validate: any = (reqType: string) => {
    switch (reqType) {
        case "upload": {
            return [body("foldername", "Please specify the folder name to upload.").notEmpty()];
        }
    }
};
