import express from "express";
const router = express.Router();

import RedisRoutes from "./routes-redis-helpers";

router.use("/", RedisRoutes);

export default router;
