import express from "express";
const router = express.Router();

// Middlewares
import { authorize } from "@redlof/libs/Middlewares/AuthenticationMiddleware";

// Controllers
import * as ChatController from "../Controllers/ChatController";
import { Validate } from "../Validations/ChatRequest";
import { throwError } from "@redlof/libs/Exceptions/ValidationException";

router.route("/message").get(authorize(["role-all"]), ChatController.getMessages);

router.route("/message").post(authorize(["role-all"]), Validate("postMessage"), throwError, ChatController.postMessage);

router.route("/feedback").post(authorize(["role-all"]), Validate("postFeedback"), throwError, ChatController.postFeedback);

router.route("/get_session_chat").get(ChatController.getSessionChats);

// Twilio

router.route("/whatsapp-sent").get(authorize(["role-all"]), ChatController.getTwilioWhatsappSent);

router.route("/whatsapp-number-update").put(authorize(["role-all"]), Validate("postWhatsAppNumberUpdate"), throwError, ChatController.putWhatsappNumberUpdate);

export default router;
