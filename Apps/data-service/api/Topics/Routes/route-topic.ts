import express from "express";
const router = express.Router();
import { throwError } from "@redlof/libs/Exceptions/ValidationException";
import { Validate } from "../Validations/TopicRequest";

// Controllers
import * as TopicController from "../Controllers/TopicController";
import { authorize } from "@redlof/libs/Middlewares/AuthenticationMiddleware";

// Topics
router
    .route("/")
    .post(authorize(["role-admin"]), Validate("postTopic"), throwError, TopicController.postTopic)
    .get(authorize(["role-all"]), Validate("getTopics"), throwError, TopicController.getTopics);

router
    .route("/:uuid/countries")
    .put(authorize(["role-admin"]), Validate("putTopicCountry"), throwError, TopicController.putTopicCountry);

router
    .route("/:uuid/states")
    .put(authorize(["role-admin"]), Validate("putTopicState"), throwError, TopicController.putTopicState);

router.route("/:uuid").get(authorize(["role-all"]), Validate("getTopic"), throwError, TopicController.getTopic);

// Individual APIs
router
    .route("/:uuid/detail")
    .get(authorize(["role-all"]), Validate("getTopic"), throwError, TopicController.getTopicDetails);

router
    .route("/:uuid/subtopic")
    .get(authorize(["role-all"]), Validate("getTopic"), throwError, TopicController.getTopicSubTopics);

router
    .route("/:uuid/barrier")
    .get(authorize(["role-all"]), Validate("getTopic"), throwError, TopicController.getTopicBarriers);

router
    .route("/:uuid/outcome")
    .get(authorize(["role-all"]), Validate("getTopic"), throwError, TopicController.getTopicOutcomes);

router
    .route("/:uuid/solution")
    .get(authorize(["role-all"]), Validate("getTopic"), throwError, TopicController.getTopicSolutions);

router
    .route("/:uuid/behaviour")
    .get(authorize(["role-all"]), Validate("getTopic"), throwError, TopicController.getTopicBehaviours);

router
    .route("/:uuid/status")
    .put(authorize(["role-admin"]), Validate("putTopicStatus"), throwError, TopicController.putTopicStatus);

export default router;
