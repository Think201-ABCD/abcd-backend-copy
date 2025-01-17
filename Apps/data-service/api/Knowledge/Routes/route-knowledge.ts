import express from "express";
const router = express.Router();
import { throwError } from "@redlof/libs/Exceptions/ValidationException";
import { Validate } from "../Validations/KnowledgeRequest";

// Controllers
import * as KnowledgeController from "../Controllers/KnowledgeController";
import { authorize } from "@redlof/libs/Middlewares/AuthenticationMiddleware";

// Knowledge categories
router.route("/categories").get(authorize(["role-admin"]), KnowledgeController.getKnowledgeCategories);

// Knowledge
router
    .route("/")
    .get(authorize(["role-all"]), Validate("getKnowledges"), throwError, KnowledgeController.getKnowledges)
    .post(authorize(["role-admin"]), Validate("postKnowledge"), throwError, KnowledgeController.postKnowledge);

router
    .route("/:uuid/countries")
    .put(
        authorize(["role-admin"]),
        Validate("putKnowledgeCountry"),
        throwError,
        KnowledgeController.putKnowledgeCountry
    );

router
    .route("/:uuid/states")
    .put(authorize(["role-admin"]), Validate("putKnowledgeStates"), throwError, KnowledgeController.putKnowledgeState);

router
    .route("/:uuid")
    .get(authorize(["role-all"]), Validate("getKnowledge"), throwError, KnowledgeController.getKnowledge);

router
    .route("/:uuid/status")
    .put(authorize(["role-admin"]), Validate("putKnowledgeStatus"), throwError, KnowledgeController.putKnowledgeStatus);

export default router;
