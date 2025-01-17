import express from "express";
const router = express.Router();

// Controllers
import { EvaluateController } from "../Controllers/EvaluateController";

const EvaluateControllerObj = new EvaluateController();

router.use("/", EvaluateControllerObj.router);

export default router;
