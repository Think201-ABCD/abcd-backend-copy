import express from "express";
const router = express.Router();

// Middlewares
import { throwError } from "@redlof/libs/Exceptions/ValidationException";
import { Validate } from "../Validations/WorkspaceRequest";
import { authorize } from "@redlof/libs/Middlewares/AuthenticationMiddleware";

// Controllers
import * as WorkspaceController from "../Controllers/WorkspaceController";

router
    .route("/")
    .get(authorize(["role-all"]),Validate("getWorkspaces"), throwError, WorkspaceController.getWorkspaces)
    .post(authorize(["role-all"]), Validate("postWorkspace"), throwError, WorkspaceController.postWorkspaces);

router
    .route("/:uuid")
    .get(authorize(["role-all"]), Validate("validateUuid"), throwError, WorkspaceController.getWorkspace)
    .put(
        authorize(["role-organisation-admin", "role-organisation-member", "role-member"]),
        Validate("putWorkspace"),
        throwError,
        WorkspaceController.putWorkspace
    );

router
    .route("/:uuid/members/:id/mark-as-admin")
    .post(
        authorize(["role-organisation-admin", "role-organisation-member", "role-member"]),
        WorkspaceController.postMarkAsAdminWorkspaceMember
    );

router
    .route("/:uuid/members/:id")
    .delete(
        authorize(["role-organisation-admin", "role-organisation-member", "role-member"]),
        Validate("deleteWorkspaceMember"),
        throwError,
        WorkspaceController.deleteWorkspaceMember
    );

router
    .route("/:uuid/contents")
    .post(
        authorize(["role-all"]),
        Validate("postWorkspaceContent"),
        throwError,
        WorkspaceController.postWorkspaceContents
    )
    .get(authorize(["role-all"]), Validate("validateUuid"), throwError, WorkspaceController.getWorkspaceContents);

router
    .route("/:uuid/invitations")
    .post(
        authorize(["role-organisation-admin", "role-member"]),
        Validate("postWorkspaceInvitations"),
        throwError,
        WorkspaceController.postWorkspaceInvitations
    )
    .get(authorize(["role-all"]), Validate("validateUuid"), throwError, WorkspaceController.getWorkspaceInvitations);

router
    .route("/:uuid/add-contents")
    .post(Validate("postWorkspaceAddContents"), throwError, WorkspaceController.postWorkspaceAddContents)
    .get(authorize(["role-all"]), Validate("validateUuid"), throwError, WorkspaceController.getWorkspaceContentDetails);

router
    .route("/:uuid/role/:user_uuid")
    .post(
        authorize(["role-member", "role-organisation-admin", "role-organisation-member"]),
        Validate("addRole"),
        throwError,
        WorkspaceController.addWorkspaceMemberRole
    );

export default router;
