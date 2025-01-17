import express from "express";
const router = express.Router();
import { throwError } from "@redlof/libs/Exceptions/ValidationException";
import { Validate } from "../Validations/BarrierRequest";

// Controllers
import * as BarrierController from "../Controllers/BarrierController";
import { authorize } from "@redlof/libs/Middlewares/AuthenticationMiddleware";

// Barrier categories
router.route("/categories").get(authorize(["role-all"]), BarrierController.getBarrierCategories);

// Barrier
router
    .route("/")
    .get(authorize(["role-all"]), Validate("getBarriers"), throwError, BarrierController.getBarriers)
    .post(authorize(["role-admin"]), Validate("postBarrier"), throwError, BarrierController.postBarrier);

router
    .route("/:uuid/countries")
    .put(authorize(["role-admin"]), Validate("putBarrierCountry"), throwError, BarrierController.putBarrierCountry);

router
    .route("/:uuid/states")
    .put(authorize(["role-admin"]), Validate("putBarrierStates"), throwError, BarrierController.putBarrierState);

router.route("/:uuid").get(authorize(["role-all"]), Validate("getBarrier"), throwError, BarrierController.getBarrier);

router
    .route("/:uuid/status")
    .put(authorize(["role-admin"]), Validate("putBarrierStatus"), throwError, BarrierController.putBarrierStatus);

export default router;
