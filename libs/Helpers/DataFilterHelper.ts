import { Op } from "sequelize";
import _ from "lodash";

// Models
import { Topic } from "../Models/Topic/Topic";
import { OutcomeTopic } from "./../Models/Outcome/OutcomeTopic";
import { SubTopicTopic } from "./../Models/Topic/SubTopicTopic";
import { BehaviourTopic } from "./../Models/Behaviour/BehaviourTopic";
import { BarrierTopic } from "../Models/Barrier/BarrierTopic";
import { SolutionTopic } from "../Models/Solution/SolutionTopic";
import { SubTopic } from "../Models/Topic/SubTopic";
import { Outcome } from "../Models/Outcome/Outcome";
import { SubOutcomeOutcome } from "../Models/Outcome/SubOutcomeOutcome";
import { BehaviourOutcome } from "../Models/Behaviour/BehaviourOutcome";
import { BarrierOutcome } from "../Models/Barrier/BarrierOutcome";
import { SolutionOutcome } from "../Models/Solution/SolutionOutcome";
import { SubOutcome } from "../Models/Outcome/SubOutcome";
import { Behaviour } from "../Models/Behaviour/Behaviour";
import { BarrierBehaviour } from "../Models/Barrier/BarrierBehaviour";
import { SolutionBehaviour } from "../Models/Solution/SolutionBehaviours";
import { Barrier } from "../Models/Barrier/Barrier";
import { SolutionBarrier } from "../Models/Solution/SolutionBarrier";
import { Solution } from "../Models/Solution/Solution";
import { TopicCountry } from "../Models/Topic/TopicCountry";
import { Country } from "../Models/Data/Country";
import { OutcomeCountry } from "../Models/Outcome/OutcomeCountry";
import { BehaviourCountry } from "../Models/Behaviour/BehaviourCountry";
import { BarrierCountry } from "../Models/Barrier/BarrierCountry";
import { SolutionCountry } from "../Models/Solution/SolutionCountry";
import { CollateralCountry } from "../Models/Collateral/CollateralCountry";
import { KnowledgeCountry } from "../Models/Knowledge/KnowledgeCountry";
import { Knowledge } from "../Models/Knowledge/Knowledge";
import { KnowledgeTopic } from "../Models/Knowledge/KnowledgeTopic";
import { KnowledgeOutcome } from "../Models/Knowledge/KnowledgeOutcome";
import { KnowledgeBehaviour } from "../Models/Knowledge/KnowledgeBehaviour";
import { KnowledgeBarrier } from "../Models/Knowledge/KnowledgeBarrier";
import { KnowledgeSolution } from "../Models/Knowledge/KnowledgeSolution";
import { CollateralTopic } from "../Models/Collateral/CollateralTopic";
import { CollateralOutcome } from "../Models/Collateral/CollateralOutcome";
import { CollateralBehaviour } from "../Models/Collateral/CollateralBehaviour";
import { CollateralBarrier } from "../Models/Collateral/CollateralBarrier";
import { CollateralSolution } from "../Models/Collateral/CollateralSolution";
import { Collateral } from "../Models/Collateral/Collateral";
import { State } from "../Models/Data/State";
import { TopicState } from "../Models/Topic/TopicState";
import { OutcomeState } from "../Models/Outcome/OutcomeState";
import { ProposalCountry } from "../Models/ProposalRequest/ProposalCountry";
import { ProposalTopic } from "../Models/ProposalRequest/ProposalTopic";
import { ProposalOutcome } from "../Models/ProposalRequest/ProposalOutcome";
import { ProposalBehaviour } from "../Models/ProposalRequest/ProposalBehaviour";
import { ProposalBarrier } from "../Models/ProposalRequest/ProposalBarrier";
import { ProposalSolution } from "../Models/ProposalRequest/ProposalSolution";
import { BehaviourState } from "../Models/Behaviour/BehaviourState";
import { BarrierState } from "../Models/Barrier/BarrierState";
import { SolutionState } from "../Models/Solution/SolutionState";
import { KnowledgeState } from "../Models/Knowledge/KnowledgeState";
import { CollateralState } from "../Models/Collateral/CollateralState";
import { ProposalState } from "../Models/ProposalRequest/ProposalState";
import { Proposal } from "../Models/ProposalRequest/Proposal";
import { OrganisationBehaviour } from "../Models/Organisation/OrganisationBehaviour";
import { OrganisationTopic } from "../Models/Organisation/OrganisationTopic";
import { User } from "../Models/Auth/User";
import { info } from "./helpers";
import { Course } from "../Models/CourseLibrary/Course";
import { CourseTopic } from "../Models/CourseLibrary/CourseTopic";
import { CourseOutcome } from "../Models/CourseLibrary/CourseOutcome";
import { CourseBehaviour } from "../Models/CourseLibrary/CourseBehaviour";
import { CourseBarrier } from "../Models/CourseLibrary/CourseBarriers";
import { CourseSolution } from "../Models/CourseLibrary/CourseSolution";
import { Skill } from "../Models/CourseLibrary/Skill";

const arraysInCommon = (...arrs: any) => {
    let commonElements = arrs[0].slice();

    for (let i = 1; i < arrs.length; i++) {
        commonElements = _.intersection(commonElements, arrs[i]);
    }

    return _.intersection(...commonElements);
};

export const getFilteredCountrys = async (filters: any) => {
    const countryIdSet = [];

    const filterKeys = ["topic_ids", "outcome_ids"];
    const appliedFilters = _.intersection(filterKeys, Object.keys(filters));

    // Determine wheather filters are applied or not, if not return all the topic Ids
    if (appliedFilters.length <= 0) {
        return [...(await Country.findAll({ attributes: ["id"] }))].map((country: any) => country.id);
    }

    if (filters.topic_ids) {
        const topicCountrys = [
            ...(await TopicCountry.findAll({
                where: {
                    topic_id: {
                        [Op.in]: typeof filters.topic_ids == "string" ? [filters.topic_ids] : filters.topic_ids,
                    },
                },
            })),
        ].map((topicCountry: any) => topicCountry.country_id);

        // Check if only the current filter is applied
        if (appliedFilters.length <= 1) {
            return topicCountrys;
        }

        countryIdSet.push(topicCountrys);
    }

    if (filters.outcome_ids) {
        const outcomeCountrys = [
            ...(await OutcomeCountry.findAll({
                where: {
                    outcome_id: {
                        [Op.in]: typeof filters.outcome_ids == "string" ? [filters.outcome_ids] : filters.outcome_ids,
                    },
                },
            })),
        ].map((outcomeCountry: any) => outcomeCountry.country_id);

        // Check if only the current filter is applied
        if (appliedFilters.length <= 1) {
            return outcomeCountrys;
        }

        countryIdSet.push(outcomeCountrys);
    }

    return arraysInCommon(countryIdSet);
};

