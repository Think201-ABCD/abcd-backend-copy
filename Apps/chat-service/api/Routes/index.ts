import express from "express";
export const router = express.Router();

// Import module routes
import ChatRoutes from "../Routes/route-chat";
import WebhookRoutes from "../Routes/router-webhook";

router.use("/", ChatRoutes);

router.use("/webhook", WebhookRoutes);

export default router;
