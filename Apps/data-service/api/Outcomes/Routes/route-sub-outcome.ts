import express from "express";
const router = express.Router();
import { throwError } from "@redlof/libs/Exceptions/ValidationException";
import { Validate } from "../Validations/SubOutcomeRequest";

// Controllers
import * as SubOutcomeController from "../Controllers/SubOutcomeController";
import { authorize } from "@redlof/libs/Middlewares/AuthenticationMiddleware";

// Topics
router
    .route("/")
    .get(authorize(["role-all"]), Validate("getSubOutcomes"), throwError, SubOutcomeController.getSubOutcomes)
    .post(authorize(["role-admin"]), Validate("postSubOutcome"), throwError, SubOutcomeController.postSubOutcome);

router
    .route("/:uuid/countries")
    .put(
        authorize(["role-admin"]),
        Validate("putSubOutcomeCountry"),
        throwError,
        SubOutcomeController.putSubOutcomeCountry
    );

router
    .route("/:uuid/states")
    .put(
        authorize(["role-admin"]),
        Validate("putSubOutcomeState"),
        throwError,
        SubOutcomeController.putSubOutcomeState
    );

router
    .route("/:uuid")
    .get(authorize(["role-all"]), Validate("getSubOutcome"), throwError, SubOutcomeController.getSubOutcome);

router
    .route("/:uuid/status")
    .put(
        authorize(["role-admin"]),
        Validate("putSubOutcomeStatus"),
        throwError,
        SubOutcomeController.putSubOutcomeStatus
    );

export default router;
