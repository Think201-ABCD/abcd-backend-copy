import { RequestHandler } from "express";
import { v4 as uuidv4 } from "uuid";
import { Op } from "sequelize";

//Helpers
import { api, apiException } from "@redlof/libs/Helpers/helpers";
import { getCountryData, getFilteredOutcomes, getFilteredSubOutcomes } from "@redlof/libs/Helpers/DataFilterHelper";
import { addMedia, deleteMedia } from "@redlof/libs/Helpers/MediaHelper";

// Models
import { Topic } from "@redlof/libs/Models/Topic/Topic";
import { SubTopic } from "@redlof/libs/Models/Topic/SubTopic";
import { Outcome } from "@redlof/libs/Models/Outcome/Outcome";
import { OutcomeCountry } from "@redlof/libs/Models/Outcome/OutcomeCountry";
import { OutcomeState } from "@redlof/libs/Models/Outcome/OutcomeState";
import { User } from "@redlof/libs/Models/Auth/User";
import { MediaData } from "@redlof/libs/Models/Media/MediaData";
import { OutcomeTopic } from "@redlof/libs/Models/Outcome/OutcomeTopic";
import { State } from "@redlof/libs/Models/Data/State";
import { SubOutcome } from "@redlof/libs/Models/Outcome/SubOutcome";
import { Barrier } from "@redlof/libs/Models/Barrier/Barrier";
import { Solution } from "@redlof/libs/Models/Solution/Solution";
import { SubOutcomeOutcome } from "@redlof/libs/Models/Outcome/SubOutcomeOutcome";
import { BarrierOutcome } from "@redlof/libs/Models/Barrier/BarrierOutcome";
import { SolutionOutcome } from "@redlof/libs/Models/Solution/SolutionOutcome";
import { SubTopicTopic } from "@redlof/libs/Models/Topic/SubTopicTopic";
import { SolutionCategory } from "@redlof/libs/Models/Solution/SolutionCategory";
import { BarrierCategory } from "@redlof/libs/Models/Barrier/BarrierCategory";

export const getOutcomes: RequestHandler = async (req: any, res) => {
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

    // Get topic ids if any filters applied
    clause.id = { [Op.in]: await getFilteredOutcomes(req.query) };

    const { rows, count } = await Outcome.findAndCountAll({
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

        for (const outcome of rows) {
            outcome.setDataValue("outcome_country", await getCountryData(outcome.id, req.query.country_id, "outcomes"));

            outcome.setDataValue("sub_outcomes", []);

            const subOutcomeIds = await getFilteredSubOutcomes({ outcome_ids: [outcome.id] });

            if (subOutcomeIds.length <= 0) {
                continue;
            }

            await SubOutcome.findAll({ where: { id: { [Op.in]: subOutcomeIds }, status: "published" } }).then(
                async (subOutcomes: any) => {
                    for (const subOutcome of subOutcomes) {
                        subOutcome.setDataValue(
                            "sub_outcome_country",
                            await getCountryData(subOutcome.id, req.query.country_id, "sub_outcomes")
                        );
                    }

                    outcome.setDataValue("sub_outcomes", subOutcomes);
                }
            );
        }

        return { rows, count };
    });

    const pages = req.query.limit ? count / Number(req.query.limit) : 1;

    return api("", res, { total: count, pages: Math.ceil(pages), data: rows });
};

