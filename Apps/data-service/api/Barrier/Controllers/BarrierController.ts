import { RequestHandler } from "express";
import { v4 as uuidv4 } from "uuid";
import { Op } from "sequelize";

//Helpers
import { api, apiException } from "@redlof/libs/Helpers/helpers";
import { addMedia, deleteMedia } from "@redlof/libs/Helpers/MediaHelper";
import { getCountryData, getFilteredBarriers } from "@redlof/libs/Helpers/DataFilterHelper";

// Models
import { BarrierCategory } from "@redlof/libs/Models/Barrier/BarrierCategory";
import { Barrier } from "@redlof/libs/Models/Barrier/Barrier";
import { BarrierCountry } from "@redlof/libs/Models/Barrier/BarrierCountry";
import { BarrierTopic } from "@redlof/libs/Models/Barrier/BarrierTopic";
import { BarrierOutcome } from "@redlof/libs/Models/Barrier/BarrierOutcome";
import { BarrierBehaviour } from "@redlof/libs/Models/Barrier/BarrierBehaviour";
import { SolutionBarrier } from "@redlof/libs/Models/Solution/SolutionBarrier";
import { MediaData } from "@redlof/libs/Models/Media/MediaData";
import { BarrierState } from "@redlof/libs/Models/Barrier/BarrierState";
import { State } from "@redlof/libs/Models/Data/State";
import { User } from "@redlof/libs/Models/Auth/User";
import { Topic } from "@redlof/libs/Models/Topic/Topic";
import { SubTopic } from "@redlof/libs/Models/Topic/SubTopic";
import { Outcome } from "@redlof/libs/Models/Outcome/Outcome";
import { SubOutcome } from "@redlof/libs/Models/Outcome/SubOutcome";
import { Solution } from "@redlof/libs/Models/Solution/Solution";
import { Behaviour } from "@redlof/libs/Models/Behaviour/Behaviour";
import { SolutionCategory } from "@redlof/libs/Models/Solution/SolutionCategory";

export const getBarrierCategories: RequestHandler = async (req, res) => {
    const clause: any = { parent_id: null };

    if (req.query.category_id) {
        clause.parent_id = typeof req.query.category_id == "string" ? { [Op.in]: [req.query.category_id] } : { [Op.in]: req.query.category_id };
    }

    const categories = await BarrierCategory.findAll({ where: clause });

    return api("", res, categories);
};

export const getBarriers: RequestHandler = async (req: any, res) => {
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

    if (req.query.type) {
        clause.type = req.query.type;
    }

    // Get barrier ids if any filters applied
    clause.id = { [Op.in]: await getFilteredBarriers(req.query) };

    const { rows, count } = await Barrier.findAndCountAll({
        limit: req.query.limit ? req.query.limit : null,
        offset: req.query.page && req.query.limit ? (Number(req.query.page) - 1) * Number(req.query.limit) : 0,
        attributes: { exclude: ["added_by", "updated_at", "deleted_at"] },
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
                model: BarrierCategory,
                attributes: ["id", "name"],
            },
        ],
    }).then(async ({ rows, count }: any) => {
        if (rows.length <= 0) {
            return { rows, count };
        }

        if (!req.query.country_id) {
            return { rows, count };
        }

        for (const barrier of rows) {
            barrier.setDataValue("barrier_country", await getCountryData(barrier.id, req.query.country_id, "barriers"));
        }

        return { rows, count };
    });

    const pages = req.query.limit ? count / Number(req.query.limit) : 1;

    return api("", res, { total: count, pages: Math.ceil(pages), data: rows });
};

