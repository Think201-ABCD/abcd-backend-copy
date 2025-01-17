import express from "express";
const router = express.Router();

// controllers
import { UserController } from "../Controllers/UserController";

const userControllerObj = new UserController();
router.use("/", userControllerObj.router);

export default router;
