import express from "express";
const router = express.Router();

// middlewares
import { throwError } from "@redlof/libs/Exceptions/ValidationException";
import { Validate } from "../../Validations/WorkspaceContentRequest";

// Controllers
import * as PublicWorkspaceContentController from "../../Controllers/Workspace content/PublicWorkspaceContentController";

router.route("/:uuid").get(Validate("getEntities"), throwError, PublicWorkspaceContentController.getWorkspaceDetail);
router.route("/v2/:uuid").get(Validate("getEntities"), throwError, PublicWorkspaceContentController.getWorkspaceContents)

router
    .route("/:uuid/entity/:entity_uuid")
    .get(Validate("getEntity"), throwError, PublicWorkspaceContentController.getWorkspaceEntityDetail);

export default router;
