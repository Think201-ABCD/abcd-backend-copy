import { RequestHandler } from "express";
import { v4 as uuidv4 } from "uuid";
import { Op } from "sequelize";

//Helpers
import { api, apiException } from "@redlof/libs/Helpers/helpers";
import { addMedia, deleteMedia } from "@redlof/libs/Helpers/MediaHelper";

// Models
import { ProposalCategory } from "@redlof/libs/Models/ProposalRequest/ProposalCategory";
import { getCountryData, getFilteredProposals } from "@redlof/libs/Helpers/DataFilterHelper";
import { User } from "@redlof/libs/Models/Auth/User";
import { Proposal } from "@redlof/libs/Models/ProposalRequest/Proposal";
import { ProposalCountry } from "@redlof/libs/Models/ProposalRequest/ProposalCountry";
import { ProposalTopic } from "@redlof/libs/Models/ProposalRequest/ProposalTopic";
import { ProposalOutcome } from "@redlof/libs/Models/ProposalRequest/ProposalOutcome";
import { ProposalBehaviour } from "@redlof/libs/Models/ProposalRequest/ProposalBehaviour";
import { ProposalSolution } from "@redlof/libs/Models/ProposalRequest/ProposalSolution";
import { ProposalBarrier } from "@redlof/libs/Models/ProposalRequest/ProposalBarrier";
import { ProposalState } from "@redlof/libs/Models/ProposalRequest/ProposalState";
import { State } from "@redlof/libs/Models/Data/State";
import { Outcome } from "@redlof/libs/Models/Outcome/Outcome";
import { SubOutcome } from "@redlof/libs/Models/Outcome/SubOutcome";
import { Topic } from "@redlof/libs/Models/Topic/Topic";
import { SubTopic } from "@redlof/libs/Models/Topic/SubTopic";
import { Barrier } from "@redlof/libs/Models/Barrier/Barrier";
import { Behaviour } from "@redlof/libs/Models/Behaviour/Behaviour";
import { Solution } from "@redlof/libs/Models/Solution/Solution";
import { MediaData } from "@redlof/libs/Models/Media/MediaData";
import { Language } from "@redlof/libs/Models/Data/Language";

export const getProposalCategories: RequestHandler = async (req, res) => {
    const clause: any = { parent_id: null };

    if (req.query.category_id) {
        clause.parent_id =
            typeof req.query.category_id == "string"
                ? { [Op.in]: [req.query.category_id] }
                : { [Op.in]: req.query.category_id };
    }

    const categories = await ProposalCategory.findAll({ where: clause });

    return api("", res, categories);
};

export const getProposals: RequestHandler = async (req: any, res) => {
    const clause: any = { [Op.and]: [] };

    const andSymbol: any = Object.getOwnPropertySymbols(clause)[0];

    if (req.query.status) {
        clause.status = req.query.status;
    }

    if (req.query.category_id) {
        clause.category_id = req.query.category_id;
    }

    if (req.query.search) {
        clause[andSymbol].push({
            [Op.or]: [{ title: { [Op.iLike]: `%${req.query.search}%` } }],
        });
    }

    // Get proposals ids if any filters applied
    clause.id = { [Op.in]: await getFilteredProposals(req.query) };

    const { rows, count } = await Proposal.findAndCountAll({
        limit: req.query.limit ? req.query.limit : null,
        offset: req.query.page && req.query.limit ? (Number(req.query.page) - 1) * Number(req.query.limit) : 0,
        attributes: ["uuid", "id", "title", "status", "confidence", "languages", "logo", "created_at"],
        order: [["created_at", "desc"]],
        where: clause,
        subQuery: false,
        distinct: true,
        include: [
            {
                as: "created_by",
                model: User,
                attributes: ["uuid", "first_name", "last_name", "photo"],
            },
            {
                as: "category",
                model: ProposalCategory,
                attributes: ["id", "name"],
            },
        ],
    }).then(async ({ rows, count }: any) => {
        for (const proposal of rows) {
            proposal.setDataValue(
                "languages",
                proposal.languages ? await Language.findAll({ where: { id: { [Op.in]: proposal.languages } } }) : []
            );
        }

        if (rows.length <= 0) {
            return { rows, count };
        }

        if (!req.query.country_id) {
            return { rows, count };
        }

        for (const proposal of rows) {
            proposal.setDataValue(
                "proposal_country",
                await getCountryData(proposal.id, req.query.country_id, "proposals")
            );
        }

        return { rows, count };
    });

    const pages = req.query.limit ? count / Number(req.query.limit) : 1;

    return api("", res, { total: count, pages: Math.ceil(pages), data: rows });
};