export const getFilteredStates = async (filters: any) => {
    const query: any = {};
    const stateIdSet = [];

    const filterKeys = ["topic_ids", "sub_topic_ids", "outcome_ids", "sub_outcome_ids", "behaviour_ids", "barrier_ids", "solution_ids", "knowledge_ids", "collateral_ids", "proposal_ids"];
    const appliedFilters = _.intersection(filterKeys, Object.keys(filters));

    if (filters.country_id) {
        query.country_id = filters.country_id;
    }

    // Determine wheather filters are applied or not, if not return all the topic Ids
    if (appliedFilters.length <= 0) {
        return [...(await State.findAll({ where: query, attributes: ["id"] }))].map((state: any) => state.id);
    }

    if (filters.topic_ids) {
        const topicStates = [
            ...(await TopicState.findAll({
                where: {
                    topic_id: {
                        [Op.in]: typeof filters.topic_ids == "string" ? [filters.topic_ids] : filters.topic_ids,
                    },
                },
            })),
        ].map((topicState: any) => topicState.state_id);

        // Check if only the current filter is applied
        if (appliedFilters.length <= 1) {
            return topicStates;
        }

        stateIdSet.push(topicStates);
    }

    if (filters.sub_topic_ids) {
        const subTopicStates = [
            ...(await TopicState.findAll({
                where: {
                    sub_topic_id: {
                        [Op.in]: typeof filters.sub_topic_ids == "string" ? [filters.sub_topic_ids] : filters.sub_topic_ids,
                    },
                },
            })),
        ].map((subTopicState: any) => subTopicState.state_id);

        // Check if only the current filter is applied
        if (appliedFilters.length <= 1) {
            return subTopicStates;
        }

        stateIdSet.push(subTopicStates);
    }

    if (filters.outcome_ids) {
        const outcomeStates = [
            ...(await OutcomeState.findAll({
                where: {
                    outcome_id: {
                        [Op.in]: typeof filters.outcome_ids == "string" ? [filters.outcome_ids] : filters.outcome_ids,
                    },
                },
            })),
        ].map((outcomeState: any) => outcomeState.state_id);

        // Check if only the current filter is applied
        if (appliedFilters.length <= 1) {
            return outcomeStates;
        }

        stateIdSet.push(outcomeStates);
    }

    if (filters.sub_outcome_ids) {
        const subOutcomeStates = [
            ...(await OutcomeState.findAll({
                where: {
                    sub_outcome_id: {
                        [Op.in]: typeof filters.sub_outcome_ids == "string" ? [filters.sub_outcome_ids] : filters.sub_outcome_ids,
                    },
                },
            })),
        ].map((subOutcomeState: any) => subOutcomeState.state_id);

        // Check if only the current filter is applied
        if (appliedFilters.length <= 1) {
            return subOutcomeStates;
        }

        stateIdSet.push(subOutcomeStates);
    }

    if (filters.behaviour_ids) {
        const behaviourStates = [
            ...(await BehaviourState.findAll({
                where: {
                    behaviour_id: {
                        [Op.in]: typeof filters.behaviour_ids == "string" ? [filters.behaviour_ids] : filters.behaviour_ids,
                    },
                },
            })),
        ].map((behaviourState: any) => behaviourState.state_id);

        // Check if only the current filter is applied
        if (appliedFilters.length <= 1) {
            return behaviourStates;
        }

        stateIdSet.push(behaviourStates);
    }

    if (filters.barrier_ids) {
        const barrierStates = [
            ...(await BarrierState.findAll({
                where: {
                    barrier_id: {
                        [Op.in]: typeof filters.barrier_ids == "string" ? [filters.barrier_ids] : filters.barrier_ids,
                    },
                },
            })),
        ].map((barrierState: any) => barrierState.state_id);

        // Check if only the current filter is applied
        if (appliedFilters.length <= 1) {
            return barrierStates;
        }

        stateIdSet.push(barrierStates);
    }

    if (filters.solution_ids) {
        const solutionStates = [
            ...(await SolutionState.findAll({
                where: {
                    solution_id: {
                        [Op.in]: typeof filters.solution_ids == "string" ? [filters.solution_ids] : filters.solution_ids,
                    },
                },
            })),
        ].map((solutionState: any) => solutionState.state_id);

        // Check if only the current filter is applied
        if (appliedFilters.length <= 1) {
            return solutionStates;
        }

        stateIdSet.push(solutionStates);
    }

    if (filters.knowledge_ids) {
        const knowledgeStates = [
            ...(await KnowledgeState.findAll({
                where: {
                    knowledge_id: {
                        [Op.in]: typeof filters.knowledge_ids == "string" ? [filters.knowledge_ids] : filters.knowledge_ids,
                    },
                },
            })),
        ].map((knowledgeState: any) => knowledgeState.state_id);

        // Check if only the current filter is applied
        if (appliedFilters.length <= 1) {
            return knowledgeStates;
        }

        stateIdSet.push(knowledgeStates);
    }

    if (filters.collateral_ids) {
        const collateralStates = [
            ...(await CollateralState.findAll({
                where: {
                    collateral_id: {
                        [Op.in]: typeof filters.collateral_ids == "string" ? [filters.collateral_ids] : filters.collateral_ids,
                    },
                },
            })),
        ].map((collateralState: any) => collateralState.state_id);

        // Check if only the current filter is applied
        if (appliedFilters.length <= 1) {
            return collateralStates;
        }

        stateIdSet.push(collateralStates);
    }

    if (filters.proposal_ids) {
        const proposalStates = [
            ...(await ProposalState.findAll({
                where: {
                    proposal_id: {
                        [Op.in]: typeof filters.proposal_ids == "string" ? [filters.proposal_ids] : filters.proposal_ids,
                    },
                },
            })),
        ].map((proposalState: any) => proposalState.state_id);

        // Check if only the current filter is applied
        if (appliedFilters.length <= 1) {
            return proposalStates;
        }

        stateIdSet.push(proposalStates);
    }

    return arraysInCommon(stateIdSet);
};

export const getFilteredTopics = async (filters: any) => {
    const topicIdSet = [];

    const filterKeys = ["sub_topic_ids", "outcome_ids", "sub_outcome_ids", "behaviour_ids", "barrier_ids", "solution_ids"];
    const appliedFilters = _.intersection(filterKeys, Object.keys(filters));

    // Determine wheather filters are applied or not, if not return all the topic Ids
    if (appliedFilters.length <= 0) {
        return [...(await Topic.findAll({ attributes: ["id"] }))].map((topic: any) => topic.id);
    }

    if (filters.sub_topic_ids) {
        const subTopicTopics = [
            ...(await SubTopicTopic.findAll({
                where: {
                    sub_topic_id: {
                        [Op.in]: typeof filters.sub_topic_ids == "string" ? [filters.sub_topic_ids] : filters.sub_topic_ids,
                    },
                },
            })),
        ].map((subTopic: any) => subTopic.topic_id);

        // Check if only the current filter is applied
        if (appliedFilters.length <= 1) {
            return subTopicTopics;
        }

        topicIdSet.push(subTopicTopics);
    }

    if (filters.outcome_ids) {
        const outcomeTopics = [
            ...(await OutcomeTopic.findAll({
                where: {
                    outcome_id: {
                        [Op.in]: typeof filters.outcome_ids == "string" ? [filters.outcome_ids] : filters.outcome_ids,
                    },
                },
            })),
        ].map((outcomeTopic: any) => outcomeTopic.topic_id);

        // Check if only the current filter is applied
        if (appliedFilters.length <= 1) {
            return outcomeTopics;
        }

        topicIdSet.push(outcomeTopics);
    }

    if (filters.sub_outcome_ids) {
        const subOutcomeTopics = [
            ...(await OutcomeTopic.findAll({
                where: {
                    sub_outcome_id: {
                        [Op.in]: typeof filters.sub_outcome_ids == "string" ? [filters.sub_outcome_ids] : filters.sub_outcome_ids,
                    },
                },
            })),
        ].map((outcomeTopic: any) => outcomeTopic.topic_id);

        // Check if only the current filter is applied
        if (appliedFilters.length <= 1) {
            return subOutcomeTopics;
        }

        topicIdSet.push(subOutcomeTopics);
    }

    if (filters.behaviour_ids) {
        const behaviourTopics = [
            ...(await BehaviourTopic.findAll({
                where: {
                    behaviour_id: {
                        [Op.in]: typeof filters.behaviour_ids == "string" ? [filters.behaviour_ids] : filters.behaviour_ids,
                    },
                },
            })),
        ].map((behaviourTopic: any) => behaviourTopic.topic_id);

        // Check if only the current filter is applied
        if (appliedFilters.length <= 1) {
            return behaviourTopics;
        }

        topicIdSet.push(behaviourTopics);
    }

    if (filters.barrier_ids) {
        const barrierTopics = [
            ...(await BarrierTopic.findAll({
                where: {
                    barrier_id: {
                        [Op.in]: typeof filters.barrier_ids == "string" ? [filters.barrier_ids] : filters.barrier_ids,
                    },
                },
            })),
        ].map((barrierTopic: any) => barrierTopic.topic_id);

        // Check if only the current filter is applied
        if (appliedFilters.length <= 1) {
            return barrierTopics;
        }

        topicIdSet.push(barrierTopics);
    }

    if (filters.solution_ids) {
        const solutionTopics = [
            ...(await SolutionTopic.findAll({
                where: {
                    solution_id: {
                        [Op.in]: typeof filters.solution_ids == "string" ? [filters.solution_ids] : filters.solution_ids,
                    },
                },
            })),
        ].map((barrierTopic: any) => barrierTopic.topic_id);

        // Check if only the current filter is applied
        if (appliedFilters.length <= 1) {
            return solutionTopics;
        }

        topicIdSet.push(solutionTopics);
    }

    return arraysInCommon(topicIdSet);
};