export const getBarrier: RequestHandler = async (req, res) => {
    const countryClause: any = {};
    const stateClause: any = {};

    if (req.query.country_id) {
        countryClause.country_id = req.query.country_id;
        stateClause.country_id = req.query.country_id;
    }

    if (req.query.state_id) {
        stateClause.state_id = req.query.state_id;
    }

    let barrier: any = await Barrier.findOne({
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
                as: "barrier_countries",
                model: BarrierCountry,
                attributes: { exclude: ["sub_outcome_id", "updated_at", "deleted_at"] },
                include: ["country"],
                where: countryClause,
                required: false,
            },
            {
                as: "outcomes",
                model: Outcome,
                attributes: ["id", "uuid", "title", "status", "logo", "status"],
                required: false,
                where: { status: "published" },
            },
            {
                as: "sub_outcomes",
                model: SubOutcome,
                attributes: ["id", "uuid", "title", "status", "logo", "status"],
                required: false,
                where: { status: "published" },
            },
            {
                model: Topic,
                as: "topics",
                attributes: ["id", "uuid", "title", "logo", "status"],
                required: false,
                where: { status: "published" },
            },
            {
                model: SubTopic,
                as: "sub_topics",
                attributes: ["id", "uuid", "title", "logo", "status"],
                required: false,
                where: { status: "published" },
            },
            {
                model: Solution,
                as: "solutions",
                attributes: ["id", "uuid", "title", "logo", "categories", "status"],
                required: false,
                where: { status: "published" },
            },
            {
                model: Behaviour,
                as: "behaviours",
                attributes: ["id", "uuid", "title", "logo", "status"],
                required: false,
                where: { status: "published" },
            },
        ],
    });

    if (!barrier) {
        throw { message: "Barrier not found", code: 404 };
    }

    barrier = barrier.toJSON();

    barrier.category = await BarrierCategory.findByPk(barrier.category_id);

    barrier.sub_category = await BarrierCategory.findByPk(barrier.sub_category_id);

    barrier.solutions = await Promise.all(
        barrier.solutions.map(async (solution) => {
            let categoryDetails = [];

            if (solution.categories) {
                categoryDetails = await Promise.all(
                    solution.categories.map(async (categoryId) => {
                        const category = await SolutionCategory.findOne({ where: { id: categoryId } });

                        return category ? category.dataValues : null;
                    })
                );
            }

            return { ...solution, categories: categoryDetails };
        })
    );

    stateClause.barrier_id = barrier.id;

    for (const barrierCountry of barrier.barrier_countries) {
        barrierCountry.media = await MediaData.findAll({
            where: { entity: "barrier_countries", entity_id: barrierCountry.id },
        });

        barrierCountry.barrier_states = await BarrierState.findAll({
            attributes: { exclude: ["updated_at", "deleted_at"] },
            where: stateClause,
            include: ["state"],
        }).then(async (barrierStates: any) => {
            if (barrierStates.length <= 0) {
                barrierStates;
            }

            for (const barrierState of barrierStates) {
                barrierState.setDataValue("media", await MediaData.findAll({ where: { entity: "barrier_states", entity_id: barrierState.id } }));
            }

            return barrierStates;
        });
    }

    return api("", res, barrier);
};