export const getProposal: RequestHandler = async (req, res) => {
    const countryClause: any = {};
    const stateClause: any = {};

    if (req.query.country_id) {
        countryClause.country_id = req.query.country_id;
        stateClause.country_id = req.query.country_id;
    }

    if (req.query.state_id) {
        stateClause.state_id = req.query.state_id;
    }

    let proposal: any = await Proposal.findOne({
        where: { uuid: req.params.uuid },
        attributes: { exclude: ["updated_at", "deleted_at"] },
        include: [
            {
                as: "created_by",
                model: User,
                attributes: ["uuid", "first_name", "last_name", "photo"],
                required: true,
            },
            {
                as: "proposal_countries",
                model: ProposalCountry,
                attributes: { exclude: ["sub_outcome_id", "updated_at", "deleted_at"] },
                include: ["country"],
                where: countryClause,
                required: false,
            },
            {
                as: "outcomes",
                model: Outcome,
                attributes: ["id", "uuid", "title", "status", "logo"],
                required: false,
                where: { status: "published" },
            },
            {
                as: "sub_outcomes",
                model: SubOutcome,
                attributes: ["id", "uuid", "title", "status", "logo"],
                required: false,
                where: { status: "published" },
            },
            {
                model: Topic,
                as: "topics",
                attributes: ["id", "uuid", "title", "logo"],
                required: false,
                where: { status: "published" },
            },
            {
                model: SubTopic,
                as: "sub_topics",
                attributes: ["id", "uuid", "title", "logo"],
                required: false,
                where: { status: "published" },
            },
            {
                as: "barriers",
                model: Barrier,
                attributes: ["id", "uuid", "title", "logo", "type"],
                required: false,
                where: { status: "published" },
            },
            {
                as: "behaviours",
                model: Behaviour,
                attributes: ["id", "uuid", "title", "logo"],
                required: false,
                where: { status: "published" },
            },
            {
                as: "solutions",
                model: Solution,
                attributes: ["id", "uuid", "title", "logo"],
                required: false,
                where: { status: "published" },
            },
            {
                as: "category",
                model: ProposalCategory,
                attributes: ["id", "name"],
            },
        ],
    });

    if (!proposal) {
        throw { message: "Proposal not found", code: 404 };
    }

    proposal = proposal.toJSON();

    proposal.category = await ProposalCategory.findByPk(proposal.category_id);

    proposal.sub_category = await ProposalCategory.findByPk(proposal.sub_category_id);

    proposal.languages = proposal.languages
        ? await Language.findAll({ where: { id: { [Op.in]: proposal.languages } } })
        : [];

    stateClause.proposal_id = proposal.id;

    for (const proposalCountry of proposal.proposal_countries) {
        proposalCountry.media = await MediaData.findAll({
            where: { entity: "proposal_countries", entity_id: proposalCountry.id },
        });

        proposalCountry.proposal_states = await ProposalState.findAll({
            attributes: { exclude: ["updated_at", "deleted_at"] },
            where: stateClause,
            include: ["state"],
        }).then(async (proposalStates: any) => {
            if (proposalStates.length <= 0) {
                proposalStates;
            }

            for (const proposalState of proposalStates) {
                proposalState.setDataValue(
                    "media",
                    await MediaData.findAll({ where: { entity: "proposal_states", entity_id: proposalState.id } })
                );
            }

            return proposalStates;
        });
    }

    return api("", res, proposal);
};