export const getOutcome: RequestHandler = async (req: any, res) => {
    const countryClause: any = {};
    const stateClause: any = {};

    if (req.query.country_id) {
        countryClause.country_id = req.query.country_id;
        stateClause.country_id = req.query.country_id;
    }

    if (req.query.state_id) {
        stateClause.state_id = req.query.state_id;
    }

    let outcome: any = await Outcome.findOne({
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
                as: "outcome_countries",
                model: OutcomeCountry,
                attributes: { exclude: ["sub_outcome_id", "updated_at", "deleted_at"] },
                include: ["country"],
                where: countryClause,
                required: false,
            },
            {
                as: "sub_outcomes",
                model: SubOutcome,
                attributes: ["uuid", "id", "title", "status", "logo"],
                where: { status: "published" },
                required: false,
            },
            {
                model: Topic,
                as: "topics",
                attributes: ["id", "uuid", "title", "logo"],
                where: { status: "published" },
                through: { where: { deleted_at: null } },
                required: false,
            },
            {
                model: SubTopic,
                as: "sub_topics",
                attributes: ["id", "uuid", "title", "logo"],
                where: { status: "published" },
                required: false,
            },
            {
                model: Barrier,
                as: "barriers",
                attributes: ["uuid", "id", "title", "logo", "type", "confidence"],
                include: ["category"],
                where: { status: "published" },
                required: false,
            },
            {
                model: Solution,
                as: "solutions",
                attributes: ["uuid", "id", "title", "logo", "categories"],
                where: { status: "published" },
                required: false,
            },
        ],
    });

    if (!outcome) {
        throw { message: "outcome not found", code: 404 };
    }

    outcome = outcome.toJSON();

    stateClause.outcome_id = outcome.id;

    for (const outcomeCountry of outcome.outcome_countries) {
        outcomeCountry.media = await MediaData.findAll({
            where: { entity: "outcome_countries", entity_id: outcomeCountry.id },
        });

        outcomeCountry.states = await OutcomeState.findAll({
            attributes: { exclude: ["updated_at", "deleted_at"] },
            where: stateClause,
            include: ["state"],
        }).then(async (outcomeStates: any) => {
            if (outcomeStates.length <= 0) {
                outcomeStates;
            }

            for (const outcomeState of outcomeStates) {
                outcomeState.setDataValue(
                    "media",
                    await MediaData.findAll({ where: { entity: "outcome_states", entity_id: outcomeState.id } })
                );
            }

            return outcomeStates;
        });
    }

    return api("", res, outcome);
};

export const postOutcome: RequestHandler = async (req, res) => {
    let outcome: any = req.body.uuid ? await Outcome.findOne({ where: { uuid: req.body.uuid } }) : null;

    if (!outcome) {
        outcome = new Outcome({ uuid: uuidv4(), added_by: res.locals.user.id, status: "draft" });
    }

    // Add primary details
    outcome.title = req.body.title ? req.body.title : outcome.title;
    outcome.types = req.body.types ? req.body.types : outcome.types;
    outcome.expiry = req.body.expiry ? req.body.expiry : outcome.expiry;
    outcome.logo = req.body.logo ? req.body.logo : outcome.getDataValue("logo");
    await outcome.save();

    // Add topic country
    if (req.body.country_ids) {
        const all_country_ids = [...(await OutcomeCountry.findAll({ where: { outcome_id: outcome.id } }))].map(
            (t: any) => parseInt(t.country_id)
        );

        const outcomeCountryToBeDeleted = all_country_ids.filter((t: any) => !req.body.country_ids.includes(t));

        const outcomeCountryToBeAdded = req.body.country_ids.filter((t: any) => !all_country_ids.includes(t));

        console.log("added", outcomeCountryToBeAdded);

        console.log("deleted", outcomeCountryToBeDeleted);

        await OutcomeCountry.destroy({
            where: { country_id: { [Op.in]: outcomeCountryToBeDeleted }, outcome_id: outcome.id },
        });

        const outcomeCountryCreate: any = [];

        for (const id of outcomeCountryToBeAdded) {
            outcomeCountryCreate.push({ outcome_id: outcome.id, country_id: id });
        }

        await OutcomeCountry.bulkCreate(outcomeCountryCreate);
    }

    if (req.body.topic_ids) {
        const all_topic_ids = [
            ...(await OutcomeTopic.findAll({ where: { outcome_id: outcome.id, topic_id: { [Op.ne]: null } } })),
        ].map((t: any) => parseInt(t.topic_id));

        const outcomeTopicToBeDeleted = all_topic_ids.filter((t: any) => !req.body.topic_ids.includes(t));

        const outcomeTopicToBeAdded = req.body.topic_ids.filter((t: any) => !all_topic_ids.includes(t));

        await OutcomeTopic.destroy({
            where: { topic_id: { [Op.in]: outcomeTopicToBeDeleted }, outcome_id: outcome.id },
        });

        const outcomeTopicCreate: any = [];

        for (const id of outcomeTopicToBeAdded) {
            outcomeTopicCreate.push({ outcome_id: outcome.id, topic_id: id });
        }

        await OutcomeTopic.bulkCreate(outcomeTopicCreate);
    }

    if (req.body.sub_topic_ids) {
        const all_sub_topic_ids = [
            ...(await OutcomeTopic.findAll({ where: { outcome_id: outcome.id, sub_topic_id: { [Op.ne]: null } } })),
        ].map((t: any) => parseInt(t.sub_topic_id));

        const outcomeSubTopicToBeDeleted = all_sub_topic_ids.filter((t: any) => !req.body.sub_topic_ids.includes(t));

        const outcomeSubTopicToBeAdded = req.body.sub_topic_ids.filter((t: any) => !all_sub_topic_ids.includes(t));

        await OutcomeTopic.destroy({
            where: { topic_id: { [Op.in]: outcomeSubTopicToBeDeleted }, outcome_id: outcome.id },
        });

        const outcomeSubTopicCreate: any = [];

        for (const id of outcomeSubTopicToBeAdded) {
            outcomeSubTopicCreate.push({ outcome_id: outcome.id, sub_topic_id: id });
        }
        await OutcomeTopic.bulkCreate(outcomeSubTopicCreate);
    }

    return api("Outcome details saved successfully", res, outcome);
};

