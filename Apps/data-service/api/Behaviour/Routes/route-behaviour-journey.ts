import express from "express";
const router = express.Router();

// Middlewares
import { throwError } from "@redlof/libs/Exceptions/ValidationException";
import { Validate } from "../Validations/BehaviourJourneyRequest";
import { authorize } from "@redlof/libs/Middlewares/AuthenticationMiddleware";

// Controllers
import * as BehaviourJourneyController from "../Controllers/BehaviourJourneyController";

// Behaviour journey
router
    .route("/:uuid/journeys")
    .get(
        authorize(["role-all"]),
        Validate("getBehaviourJourneys"),
        throwError,
        BehaviourJourneyController.getBehaviourJourneys
    )
    .post(
        authorize(["role-all"]),
        Validate("postBehaviourJourney"),
        throwError,
        BehaviourJourneyController.postBehaviourJourneys
    );

router
    .route("/:uuid/journeys/:journey_uuid/status")
    .put(
        authorize(["role-admin"]),
        Validate("putBehaviourJourneyStatus"),
        throwError,
        BehaviourJourneyController.putBehaviourJourneyStatus
    );

router
    .route("/:uuid/journeys/:journey_uuid/stages/:stage_id")
    .put(
        authorize(["role-all"]),
        Validate("putBehaviourJourneyStage"),
        throwError,
        BehaviourJourneyController.putBehaviourJourneyStage
    );

export default router;
