import express from "express";
const router = express.Router();
import { throwError } from "@redlof/libs/Exceptions/ValidationException";
import { Validate } from "../Validations/ProposalRequest";

// Controllers
import * as ProposalController from "../Controllers/ProposalController";
import { authorize } from "@redlof/libs/Middlewares/AuthenticationMiddleware";

// Proposal categories
router.route("/categories").get(authorize(["role-admin"]), ProposalController.getProposalCategories);

// Proposal
router
    .route("/")
    .get(authorize(["role-all"]), Validate("getProposals"), throwError, ProposalController.getProposals)
    .post(authorize(["role-admin"]), Validate("postProposal"), throwError, ProposalController.postProposal);

router
    .route("/:uuid/countries")
    .put(authorize(["role-admin"]), Validate("putProposalCountry"), throwError, ProposalController.putProposalCountry);

router
    .route("/:uuid/states")
    .put(authorize(["role-admin"]), Validate("putProposalStates"), throwError, ProposalController.putProposalState);

router
    .route("/:uuid")
    .get(authorize(["role-all"]), Validate("getProposal"), throwError, ProposalController.getProposal);

router
    .route("/:uuid/status")
    .put(authorize(["role-admin"]), Validate("putProposalStatus"), throwError, ProposalController.putProposalStatus);

export default router;
