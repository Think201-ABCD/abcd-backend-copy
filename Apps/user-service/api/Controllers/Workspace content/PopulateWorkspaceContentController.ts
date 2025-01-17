import { RequestHandler } from "express";
import { api, apiError } from "@redlof/libs/Helpers/helpers";
import { v4 as uuidv4 } from "uuid";

import { Workspace } from "@redlof/libs/Models/Workspace/Workspace";

import { WorkspaceBarrier } from "@redlof/libs/Models/Workspace/WorkspaceBarrier";
import { Barrier } from "@redlof/libs/Models/Barrier/Barrier";

import { WorkspaceBehaviour } from "@redlof/libs/Models/Workspace/WorkspaceBehaviour";
import { Behaviour } from "@redlof/libs/Models/Behaviour/Behaviour";

import { WorkspaceCollateral } from "@redlof/libs/Models/Workspace/WorkspaceCollateral";
import { Collateral } from "@redlof/libs/Models/Collateral/Collateral";

import { WorkspaceKnowledge } from "@redlof/libs/Models/Workspace/WorkspaceKnowledge";
import { Knowledge } from "@redlof/libs/Models/Knowledge/Knowledge";

import { WorkspaceOutcome } from "@redlof/libs/Models/Workspace/WorkspaceOutcome";
import { Outcome } from "@redlof/libs/Models/Outcome/Outcome";
import { SubOutcome } from "@redlof/libs/Models/Outcome/SubOutcome";

import { WorkspaceProposal } from "@redlof/libs/Models/Workspace/WorkspaceProposal";
import { Proposal } from "@redlof/libs/Models/ProposalRequest/Proposal";

import { WorkspaceSolution } from "@redlof/libs/Models/Workspace/WorkspaceSolution";
import { Solution } from "@redlof/libs/Models/Solution/Solution";

import { WorkspaceTopic } from "@redlof/libs/Models/Workspace/WorkspaceTopic";
import { Topic } from "@redlof/libs/Models/Topic/Topic";
import { SubTopic } from "@redlof/libs/Models/Topic/SubTopic";
import { UserWorkspaceContent } from "@redlof/libs/Models/Workspace/UserWorkspaceContent";

export const populateBarrierToWorkspaceContent: RequestHandler = async (req, res) => {
    let userWorkspaceContent = [];

    const joinTableData = await WorkspaceBarrier.findAll();

    await Promise.all(
        joinTableData.map(async (entry) => {
            const workspace = await Workspace.findOne({
                where: { id: entry.workspace_id },
                attributes: ["id", "added_by"],
            });

            if (!workspace) {
                throw { message: "Workspace does not exist", code: 422 };
            }

            const entity = await Barrier.findOne({
                where: { id: entry.barrier_id },
                attributes: ["id", "title", "logo"],
            });

            if (!entity) {
                throw { message: "Entity does not exist", code: 422 };
            }

            userWorkspaceContent.push({
                uuid: uuidv4(),
                workspace_id: entry.workspace_id,
                user_id: workspace.added_by,
                type: "barrier",
                entity_id: entry.barrier_id,
                logo: entity.logo,
                title: entity.title,
                images: [],
            });
        })
    );

    await UserWorkspaceContent.bulkCreate(userWorkspaceContent);

    return api("Barrier data populated in user workspace content table", res, {});
};

export const populateBehaviourToWorkspaceContent: RequestHandler = async (req, res) => {
    let userWorkspaceContent = [];

    const joinTableData = await WorkspaceBehaviour.findAll();

    await Promise.all(
        joinTableData.map(async (entry) => {
            const workspace = await Workspace.findOne({
                where: { id: entry.workspace_id },
                attributes: ["id", "added_by"],
            });

            if (!workspace) {
                throw { message: "Workspace does not exist", code: 422 };
            }

            const entity = await Behaviour.findOne({
                where: { id: entry.behaviour_id },
                attributes: ["id", "logo", "title"],
            });

            if (!entity) {
                throw { message: "Entity does not exist", code: 422 };
            }

            userWorkspaceContent.push({
                uuid: uuidv4(),
                workspace_id: entry.workspace_id,
                user_id: workspace.added_by,
                type: "behaviour",
                entity_id: entry.behaviour_id,
                logo: entity.logo,
                title: entity.title,
                images: [],
            });
        })
    );

    await UserWorkspaceContent.bulkCreate(userWorkspaceContent);

    return api("Behaviour data populated in user workspace content table", res, {});
};

