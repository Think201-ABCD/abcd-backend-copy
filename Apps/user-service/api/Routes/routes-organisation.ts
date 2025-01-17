import express from "express";
const router = express.Router();

// Middlewares
import { throwError } from "@redlof/libs/Exceptions/ValidationException";
import { Validate } from "../Validations/OrganisationRequest";
import { authorize } from "@redlof/libs/Middlewares/AuthenticationMiddleware";

// Controllers
import * as OrganisationController from "../Controllers/OrganisationController";

router
    .route("/")
    .get(authorize(["role-all"]), OrganisationController.getOrganisations)
    .post(authorize(["role-admin"]), Validate("postOrganisation"), throwError, OrganisationController.postOrganisations);

router
    .route("/:uuid")
    .get(authorize(["role-all"]), Validate("validateUuid"), throwError, OrganisationController.getOrganisation)
    .put(authorize(["role-all"]), Validate("putOrganisation"), throwError, OrganisationController.putOrganisation);

router.route("/:uuid/members").post(authorize(["role-admin", "role-organisation-admin"]), Validate("postOrganisationMember"), throwError, OrganisationController.postOrganisationMember);

router
    .route("/:uuid/members/:member_uuid")
    .put(authorize(["role-admin", "role-organisation-admin"]), Validate("putOrganisationMember"), throwError, OrganisationController.putOrganisationMember)
    .delete(authorize(["role-organisation-admin"]), Validate("deleteOrganisationMember"), throwError, OrganisationController.deleteOrganisationMember);

router.route("/:uuid/members/:member_uuid/type").put(authorize(["role-organisation-admin"]), Validate("putOrganisationMemberType"), throwError, OrganisationController.putOrganisatioMemberType);

router
    .route("/:uuid/topics")
    .post(authorize(["role-admin", "role-organisation-admin"]), Validate("postOrganisationTopics"), throwError, OrganisationController.postOrganisationTopics)
    .get(authorize(["role-all"]), Validate("validateUuid"), throwError, OrganisationController.getOrganisationTopics);

router
    .route("/:uuid/behaviours")
    .post(authorize(["role-admin", "role-organisation-admin"]), Validate("postOrganisationBehaviours"), throwError, OrganisationController.postOrganisationBehaviours)
    .get(authorize(["role-all"]), Validate("validateUuid"), throwError, OrganisationController.getOrganisationBehaviours);

export default router;