export const getFilteredSubTopics = async (filters: any) => {
    const dataIdSet = [];

    const filterKeys = ["topic_ids", "outcome_ids", "sub_outcome_ids", "behaviour_ids", "barrier_ids", "solution_ids"];
    const appliedFilters = _.intersection(filterKeys, Object.keys(filters));

    // Determine wheather filters are applied or not, if not return all the topic Ids
    if (appliedFilters.length <= 0) {
        return [...(await SubTopic.findAll({ attributes: ["id"] }))].map((subTopic: any) => subTopic.id);
    }

    if (filters.topic_ids) {
        const subTopicIds = [
            ...(await SubTopicTopic.findAll({
                where: {
                    topic_id: {
                        [Op.in]: typeof filters.topic_ids == "string" ? [filters.topic_ids] : filters.topic_ids,
                    },
                },
            })),
        ].map((subTopic: any) => subTopic.sub_topic_id);

        // Check if only the current filter is applied
        if (appliedFilters.length <= 1) {
            return subTopicIds;
        }

        dataIdSet.push(subTopicIds);
    }

    if (filters.outcome_ids) {
        const outcomeSubTopics = [
            ...(await OutcomeTopic.findAll({
                where: {
                    outcome_id: {
                        [Op.in]: typeof filters.outcome_ids == "string" ? [filters.outcome_ids] : filters.outcome_ids,
                    },
                },
            })),
        ].map((outcomeTopic: any) => outcomeTopic.sub_topic_id);

        // Check if only the current filter is applied
        if (appliedFilters.length <= 1) {
            return outcomeSubTopics;
        }

        dataIdSet.push(outcomeSubTopics);
    }

    if (filters.sub_outcome_ids) {
        const subOutcomeSubTopics = [
            ...(await OutcomeTopic.findAll({
                where: {
                    sub_outcome_id: {
                        [Op.in]: typeof filters.sub_outcome_ids == "string" ? [filters.sub_outcome_ids] : filters.sub_outcome_ids,
                    },
                },
            })),
        ].map((outcomeTopic: any) => outcomeTopic.sub_topic_id);

        // Check if only the current filter is applied
        if (appliedFilters.length <= 1) {
            return subOutcomeSubTopics;
        }

        dataIdSet.push(subOutcomeSubTopics);
    }

    if (filters.behaviour_ids) {
        const behaviourSubTopics = [
            ...(await BehaviourTopic.findAll({
                where: {
                    behaviour_id: {
                        [Op.in]: typeof filters.behaviour_ids == "string" ? [filters.behaviour_ids] : filters.behaviour_ids,
                    },
                },
            })),
        ].map((behaviourTopic: any) => behaviourTopic.sub_topic_id);

        // Check if only the current filter is applied
        if (appliedFilters.length <= 1) {
            return behaviourSubTopics;
        }

        dataIdSet.push(behaviourSubTopics);
    }

    if (filters.barrier_ids) {
        const barrierSubTopics = [
            ...(await BarrierTopic.findAll({
                where: {
                    barrier_id: {
                        [Op.in]: typeof filters.barrier_ids == "string" ? [filters.barrier_ids] : filters.barrier_ids,
                    },
                },
            })),
        ].map((barrierTopic: any) => barrierTopic.sub_topic_id);

        // Check if only the current filter is applied
        if (appliedFilters.length <= 1) {
            return barrierSubTopics;
        }

        dataIdSet.push(barrierSubTopics);
    }

    if (filters.solution_ids) {
        const solutionSubTopics = [
            ...(await SolutionTopic.findAll({
                where: {
                    solution_id: {
                        [Op.in]: typeof filters.solution_ids == "string" ? [filters.solution_ids] : filters.solution_ids,
                    },
                },
            })),
        ].map((barrierTopic: any) => barrierTopic.sub_topic_id);

        // Check if only the current filter is applied
        if (appliedFilters.length <= 1) {
            return solutionSubTopics;
        }

        dataIdSet.push(solutionSubTopics);
    }

    return arraysInCommon(dataIdSet);
};

export const getFilteredOutcomes = async (filters: any) => {
    const dataIdSet = [];

    const filterKeys = ["topic_ids", "sub_topic_ids", "sub_outcome_ids", "behaviour_ids", "barrier_ids", "solution_ids"];
    const appliedFilters = _.intersection(filterKeys, Object.keys(filters));

    // Determine wheather filters are applied or not, if not return all the topic Ids
    if (appliedFilters.length <= 0) {
        return [...(await Outcome.findAll({ attributes: ["id"] }))].map((outcome: any) => outcome.id);
    }

    if (filters.topic_ids) {
        const topicOutcomeIds = [
            ...(await OutcomeTopic.findAll({
                where: {
                    topic_id: {
                        [Op.in]: typeof filters.topic_ids == "string" ? [filters.topic_ids] : filters.topic_ids,
                    },
                },
            })),
        ].map((subTopic: any) => subTopic.outcome_id);

        // Check if only the current filter is applied
        if (appliedFilters.length <= 1) {
            return topicOutcomeIds;
        }

        dataIdSet.push(topicOutcomeIds);
    }

    if (filters.sub_topic_ids) {
        const subTopicOutcomes = [
            ...(await OutcomeTopic.findAll({
                where: {
                    sub_topic_id: {
                        [Op.in]: typeof filters.sub_topic_ids == "string" ? [filters.sub_topic_ids] : filters.sub_topic_ids,
                    },
                },
            })),
        ].map((subTopic: any) => subTopic.outcome_id);

        // Check if only the current filter is applied
        if (appliedFilters.length <= 1) {
            return subTopicOutcomes;
        }

        dataIdSet.push(subTopicOutcomes);
    }

    if (filters.sub_outcome_ids) {
        const subOutcomeOutcomes = [
            ...(await SubOutcomeOutcome.findAll({
                where: {
                    sub_outcome_id: {
                        [Op.in]: typeof filters.sub_outcome_ids == "string" ? [filters.sub_outcome_ids] : filters.sub_outcome_ids,
                    },
                },
            })),
        ].map((outcomeTopic: any) => outcomeTopic.outcome_id);

        // Check if only the current filter is applied
        if (appliedFilters.length <= 1) {
            return subOutcomeOutcomes;
        }

        dataIdSet.push(subOutcomeOutcomes);
    }

    if (filters.behaviour_ids) {
        const behaviourOutcomes = [
            ...(await BehaviourOutcome.findAll({
                where: {
                    behaviour_id: {
                        [Op.in]: typeof filters.behaviour_ids == "string" ? [filters.behaviour_ids] : filters.behaviour_ids,
                    },
                },
            })),
        ].map((behaviourOutcome: any) => behaviourOutcome.outcome_id);

        // Check if only the current filter is applied
        if (appliedFilters.length <= 1) {
            return behaviourOutcomes;
        }

        dataIdSet.push(behaviourOutcomes);
    }

    if (filters.barrier_ids) {
        const barrierOutcomes = [
            ...(await BarrierOutcome.findAll({
                where: {
                    barrier_id: {
                        [Op.in]: typeof filters.barrier_ids == "string" ? [filters.barrier_ids] : filters.barrier_ids,
                    },
                },
            })),
        ].map((barrierOutcome: any) => barrierOutcome.outcome_id);

        // Check if only the current filter is applied
        if (appliedFilters.length <= 1) {
            return barrierOutcomes;
        }

        dataIdSet.push(barrierOutcomes);
    }

    if (filters.solution_ids) {
        const solutionOutcomes = [
            ...(await SolutionOutcome.findAll({
                where: {
                    solution_id: {
                        [Op.in]: typeof filters.solution_ids == "string" ? [filters.solution_ids] : filters.solution_ids,
                    },
                },
            })),
        ].map((solutionOutcome: any) => solutionOutcome.outcome_id);

        // Check if only the current filter is applied
        if (appliedFilters.length <= 1) {
            return solutionOutcomes;
        }

        dataIdSet.push(solutionOutcomes);
    }

    return arraysInCommon(dataIdSet);
};