export const putOutcomeCountry: RequestHandler = async (req, res) => {
    const outcome: any = await Outcome.findOne({ where: { uuid: req.params.uuid } });

    if (!outcome) {
        throw { message: "outcome not found", code: 422 };
    }

    for (const outcomeCountryObj of req.body.outcome_countries) {
        let outcomeCountry: any = await OutcomeCountry.findOne({
            where: { outcome_id: outcome.id, country_id: outcomeCountryObj.country_id },
        });

        if (!outcomeCountry) {
            outcomeCountry = new OutcomeCountry({
                outcome_id: outcome.id,
                country_id: outcomeCountryObj.country_id,
            });
        }

        outcomeCountry.brief = outcomeCountryObj.brief ? outcomeCountryObj.brief : outcomeCountry.brief;
        outcomeCountry.description = outcomeCountryObj.description
            ? outcomeCountryObj.description
            : outcomeCountry.description;
        outcomeCountry.banner = outcomeCountryObj.banner
            ? outcomeCountryObj.banner
            : outcomeCountry.getDataValue("banner");
        await outcomeCountry.save();

        // Country media
        if (outcomeCountryObj.media && outcomeCountryObj.media.length > 0) {
            await addMedia("outcome_countries", outcomeCountry.id, outcomeCountryObj.media);
        }

        if (outcomeCountryObj.media == null || outcomeCountryObj.media == "null") {
            await deleteMedia("outcome_countries", [outcomeCountry.id]);
        }
    }

    // Delete the countries that are no longer mapped
    if (req.body.deleted_countries && req.body.deleted_countries.length > 0) {
        const entity_ids = [
            ...(await OutcomeCountry.findAll({
                where: { outcome_id: outcome.id, country_id: { [Op.in]: req.body.deleted_countries } },
            })),
        ].map((t: any) => parseInt(t.id));

        await deleteMedia("outcome_countries", entity_ids);

        await OutcomeCountry.destroy({ where: { id: entity_ids } });
    }

    return api("Outcome details saved successfully.", res, {});
};

export const putOutcomeState: RequestHandler = async (req, res) => {
    const outcome: any = await Outcome.findOne({ where: { uuid: req.params.uuid } });

    if (!outcome) {
        throw { message: "Outcome not found", code: 404 };
    }

    for (const outcomeStateObj of req.body.outcome_states) {
        let outcomeState: any = await OutcomeState.findOne({
            where: { outcome_id: outcome.id, state_id: outcomeStateObj.state_id },
        });

        if (!outcomeState) {
            outcomeState = new OutcomeState({ outcome_id: outcome.id, state_id: outcomeStateObj.state_id });
        }

        const state: any = await State.findByPk(outcomeStateObj.state_id);

        outcomeState.description = outcomeStateObj.description ? outcomeStateObj.description : outcomeState.description;
        outcomeState.brief = outcomeStateObj.brief ? outcomeStateObj.brief : outcomeState.brief;
        outcomeState.banner = outcomeStateObj.banner ? outcomeStateObj.banner : outcomeState.getDataValue("banner");
        outcomeState.country_id = state.country_id;

        await outcomeState.save();

        // State media
        if (outcomeStateObj.media && outcomeStateObj.media.length > 0) {
            await addMedia("outcome_states", outcomeState.id, outcomeStateObj.media);
        }

        if (outcomeStateObj.media == null || outcomeStateObj.media == "null") {
            await deleteMedia("outcome_states", [outcomeState.id]);
        }
    }

    // Delete the states that are no longer mapped
    if (req.body.deleted_states && req.body.deleted_states.length > 0) {
        const entity_ids = [
            ...(await OutcomeState.findAll({
                where: { outcome_id: outcome.id, state_id: { [Op.in]: req.body.deleted_states } },
            })),
        ].map((t: any) => parseInt(t.id));

        await deleteMedia("outcome_states", entity_ids);

        await OutcomeState.destroy({ where: { id: entity_ids } });
    }

    return api("Outcome details saved successfully.", res, {});
};

