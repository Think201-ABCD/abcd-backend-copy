import express from "express";
const router = express.Router();

// Middlewares
import { throwError } from "@redlof/libs/Exceptions/ValidationException";
import { Validate } from "../Validations/SolutionRequest";

// Controllers
import * as SolutionController from "../Controllers/SolutionController";
import { authorize } from "@redlof/libs/Middlewares/AuthenticationMiddleware";

// Behaviour categories
router.route("/categories").get(authorize(["role-all"]), SolutionController.getSolutionCategories);

// Behaviour
router
    .route("/")
    .get(authorize(["role-all"]), Validate("getSolutions"), throwError, SolutionController.getSolutions)
    .post(authorize(["role-admin"]), Validate("postSolution"), throwError, SolutionController.postSolution);

router
    .route("/:uuid/countries")
    .put(authorize(["role-admin"]), Validate("putSolutionCountry"), throwError, SolutionController.putSolutionCountry);

router
    .route("/:uuid/states")
    .put(authorize(["role-admin"]), Validate("putSolutionStates"), throwError, SolutionController.putSolutionState);

router
    .route("/:uuid")
    .get(authorize(["role-all"]), Validate("getSolution"), throwError, SolutionController.getSolution);

router
    .route("/:uuid/status")
    .put(authorize(["role-admin"]), Validate("putSolutionStatus"), throwError, SolutionController.putSolutionStatus);

export default router;