export const getFilteredSubOutcomes = async (filters: any) => {
    const dataIdSet = [];

    const filterKeys = ["topic_ids", "sub_topic_ids", "outcome_ids", "behaviour_ids", "barrier_ids", "solution_ids"];
    const appliedFilters = _.intersection(filterKeys, Object.keys(filters));

    // Determine wheather filters are applied or not, if not return all the topic Ids
    if (appliedFilters.length <= 0) {
        return [...(await SubOutcome.findAll({ attributes: ["id"] }))].map((subOutcome: any) => subOutcome.id);
    }

    if (filters.topic_ids) {
        const topicSubOutcomeIds = [
            ...(await OutcomeTopic.findAll({
                where: {
                    topic_id: {
                        [Op.in]: typeof filters.topic_ids == "string" ? [filters.topic_ids] : filters.topic_ids,
                    },
                },
            })),
        ].map((subOutcomeTopic: any) => subOutcomeTopic.sub_outcome_id);

        // Check if only the current filter is applied
        if (appliedFilters.length <= 1) {
            return topicSubOutcomeIds;
        }

        dataIdSet.push(topicSubOutcomeIds);
    }

    if (filters.sub_topic_ids) {
        const subOutcomes = [
            ...(await OutcomeTopic.findAll({
                where: {
                    sub_topic_id: {
                        [Op.in]: typeof filters.sub_topic_ids == "string" ? [filters.sub_topic_ids] : filters.sub_topic_ids,
                    },
                },
            })),
        ].map((subOutcomeTopic: any) => subOutcomeTopic.sub_outcome_id);

        // Check if only the current filter is applied
        if (appliedFilters.length <= 1) {
            return subOutcomes;
        }

        dataIdSet.push(subOutcomes);
    }

    if (filters.outcome_ids) {
        const subOutcomeOutcomes = [
            ...(await SubOutcomeOutcome.findAll({
                where: {
                    outcome_id: {
                        [Op.in]: typeof filters.outcome_ids == "string" ? [filters.outcome_ids] : filters.outcome_ids,
                    },
                },
            })),
        ].map((outcomeSubOutcome: any) => outcomeSubOutcome.sub_outcome_id);

        // Check if only the current filter is applied
        if (appliedFilters.length <= 1) {
            return subOutcomeOutcomes;
        }

        dataIdSet.push(subOutcomeOutcomes);
    }

    if (filters.behaviour_ids) {
        const behaviourSubOutcomes = [
            ...(await BehaviourOutcome.findAll({
                where: {
                    behaviour_id: {
                        [Op.in]: typeof filters.behaviour_ids == "string" ? [filters.behaviour_ids] : filters.behaviour_ids,
                    },
                },
            })),
        ].map((behaviourSubOutcome: any) => behaviourSubOutcome.sub_outcome_id);

        // Check if only the current filter is applied
        if (appliedFilters.length <= 1) {
            return behaviourSubOutcomes;
        }

        dataIdSet.push(behaviourSubOutcomes);
    }

    if (filters.barrier_ids) {
        const barrierSubOutcomes = [
            ...(await BarrierOutcome.findAll({
                where: {
                    barrier_id: {
                        [Op.in]: typeof filters.barrier_ids == "string" ? [filters.barrier_ids] : filters.barrier_ids,
                    },
                },
            })),
        ].map((barrierSubOutcome: any) => barrierSubOutcome.sub_outcome_id);

        // Check if only the current filter is applied
        if (appliedFilters.length <= 1) {
            return barrierSubOutcomes;
        }

        dataIdSet.push(barrierSubOutcomes);
    }

    if (filters.solution_ids) {
        const solutionSubOutcomes = [
            ...(await SolutionOutcome.findAll({
                where: {
                    solution_id: {
                        [Op.in]: typeof filters.solution_ids == "string" ? [filters.solution_ids] : filters.solution_ids,
                    },
                },
            })),
        ].map((solutionSubOutcome: any) => solutionSubOutcome.sub_outcome_id);

        // Check if only the current filter is applied
        if (appliedFilters.length <= 1) {
            return solutionSubOutcomes;
        }

        dataIdSet.push(solutionSubOutcomes);
    }

    return arraysInCommon(dataIdSet);
};

export const getFilteredBehaviours = async (filters: any) => {
    const dataIdSet = [];

    const filterKeys = ["topic_ids", "sub_topic_ids", "outcome_ids", "sub_outcome_ids", "barrier_ids", "solution_ids"];
    const appliedFilters = _.intersection(filterKeys, Object.keys(filters));

    // Determine wheather filters are applied or not, if not return all the topic Ids
    if (appliedFilters.length <= 0) {
        return [...(await Behaviour.findAll({ attributes: ["id"] }))].map((behaviour: any) => behaviour.id);
    }

    if (filters.topic_ids) {
        const behaviourTopicIds = [
            ...(await BehaviourTopic.findAll({
                where: {
                    topic_id: {
                        [Op.in]: typeof filters.topic_ids == "string" ? [filters.topic_ids] : filters.topic_ids,
                    },
                },
            })),
        ].map((behaviourTopic: any) => behaviourTopic.behaviour_id);

        // Check if only the current filter is applied
        if (appliedFilters.length <= 1) {
            return behaviourTopicIds;
        }

        dataIdSet.push(behaviourTopicIds);
    }

    if (filters.sub_topic_ids) {
        const subTopicBehaviours = [
            ...(await BehaviourTopic.findAll({
                where: {
                    sub_topic_id: {
                        [Op.in]: typeof filters.sub_topic_ids == "string" ? [filters.sub_topic_ids] : filters.sub_topic_ids,
                    },
                },
            })),
        ].map((subTopic: any) => subTopic.behaviour_id);

        // Check if only the current filter is applied
        if (appliedFilters.length <= 1) {
            return subTopicBehaviours;
        }

        dataIdSet.push(subTopicBehaviours);
    }

    if (filters.outcome_ids) {
        const outcomeBehaviours = [
            ...(await BehaviourOutcome.findAll({
                where: {
                    outcome_id: {
                        [Op.in]: typeof filters.outcome_ids == "string" ? [filters.outcome_ids] : filters.outcome_ids,
                    },
                },
            })),
        ].map((outcomeBehaviour: any) => outcomeBehaviour.behaviour_id);

        // Check if only the current filter is applied
        if (appliedFilters.length <= 1) {
            return outcomeBehaviours;
        }

        dataIdSet.push(outcomeBehaviours);
    }

    if (filters.sub_outcome_ids) {
        const subOutcomeBehaviour = [
            ...(await BehaviourOutcome.findAll({
                where: {
                    sub_outcome_id: {
                        [Op.in]: typeof filters.sub_outcome_ids == "string" ? [filters.sub_outcome_ids] : filters.sub_outcome_ids,
                    },
                },
            })),
        ].map((outcomeBehaviour: any) => outcomeBehaviour.behaviour_id);

        // Check if only the current filter is applied
        if (appliedFilters.length <= 1) {
            return subOutcomeBehaviour;
        }

        dataIdSet.push(subOutcomeBehaviour);
    }

    if (filters.barrier_ids) {
        const barrierBehaviours = [
            ...(await BarrierBehaviour.findAll({
                where: {
                    barrier_id: {
                        [Op.in]: typeof filters.barrier_ids == "string" ? [filters.barrier_ids] : filters.barrier_ids,
                    },
                },
            })),
        ].map((barrierBehaviour: any) => barrierBehaviour.behaviour_id);

        // Check if only the current filter is applied
        if (appliedFilters.length <= 1) {
            return barrierBehaviours;
        }

        dataIdSet.push(barrierBehaviours);
    }

    if (filters.solution_ids) {
        const solutionBehaviour = [
            ...(await SolutionBehaviour.findAll({
                where: {
                    solution_id: {
                        [Op.in]: typeof filters.solution_ids == "string" ? [filters.solution_ids] : filters.solution_ids,
                    },
                },
            })),
        ].map((solutionBehaviour: any) => solutionBehaviour.behaviour_id);

        // Check if only the current filter is applied
        if (appliedFilters.length <= 1) {
            return solutionBehaviour;
        }

        dataIdSet.push(solutionBehaviour);
    }

    return arraysInCommon(dataIdSet);
};

