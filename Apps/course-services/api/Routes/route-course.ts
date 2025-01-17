import express from "express";
export const router = express.Router();

import { CourseController } from "../Controllers/CourseController";
import { BundleController } from "../Controllers/BundleController";

const CourseControllerObj = new CourseController();
const BundleControllerObj = new BundleController();

router.use("/courses", CourseControllerObj.router);
router.use("/bundles", BundleControllerObj.router);

export default router;
