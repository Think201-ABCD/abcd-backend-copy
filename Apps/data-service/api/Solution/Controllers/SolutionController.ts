import { RequestHandler } from "express";
import { v4 as uuidv4 } from "uuid";
import { Op, fn, col, where, literal, cast } from "sequelize";

//Helpers
import { api, apiException } from "@redlof/libs/Helpers/helpers";
import { getCountryData, getFilteredSolutions } from "@redlof/libs/Helpers/DataFilterHelper";

// Models
import { SolutionCategory } from "@redlof/libs/Models/Solution/SolutionCategory";

import { Behaviour } from "@redlof/libs/Models/Behaviour/Behaviour";
import { SolutionCountry } from "@redlof/libs/Models/Solution/SolutionCountry";
import { SolutionTopic } from "@redlof/libs/Models/Solution/SolutionTopic";
import { SolutionOutcome } from "@redlof/libs/Models/Solution/SolutionOutcome";
import { MediaData } from "@redlof/libs/Models/Media/MediaData";
import { SolutionState } from "@redlof/libs/Models/Solution/SolutionState";
import { State } from "@redlof/libs/Models/Data/State";
import { User } from "@redlof/libs/Models/Auth/User";
import { Outcome } from "@redlof/libs/Models/Outcome/Outcome";
import { SubOutcome } from "@redlof/libs/Models/Outcome/SubOutcome";
import { Topic } from "@redlof/libs/Models/Topic/Topic";
import { SubTopic } from "@redlof/libs/Models/Topic/SubTopic";
import { Solution } from "@redlof/libs/Models/Solution/Solution";
import { SolutionBarrier } from "@redlof/libs/Models/Solution/SolutionBarrier";
import { SolutionBehaviour } from "@redlof/libs/Models/Solution/SolutionBehaviours";
import { Barrier } from "@redlof/libs/Models/Barrier/Barrier";
import { deleteMedia } from "@redlof/libs/Helpers/MediaHelper";
import { Country } from "@redlof/libs/Models/Data/Country";
import { BarrierCategory } from "@redlof/libs/Models/Barrier/BarrierCategory";
import { info } from "console";
import { sequelize } from "@redlof/libs/Loaders/database";

export const getSolutionCategories: RequestHandler = async (req, res) => {
    const clause: any = { parent_id: null };

    if (req.query.category_id) {
        clause.parent_id =
            typeof req.query.category_id == "string"
                ? { [Op.in]: [req.query.category_id] }
                : { [Op.in]: req.query.category_id };
    }

    const categories = await SolutionCategory.findAll({ where: clause, order: [["name", "asc"]] });

    return api("", res, categories);
};

export const getSolutions: RequestHandler = async (req: any, res) => {
    const clause: any = { [Op.and]: [] };
    const categoryClause: any = { [Op.or]: [] };

    const andSymbol: any = Object.getOwnPropertySymbols(clause)[0];
    const orSymbol: any = Object.getOwnPropertySymbols(categoryClause)[0];

    if (req.query.status) {
        clause.status = req.query.status;
    }

    if (req.query.category_id) {
        //implement OR functionality for Op.contains

        let categoryIdArr = req.query.category_id;

        for (const category_id of categoryIdArr) {
            categoryClause[orSymbol].push({ [Op.contains]: category_id });
        }

        clause[andSymbol].push({ categories: categoryClause });
    }

    if (req.query.search) {
        clause[andSymbol].push({
            [Op.or]: [{ title: { [Op.iLike]: `%${req.query.search}%` } }],
        });
    }

    // Get barrier ids if any filters applied
    clause.id = { [Op.in]: await getFilteredSolutions(req.query) };

    const { rows, count } = await Solution.findAndCountAll({
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
        ],
    }).then(async ({ rows, count }: any) => {
        if (rows.length <= 0) {
            return { rows, count };
        }

        if (!req.query.country_id) {
            return { rows, count };
        }

        for (const solution of rows) {
            solution.setDataValue(
                "solution_country",
                await getCountryData(solution.id, req.query.country_id, "solutions")
            );

            if (solution.categories) {
                let categories = await SolutionCategory.findAll({
                    where: {
                        id: { [Op.in]: solution.categories },
                    },
                });

                solution.setDataValue("categories", categories);
            }
        }

        return { rows, count };
    });

    const pages = req.query.limit ? count / Number(req.query.limit) : 1;

    return api("", res, { total: count, pages: Math.ceil(pages), data: rows });
};

