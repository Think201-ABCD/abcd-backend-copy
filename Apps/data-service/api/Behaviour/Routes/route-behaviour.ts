import express from "express";
const router = express.Router();

// Middlewares
import { throwError } from "@redlof/libs/Exceptions/ValidationException";
import { Validate } from "../Validations/BehaviourRequest";

// Controllers
import * as BehaviourController from "../Controllers/BehaviourController";
import { authorize } from "@redlof/libs/Middlewares/AuthenticationMiddleware";

// Behaviour categories
router.route("/categories").get(authorize(["role-admin"]), BehaviourController.getBehaviourCategories);

// Behaviour
router
    .route("/")
    .get(authorize(["role-all"]), Validate("getBehaviours"), throwError, BehaviourController.getBehaviours)
    .post(authorize(["role-admin"]), Validate("postBehaviour"), throwError, BehaviourController.postBehaviour);

router
    .route("/:uuid/countries")
    .put(
        authorize(["role-admin"]),
        Validate("putBehaviourCountry"),
        throwError,
        BehaviourController.putBehaviourCountry
    );

router
    .route("/:uuid/states")
    .put(authorize(["role-admin"]), Validate("putBehaviourStates"), throwError, BehaviourController.putBehaviourState);

router
    .route("/:uuid")
    .get(authorize(["role-all"]), Validate("getBehaviour"), throwError, BehaviourController.getBehaviour);

router
    .route("/:uuid/status")
    .put(authorize(["role-admin"]), Validate("putBehaviourStatus"), throwError, BehaviourController.putBehaviourStatus);

// Individual APIs
router
    .route("/:uuid/detail")
    .get(authorize(["role-all"]), Validate("getBehaviour"), throwError, BehaviourController.getBehaviourDetails);

router
    .route("/:uuid/outcome")
    .get(authorize(["role-all"]), Validate("getBehaviour"), throwError, BehaviourController.getBehaviourOutcomes);

router
    .route("/:uuid/sub-outcomes")
    .get(authorize(["role-all"]), Validate("getBehaviour"), throwError, BehaviourController.getBehaviourSubOutcomes);

router
    .route("/:uuid/barrier")
    .get(authorize(["role-all"]), Validate("getBehaviour"), throwError, BehaviourController.getBehaviourBarriers);

router
    .route("/:uuid/solution")
    .get(authorize(["role-all"]), Validate("getBehaviour"), throwError, BehaviourController.getBehaviourSolutions);

export default router;