export const putOutcomeStatus: RequestHandler = async (req: any, res) => {
    const outcome: any = await Outcome.findOne({ where: { uuid: req.params.uuid } });

    if (!outcome) {
        throw { message: "Outcome not found", code: 404 };
    }

    if (outcome.status != "published" && req.body.status == "unpublished") {
        throw { message: "Action not allowed. Outcome is not published yet", code: 422 };
    }

    const mes = req.body.status == "published" ? "Outcome published successfully" : "Outcome unpublished successfully";

    outcome.status = req.body.status;
    await outcome.save();

    return api(mes, res, {});
};

export const getOutcomeDetails: RequestHandler = async (req: any, res) => {
    const countryClause: any = {};
    const stateClause: any = {};

    if (req.query.country_id) {
        countryClause.country_id = req.query.country_id;
        stateClause.country_id = req.query.country_id;
    }

    if (req.query.state_id) {
        stateClause.state_id = req.query.state_id;
    }

    let outcome: any = await Outcome.findOne({
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
                as: "outcome_countries",
                model: OutcomeCountry,
                attributes: { exclude: ["sub_outcome_id", "updated_at", "deleted_at"] },
                include: ["country"],
                where: countryClause,
                required: false,
            },
        ],
    });

    if (!outcome) {
        throw { message: "outcome not found", code: 404 };
    }

    outcome = outcome.toJSON();

    stateClause.outcome_id = outcome.id;

    for (const outcomeCountry of outcome.outcome_countries) {
        outcomeCountry.media = await MediaData.findAll({
            where: { entity: "outcome_countries", entity_id: outcomeCountry.id },
        });

        outcomeCountry.states = await OutcomeState.findAll({
            attributes: { exclude: ["updated_at", "deleted_at"] },
            where: stateClause,
            include: ["state"],
        }).then(async (outcomeStates: any) => {
            if (outcomeStates.length <= 0) {
                outcomeStates;
            }

            for (const outcomeState of outcomeStates) {
                outcomeState.setDataValue(
                    "media",
                    await MediaData.findAll({ where: { entity: "outcome_states", entity_id: outcomeState.id } })
                );
            }

            return outcomeStates;
        });
    }

    return api("", res, outcome);
};

export const getOutcomeSubOutcomes: RequestHandler = async (req: any, res) => {
    const uuid = req.params.uuid;
    const country_id = req.query.country_id;

    let outcome: any = await Outcome.findOne({
        where: { uuid: uuid },
        attributes: { exclude: ["updated_at", "deleted_at"] },
        include: [
            {
                as: "outcome_countries",
                model: OutcomeCountry,
                attributes: { exclude: ["sub_outcome_id", "updated_at", "deleted_at"] },
                include: ["country"],
                where: { country_id: country_id },
                required: false,
            },
        ],
    });

    const suboutcomeoutcomes = await SubOutcomeOutcome.findAll({
        where: { outcome_id: outcome.id },
        attributes: ["sub_outcome_id"],
    });

    if (suboutcomeoutcomes.length <= 0) {
        return api("Outcomes does not have any sub-outcomes", res, {});
    }

    const suboutcomeIds = suboutcomeoutcomes.map((entry) => entry.sub_outcome_id);

    const suboutcomes = await SubOutcome.findAll({
        where: { id: { [Op.in]: suboutcomeIds }, status: "published" },
    });

    return api("", res, suboutcomes);
};

