import express from "express";
export const router = express.Router();

import BehaviourRoutes from "./Behaviour/Routes/route-behaviour";

router.use("/behaviours", BehaviourRoutes);

export default router;
