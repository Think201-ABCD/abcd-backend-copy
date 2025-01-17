// Models
import { Organisation } from "../Models/Organisation/Organisation";
import { OrganisationMember } from "../Models/Organisation/OrganisationMember";
import { WorkspaceMember } from "../Models/Workspace/WorkspaceMember";
import { Barrier } from "../Models/Barrier/Barrier";
import { Behaviour } from "../Models/Behaviour/Behaviour";
import { Outcome } from "../Models/Outcome/Outcome";
import { SubOutcome } from "../Models/Outcome/SubOutcome";
import { Topic } from "../Models/Topic/Topic";
import { SubTopic } from "../Models/Topic/SubTopic";
import { Proposal } from "../Models/ProposalRequest/Proposal";
import { Knowledge } from "../Models/Knowledge/Knowledge";
import { Solution } from "../Models/Solution/Solution";
import { Collateral } from "../Models/Collateral/Collateral";
import { info } from "./helpers";
import { Course } from "../Models/CourseLibrary/Course";

export const getUserOrganisation = async (UserId: any) => {
    // Get the organisation of the member (User)
    const organisationMember: any = await OrganisationMember.findOne({
        where: { user_id: UserId, type: "admin" },
        include: [{ model: Organisation, as: "organisation", required: true }],
    });

    if (!organisationMember) {
        throw { message: "User is not a part of any organisation.", code: 422 };
    }

    return organisationMember?.organisation;
};

export const validateWorkspaceAccess: any = async (workspace: any, user: any) => {
    let workspaceMember: any;

    switch (workspace.type) {
        case "personal":
            // Get the member of a workspace
            workspaceMember = await WorkspaceMember.findOne({
                where: { workspace_id: workspace.id, user_id: user.id },
            });

            if (!workspaceMember) {
                throw { message: "Invalid access. Please check your access to this action.", code: 422 };
            }
            break;

        case "organisation":
            // This is different because in future we have a possibility of diff check for Org tyope
            // Get the member of a workspace
            workspaceMember = await WorkspaceMember.findOne({
                where: { workspace_id: workspace.id, user_id: user.id },
            });

            if (!workspaceMember) {
                throw { message: "Invalid access. Please check your access to this action.", code: 422 };
            }

            break;

        default:
            break;
    }

    return true;
};

export const determineModel = (entity_type) => {
    let model;

    switch (entity_type) {
        case "barrier": {
            model = Barrier;
            break;
        }
        case "behaviour": {
            model = Behaviour;
            break;
        }
        case "collateral-library": {
            model = Collateral;
            break;
        }
        case "knowledge-library": {
            model = Knowledge;
            break;
        }
        case "outcome": {
            model = Outcome;
            break;
        }
        case "sub-outcome": {
            model = SubOutcome;
            break;
        }
        case "project-and-proposal": {
            model = Proposal;
            break;
        }
        case "solution": {
            model = Solution;
            break;
        }
        case "topic": {
            model = Topic;
            break;
        }
        case "sub-topic": {
            model = SubTopic;
            break;
        }
        case "course-library": {
            model = Course;
            break;
        }
    }

    return model;
};