export const getOutcomeBarriers: RequestHandler = async (req: any, res) => {
    const uuid = req.params.uuid;
    const country_id = req.query.country_id;

    let outcome: any = await Outcome.findOne({
        where: { uuid: uuid },
        attributes: { exclude: ["updated_at", "deleted_at"] },
        include: [
            {
                as: "outcome_countries",
                model: OutcomeCountry,
                attributes: { exclude: ["sub_outcome_id", "updated_at", "deleted_at"] },
                include: ["country"],
                where: { country_id: country_id },
                required: false,
            },
        ],
    });

    const barrierOutcomes = await BarrierOutcome.findAll({
        where: { outcome_id: outcome.id },
        attributes: ["barrier_id"],
    });

    if (barrierOutcomes.length <= 0) {
        return api("Outcomes does not have any barrier", res, {});
    }

    const barrierIds = barrierOutcomes.map((entry) => entry.barrier_id);

    const outcomeBarriers = await Barrier.findAll({
        where: {
            id: { [Op.in]: barrierIds },
            status: "published",
        },
        include: [
            {
                as: "category",
                model: BarrierCategory,
                attributes: ["id", "name"],
            },
        ],
    });

    return api("", res, outcomeBarriers);
};

export const getOutcomeSolutions: RequestHandler = async (req: any, res) => {
    const uuid = req.params.uuid;
    const country_id = req.query.country_id;

    let outcome: any = await Outcome.findOne({
        where: { uuid: uuid },
        attributes: { exclude: ["updated_at", "deleted_at"] },
        include: [
            {
                as: "outcome_countries",
                model: OutcomeCountry,
                attributes: { exclude: ["sub_outcome_id", "updated_at", "deleted_at"] },
                include: ["country"],
                where: { country_id: country_id },
                required: false,
            },
        ],
    });

    const solutionOutcomes = await SolutionOutcome.findAll({
        where: { outcome_id: outcome.id },
        attributes: ["solution_id"],
    });

    if (solutionOutcomes.length <= 0) {
        return api("outcome does not have any solution", res, {});
    }

    const solutionIds = solutionOutcomes.map((entry) => entry.solution_id);

    let outcomeSolutions: any = await Solution.findAll({
        where: {
            id: { [Op.in]: solutionIds },
            status: "published",
        },
    });

    let updatedOutcomeSolutions = await Promise.all(
        outcomeSolutions?.map(async (solution: any) => {
            let categoryDetails = null;

            if (solution.categories) {
                categoryDetails = await Promise.all(
                    solution?.categories?.map(async (categoryId) => {
                        const category = await SolutionCategory.findOne({ where: { id: categoryId } });
                        return category.dataValues;
                    })
                );
            }

            solution = solution.toJSON();

            let temp = { ...solution, categories: categoryDetails };

            return temp;
        })
    );

    return api("", res, updatedOutcomeSolutions);
};

export const getOutcomeTopics: RequestHandler = async (req: any, res) => {
    const uuid = req.params.uuid;
    const country_id = req.query.country_id;

    let outcome: any = await Outcome.findOne({
        where: { uuid: uuid },
        attributes: { exclude: ["updated_at", "deleted_at"] },
        include: [
            {
                as: "outcome_countries",
                model: OutcomeCountry,
                attributes: { exclude: ["sub_outcome_id", "updated_at", "deleted_at"] },
                include: ["country"],
                where: { country_id: country_id },
                required: false,
            },
        ],
    });

    const topicOutcomes = await OutcomeTopic.findAll({
        where: { outcome_id: outcome.id },
        attributes: ["topic_id"],
    });

    if (topicOutcomes.length <= 0) {
        return api("outcome does not have any topic", res, {});
    }

    const topicIds = topicOutcomes.map((entry) => entry.topic_id);

    let outcomeTopics: any = await Topic.findAll({
        where: {
            id: { [Op.in]: topicIds },
            status: "published",
        },
    });

    return api("", res, outcomeTopics);
};

export const getOutcomeSubTopics: RequestHandler = async (req: any, res) => {
    const countryClause: any = {};
    const stateClause: any = {};

    if (req.query.country_id) {
        countryClause.country_id = req.query.country_id;
        stateClause.country_id = req.query.country_id;
    }

    if (req.query.state_id) {
        stateClause.state_id = req.query.state_id;
    }

    let outcome: any = await Outcome.findOne({
        where: { uuid: req.params.uuid },
        attributes: { exclude: ["updated_at", "deleted_at"] },
        include: [
            {
                model: SubTopic,
                as: "sub_topics",
                attributes: ["id", "uuid", "title", "logo"],
                where: { status: "published" },
                required: false,
            },
        ],
    });

    if (!outcome) {
        throw { message: "outcome not found", code: 404 };
    }

    return api("", res, outcome.sub_topics);
};
