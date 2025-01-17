import { RequestHandler } from "express";
import { v4 as uuidv4 } from "uuid";
import { Op } from "sequelize";

//Helpers
import { api, apiException } from "@redlof/libs/Helpers/helpers";
import { addMedia, deleteMedia } from "@redlof/libs/Helpers/MediaHelper";
import { getCountryData, getFilteredKnowledges } from "@redlof/libs/Helpers/DataFilterHelper";

// Models
import { Knowledge } from "@redlof/libs/Models/Knowledge/Knowledge";
import { KnowledgeCategory } from "@redlof/libs/Models/Knowledge/KnowledgeCategory";
import { KnowledgeCountry } from "@redlof/libs/Models/Knowledge/KnowledgeCountry";
import { KnowledgeTopic } from "@redlof/libs/Models/Knowledge/KnowledgeTopic";
import { KnowledgeOutcome } from "@redlof/libs/Models/Knowledge/KnowledgeOutcome";
import { KnowledgeBehaviour } from "@redlof/libs/Models/Knowledge/KnowledgeBehaviour";
import { KnowledgeSolution } from "@redlof/libs/Models/Knowledge/KnowledgeSolution";
import { KnowledgeBarrier } from "@redlof/libs/Models/Knowledge/KnowledgeBarrier";
import { KnowledgeState } from "@redlof/libs/Models/Knowledge/KnowledgeState";
import { State } from "@redlof/libs/Models/Data/State";
import { User } from "@redlof/libs/Models/Auth/User";
import { Outcome } from "@redlof/libs/Models/Outcome/Outcome";
import { SubOutcome } from "@redlof/libs/Models/Outcome/SubOutcome";
import { Topic } from "@redlof/libs/Models/Topic/Topic";
import { SubTopic } from "@redlof/libs/Models/Topic/SubTopic";
import { Barrier } from "@redlof/libs/Models/Barrier/Barrier";
import { Behaviour } from "@redlof/libs/Models/Behaviour/Behaviour";
import { Solution } from "@redlof/libs/Models/Solution/Solution";
import { MediaData } from "@redlof/libs/Models/Media/MediaData";
import { Language } from "@redlof/libs/Models/Data/Language";
import { Organisation } from "@redlof/libs/Models/Organisation/Organisation";

export const getKnowledgeCategories: RequestHandler = async (req, res) => {
    const clause: any = { parent_id: null };

    if (req.query.category_id) {
        clause.parent_id = typeof req.query.category_id == "string" ? { [Op.in]: [req.query.category_id] } : { [Op.in]: req.query.category_id };
    }

    const categories = await KnowledgeCategory.findAll({ where: clause });

    return api("", res, categories);
};

export const getKnowledges: RequestHandler = async (req: any, res) => {
    const clause: any = { [Op.and]: [] };

    const andSymbol: any = Object.getOwnPropertySymbols(clause)[0];

    if (req.query.status) {
        clause.status = req.query.status;
    }

    if (req.query.search) {
        clause[andSymbol].push({
            [Op.or]: [{ title: { [Op.iLike]: `%${req.query.search}%` } }],
        });
    }

    if (req.query.type) {
        clause.type = { [Op.in]: req.query.type };
    }

    if (req.query.organisation_ids) {
        clause.organisation_ids = { [Op.contains]: req.query.organisation_ids };
    }

    // Get knowledge ids if any filters applied
    clause.id = { [Op.in]: await getFilteredKnowledges(req.query) };

    const { rows, count } = await Knowledge.findAndCountAll({
        limit: req.query.limit ? req.query.limit : null,
        offset: req.query.page && req.query.limit ? (Number(req.query.page) - 1) * Number(req.query.limit) : 0,
        attributes: ["uuid", "id", "title", "status", "logo", "type", "languages", "confidence", "created_at", "organisation_ids"],
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
                model: KnowledgeCategory,
                attributes: ["id", "name"],
            },
        ],
    }).then(async ({ rows, count }: any) => {
        for (const knowledge of rows) {
            knowledge.setDataValue("languages", knowledge.languages ? await Language.findAll({ where: { id: { [Op.in]: knowledge.languages } } }) : []);
        }

        if (rows.length <= 0) {
            return { rows, count };
        }

        if (!req.query.country_id) {
            return { rows, count };
        }

        for (const knowledge of rows) {
            knowledge.setDataValue("knowledge_country", await getCountryData(knowledge.id, req.query.country_id, "knowledges"));
        }

        return { rows, count };
    });

    const pages = req.query.limit ? count / Number(req.query.limit) : 1;

    return api("", res, { total: count, pages: Math.ceil(pages), data: rows });
};