export const getFilteredBarriers = async (filters: any) => {
    const dataIdSet = [];

    const filterKeys = ["topic_ids", "sub_topic_ids", "outcome_ids", "sub_outcome_ids", "behaviour_ids", "solution_ids"];
    const appliedFilters = _.intersection(filterKeys, Object.keys(filters));

    // Determine wheather filters are applied or not, if not return all the topic Ids
    if (appliedFilters.length <= 0) {
        return [...(await Barrier.findAll({ attributes: ["id"] }))].map((barrier: any) => barrier.id);
    }

    if (filters.topic_ids) {
        const barrierTopicIds = [
            ...(await BarrierTopic.findAll({
                where: {
                    topic_id: {
                        [Op.in]: typeof filters.topic_ids == "string" ? [filters.topic_ids] : filters.topic_ids,
                    },
                },
            })),
        ].map((barrierTopic: any) => barrierTopic.barrier_id);

        // Check if only the current filter is applied
        if (appliedFilters.length <= 1) {
            return barrierTopicIds;
        }

        dataIdSet.push(barrierTopicIds);
    }

    if (filters.sub_topic_ids) {
        const subTopicBarriers = [
            ...(await BarrierTopic.findAll({
                where: {
                    sub_topic_id: {
                        [Op.in]: typeof filters.sub_topic_ids == "string" ? [filters.sub_topic_ids] : filters.sub_topic_ids,
                    },
                },
            })),
        ].map((subTopicBarrier: any) => subTopicBarrier.barrier_id);

        // Check if only the current filter is applied
        if (appliedFilters.length <= 1) {
            return subTopicBarriers;
        }

        dataIdSet.push(subTopicBarriers);
    }

    if (filters.outcome_ids) {
        const outcomeBarriers = [
            ...(await BarrierOutcome.findAll({
                where: {
                    outcome_id: {
                        [Op.in]: typeof filters.outcome_ids == "string" ? [filters.outcome_ids] : filters.outcome_ids,
                    },
                },
            })),
        ].map((outcomeBarrier: any) => outcomeBarrier.barrier_id);

        // Check if only the current filter is applied
        if (appliedFilters.length <= 1) {
            return outcomeBarriers;
        }

        dataIdSet.push(outcomeBarriers);
    }

    if (filters.sub_outcome_ids) {
        const subOutcomeBarrier = [
            ...(await BarrierOutcome.findAll({
                where: {
                    sub_outcome_id: {
                        [Op.in]: typeof filters.sub_outcome_ids == "string" ? [filters.sub_outcome_ids] : filters.sub_outcome_ids,
                    },
                },
            })),
        ].map((outcomeBarrier: any) => outcomeBarrier.barrier_id);

        // Check if only the current filter is applied
        if (appliedFilters.length <= 1) {
            return subOutcomeBarrier;
        }

        dataIdSet.push(subOutcomeBarrier);
    }

    if (filters.behaviour_ids) {
        const barrierBehaviours = [
            ...(await BarrierBehaviour.findAll({
                where: {
                    behaviour_id: {
                        [Op.in]: typeof filters.behaviour_ids == "string" ? [filters.behaviour_ids] : filters.behaviour_ids,
                    },
                },
            })),
        ].map((barrierBehaviour: any) => barrierBehaviour.barrier_id);

        // Check if only the current filter is applied
        if (appliedFilters.length <= 1) {
            return barrierBehaviours;
        }

        dataIdSet.push(barrierBehaviours);
    }

    if (filters.solution_ids) {
        const solutionBarrier = [
            ...(await SolutionBarrier.findAll({
                where: {
                    solution_id: {
                        [Op.in]: typeof filters.solution_ids == "string" ? [filters.solution_ids] : filters.solution_ids,
                    },
                },
            })),
        ].map((solutionBarrier: any) => solutionBarrier.barrier_id);

        // Check if only the current filter is applied
        if (appliedFilters.length <= 1) {
            return solutionBarrier;
        }

        dataIdSet.push(solutionBarrier);
    }

    return arraysInCommon(dataIdSet);
};

export const getFilteredSolutions = async (filters: any) => {
    const dataIdSet = [];

    const filterKeys = ["topic_ids", "sub_topic_ids", "outcome_ids", "sub_outcome_ids", "behaviour_ids", "barrier_ids"];
    const appliedFilters = _.intersection(filterKeys, Object.keys(filters));

    // Determine wheather filters are applied or not, if not return all the topic Ids
    if (appliedFilters.length <= 0) {
        return [...(await Solution.findAll({ attributes: ["id"] }))].map((solution: any) => solution.id);
    }

    if (filters.topic_ids) {
        const solutionTopicIds = [
            ...(await SolutionTopic.findAll({
                where: {
                    topic_id: {
                        [Op.in]: typeof filters.topic_ids == "string" ? [filters.topic_ids] : filters.topic_ids,
                    },
                },
            })),
        ].map((solutionTopic: any) => solutionTopic.solution_id);

        // Check if only the current filter is applied
        if (appliedFilters.length <= 1) {
            return solutionTopicIds;
        }

        dataIdSet.push(solutionTopicIds);
    }

    if (filters.sub_topic_ids) {
        const subTopicSolutions = [
            ...(await SolutionTopic.findAll({
                where: {
                    sub_topic_id: {
                        [Op.in]: typeof filters.sub_topic_ids == "string" ? [filters.sub_topic_ids] : filters.sub_topic_ids,
                    },
                },
            })),
        ].map((subTopicSolution: any) => subTopicSolution.solution_id);

        // Check if only the current filter is applied
        if (appliedFilters.length <= 1) {
            return subTopicSolutions;
        }

        dataIdSet.push(subTopicSolutions);
    }

    if (filters.outcome_ids) {
        const outcomeSolutions = [
            ...(await SolutionOutcome.findAll({
                where: {
                    outcome_id: {
                        [Op.in]: typeof filters.outcome_ids == "string" ? [filters.outcome_ids] : filters.outcome_ids,
                    },
                },
            })),
        ].map((outcomeSolution: any) => outcomeSolution.solution_id);

        // Check if only the current filter is applied
        if (appliedFilters.length <= 1) {
            return outcomeSolutions;
        }

        dataIdSet.push(outcomeSolutions);
    }

    if (filters.sub_outcome_ids) {
        const subOutcomeSolution = [
            ...(await SolutionOutcome.findAll({
                where: {
                    sub_outcome_id: {
                        [Op.in]: typeof filters.sub_outcome_ids == "string" ? [filters.sub_outcome_ids] : filters.sub_outcome_ids,
                    },
                },
            })),
        ].map((outcomeSolution: any) => outcomeSolution.solution_id);

        // Check if only the current filter is applied
        if (appliedFilters.length <= 1) {
            return subOutcomeSolution;
        }

        dataIdSet.push(subOutcomeSolution);
    }

    if (filters.behaviour_ids) {
        const solutionBehaviours = [
            ...(await SolutionBehaviour.findAll({
                where: {
                    behaviour_id: {
                        [Op.in]: typeof filters.behaviour_ids == "string" ? [filters.behaviour_ids] : filters.behaviour_ids,
                    },
                },
            })),
        ].map((solutionBehaviour: any) => solutionBehaviour.solution_id);

        // Check if only the current filter is applied
        if (appliedFilters.length <= 1) {
            return solutionBehaviours;
        }

        dataIdSet.push(solutionBehaviours);
    }

    if (filters.barrier_ids) {
        const solutionBarrier = [
            ...(await SolutionBarrier.findAll({
                where: {
                    barrier_id: {
                        [Op.in]: typeof filters.barrier_ids == "string" ? [filters.barrier_ids] : filters.barrier_ids,
                    },
                },
            })),
        ].map((solutionBarrier: any) => solutionBarrier.solution_id);

        // Check if only the current filter is applied
        if (appliedFilters.length <= 1) {
            return solutionBarrier;
        }

        dataIdSet.push(solutionBarrier);
    }

    return arraysInCommon(dataIdSet);
};