export const getSolution: RequestHandler = async (req, res) => {
    const countryClause: any = {};
    const stateClause: any = {};

    if (req.query.country_id) {
        countryClause.country_id = req.query.country_id;
        stateClause.country_id = req.query.country_id;
    }

    if (req.query.state_id) {
        stateClause.state_id = req.query.state_id;
    }

    let solution: any = await Solution.findOne({
        where: { uuid: req.params.uuid },
        attributes: { exclude: ["updated_at", "deleted_at"] },
        include: [
            {
                as: "created_by",
                model: User,
                attributes: ["uuid", "first_name", "last_name", "photo"],
                required: true,
            },
            { model: Country, as: "source_country", required: false },
            { model: State, as: "source_state", required: false },
            {
                as: "solution_countries",
                model: SolutionCountry,
                attributes: { exclude: ["updated_at", "deleted_at"] },
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
                include: ["outcome_countries"],
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
                model: Barrier,
                as: "barriers",
                attributes: ["id", "uuid", "title", "type", "logo"],
                required: false,
                where: { status: "published" },
                include: [
                    "barrier_countries",
                    {
                        as: "category",
                        model: BarrierCategory,
                        attributes: ["id", "name"],
                    },
                ],
            },
            {
                model: Behaviour,
                as: "behaviours",
                attributes: ["id", "uuid", "title", "logo"],
                required: false,
                where: { status: "published" },
                include: ["behaviour_countries"],
            },
        ],
    });

    if (!solution) {
        throw { message: "Solution not found", code: 404 };
    }

    solution = solution.toJSON();

    solution.category = await SolutionCategory.findAll({
        where: { id: { [Op.in]: solution.categories ? solution.categories : [] } },
    });

    solution.sub_category = await SolutionCategory.findAll({
        where: { id: { [Op.in]: solution.sub_categories ? solution.sub_categories : [] } },
    });

    stateClause.solution_id = solution.id;

    for (const solutionCountry of solution.solution_countries) {
        solutionCountry.media = await MediaData.findAll({
            where: { entity: "solution_countries", entity_id: solutionCountry.id },
        });

        solutionCountry.solution_states = await SolutionState.findAll({
            attributes: { exclude: ["updated_at", "deleted_at"] },
            where: stateClause,
            include: ["state"],
        }).then(async (solutionStates: any) => {
            if (solutionStates.length <= 0) {
                solutionStates;
            }

            for (const solutionState of solutionStates) {
                solutionState.setDataValue(
                    "media",
                    await MediaData.findAll({ where: { entity: "solution_states", entity_id: solutionState.id } })
                );
            }

            return solutionStates;
        });
    }

    return api("", res, solution);
};