export const getKnowledge: RequestHandler = async (req, res) => {
    const countryClause: any = {};
    const stateClause: any = {};

    if (req.query.country_id) {
        countryClause.country_id = req.query.country_id;
        stateClause.country_id = req.query.country_id;
    }

    if (req.query.state_id) {
        stateClause.state_id = req.query.state_id;
    }

    let knowledge: any = await Knowledge.findOne({
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
                as: "knowledge_countries",
                model: KnowledgeCountry,
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
        ],
    });

    if (!knowledge) {
        throw { message: "Knowledge not found", code: 404 };
    }

    knowledge = knowledge.toJSON();

    const organisations = await Organisation.findAll({
        where: {
            id: { [Op.in]: knowledge?.organisation_ids || [] },
        },
        attributes: ["id", "uuid", "name", "website", "brief"],
    });

    knowledge.organisations = organisations;

    knowledge.category = knowledge.category_id ? await KnowledgeCategory.findByPk(knowledge.category_id) : null;

    knowledge.sub_category = knowledge.sub_category_id ? await KnowledgeCategory.findByPk(knowledge.sub_category_id) : null;

    knowledge.languages = knowledge.languages ? await Language.findAll({ where: { id: { [Op.in]: knowledge.languages } } }) : [];

    stateClause.knowledge_id = knowledge.id;

    for (const knowledgeCountry of knowledge.knowledge_countries) {
        knowledgeCountry.media = await MediaData.findAll({
            where: { entity: "knowledge_countries", entity_id: knowledgeCountry.id },
        });

        knowledgeCountry.knowledge_states = await KnowledgeState.findAll({
            attributes: { exclude: ["updated_at", "deleted_at"] },
            where: stateClause,
            include: ["state"],
        }).then(async (knowledgeStates: any) => {
            if (knowledgeStates.length <= 0) {
                knowledgeStates;
            }

            for (const knowledgeState of knowledgeStates) {
                knowledgeState.setDataValue("media", await MediaData.findAll({ where: { entity: "knowledge_states", entity_id: knowledgeState.id } }));
            }

            return knowledgeStates;
        });
    }

    return api("", res, knowledge);
};

