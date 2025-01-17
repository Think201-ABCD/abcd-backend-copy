import express from "express";
const router = express.Router();
import { throwError } from "@redlof/libs/Exceptions/ValidationException";
import { Validate } from "../Validations/BehaviourRequest";

// Controllers
import * as BehaviourController from "../Controllers/BehaviourController";

// Behaviour
router.route("/").get(Validate("getBehaviours"), throwError, BehaviourController.getBehaviours);

export default router;
