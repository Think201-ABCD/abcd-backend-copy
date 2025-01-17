import express from "express";
const router = express.Router();
import { throwError } from "@redlof/libs/Exceptions/ValidationException";
import { Validate } from "../Validations/OutcomeRequest";

// Controllers
import * as OutcomeController from "../Controllers/OutcomeController";
import { authorize } from "@redlof/libs/Middlewares/AuthenticationMiddleware";

// Outcomes
router
    .route("/")
    .get(authorize(["role-all"]), Validate("getOutcomes"), throwError, OutcomeController.getOutcomes)
    .post(authorize(["role-admin"]), Validate("postOutcome"), throwError, OutcomeController.postOutcome);

router
    .route("/:uuid/countries")
    .put(authorize(["role-admin"]), Validate("putOutcomeCountry"), throwError, OutcomeController.putOutcomeCountry);

router
    .route("/:uuid/states")
    .put(authorize(["role-admin"]), Validate("putOutcomeStates"), throwError, OutcomeController.putOutcomeState);

router.route("/:uuid").get(authorize(["role-all"]), Validate("getOutcome"), throwError, OutcomeController.getOutcome);

router
    .route("/:uuid/status")
    .put(authorize(["role-admin"]), Validate("putOutcomeStatus"), throwError, OutcomeController.putOutcomeStatus);

// Individual APIs
router
    .route("/:uuid/detail")
    .get(authorize(["role-all"]), Validate("getOutcome"), throwError, OutcomeController.getOutcomeDetails);

router
    .route("/:uuid/sub-outcomes")
    .get(authorize(["role-all"]), Validate("getOutcome"), throwError, OutcomeController.getOutcomeSubOutcomes);

router
    .route("/:uuid/barriers")
    .get(authorize(["role-all"]), Validate("getOutcome"), throwError, OutcomeController.getOutcomeBarriers);

router
    .route("/:uuid/solutions")
    .get(authorize(["role-all"]), Validate("getOutcome"), throwError, OutcomeController.getOutcomeSolutions);

router
    .route("/:uuid/topics")
    .get(authorize(["role-all"]), Validate("getOutcome"), throwError, OutcomeController.getOutcomeTopics);

router
    .route("/:uuid/sub-topics")
    .get(authorize(["role-all"]), Validate("getOutcome"), throwError, OutcomeController.getOutcomeSubTopics);

export default router;