export const postKnowledge: RequestHandler = async (req: any, res) => {
    const knowledge: any = req.body.uuid ? await Knowledge.findOne({ where: { uuid: req.body.uuid } }) : new Knowledge({ uuid: uuidv4(), added_by: res.locals.user.id, status: "draft" });

    if (!knowledge) {
        throw { message: "Knowledge data not found", code: 404 };
    }

    // Add primary details
    knowledge.title = req.body.title ? req.body.title : knowledge.title;
    knowledge.type = req.body.type ? req.body.type : knowledge.type;
    knowledge.category_id = req.body.category_id ? req.body.category_id : knowledge.category_id;
    knowledge.sub_category_id = req.body.sub_category_id ? req.body.sub_category_id : knowledge.sub_category_id;
    knowledge.knowledge_ids = req.body.knowledge_ids ? req.body.knowledge_ids : knowledge.knowledge_ids;
    knowledge.logo = req.body.logo ? req.body.logo : knowledge.getDataValue("logo");
    knowledge.organisations = req.body.organisations ? req.body.organisations : knowledge.organisations ? knowledge.organisations : [];
    knowledge.organisation_ids = req.body.organisation_ids ? req.body.organisation_ids : knowledge.organisation_ids
    knowledge.person = req.body.person ? req.body.person : knowledge.person;
    knowledge.languages = req.body.language_ids ? req.body.language_ids : knowledge.languages;
    knowledge.source = req.body.source ? req.body.source : knowledge.source;
    knowledge.budget = req.body.budget ? req.body.budget : knowledge.budget;
    knowledge.start_year = req.body.start_year ? req.body.start_year : knowledge.start_year;
    knowledge.end_year = req.body.end_year ? req.body.end_year : knowledge.end_year;
    knowledge.impact = req.body.impact ? req.body.impact : knowledge.impact;
    knowledge.confidence = req.body.confidence ? req.body.confidence : knowledge.confidence;
    knowledge.expiry = req.body.expiry ? req.body.expiry : knowledge.expiry;
    await knowledge.save();

    // Add country details
    if (req.body.country_ids) {
        const all_country_ids = [...(await KnowledgeCountry.findAll({ where: { knowledge_id: knowledge.id } }))].map((t: any) => parseInt(t.country_id));

        const knowledgeCountryToBeDeleted = all_country_ids.filter((t: any) => !req.body.country_ids.includes(t));

        const knowledgeCountryToBeAdded = req.body.country_ids.filter((t: any) => !all_country_ids.includes(t));

        await KnowledgeCountry.destroy({
            where: { country_id: { [Op.in]: knowledgeCountryToBeDeleted }, knowledge_id: knowledge.id },
        });

        const knowledgeCountryCreate: any = [];

        for (const id of knowledgeCountryToBeAdded) {
            knowledgeCountryCreate.push({ knowledge_id: knowledge.id, country_id: id });
        }

        await KnowledgeCountry.bulkCreate(knowledgeCountryCreate);
    }

    // Topic / Sub topic
    if (req.body.topic_ids) {
        const all_topic_ids = [
            ...(await KnowledgeTopic.findAll({
                where: { knowledge_id: knowledge.id, topic_id: { [Op.ne]: null } },
            })),
        ].map((t: any) => parseInt(t.topic_id));

        const knowledgeTopicToBeDeleted = all_topic_ids.filter((t: any) => !req.body.topic_ids.includes(t));

        const knowledgeTopicToBeAdded = req.body.topic_ids.filter((t: any) => !all_topic_ids.includes(t));

        await KnowledgeTopic.destroy({
            where: { topic_id: { [Op.in]: knowledgeTopicToBeDeleted }, knowledge_id: knowledge.id },
        });

        const knowledgeTopicCreate: any = [];

        for (const id of knowledgeTopicToBeAdded) {
            knowledgeTopicCreate.push({ knowledge_id: knowledge.id, topic_id: id });
        }

        await KnowledgeTopic.bulkCreate(knowledgeTopicCreate);
    }

    if (req.body.sub_topic_ids) {
        const all_topic_ids = [
            ...(await KnowledgeTopic.findAll({
                where: { knowledge_id: knowledge.id, sub_topic_id: { [Op.ne]: null } },
            })),
        ].map((t: any) => parseInt(t.sub_topic_id));

        const knowledgeSubTopicToBeDeleted = all_topic_ids.filter((t: any) => !req.body.sub_topic_ids.includes(t));

        const knowledgeSubTopicToBeAdded = req.body.sub_topic_ids.filter((t: any) => !all_topic_ids.includes(t));

        await KnowledgeTopic.destroy({
            where: { sub_topic_id: { [Op.in]: knowledgeSubTopicToBeDeleted }, knowledge_id: knowledge.id },
        });

        const knowledgeSubTopicCreate: any = [];

        for (const id of knowledgeSubTopicToBeAdded) {
            knowledgeSubTopicCreate.push({ knowledge_id: knowledge.id, sub_topic_id: id });
        }

        await KnowledgeTopic.bulkCreate(knowledgeSubTopicCreate);
    }

    // Outcome / Sub outcome
    if (req.body.outcome_ids) {
        const all_outcome_ids = [
            ...(await KnowledgeOutcome.findAll({
                where: { knowledge_id: knowledge.id, outcome_id: { [Op.ne]: null } },
            })),
        ].map((t: any) => parseInt(t.outcome_id));

        const knowledgeOutcomeToBeDeleted = all_outcome_ids.filter((t: any) => !req.body.outcome_ids.includes(t));

        const knowledgeOutcomeToBeAdded = req.body.outcome_ids.filter((t: any) => !all_outcome_ids.includes(t));

        await KnowledgeOutcome.destroy({
            where: { outcome_id: { [Op.in]: knowledgeOutcomeToBeDeleted }, knowledge_id: knowledge.id },
        });

        const knowledgeOutcomeCreate: any = [];

        for (const id of knowledgeOutcomeToBeAdded) {
            knowledgeOutcomeCreate.push({ knowledge_id: knowledge.id, outcome_id: id });
        }

        await KnowledgeOutcome.bulkCreate(knowledgeOutcomeCreate);
    }

    if (req.body.sub_outcome_ids) {
        const all_outcome_ids = [
            ...(await KnowledgeOutcome.findAll({
                where: { knowledge_id: knowledge.id, sub_outcome_id: { [Op.ne]: null } },
            })),
        ].map((t: any) => parseInt(t.sub_outcome_id));

        const knowledgeSubOutcomeToBeDeleted = all_outcome_ids.filter((t: any) => !req.body.sub_outcome_ids.includes(t));

        const knowledgeSubOutcomeToBeAdded = req.body.sub_outcome_ids.filter((t: any) => !all_outcome_ids.includes(t));

        await KnowledgeOutcome.destroy({
            where: { sub_outcome_id: { [Op.in]: knowledgeSubOutcomeToBeDeleted }, knowledge_id: knowledge.id },
        });

        const knowledgeSubOutcomeCreate: any = [];

        for (const id of knowledgeSubOutcomeToBeAdded) {
            knowledgeSubOutcomeCreate.push({ knowledge_id: knowledge.id, sub_outcome_id: id });
        }

        await KnowledgeOutcome.bulkCreate(knowledgeSubOutcomeCreate);
    }

    // Behaviour
    if (req.body.behaviour_ids) {
        const all_behaviour_ids = [...(await KnowledgeBehaviour.findAll({ where: { knowledge_id: knowledge.id } }))].map((t: any) => parseInt(t.behaviour_id));

        const knowledgeBehaviourToBeDeleted = all_behaviour_ids.filter((t: any) => !req.body.behaviour_ids.includes(t));

        const knowledgeBehaviourToBeAdded = req.body.behaviour_ids.filter((t: any) => !all_behaviour_ids.includes(t));

        await KnowledgeBehaviour.destroy({
            where: { behaviour_id: { [Op.in]: knowledgeBehaviourToBeDeleted }, knowledge_id: knowledge.id },
        });

        const knowledgeBehaviourCreate: any = [];

        for (const id of knowledgeBehaviourToBeAdded) {
            knowledgeBehaviourCreate.push({ knowledge_id: knowledge.id, behaviour_id: id });
        }

        await KnowledgeBehaviour.bulkCreate(knowledgeBehaviourCreate);
    }

    // Solution
    if (req.body.solution_ids) {
        const all_solution_ids = [...(await KnowledgeSolution.findAll({ where: { knowledge_id: knowledge.id } }))].map((t: any) => parseInt(t.solution_id));

        const solutionToBeDeleted = all_solution_ids.filter((t: any) => !req.body.solution_ids.includes(t));

        const solutionToBeAdded = req.body.solution_ids.filter((t: any) => !all_solution_ids.includes(t));

        await KnowledgeSolution.destroy({
            where: { solution_id: { [Op.in]: solutionToBeDeleted }, knowledge_id: knowledge.id },
        });

        const knowledgeSolutionCreate: any = [];

        for (const id of solutionToBeAdded) {
            knowledgeSolutionCreate.push({ knowledge_id: knowledge.id, solution_id: id });
        }

        await KnowledgeSolution.bulkCreate(knowledgeSolutionCreate);
    }

    // Barrier
    if (req.body.barrier_ids) {
        const all_barrier_ids = [...(await KnowledgeBarrier.findAll({ where: { knowledge_id: knowledge.id } }))].map((t: any) => parseInt(t.barrier_id));

        const knowledgeBarrierToBeDeleted = all_barrier_ids.filter((t: any) => !req.body.barrier_ids.includes(t));

        const knowledgeBarrierToBeAdded = req.body.barrier_ids.filter((t: any) => !all_barrier_ids.includes(t));

        await KnowledgeBarrier.destroy({
            where: { barrier_id: { [Op.in]: knowledgeBarrierToBeDeleted }, knowledge_id: knowledge.id },
        });

        const knowledgeBarrierCreate: any = [];

        for (const id of knowledgeBarrierToBeAdded) {
            knowledgeBarrierCreate.push({ knowledge_id: knowledge.id, barrier_id: id });
        }

        await KnowledgeBarrier.bulkCreate(knowledgeBarrierCreate);
    }

    // Experts

    // Funders

    // Partners

    return api("Knowledge details saved successfully", res, knowledge);
};

