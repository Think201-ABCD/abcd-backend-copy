import express from "express";
import multer from "multer";

// Exceptions
import { throwError } from "@redlof/libs/Exceptions/ValidationException";

// Middlewares
import { authorize } from "@redlof/libs/Middlewares/AuthenticationMiddleware";
import { upload } from "@redlof/libs/Middlewares/MulterUploadMiddleware";

// Helper
import { apiException, fileUploader } from "@redlof/libs/Helpers/helpers";

import { Validate } from "../Validations/RedlofHelperRequest";

const router = express.Router();

const fileUpload = upload.single("file");

router.route("/upload").post(
    (req: any, res: any, next: any) => {
        fileUpload(req, res, (err: any) => {
            if (err instanceof multer.MulterError) {
                if (err.code === "LIMIT_FILE_SIZE") {
                    return apiException("File size must be less than 10MB", res, {}, 422);
                }
            }

            if (err) {
                return apiException(String(err), res, {}, 422);
            }

            next();
        });
    },
    Validate("upload"),
    authorize(["role-all"]),
    throwError,
    fileUploader
);

export default router;