export const postSolution: RequestHandler = async (req: any, res) => {
    const solution: any = req.body.uuid
        ? await Solution.findOne({ where: { uuid: req.body.uuid } })
        : new Solution({ uuid: uuidv4(), added_by: res.locals.user.id, status: "draft" });

    if (!solution) {
        throw { message: "Solution not found", code: 404 };
    }

    // Add primary details
    solution.title = req.body.title ? req.body.title : solution.title;
    solution.logo = req.body.logo ? req.body.logo : solution.getDataValue("logo");

    solution.source_country_id = req.body.source_country_id ? req.body.source_country_id : solution.source_country_id;
    solution.source_state_id = req.body.source_state_id ? req.body.source_state_id : solution.source_state_id;
    solution.expiry = req.body.expiry ? req.body.expiry : solution.expiry;
    solution.confidence = req.body.confidence ? req.body.confidence : solution.confidence;
    solution.year = req.body.development_year ? req.body.development_year : solution.year;
    solution.priority = req.body.priority ? req.body.priority : solution.priority;
    solution.source = req.body.source ? req.body.source : solution.source;
    solution.source_links = req.body.source_links ? req.body.source_links : solution.source_links;
    solution.evidence_type = req.body.evidence_type ? req.body.evidence_type : solution.evidence_type;

    solution.categories =
        req.body.categories && req.body.categories.length > 0 ? req.body.categories : solution.categories;
    solution.sub_categories =
        req.body.sub_categories && req.body.sub_categories.length > 0
            ? req.body.sub_categories
            : solution.sub_categories;

    solution.link = req.body.link ? req.body.link : solution.link;

    await solution.save();

    // Solution mapping with countries
    if (req.body.country_ids) {
        const all_country_ids = [...(await SolutionCountry.findAll({ where: { solution_id: solution.id } }))].map(
            (t: any) => parseInt(t.country_id)
        );

        const solutionCountryToBeDeleted = all_country_ids.filter((t: any) => !req.body.country_ids.includes(t));

        const solutionCountryToBeAdded = req.body.country_ids.filter((t: any) => !all_country_ids.includes(t));

        await SolutionCountry.destroy({
            where: { country_id: { [Op.in]: solutionCountryToBeDeleted }, solution_id: solution.id },
        });

        const solutionCountryCreate: any = [];

        for (const id of solutionCountryToBeAdded) {
            solutionCountryCreate.push({ solution_id: solution.id, country_id: id });
        }

        await SolutionCountry.bulkCreate(solutionCountryCreate);
    }

    // Solution mapping with Topic / Sub topic
    if (req.body.topic_ids) {
        const all_topic_ids = [
            ...(await SolutionTopic.findAll({ where: { solution_id: solution.id, topic_id: { [Op.ne]: null } } })),
        ].map((t: any) => parseInt(t.topic_id));

        const solutionTopicToBeDeleted = all_topic_ids.filter((t: any) => !req.body.topic_ids.includes(t));

        const solutionTopicToBeAdded = req.body.topic_ids.filter((t: any) => !all_topic_ids.includes(t));

        await SolutionTopic.destroy({
            where: { topic_id: { [Op.in]: solutionTopicToBeDeleted }, solution_id: solution.id },
        });

        const solutionTopicCreate: any = [];

        for (const id of solutionTopicToBeAdded) {
            solutionTopicCreate.push({ solution_id: solution.id, topic_id: id });
        }

        await SolutionTopic.bulkCreate(solutionTopicCreate);
    }

    if (req.body.sub_topic_ids) {
        const all_topic_ids = [
            ...(await SolutionTopic.findAll({
                where: { solution_id: solution.id, sub_topic_id: { [Op.ne]: null } },
            })),
        ].map((t: any) => parseInt(t.sub_topic_id));

        const solutionSubTopicToBeDeleted = all_topic_ids.filter((t: any) => !req.body.sub_topic_ids.includes(t));

        const solutionSubTopicToBeAdded = req.body.sub_topic_ids.filter((t: any) => !all_topic_ids.includes(t));

        await SolutionTopic.destroy({
            where: { sub_topic_id: { [Op.in]: solutionSubTopicToBeDeleted }, solution_id: solution.id },
        });

        const solutionSubTopicCreate: any = [];

        for (const id of solutionSubTopicToBeAdded) {
            solutionSubTopicCreate.push({ solution_id: solution.id, sub_topic_id: id });
        }

        await SolutionTopic.bulkCreate(solutionSubTopicCreate);
    }

    // Outcome / Sub outcome
    if (req.body.outcome_ids) {
        const all_outcome_ids = [
            ...(await SolutionOutcome.findAll({
                where: { solution_id: solution.id, outcome_id: { [Op.ne]: null } },
            })),
        ].map((t: any) => parseInt(t.outcome_id));

        const solutionOutcomeToBeDeleted = all_outcome_ids.filter((t: any) => !req.body.outcome_ids.includes(t));

        const solutionOutcomeToBeAdded = req.body.outcome_ids.filter((t: any) => !all_outcome_ids.includes(t));

        await SolutionOutcome.destroy({
            where: { outcome_id: { [Op.in]: solutionOutcomeToBeDeleted }, solution_id: solution.id },
        });

        const solutionOutcomeCreate: any = [];

        for (const id of solutionOutcomeToBeAdded) {
            solutionOutcomeCreate.push({ solution_id: solution.id, outcome_id: id });
        }

        await SolutionOutcome.bulkCreate(solutionOutcomeCreate);
    }

    if (req.body.sub_outcome_ids) {
        const all_outcome_ids = [
            ...(await SolutionOutcome.findAll({
                where: { solution_id: solution.id, sub_outcome_id: { [Op.ne]: null } },
            })),
        ].map((t: any) => parseInt(t.sub_outcome_id));

        const solutionSubOutcomeToBeDeleted = all_outcome_ids.filter((t: any) => !req.body.sub_outcome_ids.includes(t));

        const solutionSubOutcomeToBeAdded = req.body.sub_outcome_ids.filter((t: any) => !all_outcome_ids.includes(t));

        await SolutionOutcome.destroy({
            where: { sub_outcome_id: { [Op.in]: solutionSubOutcomeToBeDeleted }, solution_id: solution.id },
        });

        const solutionSubOutcomeCreate: any = [];

        for (const id of solutionSubOutcomeToBeAdded) {
            solutionSubOutcomeCreate.push({ solution_id: solution.id, sub_outcome_id: id });
        }

        await SolutionOutcome.bulkCreate(solutionSubOutcomeCreate);
    }

    if (req.body.barrier_ids) {
        const all_barrier_ids = [...(await SolutionBarrier.findAll({ where: { solution_id: solution.id } }))].map(
            (t: any) => parseInt(t.barrier_id)
        );

        const solutionBarrierToBeDeleted = all_barrier_ids.filter((t: any) => !req.body.barrier_ids.includes(t));

        const solutionBarrierToBeAdded = req.body.barrier_ids.filter((t: any) => !all_barrier_ids.includes(t));

        await SolutionBarrier.destroy({
            where: { barrier_id: { [Op.in]: solutionBarrierToBeDeleted }, solution_id: solution.id },
        });

        const solutionBarrierCreate: any = [];

        for (const id of solutionBarrierToBeAdded) {
            solutionBarrierCreate.push({ solution_id: solution.id, barrier_id: id });
        }

        await SolutionBarrier.bulkCreate(solutionBarrierCreate);
    }

    if (req.body.behaviour_ids) {
        const all_behaviour_ids = [...(await SolutionBehaviour.findAll({ where: { solution_id: solution.id } }))].map(
            (t: any) => parseInt(t.behaviour_id)
        );

        const solutionBehaviourToBeDeleted = all_behaviour_ids.filter((t: any) => !req.body.behaviour_ids.includes(t));

        const solutionBehaviourToBeAdded = req.body.behaviour_ids.filter((t: any) => !all_behaviour_ids.includes(t));

        await SolutionBehaviour.destroy({
            where: { behaviour_id: { [Op.in]: solutionBehaviourToBeDeleted }, solution_id: solution.id },
        });

        const solutionBehaviourCreate: any = [];

        for (const id of solutionBehaviourToBeAdded) {
            solutionBehaviourCreate.push({ solution_id: solution.id, behaviour_id: id });
        }

        await SolutionBehaviour.bulkCreate(solutionBehaviourCreate);
    }

    return api("Solution details saved successfully", res, solution);
};

