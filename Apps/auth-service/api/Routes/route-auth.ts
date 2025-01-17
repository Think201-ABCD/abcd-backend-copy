import express from "express";
const router = express.Router();
import { throwError } from "@redlof/libs/Exceptions/ValidationException";
import { Validate } from "../Validations/AuthRequest";

// Controllers
import * as AuthController from "../Controllers/AuthController";
import * as GoogleController from "../Controllers/GoogleController";
import { authorize } from "@redlof/libs/Middlewares/AuthenticationMiddleware";

// Routes

router.route("/signin").post(Validate("postSignin"), throwError, AuthController.postSignin);

router.route("/pulgin-signin").post(Validate("postSignin"), throwError, AuthController.postPluginSignin);

// Sign-up

router
    .route("/signup")
    .post(Validate("postSignup"), throwError, AuthController.postSignup)
    .get(Validate("getSignup"), throwError, AuthController.getSignup);

router
    .route("/signup/verify-otp")
    .post(Validate("postVerifyOTPSignup"), throwError, AuthController.postVerifyOTPSignup);

router.route("/resend-otp").post(Validate("postResendOTP"), throwError, AuthController.postResendOTP);

// Password reset

router
    .route("/resetpassword/link")
    .post(Validate("postSendResetPasswordLink"), throwError, AuthController.postSendResetPasswordLink);

router.route("/resetpassword").post(Validate("postResetPassword"), throwError, AuthController.postResetPassword);

// Invitation
router.route("/invitations/:uuid").get(Validate("getInvitation"), throwError, AuthController.getInvitation);

// Sign out

router.route("/signout").get(authorize(["role-all"]), AuthController.getSignout);

// Google Auth

router.route("/google/url").get(GoogleController.getSignInUrl);

router.route("/google/signin").post(GoogleController.postGoogleSignIn);

export default router;
