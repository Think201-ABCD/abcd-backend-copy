import { Op } from "sequelize";

// Models
import { Country } from "../Models/Data/Country";
import { State } from "../Models/Data/State";
import { Knowledge } from "../Models/Knowledge/Knowledge";
import { KnowledgeBehaviour } from "../Models/Knowledge/KnowledgeBehaviour";
import { PrevalenceBehaviour } from "../Models/Prevalence/PrevalenceBehaviour";
import { Prevalence } from "../Models/Prevalence/Prevalence";
import { Organisation } from "../Models/Organisation/Organisation";
import { OrganisationBehaviour } from "../Models/Organisation/OrganisationBehaviour";
import { CollateralBehaviour } from "../Models/Collateral/CollateralBehaviour";
import { Collateral } from "../Models/Collateral/Collateral";
import { User } from "../Models/Auth/User";
import { ExpertBehaviour } from "../Models/Expert/ExpertBehaviour";
import { Expert } from "../Models/Expert/Expert";
import { ProposalBehaviour } from "../Models/ProposalRequest/ProposalBehaviour";
import { Proposal } from "../Models/ProposalRequest/Proposal";
import { CourseTopic } from "../Models/CourseLibrary/CourseTopic";
import { CourseOutcome } from "../Models/CourseLibrary/CourseOutcome";
import { CourseBehaviour } from "../Models/CourseLibrary/CourseBehaviour";
import { CourseSolution } from "../Models/CourseLibrary/CourseSolution";
import { CourseBarrier } from "../Models/CourseLibrary/CourseBarriers";
import { CourseSkill } from "../Models/CourseLibrary/CourseSkill";

export const rearrangePrevalenceData = async (prevalenceData: any) => {
    let result: any = [];

    const data: any = {};

    const prevalenceStateData = prevalenceData.filter((p: any) => p.state_id != null);

    const prevalenceCountryData = prevalenceData.filter((p: any) => p.state_id == null);

    for (const prevalence_state of prevalenceStateData) {
        let state_obj = result.find((r: any) => r.state_id == prevalence_state.state_id);

        if (!state_obj && prevalence_state.state_id) {
            state_obj = { ...(prevalence_state.state_id && { state_id: prevalence_state.state_id }) };

            if (state_obj.state_id) {
                state_obj.state = await State.findByPk(Number(prevalence_state.state_id));
            }

            state_obj.data = [];

            result.push(state_obj);
        }

        if (state_obj.data) {
            state_obj.data.push(prevalence_state);
        }
    }

    data["prevalence_states"] = result;

    result = [];

    for (const prevalence_country of prevalenceCountryData) {
        let country_obj = result.find((r: any) => r.country_id == prevalence_country.country_id);

        if (!country_obj) {
            country_obj = { ...(prevalence_country.country_id && { country_id: prevalence_country.country_id }) };

            if (country_obj.country_id) {
                country_obj.country = await Country.findByPk(Number(prevalence_country.country_id));
            }

            country_obj.data = [];

            result.push(country_obj);
        }

        if (country_obj.data) {
            country_obj.data.push(prevalence_country);
        }
    }

    data["prevalence_countries"] = result;

    return data;
};