export const putSolutionCountry: RequestHandler = async (req, res) => {
    const solution: any = await Solution.findOne({ where: { uuid: req.params.uuid } });

    if (!solution) {
        throw { message: "Solution not found", code: 422 };
    }

    for (const solutionCountryObj of req.body.solution_countries) {
        let solutionCountry: any = await SolutionCountry.findOne({
            where: { solution_id: solution.id, country_id: solutionCountryObj.country_id },
        });

        if (!solutionCountry) {
            solutionCountry = new SolutionCountry({
                solution_id: solution.id,
                country_id: solutionCountryObj.country_id,
            });
        }

        solutionCountry.brief = solutionCountryObj.brief ? solutionCountryObj.brief : solutionCountry.brief;
        solutionCountry.banner = solutionCountryObj.banner
            ? solutionCountryObj.banner
            : solutionCountry.getDataValue("banner");
        solutionCountry.description = solutionCountryObj.description
            ? solutionCountryObj.description
            : solutionCountry.description;
        await solutionCountry.save();

        // Country media
        if (solutionCountryObj.media) {
            const mediaData = [];

            for (const media of solutionCountryObj.media) {
                mediaData.push({
                    entity: "solution_countries",
                    entity_id: solutionCountry.id,
                    type: media.type,
                    file: media.file,
                    file_name: media.file_name ? media.file_name : null,
                });
            }

            // Delete any previous media
            await MediaData.destroy({ where: { entity: "solution_countries", entity_id: solutionCountry.id } });

            // Update the media
            await MediaData.bulkCreate(mediaData);
        }
    }

    // Delete the countries that are no longer mapped
    if (req.body.deleted_countries && req.body.deleted_countries.length > 0) {
        const entity_ids = [
            ...(await SolutionCountry.findAll({
                where: { solution_id: solution.id, country_id: { [Op.in]: req.body.deleted_countries } },
            })),
        ].map((t: any) => parseInt(t.id));

        await deleteMedia("solution_countries", entity_ids);

        await SolutionCountry.destroy({ where: { id: entity_ids } });
    }

    return api("Country specific solution details saved successfully.", res, {});
};

