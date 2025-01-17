import express from "express";
const router = express.Router();
import { throwError } from "@redlof/libs/Exceptions/ValidationException";
import { Validate } from "../Validations/SubTopicRequest";

// Controllers
import * as SubTopicController from "../Controllers/SubTopicController";
import { authorize } from "@redlof/libs/Middlewares/AuthenticationMiddleware";

// Sub Topics
router
    .route("/")
    .post(authorize(["role-admin"]), Validate("postSubTopic"), throwError, SubTopicController.postSubTopic)
    .get(authorize(["role-all"]), Validate("getSubTopics"), throwError, SubTopicController.getSubTopics);

router
    .route("/:uuid/countries")
    .put(authorize(["role-admin"]), Validate("putSubTopicCountry"), throwError, SubTopicController.putSubTopicCountry);

router
    .route("/:uuid/states")
    .put(authorize(["role-admin"]), Validate("putSubTopicState"), throwError, SubTopicController.putSubTopicState);

router
    .route("/:uuid")
    .get(authorize(["role-all"]), Validate("getSubTopic"), throwError, SubTopicController.getSubTopic);

router
    .route("/:uuid/status")
    .put(authorize(["role-admin"]), Validate("putSubTopicStatus"), throwError, SubTopicController.putSubTopicStatus);

export default router;