export const postProposal: RequestHandler = async (req: any, res) => {
    const proposal: any = req.body.uuid
        ? await Proposal.findOne({ where: { uuid: req.body.uuid } })
        : new Proposal({ uuid: uuidv4(), added_by: res.locals.user.id, status: "draft" });

    if (!proposal) {
        throw { message: "Proposal data not found", code: 404 };
    }

    // Add primary details
    proposal.title = req.body.title ? req.body.title : proposal.title;
    proposal.knowledge_ids = req.body.knowledge_ids ? req.body.knowledge_ids : proposal.knowledge_ids;
    proposal.logo = req.body.logo ? req.body.logo : proposal.getDataValue("logo");
    proposal.category_id = req.body.category_id ? req.body.category_id : proposal.category_id;
    proposal.sub_category_id = req.body.sub_category_id ? req.body.sub_category_id : proposal.sub_category_id;
    proposal.organisation_id = req.body.organisation_id ? req.body.organisation_id : proposal.organisation_id;
    proposal.person = req.body.person ? req.body.person : proposal.person;
    proposal.languages = req.body.language_ids ? req.body.language_ids : proposal.languages;
    proposal.source = req.body.source ? req.body.source : proposal.source;
    proposal.start_year = req.body.start_year ? req.body.start_year : proposal.start_year;
    proposal.end_year = req.body.end_year ? req.body.end_year : proposal.end_year;
    proposal.confidence = req.body.confidence ? req.body.confidence : proposal.confidence;
    proposal.expiry = req.body.expiry ? req.body.expiry : proposal.expiry;
    proposal.brief = req.body.brief ? req.body.brief : proposal.brief;
    proposal.description = req.body.description ? req.body.description : proposal.description;
    await proposal.save();

    // Add country details
    if (req.body.country_ids) {
        const all_country_ids = [...(await ProposalCountry.findAll({ where: { proposal_id: proposal.id } }))].map(
            (t: any) => parseInt(t.country_id)
        );

        const proposalCountryToBeDeleted = all_country_ids.filter((t: any) => !req.body.country_ids.includes(t));

        const proposalCountryToBeAdded = req.body.country_ids.filter((t: any) => !all_country_ids.includes(t));

        await ProposalCountry.destroy({
            where: { country_id: { [Op.in]: proposalCountryToBeDeleted }, proposal_id: proposal.id },
        });

        const proposalCountryCreate: any = [];

        for (const id of proposalCountryToBeAdded) {
            proposalCountryCreate.push({ proposal_id: proposal.id, country_id: id });
        }

        await ProposalCountry.bulkCreate(proposalCountryCreate);
    }

    // Topic / Sub topic
    if (req.body.topic_ids) {
        const all_topic_ids = [
            ...(await ProposalTopic.findAll({ where: { proposal_id: proposal.id, topic_id: { [Op.ne]: null } } })),
        ].map((t: any) => parseInt(t.topic_id));

        const proposalTopicToBeDeleted = all_topic_ids.filter((t: any) => !req.body.topic_ids.includes(t));

        const proposalTopicToBeAdded = req.body.topic_ids.filter((t: any) => !all_topic_ids.includes(t));

        await ProposalTopic.destroy({
            where: { topic_id: { [Op.in]: proposalTopicToBeDeleted }, proposal_id: proposal.id },
        });

        const proposalTopicCreate: any = [];

        for (const id of proposalTopicToBeAdded) {
            proposalTopicCreate.push({ proposal_id: proposal.id, topic_id: id });
        }

        await ProposalTopic.bulkCreate(proposalTopicCreate);
    }

    if (req.body.sub_topic_ids) {
        const all_topic_ids = [
            ...(await ProposalTopic.findAll({
                where: { proposal_id: proposal.id, sub_topic_id: { [Op.ne]: null } },
            })),
        ].map((t: any) => parseInt(t.sub_topic_id));

        const proposalSubTopicToBeDeleted = all_topic_ids.filter((t: any) => !req.body.sub_topic_ids.includes(t));

        const proposalSubTopicToBeAdded = req.body.sub_topic_ids.filter((t: any) => !all_topic_ids.includes(t));

        await ProposalTopic.destroy({
            where: { sub_topic_id: { [Op.in]: proposalSubTopicToBeDeleted }, proposal_id: proposal.id },
        });

        const proposalSubTopicCreate: any = [];

        for (const id of proposalSubTopicToBeAdded) {
            proposalSubTopicCreate.push({ proposal_id: proposal.id, sub_topic_id: id });
        }

        await ProposalTopic.bulkCreate(proposalSubTopicCreate);
    }

    // Outcome / Sub outcome
    if (req.body.outcome_ids) {
        const all_outcome_ids = [
            ...(await ProposalOutcome.findAll({
                where: { proposal_id: proposal.id, outcome_id: { [Op.ne]: null } },
            })),
        ].map((t: any) => parseInt(t.outcome_id));

        const proposalOutcomeToBeDeleted = all_outcome_ids.filter((t: any) => !req.body.outcome_ids.includes(t));

        const proposalOutcomeToBeAdded = req.body.outcome_ids.filter((t: any) => !all_outcome_ids.includes(t));

        await ProposalOutcome.destroy({
            where: { outcome_id: { [Op.in]: proposalOutcomeToBeDeleted }, proposal_id: proposal.id },
        });

        const proposalOutcomeCreate: any = [];

        for (const id of proposalOutcomeToBeAdded) {
            proposalOutcomeCreate.push({ proposal_id: proposal.id, outcome_id: id });
        }

        await ProposalOutcome.bulkCreate(proposalOutcomeCreate);
    }

    if (req.body.sub_outcome_ids) {
        const all_outcome_ids = [
            ...(await ProposalOutcome.findAll({
                where: { proposal_id: proposal.id, sub_outcome_id: { [Op.ne]: null } },
            })),
        ].map((t: any) => parseInt(t.sub_outcome_id));

        const proposalSubOutcomeToBeDeleted = all_outcome_ids.filter((t: any) => !req.body.sub_outcome_ids.includes(t));

        const proposalSubOutcomeToBeAdded = req.body.sub_outcome_ids.filter((t: any) => !all_outcome_ids.includes(t));

        await ProposalOutcome.destroy({
            where: { sub_outcome_id: { [Op.in]: proposalSubOutcomeToBeDeleted }, proposal_id: proposal.id },
        });

        const proposalSubOutcomeCreate: any = [];

        for (const id of proposalSubOutcomeToBeAdded) {
            proposalSubOutcomeCreate.push({ proposal_id: proposal.id, sub_outcome_id: id });
        }

        await ProposalOutcome.bulkCreate(proposalSubOutcomeCreate);
    }

    // Behaviour
    if (req.body.behaviour_ids) {
        const all_behaviour_ids = [...(await ProposalBehaviour.findAll({ where: { proposal_id: proposal.id } }))].map(
            (t: any) => parseInt(t.behaviour_id)
        );

        const proposalBehaviourToBeDeleted = all_behaviour_ids.filter((t: any) => !req.body.behaviour_ids.includes(t));

        const proposalBehaviourToBeAdded = req.body.behaviour_ids.filter((t: any) => !all_behaviour_ids.includes(t));

        await ProposalBehaviour.destroy({
            where: { behaviour_id: { [Op.in]: proposalBehaviourToBeDeleted }, proposal_id: proposal.id },
        });

        const proposalBehaviourCreate: any = [];

        for (const id of proposalBehaviourToBeAdded) {
            proposalBehaviourCreate.push({ proposal_id: proposal.id, behaviour_id: id });
        }

        await ProposalBehaviour.bulkCreate(proposalBehaviourCreate);
    }

    // Solution
    if (req.body.solution_ids) {
        const all_solution_ids = [...(await ProposalSolution.findAll({ where: { proposal_id: proposal.id } }))].map(
            (t: any) => parseInt(t.solution_id)
        );

        const solutionToBeDeleted = all_solution_ids.filter((t: any) => !req.body.solution_ids.includes(t));

        const solutionToBeAdded = req.body.solution_ids.filter((t: any) => !all_solution_ids.includes(t));

        await ProposalSolution.destroy({
            where: { solution_id: { [Op.in]: solutionToBeDeleted }, proposal_id: proposal.id },
        });

        const proposalSolutionCreate: any = [];

        for (const id of solutionToBeAdded) {
            proposalSolutionCreate.push({ proposal_id: proposal.id, solution_id: id });
        }

        await ProposalSolution.bulkCreate(proposalSolutionCreate);
    }

    // Barrier
    if (req.body.barrier_ids) {
        const all_barrier_ids = [...(await ProposalBarrier.findAll({ where: { proposal_id: proposal.id } }))].map(
            (t: any) => parseInt(t.barrier_id)
        );

        const proposalBarrierToBeDeleted = all_barrier_ids.filter((t: any) => !req.body.barrier_ids.includes(t));

        const proposalBarrierToBeAdded = req.body.barrier_ids.filter((t: any) => !all_barrier_ids.includes(t));

        await ProposalBarrier.destroy({
            where: { barrier_id: { [Op.in]: proposalBarrierToBeDeleted }, proposal_id: proposal.id },
        });

        const proposalBarrierCreate: any = [];

        for (const id of proposalBarrierToBeAdded) {
            proposalBarrierCreate.push({ proposal_id: proposal.id, barrier_id: id });
        }

        await ProposalBarrier.bulkCreate(proposalBarrierCreate);
    }

    return api("Proposal details saved successfully", res, proposal);
};

