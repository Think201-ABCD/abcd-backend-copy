import express from "express";
const router = express.Router();
import { throwError } from "@redlof/libs/Exceptions/ValidationException";
import { Validate } from "../Validations/PrevalenceRequest";

// Controllers
import * as PrevalenceController from "../Controllers/PrevalenceController";
import { authorize } from "@redlof/libs/Middlewares/AuthenticationMiddleware";

// Prevalence
router
    .route("/")
    .get(authorize(["role-all"]), Validate("getPrevalences"), throwError, PrevalenceController.getPrevalences)
    .post(authorize(["role-admin"]), Validate("postPrevalence"), throwError, PrevalenceController.postPrevalence);

router
    .route("/:uuid")
    .get(authorize(["role-all"]), Validate("getPrevalence"), throwError, PrevalenceController.getPrevalence);

router
    .route("/:uuid/countries")
    .put(
        authorize(["role-admin"]),
        Validate("putPrevalenceDataSet"),
        throwError,
        PrevalenceController.putPrevalenceDataSet
    );

router
    .route("/:uuid/status")
    .put(
        authorize(["role-admin"]),
        Validate("putPrevalenceStatus"),
        throwError,
        PrevalenceController.putPrevalenceStatus
    );

export default router;
