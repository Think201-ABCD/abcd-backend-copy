import express from "express";
const router = express.Router();

// middlewares
import { throwError } from "@redlof/libs/Exceptions/ValidationException";
import { Validate } from "../../Validations/WorkspaceContentRequest";
import { authorize } from "@redlof/libs/Middlewares/AuthenticationMiddleware";

// Controllers
import * as WorkspaceContentController from "../../Controllers/Workspace content/WorkspaceContentController";

router.route("/topics").get(WorkspaceContentController.getTopics);

router.route("/entities").get(Validate("filterEntities"), throwError, WorkspaceContentController.getEntities);

router.route("/behaviors").get(Validate("getBehaviors"), throwError, WorkspaceContentController.getBehaviors);

router
    .route("/organisation-members")
    .get(authorize(["role-all"]), Validate("getMembers"), throwError, WorkspaceContentController.getEmailMemberList);

router
    .route("/:uuid")
    .get(authorize(["role-all"]), Validate("getEntities"), throwError, WorkspaceContentController.getWorkspaceEntities)
    .post(
        authorize(["role-all"]),
        Validate("addContents"),
        throwError,
        WorkspaceContentController.addExistingWorkspaceContents
    );

router
    .route("/:uuid/custom")
    .post(
        authorize(["role-all"]),
        Validate("addCustomContent"),
        throwError,
        WorkspaceContentController.addCustomWorkspaceContent
    );

router
    .route("/:uuid/entity/:entity_uuid")
    .get(authorize(["role-all"]), Validate("getEntity"), throwError, WorkspaceContentController.getWorkspaceEntity)
    .put(
        authorize(["role-member", "role-organisation-admin", "role-organisation-member"]),
        Validate("updateEntity"),
        throwError,
        WorkspaceContentController.putWorkspaceEntity
    )
    .delete(
        authorize(["role-member", "role-organisation-admin", "role-organisation-member"]),
        Validate("deleteEntity"),
        throwError,
        WorkspaceContentController.deleteWorkspaceEntity
    );

router
    .route("/:uuid/pin/:content_uuid")
    .get(
        authorize(["role-member", "role-organisation-admin", "role-organisation-member"]),
        Validate("pinEntity"),
        throwError,
        WorkspaceContentController.addPin
    )
    .delete(
        authorize(["role-member", "role-organisation-admin", "role-organisation-member"]),
        Validate("pinEntity"),
        throwError,
        WorkspaceContentController.removePin
    );

export default router;
