import express from "express";
export const router = express.Router();

import AuthRoutes from "./route-auth";
import ProfileRoutes from "./route-profile";

import {AuthController} from "../Controllers/AuthV2Controller"
const AuthControllerObj = new AuthController()
router.use("/v2", AuthControllerObj.router)

router.use("/", AuthRoutes);
router.use("/profiles", ProfileRoutes);

export default router;
