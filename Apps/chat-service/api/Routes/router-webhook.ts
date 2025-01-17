import express from "express";
const router = express.Router();

// Controllers
import * as WebhookController from "../Controllers/WebhookController";

router.route("/whatsapp-message-received").post(WebhookController.postTwilioWhatsappMessageReceived);

export default router;