export const postBarrier: RequestHandler = async (req: any, res) => {
    const barrier: any = req.body.uuid ? await Barrier.findOne({ where: { uuid: req.body.uuid } }) : new Barrier({ uuid: uuidv4(), added_by: res.locals.user.id, status: "draft" });

    if (!barrier) {
        throw { message: "Barrier not found", code: 404 };
    }

    // Add primary details
    barrier.title = req.body.title ? req.body.title : barrier.title;
    barrier.type = req.body.type ? req.body.type : barrier.type;
    barrier.confidence = req.body.confidence ? req.body.confidence : barrier.confidence;
    barrier.logo = req.body.logo ? req.body.logo : barrier.getDataValue("logo");
    barrier.category_id = req.body.category_id ? req.body.category_id : barrier.category_id;
    barrier.sub_category_id = req.body.sub_category_id ? req.body.sub_category_id : barrier.sub_category_id;
    barrier.expiry = req.body.expiry ? req.body.expiry : barrier.expiry;
    barrier.source = req.body.source ? req.body.source : barrier.source;
    barrier.source_links = req.body.source_links ? req.body.source_links : barrier.source_links;
    barrier.evidence_type = req.body.evidence_type ? req.body.evidence_type : barrier.evidence_type;

    await barrier.save();

    // Add Barrier country
    if (req.body.country_ids) {
        const all_country_ids = [...(await BarrierCountry.findAll({ where: { barrier_id: barrier.id } }))].map((t: any) => parseInt(t.country_id));

        const barrierCountryToBeDeleted = all_country_ids.filter((t: any) => !req.body.country_ids.includes(t));

        const barrierCountryToBeAdded = req.body.country_ids.filter((t: any) => !all_country_ids.includes(t));

        await BarrierCountry.destroy({
            where: { country_id: { [Op.in]: barrierCountryToBeDeleted }, barrier_id: barrier.id },
        });

        const barrierCountryCreate: any = [];

        for (const id of barrierCountryToBeAdded) {
            barrierCountryCreate.push({ barrier_id: barrier.id, country_id: id });
        }

        await BarrierCountry.bulkCreate(barrierCountryCreate);
    }

    // Topic / Sub topic
    if (req.body.topic_ids) {
        const all_topic_ids = [...(await BarrierTopic.findAll({ where: { barrier_id: barrier.id, topic_id: { [Op.ne]: null } } }))].map((t: any) => parseInt(t.topic_id));

        const barrierTopicToBeDeleted = all_topic_ids.filter((t: any) => !req.body.topic_ids.includes(t));

        const barrierTopicToBeAdded = req.body.topic_ids.filter((t: any) => !all_topic_ids.includes(t));

        await BarrierTopic.destroy({
            where: { topic_id: { [Op.in]: barrierTopicToBeDeleted }, barrier_id: barrier.id },
        });

        const barrierTopicCreate: any = [];

        for (const id of barrierTopicToBeAdded) {
            barrierTopicCreate.push({ barrier_id: barrier.id, topic_id: id });
        }

        await BarrierTopic.bulkCreate(barrierTopicCreate);
    }

    if (req.body.sub_topic_ids) {
        const all_topic_ids = [...(await BarrierTopic.findAll({ where: { barrier_id: barrier.id, sub_topic_id: { [Op.ne]: null } } }))].map((t: any) => parseInt(t.sub_topic_id));

        const barrierSubTopicToBeDeleted = all_topic_ids.filter((t: any) => !req.body.sub_topic_ids.includes(t));

        const barrierSubTopicToBeAdded = req.body.sub_topic_ids.filter((t: any) => !all_topic_ids.includes(t));

        await BarrierTopic.destroy({
            where: { sub_topic_id: { [Op.in]: barrierSubTopicToBeDeleted }, barrier_id: barrier.id },
        });

        const barrierSubTopicCreate: any = [];

        for (const id of barrierSubTopicToBeAdded) {
            barrierSubTopicCreate.push({ barrier_id: barrier.id, sub_topic_id: id });
        }

        await BarrierTopic.bulkCreate(barrierSubTopicCreate);
    }

    // Outcome / Sub outcome
    if (req.body.outcome_ids) {
        const all_outcome_ids = [...(await BarrierOutcome.findAll({ where: { barrier_id: barrier.id, outcome_id: { [Op.ne]: null } } }))].map((t: any) => parseInt(t.outcome_id));

        const barrierOutcomeToBeDeleted = all_outcome_ids.filter((t: any) => !req.body.outcome_ids.includes(t));

        const barrierOutcomeToBeAdded = req.body.outcome_ids.filter((t: any) => !all_outcome_ids.includes(t));

        await BarrierOutcome.destroy({
            where: { outcome_id: { [Op.in]: barrierOutcomeToBeDeleted }, barrier_id: barrier.id },
        });

        const barrierOutcomeCreate: any = [];

        for (const id of barrierOutcomeToBeAdded) {
            barrierOutcomeCreate.push({ barrier_id: barrier.id, outcome_id: id });
        }

        await BarrierOutcome.bulkCreate(barrierOutcomeCreate);
    }

    if (req.body.sub_outcome_ids) {
        const all_outcome_ids = [
            ...(await BarrierOutcome.findAll({
                where: { barrier_id: barrier.id, sub_outcome_id: { [Op.ne]: null } },
            })),
        ].map((t: any) => parseInt(t.sub_outcome_id));

        const barrierSubOutcomeToBeDeleted = all_outcome_ids.filter((t: any) => !req.body.sub_outcome_ids.includes(t));

        const barrierSubOutcomeToBeAdded = req.body.sub_outcome_ids.filter((t: any) => !all_outcome_ids.includes(t));

        await BarrierOutcome.destroy({
            where: { sub_outcome_id: { [Op.in]: barrierSubOutcomeToBeDeleted }, barrier_id: barrier.id },
        });

        const barrierSubOutcomeCreate: any = [];

        for (const id of barrierSubOutcomeToBeAdded) {
            barrierSubOutcomeCreate.push({ barrier_id: barrier.id, sub_outcome_id: id });
        }

        await BarrierOutcome.bulkCreate(barrierSubOutcomeCreate);
    }

    // Behaviour
    if (req.body.behaviour_ids) {
        const all_behaviour_ids = [...(await BarrierBehaviour.findAll({ where: { barrier_id: barrier.id } }))].map((t: any) => parseInt(t.behaviour_id));

        const barrierBehaviourToBeDeleted = all_behaviour_ids.filter((t: any) => !req.body.behaviour_ids.includes(t));

        const barrierBehaviourToBeAdded = req.body.behaviour_ids.filter((t: any) => !all_behaviour_ids.includes(t));

        await BarrierBehaviour.destroy({
            where: { behaviour_id: { [Op.in]: barrierBehaviourToBeDeleted }, barrier_id: barrier.id },
        });

        const barrierBehaviourCreate: any = [];

        for (const id of barrierBehaviourToBeAdded) {
            barrierBehaviourCreate.push({ barrier_id: barrier.id, behaviour_id: id });
        }

        await BarrierBehaviour.bulkCreate(barrierBehaviourCreate);
    }

    // Solution
    if (req.body.solution_ids) {
        const all_solution_ids = [...(await SolutionBarrier.findAll({ where: { barrier_id: barrier.id } }))].map((t: any) => parseInt(t.solution_id));

        const solutionToBeDeleted = all_solution_ids.filter((t: any) => !req.body.solution_ids.includes(t));

        const solutionToBeAdded = req.body.solution_ids.filter((t: any) => !all_solution_ids.includes(t));

        await SolutionBarrier.destroy({
            where: { solution_id: { [Op.in]: solutionToBeDeleted }, barrier_id: barrier.id },
        });

        const solutionBarrierCreate: any = [];

        for (const id of solutionToBeAdded) {
            solutionBarrierCreate.push({ barrier_id: barrier.id, solution_id: id });
        }

        await SolutionBarrier.bulkCreate(solutionBarrierCreate);
    }

    return api("Barrier details saved successfully", res, barrier);
};