export const getAdditionalBehaviourData = async (behaviour: any) => {
    // Knowledge
    const knowledgeId: any = [...(await KnowledgeBehaviour.findAll({ where: { behaviour_id: behaviour.id } }))].map((knowledgeBehaviour: any) => knowledgeBehaviour.knowledge_id);

    behaviour.knowledges = await Knowledge.findAll({
        attributes: ["id", "uuid", "title", "status", "logo"],
        where: { id: { [Op.in]: knowledgeId }, status: "published" },
    });

    // Prevalence
    const prevalenceId: any = [...(await PrevalenceBehaviour.findAll({ where: { behaviour_id: behaviour.id } }))].map((prevalence) => prevalence.prevalence_id);

    behaviour.prevalences = await Prevalence.findAll({
        attributes: ["id", "uuid", "name", "license", "status"],
        where: { id: { [Op.in]: prevalenceId }, status: "published" },
        raw: true,
        nest: true,
    });

    //Collateral
    const collateralId = [...(await CollateralBehaviour.findAll({ where: { behaviour_id: behaviour.id } }))].map((collateral) => collateral.collateral_id);

    behaviour.collaterals = await Collateral.findAll({
        attributes: ["id", "uuid", "title", "logo", "confidence", "status", "created_at"],
        where: { id: { [Op.in]: collateralId }, status: "published" },
        include: [
            {
                as: "created_by",
                model: User,
                attributes: ["uuid", "first_name", "last_name", "photo"],
                required: false,
            },
        ],
    });

    // Organisations
    const organisationId: any = [...(await OrganisationBehaviour.findAll({ where: { behaviour_id: behaviour.id } }))].map((organisation) => organisation.organisation_id);

    behaviour.organisations = await Organisation.findAll({
        attributes: ["id", "uuid", "name", "logo", "description", "type", "category", "status"],
        where: { id: { [Op.in]: organisationId }, [Op.or]: { is_partner: true, is_funder: true } },
    });

    // Expers
    const expertId = [...(await ExpertBehaviour.findAll({ where: { behaviour_id: behaviour.id } }))].map((expert) => expert.expert_id);

    behaviour.experts = await Expert.findAll({
        attributes: { exclude: ["updated_at", "deleted_at"] },
        where: { id: { [Op.in]: expertId } },
    });

    // Proposals
    const proposalId = [...(await ProposalBehaviour.findAll({ where: { behaviour_id: behaviour.id } }))].map((proposal) => proposal.proposal_id);

    behaviour.proposals = await Proposal.findAll({
        where: { id: { [Op.in]: proposalId } },
        attributes: ["id", "uuid", "title", "brief", "logo", "languages"],
        include: [
            {
                as: "created_by",
                model: User,
                attributes: ["uuid", "first_name", "last_name", "photo"],
                required: false,
            },
        ],
    });

    return behaviour;
};