export const putProposalCountry: RequestHandler = async (req, res) => {
    const proposal: any = await Proposal.findOne({ where: { uuid: req.params.uuid } });

    if (!proposal) {
        throw { message: "Proposal not found", code: 422 };
    }

    for (const proposalCountryObj of req.body.proposal_countries) {
        let proposalCountry: any = await ProposalCountry.findOne({
            where: { proposal_id: proposal.id, country_id: proposalCountryObj.country_id },
        });

        if (!proposalCountry) {
            proposalCountry = new ProposalCountry({
                proposal_id: proposal.id,
                country_id: proposalCountryObj.country_id,
            });
        }

        proposalCountry.banner = proposalCountryObj.banner
            ? proposalCountryObj.banner
            : proposalCountry.getDataValue("banner");
        proposalCountry.brief = proposalCountryObj.brief ? proposalCountryObj.brief : proposalCountry.brief;
        proposalCountry.description = proposalCountryObj.description
            ? proposalCountryObj.description
            : proposalCountry.description;
        await proposalCountry.save();

        // Country media
        if (proposalCountryObj.media && proposalCountryObj.media.length > 0) {
            await addMedia("proposal_countries", proposalCountry.id, proposalCountryObj.media);
        }

        if (proposalCountryObj.media == null || proposalCountryObj.media == "null") {
            await deleteMedia("proposal_countries", [proposalCountry.id]);
        }
    }

    // Delete the countries that are no longer mapped
    if (req.body.deleted_countries && req.body.deleted_countries.length > 0) {
        const entity_ids = [
            ...(await ProposalCountry.findAll({
                where: { proposal_id: proposal.id, country_id: { [Op.in]: req.body.deleted_countries } },
            })),
        ].map((t: any) => parseInt(t.id));

        await deleteMedia("proposal_countries", entity_ids);

        await ProposalCountry.destroy({ where: { id: entity_ids } });
    }

    return api("Country specific proposal details saved successfully.", res, {});
};