export const populateCollateralToWorkspaceContent: RequestHandler = async (req, res) => {
    let userWorkspaceContent = [];

    const joinTableData = await WorkspaceCollateral.findAll();

    await Promise.all(
        joinTableData.map(async (entry) => {
            const workspace = await Workspace.findOne({
                where: { id: entry.workspace_id },
                attributes: ["id", "added_by"],
            });

            if (!workspace) {
                throw { message: "Workspace does not exist", code: 422 };
            }

            const entity = await Collateral.findOne({
                where: { id: entry.collateral_id },
                attributes: ["id", "logo", "title"],
            });

            if (!entity) {
                throw { message: "Entity does not exist", code: 422 };
            }

            userWorkspaceContent.push({
                uuid: uuidv4(),
                workspace_id: entry.workspace_id,
                user_id: workspace.added_by,
                type: "collateral-library",
                entity_id: entry.collateral_id,
                logo: entity.logo,
                title: entity.title,
                images: [],
            });
        })
    );

    await UserWorkspaceContent.bulkCreate(userWorkspaceContent);

    return api("Collateral library data populated in user workspace content table", res, {});
};

export const populateKnowledgeToWorkspaceContent: RequestHandler = async (req, res) => {
    let userWorkspaceContent = [];

    const joinTableData = await WorkspaceKnowledge.findAll();

    await Promise.all(
        joinTableData.map(async (entry) => {
            const workspace = await Workspace.findOne({
                where: { id: entry.workspace_id },
                attributes: ["id", "added_by"],
            });

            if (!workspace) {
                throw { message: "Workspace does not exist", code: 422 };
            }

            const entity = await Knowledge.findOne({
                where: { id: entry.knowledge_id },
                attributes: ["id", "title", "logo"],
            });

            if (!entity) {
                throw { message: "Entity does not exist", code: 422 };
            }

            userWorkspaceContent.push({
                uuid: uuidv4(),
                workspace_id: entry.workspace_id,
                user_id: workspace.added_by,
                type: "knowledge-library",
                entity_id: entry.knowledge_id,
                logo: entity.logo,
                title: entity.title,
                images: [],
            });
        })
    );

    await UserWorkspaceContent.bulkCreate(userWorkspaceContent);

    return api("Knowledge library data populated in user workspace content table", res, {});
};

export const populateOutcomeToWorkspaceContent: RequestHandler = async (req, res) => {
    let userWorkspaceContent = [];

    const joinTableData = await WorkspaceOutcome.findAll();

    await Promise.all(
        joinTableData.map(async (entry) => {
            if (!entry.outcome_id) {
                return null;
            }

            const workspace = await Workspace.findOne({
                where: { id: entry.workspace_id },
                attributes: ["id", "added_by"],
            });

            if (!workspace) {
                throw { message: "Workspace does not exist", code: 422 };
            }

            const entity = await Outcome.findOne({
                where: { id: entry.outcome_id },
                attributes: ["id", "logo", "title"],
            });

            if (!entity) {
                throw { message: "Entity does not exist", code: 422 };
            }

            userWorkspaceContent.push({
                uuid: uuidv4(),
                workspace_id: entry.workspace_id,
                user_id: workspace.added_by,
                type: "outcome",
                entity_id: entry.outcome_id,
                logo: entity.logo,
                title: entity.title,
                images: [],
            });
        })
    );

    await UserWorkspaceContent.bulkCreate(userWorkspaceContent);

    return api("Outcome library data populated in user workspace content table", res, {});
};

export const populateSubOutcomeToWorkspaceContent: RequestHandler = async (req, res) => {
    let userWorkspaceContent = [];

    const joinTableData = await WorkspaceOutcome.findAll();

    await Promise.all(
        joinTableData.map(async (entry) => {
            if (!entry.sub_outcome_id) {
                return null;
            }

            const workspace = await Workspace.findOne({
                where: { id: entry.workspace_id },
                attributes: ["id", "added_by"],
            });

            if (!workspace) {
                throw { message: "Workspace does not exist", code: 422 };
            }

            const entity = await SubOutcome.findOne({
                where: { id: entry.sub_outcome_id },
                attributes: ["id", "title", "logo"],
            });

            if (!entity) {
                throw { message: "Entity does not exist", code: 422 };
            }

            userWorkspaceContent.push({
                uuid: uuidv4(),
                workspace_id: entry.workspace_id,
                user_id: workspace.added_by,
                type: "sub-outcome",
                entity_id: entry.sub_outcome_id,
                logo: entity.logo,
                title: entity.title,
                images: [],
            });
        })
    );

    await UserWorkspaceContent.bulkCreate(userWorkspaceContent);

    return api("Sub outcome library data populated in user workspace content table", res, {});
};