export const putSolutionState: RequestHandler = async (req, res) => {
    const solution: any = await Solution.findOne({ where: { uuid: req.params.uuid } });

    if (!solution) {
        throw { message: "Solution not found", code: 422 };
    }

    for (const solutionStateObj of req.body.solution_states) {
        let solutionState: any = await SolutionState.findOne({
            where: { solution_id: solution.id, state_id: solutionStateObj.state_id },
        });

        if (!solutionState) {
            solutionState = new SolutionState({ solution_id: solution.id, state_id: solutionStateObj.state_id });
        }

        const state: any = await State.findByPk(solutionStateObj.state_id);

        solutionState.description = solutionStateObj.description
            ? solutionStateObj.description
            : solutionState.description;
        solutionState.brief = solutionStateObj.brief ? solutionStateObj.brief : solutionState.brief;
        solutionState.banner = solutionStateObj.banner ? solutionStateObj.banner : solutionState.getDataValue("banner");
        solutionState.country_id = state.country_id;
        await solutionState.save();

        // State media
        if (solutionStateObj.media) {
            const mediaData = [];

            for (const media of solutionStateObj.media) {
                mediaData.push({
                    entity: "solution_states",
                    entity_id: solutionState.id,
                    type: media.type,
                    file: media.file,
                    file_name: media.file_name ? media.file_name : null,
                });
            }

            // Delete any previous media
            await MediaData.destroy({ where: { entity: "solution_states", entity_id: solutionState.id } });

            // Update the media
            await MediaData.bulkCreate(mediaData);
        }
    }

    // Delete the states that are no longer mapped
    if (req.body.deleted_states && req.body.deleted_states.length > 0) {
        const entity_ids = [
            ...(await SolutionState.findAll({
                where: { solution_id: solution.id, state_id: { [Op.in]: req.body.deleted_states } },
            })),
        ].map((t: any) => parseInt(t.id));

        await deleteMedia("solution_states", entity_ids);

        await SolutionState.destroy({ where: { id: entity_ids } });
    }

    return api("State specific solution details saved successfully.", res, {});
};

export const putSolutionStatus: RequestHandler = async (req, res) => {
    const solution: any = await Solution.findOne({ where: { uuid: req.params.uuid } });

    if (!solution) {
        throw { message: "Solution not found", code: 404 };
    }

    if (solution.status != "published" && req.body.status == "unpublished") {
        throw { message: "Action not allowed. Solution is not published yet", code: 422 };
    }

    const mes =
        req.body.status == "published" ? "Solution published successfully" : "Solution unpublished successfully";

    solution.status = req.body.status;
    await solution.save();

    return api(mes, res, {});
};
