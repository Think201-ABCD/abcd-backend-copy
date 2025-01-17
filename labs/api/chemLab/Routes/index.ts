import express from "express";
const router = express.Router();

import chemlabRoute from "./routes-chemlab";

router.use("/chemlab", chemlabRoute);


export default router;
