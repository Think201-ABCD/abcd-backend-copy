import express from "express";
const router = express.Router();

import * as ChemlabContoller from "../Controllers/ChemlabController";

router.route("/test").get(ChemlabContoller.publicTestFuction);
router.route("/map-role-member").post(ChemlabContoller.mapRoleMember);

export default router;
