import express from "express";
const router = express.Router();
import { throwError } from "@redlof/libs/Exceptions/ValidationException";
import { Validate } from "../Validations/ProfileRequest";

// Controllers
import * as AuthController from "../Controllers/ProfileController";
import { authorize } from "@redlof/libs/Middlewares/AuthenticationMiddleware";

// Routes
router
    .route("/")
    .get(authorize(["role-all"]), AuthController.getProfile)
    .put(authorize(["role-all"]), Validate("putProfile"), throwError, AuthController.putProfile);

router
    .route("/me")
    .get(authorize(["role-all"]), AuthController.getBasicProfile)

router
    .route("/organisations")
    .post(authorize(["role-all"]), Validate("postOrganisation"), throwError, AuthController.postOrganisationProfile);

router.route("/first-login").post(AuthController.postFirstTimeSignin);

export default router;