export const getFilteredKnowledges = async (filters: any) => {
    const knowledgeIdSet = [];

    const filterKeys = ["topic_ids", "sub_topic_ids", "outcome_ids", "sub_outcome_ids", "behaviour_ids", "barrier_ids", "solution_ids"];
    const appliedFilters = _.intersection(filterKeys, Object.keys(filters));

    // Determine wheather filters are applied or not, if not return all the topic Ids
    if (appliedFilters.length <= 0) {
        return [...(await Knowledge.findAll({ attributes: ["id"] }))].map((knowledge: any) => knowledge.id);
    }

    if (filters.topic_ids) {
        const topicKnowledges = [
            ...(await KnowledgeTopic.findAll({
                where: {
                    topic_id: {
                        [Op.in]: typeof filters.topic_ids == "string" ? [filters.topic_ids] : filters.topic_ids,
                    },
                },
            })),
        ].map((knowledgeTopic: any) => knowledgeTopic.knowledge_id);

        // Check if only the current filter is applied
        if (appliedFilters.length <= 1) {
            return topicKnowledges;
        }

        knowledgeIdSet.push(topicKnowledges);
    }

    if (filters.sub_topic_ids) {
        const knowledgeSubTopics = [
            ...(await KnowledgeTopic.findAll({
                where: {
                    sub_topic_id: {
                        [Op.in]: typeof filters.sub_topic_ids == "string" ? [filters.sub_topic_ids] : filters.sub_topic_ids,
                    },
                },
            })),
        ].map((knowledgeSubTopic: any) => knowledgeSubTopic.knowledge_id);

        // Check if only the current filter is applied
        if (appliedFilters.length <= 1) {
            return knowledgeSubTopics;
        }

        knowledgeIdSet.push(knowledgeSubTopics);
    }

    if (filters.outcome_ids) {
        const knowledgeOutcomes = [
            ...(await KnowledgeOutcome.findAll({
                where: {
                    outcome_id: {
                        [Op.in]: typeof filters.outcome_ids == "string" ? [filters.outcome_ids] : filters.outcome_ids,
                    },
                },
            })),
        ].map((knowledgeOutcome: any) => knowledgeOutcome.knowledge_id);

        // Check if only the current filter is applied
        if (appliedFilters.length <= 1) {
            return knowledgeOutcomes;
        }

        knowledgeIdSet.push(knowledgeOutcomes);
    }

    if (filters.sub_outcome_ids) {
        const knowledgeSubOutcomes = [
            ...(await KnowledgeOutcome.findAll({
                where: {
                    sub_outcome_id: {
                        [Op.in]: typeof filters.sub_outcome_ids == "string" ? [filters.sub_outcome_ids] : filters.sub_outcome_ids,
                    },
                },
            })),
        ].map((knowledgeSubOutcome: any) => knowledgeSubOutcome.knowledge_id);

        // Check if only the current filter is applied
        if (appliedFilters.length <= 1) {
            return knowledgeSubOutcomes;
        }

        knowledgeIdSet.push(knowledgeSubOutcomes);
    }

    if (filters.behaviour_ids) {
        const knowledgeBehaviours = [
            ...(await KnowledgeBehaviour.findAll({
                where: {
                    behaviour_id: {
                        [Op.in]: typeof filters.behaviour_ids == "string" ? [filters.behaviour_ids] : filters.behaviour_ids,
                    },
                },
            })),
        ].map((knowledgeBehaviour: any) => knowledgeBehaviour.knowledge_id);

        // Check if only the current filter is applied
        if (appliedFilters.length <= 1) {
            return knowledgeBehaviours;
        }

        knowledgeIdSet.push(knowledgeBehaviours);
    }

    if (filters.barrier_ids) {
        const knowledgeBarriers = [
            ...(await KnowledgeBarrier.findAll({
                where: {
                    barrier_id: {
                        [Op.in]: typeof filters.barrier_ids == "string" ? [filters.barrier_ids] : filters.barrier_ids,
                    },
                },
            })),
        ].map((knowledgeBarrier: any) => knowledgeBarrier.knowledge_id);

        // Check if only the current filter is applied
        if (appliedFilters.length <= 1) {
            return knowledgeBarriers;
        }

        knowledgeIdSet.push(knowledgeBarriers);
    }

    if (filters.solution_ids) {
        const knowledgeSolutions = [
            ...(await KnowledgeSolution.findAll({
                where: {
                    solution_id: {
                        [Op.in]: typeof filters.solution_ids == "string" ? [filters.solution_ids] : filters.solution_ids,
                    },
                },
            })),
        ].map((knowledgeSolution: any) => knowledgeSolution.knowledge_id);

        // Check if only the current filter is applied
        if (appliedFilters.length <= 1) {
            return knowledgeSolutions;
        }

        knowledgeIdSet.push(knowledgeSolutions);
    }

    return arraysInCommon(knowledgeIdSet);
};

export const getFilteredCollaterals = async (filters: any) => {
    const collateralIdSet = [];

    const filterKeys = ["topic_ids", "sub_topic_ids", "outcome_ids", "sub_outcome_ids", "behaviour_ids", "barrier_ids", "solution_ids"];
    const appliedFilters = _.intersection(filterKeys, Object.keys(filters));

    // Determine wheather filters are applied or not, if not return all the topic Ids
    if (appliedFilters.length <= 0) {
        return [...(await Collateral.findAll({ attributes: ["id"] }))].map((collateral: any) => collateral.id);
    }

    if (filters.topic_ids) {
        const topicCollaterals = [
            ...(await CollateralTopic.findAll({
                where: {
                    topic_id: {
                        [Op.in]: typeof filters.topic_ids == "string" ? [filters.topic_ids] : filters.topic_ids,
                    },
                },
            })),
        ].map((collateralTopic: any) => collateralTopic.collateral_id);

        // Check if only the current filter is applied
        if (appliedFilters.length <= 1) {
            return topicCollaterals;
        }

        collateralIdSet.push(topicCollaterals);
    }

    if (filters.sub_topic_ids) {
        const collateralSubTopics = [
            ...(await CollateralTopic.findAll({
                where: {
                    sub_topic_id: {
                        [Op.in]: typeof filters.sub_topic_ids == "string" ? [filters.sub_topic_ids] : filters.sub_topic_ids,
                    },
                },
            })),
        ].map((collateralSubTopic: any) => collateralSubTopic.collateral_id);

        // Check if only the current filter is applied
        if (appliedFilters.length <= 1) {
            return collateralSubTopics;
        }

        collateralIdSet.push(collateralSubTopics);
    }

    if (filters.outcome_ids) {
        const collateralOutcomes = [
            ...(await CollateralOutcome.findAll({
                where: {
                    outcome_id: {
                        [Op.in]: typeof filters.outcome_ids == "string" ? [filters.outcome_ids] : filters.outcome_ids,
                    },
                },
            })),
        ].map((collateralOutcome: any) => collateralOutcome.collateral_id);

        // Check if only the current filter is applied
        if (appliedFilters.length <= 1) {
            return collateralOutcomes;
        }

        collateralIdSet.push(collateralOutcomes);
    }

    if (filters.sub_outcome_ids) {
        const collateralSubOutcomes = [
            ...(await CollateralOutcome.findAll({
                where: {
                    sub_outcome_id: {
                        [Op.in]: typeof filters.sub_outcome_ids == "string" ? [filters.sub_outcome_ids] : filters.sub_outcome_ids,
                    },
                },
            })),
        ].map((collateralSubOutcome: any) => collateralSubOutcome.collateral_id);

        // Check if only the current filter is applied
        if (appliedFilters.length <= 1) {
            return collateralSubOutcomes;
        }

        collateralIdSet.push(collateralSubOutcomes);
    }

    if (filters.behaviour_ids) {
        const collateralBehaviours = [
            ...(await CollateralBehaviour.findAll({
                where: {
                    behaviour_id: {
                        [Op.in]: typeof filters.behaviour_ids == "string" ? [filters.behaviour_ids] : filters.behaviour_ids,
                    },
                },
            })),
        ].map((collateralBehaviour: any) => collateralBehaviour.collateral_id);

        // Check if only the current filter is applied
        if (appliedFilters.length <= 1) {
            return collateralBehaviours;
        }

        collateralIdSet.push(collateralBehaviours);
    }

    if (filters.barrier_ids) {
        const collateralBarriers = [
            ...(await CollateralBarrier.findAll({
                where: {
                    barrier_id: {
                        [Op.in]: typeof filters.barrier_ids == "string" ? [filters.barrier_ids] : filters.barrier_ids,
                    },
                },
            })),
        ].map((collateralBarrier: any) => collateralBarrier.collateral_id);

        // Check if only the current filter is applied
        if (appliedFilters.length <= 1) {
            return collateralBarriers;
        }

        collateralIdSet.push(collateralBarriers);
    }

    if (filters.solution_ids) {
        const collateralSolutions = [
            ...(await CollateralSolution.findAll({
                where: {
                    solution_id: {
                        [Op.in]: typeof filters.solution_ids == "string" ? [filters.solution_ids] : filters.solution_ids,
                    },
                },
            })),
        ].map((collateralSolution: any) => collateralSolution.collateral_id);

        // Check if only the current filter is applied
        if (appliedFilters.length <= 1) {
            return collateralSolutions;
        }

        collateralIdSet.push(collateralSolutions);
    }

    return arraysInCommon(collateralIdSet);
};