export const putBarrierCountry: RequestHandler = async (req, res) => {
    const barrier: any = await Barrier.findOne({ where: { uuid: req.params.uuid } });

    if (!barrier) {
        throw { message: "Barrier not found", code: 422 };
    }

    for (const barrierCountryObj of req.body.barrier_countries) {
        let barrierCountry: any = await BarrierCountry.findOne({
            where: { barrier_id: barrier.id, country_id: barrierCountryObj.country_id },
        });

        if (!barrierCountry) {
            barrierCountry = new BarrierCountry({
                barrier_id: barrier.id,
                country_id: barrierCountryObj.country_id,
            });
        }

        barrierCountry.brief = barrierCountryObj.brief ? barrierCountryObj.brief : barrierCountry.brief;
        barrierCountry.description = barrierCountryObj.description ? barrierCountryObj.description : barrierCountry.description;
        barrierCountry.banner = barrierCountryObj.banner ? barrierCountryObj.banner : barrierCountry.getDataValue("banner");
        await barrierCountry.save();

        // Country media
        if (barrierCountryObj.media && barrierCountryObj.media.length > 0) {
            await addMedia("barrier_countries", barrierCountry.id, barrierCountryObj.media);
        }

        // Delete all the media if media is null
        if (barrierCountryObj.media == null || barrierCountryObj.media == "null") {
            await deleteMedia("barrier_countries", [barrierCountry.id]);
        }
    }

    // Delete the countries that are no longer mapped
    if (req.body.deleted_countries && req.body.deleted_countries.length > 0) {
        const entity_ids = [
            ...(await BarrierCountry.findAll({
                where: { barrier_id: barrier.id, country_id: { [Op.in]: req.body.deleted_countries } },
            })),
        ].map((t: any) => parseInt(t.id));

        await deleteMedia("barrier_countries", entity_ids);

        await BarrierCountry.destroy({ where: { id: entity_ids } });
    }

    return api("Country specific barrier details saved successfully.", res, {});
};

