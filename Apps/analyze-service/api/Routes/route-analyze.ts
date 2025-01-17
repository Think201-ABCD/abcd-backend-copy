import { Router } from "express";
const router = Router();

// Controllers
import { AnalyzeController } from "../Controllers/AnalyzeController";

const AnalyzeControllerObj = new AnalyzeController();
router.use("/", AnalyzeControllerObj.router);

export default router;