export const getFilteredProposals = async (filters: any) => {
    const proposalIdSet: any = [];

    const filterKeys = ["topic_ids", "sub_topic_ids", "outcome_ids", "sub_outcome_ids", "behaviour_ids", "barrier_ids", "solution_ids"];
    const appliedFilters = _.intersection(filterKeys, Object.keys(filters));

    // Determine wheather filters are applied or not, if not return all the topic Ids
    if (appliedFilters.length <= 0) {
        return [...(await Proposal.findAll({ attributes: ["id"] }))].map((proposal: any) => proposal.id);
    }

    if (filters.topic_ids) {
        const topicProposals = [
            ...(await ProposalTopic.findAll({
                where: {
                    topic_id: {
                        [Op.in]: typeof filters.topic_ids == "string" ? [filters.topic_ids] : filters.topic_ids,
                    },
                },
            })),
        ].map((proposalTopic: any) => proposalTopic.proposal_id);

        // Check if only the current filter is applied
        if (appliedFilters.length <= 1) {
            return topicProposals;
        }

        proposalIdSet.push(topicProposals);
    }

    if (filters.sub_topic_ids) {
        const proposalSubTopics = [
            ...(await ProposalTopic.findAll({
                where: {
                    sub_topic_id: {
                        [Op.in]: typeof filters.sub_topic_ids == "string" ? [filters.sub_topic_ids] : filters.sub_topic_ids,
                    },
                },
            })),
        ].map((proposalSubTopic: any) => proposalSubTopic.proposal_id);

        // Check if only the current filter is applied
        if (appliedFilters.length <= 1) {
            return proposalSubTopics;
        }

        proposalIdSet.push(proposalSubTopics);
    }

    if (filters.outcome_ids) {
        const proposalOutcomes = [
            ...(await ProposalOutcome.findAll({
                where: {
                    outcome_id: {
                        [Op.in]: typeof filters.outcome_ids == "string" ? [filters.outcome_ids] : filters.outcome_ids,
                    },
                },
            })),
        ].map((proposalOutcome: any) => proposalOutcome.proposal_id);

        // Check if only the current filter is applied
        if (appliedFilters.length <= 1) {
            return proposalOutcomes;
        }

        proposalIdSet.push(proposalOutcomes);
    }

    if (filters.sub_outcome_ids) {
        const proposalSubOutcomes = [
            ...(await ProposalOutcome.findAll({
                where: {
                    sub_outcome_id: {
                        [Op.in]: typeof filters.sub_outcome_ids == "string" ? [filters.sub_outcome_ids] : filters.sub_outcome_ids,
                    },
                },
            })),
        ].map((proposalSubOutcome: any) => proposalSubOutcome.proposal_id);

        // Check if only the current filter is applied
        if (appliedFilters.length <= 1) {
            return proposalSubOutcomes;
        }

        proposalIdSet.push(proposalSubOutcomes);
    }

    if (filters.behaviour_ids) {
        const proposalBehaviours = [
            ...(await ProposalBehaviour.findAll({
                where: {
                    behaviour_id: {
                        [Op.in]: typeof filters.behaviour_ids == "string" ? [filters.behaviour_ids] : filters.behaviour_ids,
                    },
                },
            })),
        ].map((proposalBehaviour: any) => proposalBehaviour.proposal_id);

        // Check if only the current filter is applied
        if (appliedFilters.length <= 1) {
            return proposalBehaviours;
        }

        proposalIdSet.push(proposalBehaviours);
    }

    if (filters.barrier_ids) {
        const proposalBarriers = [
            ...(await ProposalBarrier.findAll({
                where: {
                    barrier_id: {
                        [Op.in]: typeof filters.barrier_ids == "string" ? [filters.barrier_ids] : filters.barrier_ids,
                    },
                },
            })),
        ].map((proposalBarrier: any) => proposalBarrier.proposal_id);

        // Check if only the current filter is applied
        if (appliedFilters.length <= 1) {
            return proposalBarriers;
        }

        proposalIdSet.push(proposalBarriers);
    }

    if (filters.solution_ids) {
        const proposalSolutions = [
            ...(await ProposalSolution.findAll({
                where: {
                    solution_id: {
                        [Op.in]: typeof filters.solution_ids == "string" ? [filters.solution_ids] : filters.solution_ids,
                    },
                },
            })),
        ].map((proposalSolution: any) => proposalSolution.proposal_id);

        // Check if only the current filter is applied
        if (appliedFilters.length <= 1) {
            return proposalSolutions;
        }

        proposalIdSet.push(proposalSolutions);
    }

    return arraysInCommon(proposalIdSet);
};

export const getCountryData = async (entitiyId: number, countryId: any, entity: string) => {
    let entitydata: any;
    const include: any = [{ model: Country, as: "country", required: true }];

    switch (entity) {
        case "topics":
            entitydata = await TopicCountry.findOne({
                attributes: { exclude: ["deleted_at", "updated_at"] },
                where: { topic_id: entitiyId, country_id: countryId },
                include,
            });

            break;

        case "sub_topics":
            entitydata = await TopicCountry.findOne({
                attributes: { exclude: ["deleted_at", "updated_at"] },
                where: { sub_topic_id: entitiyId, country_id: countryId },
                include,
            });

            break;

        case "outcomes":
            entitydata = await OutcomeCountry.findOne({
                attributes: { exclude: ["deleted_at", "updated_at"] },
                where: { outcome_id: entitiyId, country_id: countryId },
                include,
            });

            break;

        case "sub_outcomes":
            entitydata = await OutcomeCountry.findOne({
                attributes: { exclude: ["deleted_at", "updated_at"] },
                where: { sub_outcome_id: entitiyId, country_id: countryId },
                include,
            });

            break;

        case "behaviours": {
            const query: any = { behaviour_id: entitiyId };

            if (countryId) {
                query.country_id = countryId;
            }

            entitydata = await BehaviourCountry.findOne({
                attributes: { exclude: ["deleted_at", "updated_at"] },
                where: query,
                include,
            });

            break;
        }

        case "barriers":
            entitydata = await BarrierCountry.findOne({
                attributes: { exclude: ["deleted_at", "updated_at"] },
                where: { barrier_id: entitiyId, country_id: countryId },
                include,
            });

            break;

        case "solutions":
            entitydata = await SolutionCountry.findOne({
                attributes: { exclude: ["deleted_at", "updated_at"] },
                where: { solution_id: entitiyId, country_id: countryId },
                include,
            });

            break;

        case "collaterals":
            entitydata = await CollateralCountry.findOne({
                attributes: { exclude: ["deleted_at", "updated_at"] },
                where: { collateral_id: entitiyId, country_id: countryId },
                include,
            });

            break;

        case "knowledges":
            entitydata = await KnowledgeCountry.findOne({
                attributes: { exclude: ["deleted_at", "updated_at"] },
                where: { knowledge_id: entitiyId, country_id: countryId },
                include,
            });

            break;

        case "proposals":
            entitydata = await ProposalCountry.findOne({
                attributes: { exclude: ["deleted_at", "updated_at"] },
                where: { proposal_id: entitiyId, country_id: countryId },
                include,
            });

            break;

        default:
            break;
    }

    return entitydata;
};

export const getFilteredOrganisations = async (filters: any) => {
    const organisationIdSet: any = [];

    const filterKeys = ["topic_ids", "behaviour_ids"];
    const appliedFilters = _.intersection(filterKeys, Object.keys(filters));

    // Determine wheather filters are applied or not, if not return all the topic Ids
    if (appliedFilters.length <= 0) {
        return false;
    }

    if (filters.behaviour_ids) {
        const organisationBehaviours = [
            ...(await OrganisationBehaviour.findAll({
                where: {
                    behaviour_id: {
                        [Op.in]: typeof filters.behaviour_ids == "string" ? [filters.behaviour_ids] : filters.behaviour_ids,
                    },
                },
            })),
        ].map((organisationBehaviour: any) => organisationBehaviour.organisation_id);

        // Check if only the current filter is applied
        if (appliedFilters.length <= 1) {
            return organisationBehaviours;
        }

        organisationIdSet.push(organisationBehaviours);
    }

    if (filters.topic_ids) {
        const organisationTopics = [
            ...(await OrganisationTopic.findAll({
                where: {
                    topic_id: {
                        [Op.in]: typeof filters.topic_ids == "string" ? [filters.topic_ids] : filters.topic_ids,
                    },
                },
            })),
        ].map((organisationTopic: any) => organisationTopic.organisation_id);

        // Check if only the current filter is applied
        if (appliedFilters.length <= 1) {
            return organisationTopics;
        }

        organisationIdSet.push(organisationTopics);
    }

    return arraysInCommon(organisationIdSet);
};

