import express from "express";
const router = express.Router();

// Import module routes
import organisationRoutes from "./Routes/routes-organisation";
import UserListingRoutes from "./Routes/routes-user-listing";
import memberRoutes from "./Routes/routes-members";
import expertRoutes from "./Routes/routes-experts";
import workspaceRoutes from "./Routes/routes-workspace";
import PopulateWorkspaceContentRoutes from "./Routes/Workspace content/route-populate-workspace-content";
import WorkspaceContentRoutes from "./Routes/Workspace content/route-workspace-content";
import PublicWorkspaceContentRoutes from "./Routes/Workspace content/route-public-workspace-content";

// v2 controllers
import { MemberController } from "./Controllers/MemberV2Controller";
import { OrganisationController } from "./Controllers/OrganisationV2Controller";

const MemberControllerObj = new MemberController();
router.use("/members/v2", MemberControllerObj.router);

const OrganisationControllerObj = new OrganisationController();
router.use("/organisations/v2", OrganisationControllerObj.router);

router.use("/", UserListingRoutes);
router.use("/organisations", organisationRoutes);
router.use("/members", memberRoutes);
router.use("/experts", expertRoutes);
router.use("/workspaces", workspaceRoutes);
router.use("/workspace-content", PopulateWorkspaceContentRoutes);
router.use("/workspace-content", WorkspaceContentRoutes);
router.use("/public/workspace-content", PublicWorkspaceContentRoutes);

export default router;
