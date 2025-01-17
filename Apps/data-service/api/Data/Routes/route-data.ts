import express from "express";
const router = express.Router();

// Controllers
import * as DataController from "../Controllers/DataController";
import { authorize } from "@redlof/libs/Middlewares/AuthenticationMiddleware";

router.route("/sdgs").get(authorize(["role-all"]), DataController.getSdgs);

router.route("/entity-types").get(authorize(["role-all"]), DataController.getEntityTyes);

router.route("/recent-updates").get(authorize(["role-all"]), DataController.getRecentUpdates);

router.route("/search").get(authorize(["role-all"]), DataController.getSearchResults);

router.route("/source-downloads").post(authorize(["role-all"]), DataController.postSourceDownloads)

router.route("/organisations").get(authorize(["role-all"]), DataController.getOrganisations)

export default router;
