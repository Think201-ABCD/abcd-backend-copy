import express from "express";
const router = express.Router();
import { throwError } from "@redlof/libs/Exceptions/ValidationException";

// Controllers
import * as RedisController from "../Controllers/RedisController";
import { authorize } from "@redlof/libs/Middlewares/AuthenticationMiddleware";

// Routes

router.route("/get-error-log").get(RedisController.getErrorLog);

export default router;
