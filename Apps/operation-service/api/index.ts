import express from "express";
export const router = express.Router();

import routesRedlofHelper from "./RedlofHelper/Routes/routes-redlof-helpers";
import routesRedisHelper from "./RedisHelper/Routes/index";

router.use("/redlof", routesRedlofHelper);
router.use("/redis", routesRedisHelper);

export default router;