export const populateProjectToWorkspaceContent: RequestHandler = async (req, res) => {
    let userWorkspaceContent = [];

    const joinTableData = await WorkspaceProposal.findAll();

    await Promise.all(
        joinTableData.map(async (entry) => {
            const workspace = await Workspace.findOne({
                where: { id: entry.workspace_id },
                attributes: ["id", "added_by"],
            });

            if (!workspace) {
                throw { message: "Workspace does not exist", code: 422 };
            }

            const entity = await Proposal.findOne({
                where: { id: entry.proposal_id },
                attributes: ["id", "logo", "title"],
            });

            if (!entity) {
                throw { message: "Entity does not exist", code: 422 };
            }

            userWorkspaceContent.push({
                uuid: uuidv4(),
                workspace_id: entry.workspace_id,
                user_id: workspace.added_by,
                type: "project-and-proposal",
                entity_id: entry.proposal_id,
                logo: entity.logo,
                title: entity.title,
                images: [],
            });
        })
    );

    await UserWorkspaceContent.bulkCreate(userWorkspaceContent);

    return api("Project and proposal data populated in user workspace content table", res, {});
};

export const populateSolutionToWorkspaceContent: RequestHandler = async (req, res) => {
    let userWorkspaceContent = [];

    const joinTableData = await WorkspaceSolution.findAll();

    await Promise.all(
        joinTableData.map(async (entry) => {
            const workspace = await Workspace.findOne({
                where: { id: entry.workspace_id },
                attributes: ["id", "added_by"],
            });

            if (!workspace) {
                throw { message: "Workspace does not exist", code: 422 };
            }

            const entity = await Solution.findOne({
                where: { id: entry.solution_id },
                attributes: ["id", "logo", "title"],
            });

            if (!entity) {
                throw { message: "Entity does not exist", code: 422 };
            }

            userWorkspaceContent.push({
                uuid: uuidv4(),
                workspace_id: entry.workspace_id,
                user_id: workspace.added_by,
                type: "solution",
                entity_id: entry.solution_id,
                logo: entity.logo,
                title: entity.title,
                images: [],
            });
        })
    );

    await UserWorkspaceContent.bulkCreate(userWorkspaceContent);

    return api("Solution data populated in user workspace content table", res, {});
};

export const populateTopicToWorkspaceContent: RequestHandler = async (req, res) => {
    let userWorkspaceContent = [];

    const joinTableData = await WorkspaceTopic.findAll();

    await Promise.all(
        joinTableData.map(async (entry) => {
            if (!entry.topic_id) {
                return null;
            }

            const workspace = await Workspace.findOne({
                where: { id: entry.workspace_id },
                attributes: ["id", "added_by"],
            });

            if (!workspace) {
                throw { message: "Workspace does not exist", code: 422 };
            }

            const entity = await Topic.findOne({
                where: { id: entry.topic_id },
                attributes: ["id", "logo", "title"],
            });

            if (!entity) {
                throw { message: "Entity does not exist", code: 422 };
            }

            userWorkspaceContent.push({
                uuid: uuidv4(),
                workspace_id: entry.workspace_id,
                user_id: workspace.added_by,
                type: "topic",
                entity_id: entry.topic_id,
                logo: entity.logo,
                title: entity.title,
                images: [],
            });
        })
    );

    await UserWorkspaceContent.bulkCreate(userWorkspaceContent);

    return api("Topic data populated in user workspace content table", res, {});
};

export const populateSubTopicToWorkspaceContent: RequestHandler = async (req, res) => {
    let userWorkspaceContent = [];

    const joinTableData = await WorkspaceTopic.findAll();

    await Promise.all(
        joinTableData.map(async (entry) => {
            if (!entry.sub_topic_id) {
                return null;
            }

            const workspace = await Workspace.findOne({
                where: { id: entry.workspace_id },
                attributes: ["id", "added_by"],
            });

            if (!workspace) {
                throw { message: "Workspace does not exist", code: 422 };
            }

            const entity = await SubTopic.findOne({
                where: { id: entry.sub_topic_id },
                attributes: ["id", "logo", "title"],
            });

            if (!entity) {
                throw { message: "Entity does not exist", code: 422 };
            }

            userWorkspaceContent.push({
                uuid: uuidv4(),
                workspace_id: entry.workspace_id,
                user_id: workspace.added_by,
                type: "sub-topic",
                entity_id: entry.sub_topic_id,
                logo: entity.logo,
                title: entity.title,
                images: [],
            });
        })
    );

    await UserWorkspaceContent.bulkCreate(userWorkspaceContent);

    return api("Subtopic data populated in user workspace content table", res, {});
};
