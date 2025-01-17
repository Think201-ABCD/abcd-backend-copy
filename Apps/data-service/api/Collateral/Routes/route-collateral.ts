import express from "express";
const router = express.Router();
import { throwError } from "@redlof/libs/Exceptions/ValidationException";
import { Validate } from "../Validations/CollateralRequest";

// Controllers
import * as CollateralController from "../Controllers/CollateralController";
import { authorize } from "@redlof/libs/Middlewares/AuthenticationMiddleware";

// Collateral categories
router.route("/categories").get(authorize(["role-admin"]), CollateralController.getCollateralCategories);

// Collateral
router
    .route("/")
    .get(authorize(["role-all"]), Validate("getCollaterals"), throwError, CollateralController.getCollaterals)
    .post(authorize(["role-admin"]), Validate("postCollateral"), throwError, CollateralController.postCollateral);

router
    .route("/:uuid/countries")
    .put(
        authorize(["role-admin"]),
        Validate("putCollateralCountry"),
        throwError,
        CollateralController.putCollateralCountry
    );

router
    .route("/:uuid/states")
    .put(
        authorize(["role-admin"]),
        Validate("putCollateralStates"),
        throwError,
        CollateralController.putCollateralState
    );

router
    .route("/:uuid")
    .get(authorize(["role-all"]), Validate("getCollateral"), throwError, CollateralController.getCollateral);

router
    .route("/:uuid/status")
    .put(
        authorize(["role-admin"]),
        Validate("putCollateralStatus"),
        throwError,
        CollateralController.putCollateralStatus
    );

export default router;