export const putProposalState: RequestHandler = async (req, res) => {
    const proposal: any = await Proposal.findOne({ where: { uuid: req.params.uuid } });

    if (!proposal) {
        throw { message: "Proposal data not found", code: 422 };
    }

    for (const proposalStateObj of req.body.proposal_states) {
        let proposalState: any = await ProposalState.findOne({
            where: { proposal_id: proposal.id, state_id: proposalStateObj.state_id },
        });

        if (!proposalState) {
            proposalState = new ProposalState({ proposal_id: proposal.id, state_id: proposalStateObj.state_id });
        }

        const state: any = await State.findByPk(proposalStateObj.state_id);

        proposalState.description = proposalStateObj.description
            ? proposalStateObj.description
            : proposalState.description;
        proposalState.brief = proposalStateObj.brief ? proposalStateObj.brief : proposalState.brief;
        proposalState.banner = proposalStateObj.banner ? proposalStateObj.banner : proposalState.getDataValue("banner");
        proposalState.country_id = state.country_id;

        await proposalState.save();

        // State media
        if (proposalStateObj.media && proposalStateObj.media.length > 0) {
            await addMedia("proposal_states", proposalState.id, proposalStateObj.media);
        }

        if (proposalStateObj.media == null || proposalStateObj.media == "null") {
            await deleteMedia("proposal_states", [proposalState.id]);
        }
    }

    // Delete the states that are no longer mapped
    if (req.body.deleted_states && req.body.deleted_states.length > 0) {
        const entity_ids = [
            ...(await ProposalState.findAll({
                where: { proposal_id: proposal.id, state_id: { [Op.in]: req.body.deleted_states } },
            })),
        ].map((t: any) => parseInt(t.id));

        await deleteMedia("proposal_states", entity_ids);

        await ProposalState.destroy({ where: { id: entity_ids } });
    }

    return api("State specific proposal details saved successfully.", res, {});
};

export const putProposalStatus: RequestHandler = async (req, res) => {
    const proposal: any = await Proposal.findOne({ where: { uuid: req.params.uuid } });

    if (!proposal) {
        throw { message: "Proposal data not found", code: 404 };
    }

    if (proposal.status != "published" && req.body.status == "unpublished") {
        throw { message: "Action not allowed. Proposal data is not published yet", code: 422 };
    }

    const mes =
        req.body.status == "published"
            ? "Proposal data published successfully"
            : "Proposal data unpublished successfully";

    proposal.status = req.body.status;
    await proposal.save();

    return api(mes, res, {});
};