export const putKnowledgeCountry: RequestHandler = async (req, res) => {
    const knowledge: any = await Knowledge.findOne({ where: { uuid: req.params.uuid } });

    if (!knowledge) {
        throw { message: "Knowledge not found", code: 422 };
    }

    for (const knowledgeCountryObj of req.body.knowledge_countries) {
        let knowledgeCountry: any = await KnowledgeCountry.findOne({
            where: { knowledge_id: knowledge.id, country_id: knowledgeCountryObj.country_id },
        });

        if (!knowledgeCountry) {
            knowledgeCountry = new KnowledgeCountry({
                knowledge_id: knowledge.id,
                country_id: knowledgeCountryObj.country_id,
            });
        }

        knowledgeCountry.brief = knowledgeCountryObj.brief ? knowledgeCountryObj.brief : knowledgeCountry.brief;
        knowledgeCountry.description = knowledgeCountryObj.description ? knowledgeCountryObj.description : knowledgeCountry.description;
        await knowledgeCountry.save();

        // Country media
        if (knowledgeCountryObj.media && knowledgeCountryObj.media.length > 0) {
            await addMedia("knowledge_countries", knowledgeCountry.id, knowledgeCountryObj.media);
        }

        if (knowledgeCountryObj.media == null || knowledgeCountryObj.media == "null") {
            await deleteMedia("knowledge_countries", [knowledgeCountry.id]);
        }
    }

    // Delete the countries that are no longer mapped
    if (req.body.deleted_countries && req.body.deleted_countries.length > 0) {
        const entity_ids = [
            ...(await KnowledgeCountry.findAll({
                where: { knowledge_id: knowledge.id, country_id: { [Op.in]: req.body.deleted_countries } },
            })),
        ].map((t: any) => parseInt(t.id));

        await deleteMedia("knowledge_countries", entity_ids);

        await KnowledgeCountry.destroy({ where: { id: entity_ids } });
    }

    return api("Country specific knowledge details saved successfully.", res, {});
};

