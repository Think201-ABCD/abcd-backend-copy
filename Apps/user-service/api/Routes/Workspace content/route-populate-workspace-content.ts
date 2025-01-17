import express from "express";
const router = express.Router();

// Controllers
import * as WorkspaceContentController from "../../Controllers/Workspace content/PopulateWorkspaceContentController";

router.route("/populate-barrier").get(WorkspaceContentController.populateBarrierToWorkspaceContent);
router.route("/populate-behaviour").get(WorkspaceContentController.populateBehaviourToWorkspaceContent);
router.route("/populate-collateral-library").get(WorkspaceContentController.populateCollateralToWorkspaceContent);
router.route("/populate-knowledge-library").get(WorkspaceContentController.populateKnowledgeToWorkspaceContent);
router.route("/populate-outcome").get(WorkspaceContentController.populateOutcomeToWorkspaceContent);
router.route("/populate-sub-outcome").get(WorkspaceContentController.populateSubOutcomeToWorkspaceContent);
router.route("/populate-project").get(WorkspaceContentController.populateProjectToWorkspaceContent);
router.route("/populate-solution").get(WorkspaceContentController.populateSolutionToWorkspaceContent);
router.route("/populate-sub-topic").get(WorkspaceContentController.populateSubTopicToWorkspaceContent);
router.route("/populate-topic").get(WorkspaceContentController.populateTopicToWorkspaceContent);

export default router;