export const postCourseRelations = async (data: any, course_id) => {
    // Topic / Sub topic
    if (data.topic_ids) {
        const all_topic_ids = [
            ...(await CourseTopic.findAll({
                where: { course_id: course_id, topic_id: { [Op.ne]: null } },
            })),
        ].map((t: any) => parseInt(t.topic_id));

        const CourseTopicToBeDeleted = all_topic_ids.filter((t: any) => !data.topic_ids.includes(t));

        const CourseTopicToBeAdded = data.topic_ids.filter((t: any) => !all_topic_ids.includes(t));

        await CourseTopic.destroy({
            where: { topic_id: { [Op.in]: CourseTopicToBeDeleted }, course_id: course_id },
        });

        const CourseTopicCreate: any = [];

        for (const id of CourseTopicToBeAdded) {
            CourseTopicCreate.push({ course_id: course_id, topic_id: id });
        }

        await CourseTopic.bulkCreate(CourseTopicCreate);
    }

    if (data.sub_topic_ids) {
        const all_topic_ids = [
            ...(await CourseTopic.findAll({
                where: { course_id: course_id, sub_topic_id: { [Op.ne]: null } },
            })),
        ].map((t: any) => parseInt(t.sub_topic_id));

        const courseSubTopicToBeDeleted = all_topic_ids.filter((t: any) => !data.sub_topic_ids.includes(t));

        const courseSubTopicToBeAdded = data.sub_topic_ids.filter((t: any) => !all_topic_ids.includes(t));

        await CourseTopic.destroy({
            where: { sub_topic_id: { [Op.in]: courseSubTopicToBeDeleted }, course_id: course_id },
        });

        const courseSubTopicCreate: any = [];

        for (const id of courseSubTopicToBeAdded) {
            courseSubTopicCreate.push({ course_id: course_id, sub_topic_id: id });
        }

        await CourseTopic.bulkCreate(courseSubTopicCreate);
    }

    // Outcome / Sub outcome
    if (data.outcome_ids) {
        const all_outcome_ids = [
            ...(await CourseOutcome.findAll({
                where: { course_id: course_id, outcome_id: { [Op.ne]: null } },
            })),
        ].map((t: any) => parseInt(t.outcome_id));

        const courseOutcomeToBeDeleted = all_outcome_ids.filter((t: any) => !data.outcome_ids.includes(t));

        const courseOutcomeToBeAdded = data.outcome_ids.filter((t: any) => !all_outcome_ids.includes(t));

        await CourseOutcome.destroy({
            where: { outcome_id: { [Op.in]: courseOutcomeToBeDeleted }, course_id: course_id },
        });

        const courseOutcomeCreate: any = [];

        for (const id of courseOutcomeToBeAdded) {
            courseOutcomeCreate.push({ course_id: course_id, outcome_id: id });
        }

        await CourseOutcome.bulkCreate(courseOutcomeCreate);
    }

    if (data.sub_outcome_ids) {
        const all_outcome_ids = [
            ...(await CourseOutcome.findAll({
                where: { course_id: course_id, sub_outcome_id: { [Op.ne]: null } },
            })),
        ].map((t: any) => parseInt(t.sub_outcome_id));

        const courseSubOutcomeToBeDeleted = all_outcome_ids.filter((t: any) => !data.sub_outcome_ids.includes(t));

        const courseSubOutcomeToBeAdded = data.sub_outcome_ids.filter((t: any) => !all_outcome_ids.includes(t));

        await CourseOutcome.destroy({
            where: { sub_outcome_id: { [Op.in]: courseSubOutcomeToBeDeleted }, course_id: course_id },
        });

        const courseSubOutcomeCreate: any = [];

        for (const id of courseSubOutcomeToBeAdded) {
            courseSubOutcomeCreate.push({ course_id: course_id, sub_outcome_id: id });
        }

        await CourseOutcome.bulkCreate(courseSubOutcomeCreate);
    }

    // Behaviour
    if (data.behaviour_ids) {
        const all_behaviour_ids = [...(await CourseBehaviour.findAll({ where: { course_id: course_id } }))].map((t: any) => parseInt(t.behaviour_id));

        const courseBehaviourToBeDeleted = all_behaviour_ids.filter((t: any) => !data.behaviour_ids.includes(t));

        const courseBehaviourToBeAdded = data.behaviour_ids.filter((t: any) => !all_behaviour_ids.includes(t));

        await CourseBehaviour.destroy({
            where: { behaviour_id: { [Op.in]: courseBehaviourToBeDeleted }, course_id: course_id },
        });

        const courseBehaviourCreate: any = [];

        for (const id of courseBehaviourToBeAdded) {
            courseBehaviourCreate.push({ course_id: course_id, behaviour_id: id });
        }

        await CourseBehaviour.bulkCreate(courseBehaviourCreate);
    }

    // Solution
    if (data.solution_ids) {
        const all_solution_ids = [...(await CourseSolution.findAll({ where: { course_id: course_id } }))].map((t: any) => parseInt(t.solution_id));

        const solutionToBeDeleted = all_solution_ids.filter((t: any) => !data.solution_ids.includes(t));

        const solutionToBeAdded = data.solution_ids.filter((t: any) => !all_solution_ids.includes(t));

        await CourseSolution.destroy({
            where: { solution_id: { [Op.in]: solutionToBeDeleted }, course_id: course_id },
        });

        const courseSolutionCreate: any = [];

        for (const id of solutionToBeAdded) {
            courseSolutionCreate.push({ course_id: course_id, solution_id: id });
        }

        await CourseSolution.bulkCreate(courseSolutionCreate);
    }

    // Barrier
    if (data.barrier_ids) {
        const all_barrier_ids = [...(await CourseBarrier.findAll({ where: { course_id: course_id } }))].map((t: any) => parseInt(t.barrier_id));

        const courseBarrierToBeDeleted = all_barrier_ids.filter((t: any) => !data.barrier_ids.includes(t));

        const courseBarrierToBeAdded = data.barrier_ids.filter((t: any) => !all_barrier_ids.includes(t));

        await CourseBarrier.destroy({
            where: { barrier_id: { [Op.in]: courseBarrierToBeDeleted }, course_id: course_id },
        });

        const courseBarrierCreate: any = [];

        for (const id of courseBarrierToBeAdded) {
            courseBarrierCreate.push({ course_id: course_id, barrier_id: id });
        }

        await CourseBarrier.bulkCreate(courseBarrierCreate);
    }

    // skills
    if (data.skill_ids) {
        const all_skill_ids = [...(await CourseBarrier.findAll({ where: { course_id: course_id } }))].map((t: any) => parseInt(t.barrier_id));

        const courseSkillToBeDeleted = all_skill_ids.filter((t: any) => !data.skill_ids.includes(t));

        const courseSkillToBeAdded = data.skill_ids.filter((t: any) => !all_skill_ids.includes(t));

        await CourseSkill.destroy({
            where: { skill_id: { [Op.in]: courseSkillToBeDeleted }, course_id: course_id },
        });

        const courseSkillCreate: any = [];

        for (const id of courseSkillToBeAdded) {
            courseSkillCreate.push({ course_id: course_id, skill_id: id });
        }

        await CourseSkill.bulkCreate(courseSkillCreate);
    }
};