export const getFilteredWorkspaceContent = async (filters, workspaceContents) => {
    const filterKeys = ["topic_ids", "behaviour_ids"];
    const appliedFilters = _.intersection(filterKeys, Object.keys(filters));

    //If no filter is applied then pass the all workspace content

    if (appliedFilters.length <= 0) {
        return workspaceContents;
    }

    // if (filters.topic_ids && filters.topic_ids.length >= 0) {
    //     topicIds = await Promise.all(
    //         filters.topic_ids.map(async (topic_id) => {
    //             const topic: any = await Topic.findOne({ where: { uuid: topic_id } });

    //             if (!topic) {
    //                 throw { message: "Topic not found", code: 422 };
    //             }
    //             return topic.id;
    //         })
    //     );
    // }

    // if (filters.behaviour_ids && filters.behaviour_ids.length >= 0) {
    //     behaviorIds = await Promise.all(
    //         filters.behaviour_ids.map(async (behaviour_id) => {
    //             const behavior = await Behaviour.findOne({ where: { uuid: behaviour_id } });

    //             if (!behavior) {
    //                 throw { message: "Behavior not found", code: 422 };
    //             }

    //             return behavior.id;
    //         })
    //     );
    // }

    let queryInclude = generateQueryInclude(filters.topic_ids, filters.behaviour_ids);

    let updatedContents = await Promise.all(
        await workspaceContents.map(async (workspaceContent) => {
            switch (workspaceContent.type) {
                case "topic": {
                    let query: any = {};

                    if (filters.topic_ids && !filters.topic_ids.includes(workspaceContent.entity_id)) {
                        return;
                    }

                    query = { topic_id: workspaceContent.entity_id };

                    if (filters.behaviour_ids && filters.behaviour_ids.length >= 0) {
                        query.behaviour_id = { [Op.in]: filters.behaviour_ids };
                    }

                    const behaviorTopic = await BehaviourTopic.findOne({
                        where: query,
                    });

                    if (behaviorTopic) {
                        return workspaceContent;
                    }

                    break;
                }

                case "behaviour": {
                    let query: any = {};

                    if (filters.behaviour_ids && !filters.behaviour_ids.includes(workspaceContent.entity_id)) {
                        return;
                    }

                    query = { behaviour_id: workspaceContent.entity_id };

                    if (filters.topic_ids && filters.topic_ids.length >= 0) {
                        query.topic_id = { [Op.in]: filters.topic_ids };
                    }

                    const behaviorTopic = await BehaviourTopic.findOne({
                        where: query,
                    });

                    if (behaviorTopic) {
                        return workspaceContent;
                    }

                    break;
                }

                case "barrier": {
                    const barrier = await Barrier.findOne({
                        where: { id: workspaceContent.entity_id },
                        include: queryInclude,
                    });

                    if (barrier) {
                        return workspaceContent;
                    }

                    break;
                }

                case "collateral-library": {
                    const collateral = await Collateral.findOne({
                        where: { id: workspaceContent.entity_id },
                        include: queryInclude,
                    });

                    if (collateral) {
                        return workspaceContent;
                    }

                    break;
                }

                case "knowledge-library": {
                    const knowledge = await Knowledge.findOne({
                        where: { id: workspaceContent.entity_id },
                        include: queryInclude,
                    });

                    if (knowledge) {
                        return workspaceContent;
                    }

                    break;
                }

                case "course-library": {
                    const course = await Course.findOne({
                        where: { id: workspaceContent.entity_id },
                        include: queryInclude,
                    });

                    if (course) {
                        return workspaceContent;
                    }

                    break;
                }

                case "project-and-proposal": {
                    const proposal = await Proposal.findOne({
                        where: { id: workspaceContent.entity_id },
                        include: queryInclude,
                    });

                    if (proposal) {
                        return workspaceContent;
                    }

                    break;
                }

                case "solution": {
                    const solution = await Solution.findOne({
                        where: { id: workspaceContent.entity_id },
                        include: queryInclude,
                    });

                    if (solution) {
                        return workspaceContent;
                    }

                    break;
                }

                case "outcome": {
                    const outcome = await Outcome.findOne({
                        where: { id: workspaceContent.entity_id },
                        include: queryInclude,
                    });

                    if (outcome) {
                        return workspaceContent;
                    }

                    break;
                }

                case "sub-topic": {
                    const subtopic = await SubTopic.findOne({
                        where: { id: workspaceContent.entity_id },
                        include: queryInclude,
                    });

                    if (subtopic) {
                        return workspaceContent;
                    }

                    break;
                }

                case "sub-outcome": {
                    const subtopic = await SubTopic.findOne({
                        where: { id: workspaceContent.entity_id },
                        include: queryInclude,
                    });

                    if (subtopic) {
                        return workspaceContent;
                    }

                    break;
                }
            }
        })
    );

    return updatedContents.filter(Boolean);
};

const generateQueryInclude = (topicIds, behaviorIds) => {
    let queryInclude = [];

    if (topicIds && topicIds.length >= 0) {
        queryInclude.push({
            as: "topics",
            model: Topic,
            where: { id: { [Op.in]: topicIds } },
            required: true,
        });
    }

    if (behaviorIds && behaviorIds.length >= 0) {
        queryInclude.push({
            as: "behaviours",
            model: Behaviour,
            where: { id: { [Op.in]: behaviorIds } },
            required: true,
        });
    }

    return queryInclude;
};

export const getFilteredCourses = async (filters: any) => {
    const include = [];

    if (filters.topic_ids) {
        include.push({
            model: Topic,
            attributes: [],
            through: {
                where: {
                    topic_id: {
                        [Op.in]: typeof filters.topic_ids == "string" ? [filters.topic_ids] : filters.topic_ids,
                    },
                },
            },
            as: "topics",
            required: true,
        });
    }

    if (filters.sub_topic_ids) {
        include.push({
            model: SubTopic,
            attributes: [],
            through: {
                where: {
                    sub_topic_id: {
                        [Op.in]: typeof filters.sub_topic_ids == "string" ? [filters.sub_topic_ids] : filters.sub_topic_ids,
                    },
                },
            },
            as: "sub_topics",
            required: true,
        });
    }
    if (filters.outcome_ids) {
        include.push({
            model: Outcome,
            attributes: [],
            through: {
                where: {
                    outcome_id: {
                        [Op.in]: typeof filters.outcome_ids == "string" ? [filters.outcome_ids] : filters.outcome_ids,
                    },
                },
            },
            as: "outcomes",
            required: true,
        });
    }
    if (filters.sub_outcome_ids) {
        include.push({
            model: SubOutcome,
            attributes: [],
            through: {
                where: {
                    sub_outcome_id: {
                        [Op.in]: typeof filters.sub_outcome_ids == "string" ? [filters.sub_outcome_ids] : filters.sub_outcome_ids,
                    },
                },
            },
            as: "sub_outcomes",
            required: true,
        });
    }
    if (filters.behaviour_ids) {
        include.push({
            model: Behaviour,
            attributes: [],
            through: {
                where: {
                    behaviour_id: {
                        [Op.in]: typeof filters.behaviour_ids == "string" ? [filters.behaviour_ids] : filters.behaviour_ids,
                    },
                },
            },
            as: "behaviours",
            required: true,
        });
    }

    if (filters.barrier_ids) {
        include.push({
            model: Barrier,
            attributes: [],
            through: {
                where: {
                    barrier_id: {
                        [Op.in]: typeof filters.barrier_ids == "string" ? [filters.barrier_ids] : filters.barrier_ids,
                    },
                },
            },
            as: "barriers",
            required: true,
        });
    }

    if (filters.solution_ids) {
        include.push({
            model: Solution,
            attributes: [],
            through: {
                where: {
                    solution_id: {
                        [Op.in]: typeof filters.solution_ids == "string" ? [filters.solution_ids] : filters.solution_ids,
                    },
                },
            },
            as: "solutions",
            required: true,
        });
    }


    if (filters.skill_ids) {
        include.push({
            model: Skill,
            attributes: [],
            through: {
                where: {
                    skill_id: {
                        [Op.in]: typeof filters.skill_ids == "string" ? [filters.skill_ids] : filters.skill_ids,
                    },
                },
            },
            as: "skills",
            required: true,
        });
    }

    return include;
};
