import express from "express";
const router = express.Router();

// Controllers
import * as LanguageController from "../Controllers/LanguageController";
import { authorize } from "@redlof/libs/Middlewares/AuthenticationMiddleware";

router.route("/").get(authorize(["role-all"]), LanguageController.getLanguages);

export default router;