export const putKnowledgeState: RequestHandler = async (req, res) => {
    const knowledge: any = await Knowledge.findOne({ where: { uuid: req.params.uuid } });

    if (!knowledge) {
        throw { message: "Knowledge not found", code: 422 };
    }

    for (const knowledgeStateObj of req.body.knowledge_states) {
        let knowledgeState: any = await KnowledgeState.findOne({
            where: { knowledge_id: knowledge.id, state_id: knowledgeStateObj.state_id },
        });

        if (!knowledgeState) {
            knowledgeState = new KnowledgeState({
                knowledge_id: knowledge.id,
                state_id: knowledgeStateObj.state_id,
            });
        }

        const state: any = await State.findByPk(knowledgeStateObj.state_id);

        knowledgeState.description = knowledgeStateObj.description ? knowledgeStateObj.description : knowledgeState.description;
        knowledgeState.brief = knowledgeStateObj.brief ? knowledgeStateObj.brief : knowledgeState.brief;
        knowledgeState.country_id = state.country_id;

        await knowledgeState.save();

        // State media
        if (knowledgeStateObj.media && knowledgeStateObj.media.length > 0) {
            await addMedia("knowledge_states", knowledgeState.id, knowledgeStateObj.media);
        }

        if (knowledgeStateObj.media == null || knowledgeStateObj.media == "null") {
            await deleteMedia("knowledge_states", [knowledgeState.id]);
        }
    }

    // Delete the states that are no longer mapped
    if (req.body.deleted_states && req.body.deleted_states.length > 0) {
        const entity_ids = [
            ...(await KnowledgeState.findAll({
                where: { knowledge_id: knowledge.id, state_id: { [Op.in]: req.body.deleted_states } },
            })),
        ].map((t: any) => parseInt(t.id));

        await deleteMedia("knowledge_states", entity_ids);

        await KnowledgeState.destroy({ where: { id: entity_ids } });
    }

    return api("State specific knowledge details saved successfully.", res, {});
};

export const putKnowledgeStatus: RequestHandler = async (req, res) => {
    const knowledge: any = await Knowledge.findOne({ where: { uuid: req.params.uuid } });

    if (!knowledge) {
        throw { message: "Knowledge data not found", code: 404 };
    }

    if (knowledge.status != "published" && req.body.status == "unpublished") {
        throw { message: "Action not allowed. Knowledge data is not published yet", code: 422 };
    }

    const mes = req.body.status == "published" ? "Knowledge data published successfully" : "Knowledge data unpublished successfully";

    knowledge.status = req.body.status;
    await knowledge.save();

    return api(mes, res, {});
};
