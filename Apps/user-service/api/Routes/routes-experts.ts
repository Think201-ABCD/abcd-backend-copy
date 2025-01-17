import express from "express";
const router = express.Router();

// Middlewares
import { throwError } from "@redlof/libs/Exceptions/ValidationException";
import { Validate } from "../Validations/ExportRequest";
import { authorize } from "@redlof/libs/Middlewares/AuthenticationMiddleware";

// Controllers
import * as ExpertController from "../Controllers/ExpertController";

router.route("/categories").get(authorize(["role-admin"]), ExpertController.getExpertCategories);

router
    .route("/")
    .get(authorize(["role-all"]), ExpertController.getExperts)
    .post(authorize(["role-all"]), Validate("postExpert"), throwError, ExpertController.postExpert);

router
    .route("/:uuid")
    .get(authorize(["role-all"]), ExpertController.getExpert)
    .put(authorize(["role-all"]), Validate("putExpert"), throwError, ExpertController.putExpert)
    .patch(authorize(["role-admin"]), Validate("patchExpertStatus"), throwError, ExpertController.patchExperStatus);

export default router;
