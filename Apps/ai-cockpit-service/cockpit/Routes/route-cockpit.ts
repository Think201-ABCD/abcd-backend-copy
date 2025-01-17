import express from "express";
const router = express.Router();

// controllers
import { CockpitController } from "../Controllers/CockpitController";

const CockpitControllerObj = new CockpitController();
router.use("/", CockpitControllerObj.router);

export default router;
