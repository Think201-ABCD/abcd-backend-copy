import express from "express";
const router = express.Router();

// Middlewares
import { throwError } from "@redlof/libs/Exceptions/ValidationException";
import { Validate } from "../Validations/MemberRequest";
import { authorize } from "@redlof/libs/Middlewares/AuthenticationMiddleware";

// Controllers
import * as MemberController from "../Controllers/MemberController";

router.route("/").get(authorize(["role-all"]), MemberController.getMembers);

router
    .route("/:uuid")
    .get(authorize(["role-admin"]), MemberController.getMember)
    .put(authorize(["role-admin"]), MemberController.putMember);

router.route("/:uuid").get(authorize(["role-admin"]), MemberController.getMember);

router
    .route("/:uuid/preferences")
    .post(authorize(["role-admin", "role-member"]), Validate("postMemberPreferences"), throwError, MemberController.postMemberPreferences)
    .get(authorize(["role-admin", "role-member"]), Validate("validateUuid"), throwError, MemberController.getMemberPreferences);

// Scripts
router.route("/banner-update").post(authorize(["role-admin"]), MemberController.postBannerPhotoBulkUpdate);

export default router;
