import express from "express";
const router = express.Router();

// controllers
import { ScriptController } from "../Controllers/ScriptController";

const scriptControllerObj = new ScriptController();
router.use("/", scriptControllerObj.router);

export default router;
