import express from "express";
const router = express.Router();
import { throwError } from "@redlof/libs/Exceptions/ValidationException";
import { Validate } from "../Validations/LocationRequest";

// Controllers
import * as LocationController from "../Controllers/LocationController";
import { authorize } from "@redlof/libs/Middlewares/AuthenticationMiddleware";

router.route("/countries").get(authorize(["role-all"]), LocationController.getCountries);

router.route("/states").get(authorize(["role-all"]), Validate("getStates"), throwError, LocationController.getStates);

export default router;