export const putBarrierState: RequestHandler = async (req, res) => {
    const barrier: any = await Barrier.findOne({ where: { uuid: req.params.uuid } });

    if (!barrier) {
        throw { message: "Barrier not found", code: 422 };
    }

    for (const barrierStateObj of req.body.barrier_states) {
        let barrierState: any = await BarrierState.findOne({
            where: { barrier_id: barrier.id, state_id: barrierStateObj.state_id },
        });

        if (!barrierState) {
            barrierState = new BarrierState({ barrier_id: barrier.id, state_id: barrierStateObj.state_id });
        }

        const state: any = await State.findByPk(barrierStateObj.state_id);

        barrierState.description = barrierStateObj.description ? barrierStateObj.description : barrierState.description;
        barrierState.brief = barrierStateObj.brief ? barrierStateObj.brief : barrierState.brief;
        barrierState.banner = barrierStateObj.banner ? barrierStateObj.banner : barrierState.getDataValue("banner");
        barrierState.country_id = state.country_id;
        await barrierState.save();

        // State media
        if (barrierStateObj.media && barrierStateObj.media.length > 0) {
            await addMedia("barrier_states", barrierState.id, barrierStateObj.media);
        }

        if (barrierStateObj.media == null || barrierStateObj.media == "null") {
            await deleteMedia("barrier_states", [barrierState.id]);
        }
    }

    // Delete the states that are no longer mapped
    if (req.body.deleted_states && req.body.deleted_states.length > 0) {
        const entity_ids = [
            ...(await BarrierState.findAll({
                where: { barrier_id: barrier.id, state_id: { [Op.in]: req.body.deleted_states } },
            })),
        ].map((t: any) => parseInt(t.id));

        await deleteMedia("barrier_states", entity_ids);

        await BarrierState.destroy({ where: { id: entity_ids } });
    }

    return api("State specific barrier details saved successfully.", res, {});
};

export const putBarrierStatus: RequestHandler = async (req, res) => {
    const barrier: any = await Barrier.findOne({ where: { uuid: req.params.uuid } });

    if (!barrier) {
        throw { message: "Barrier not found", code: 404 };
    }

    if (barrier.status != "published" && req.body.status == "unpublished") {
        throw { message: "Action not allowed. Barrier is not published yet", code: 422 };
    }

    const mes = req.body.status == "published" ? "Barrier published successfully" : "Barrier unpublished successfully";

    barrier.status = req.body.status;
    await barrier.save();

    return api(mes, res, {});
};
