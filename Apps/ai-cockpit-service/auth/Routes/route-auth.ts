import express from "express";
const router = express.Router();

// controllers
import { AuthController } from "../Controllers/AuthController";

const authControllerObj = new AuthController();
router.use("/", authControllerObj.router);

export default router;
