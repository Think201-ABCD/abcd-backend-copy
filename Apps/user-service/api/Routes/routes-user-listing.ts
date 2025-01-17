import express from "express";
const router = express.Router();

// Middlewares
import { throwError } from "@redlof/libs/Exceptions/ValidationException";
import { Validate } from "../Validations/UserLisitngRequest";
import { authorize } from "@redlof/libs/Middlewares/AuthenticationMiddleware";

// Controllers
import * as UserListingController from "../Controllers/UserListingController";

router.route("/").get(authorize(["role-admin"]), Validate("getUsers"), throwError, UserListingController.getUsers);
router.route("/download").get(authorize(["role-admin"]), UserListingController.downloadUsersDetails)

export default router;
