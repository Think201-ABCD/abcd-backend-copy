import { RequestHandler } from "express";
import { v4 as uuidv4 } from "uuid";
import { Op } from "sequelize";

//Helpers
import { api, apiException } from "@redlof/libs/Helpers/helpers";
import { addMedia, deleteMedia } from "@redlof/libs/Helpers/MediaHelper";
import { getCountryData, getFilteredSubOutcomes } from "@redlof/libs/Helpers/DataFilterHelper";

// Models
import { SubOutcome } from "@redlof/libs/Models/Outcome/SubOutcome";
import { OutcomeState } from "@redlof/libs/Models/Outcome/OutcomeState";
import { OutcomeCountry } from "@redlof/libs/Models/Outcome/OutcomeCountry";
import { OutcomeTopic } from "@redlof/libs/Models/Outcome/OutcomeTopic";
import { SubOutcomeOutcome } from "@redlof/libs/Models/Outcome/SubOutcomeOutcome";
import { MediaData } from "@redlof/libs/Models/Media/MediaData";
import { State } from "@redlof/libs/Models/Data/State";
import { User } from "@redlof/libs/Models/Auth/User";
import { Outcome } from "@redlof/libs/Models/Outcome/Outcome";
import { Topic } from "@redlof/libs/Models/Topic/Topic";
import { SubTopic } from "@redlof/libs/Models/Topic/SubTopic";
import { Barrier } from "@redlof/libs/Models/Barrier/Barrier";
import { Solution } from "@redlof/libs/Models/Solution/Solution";
import { SubTopicTopic } from "@redlof/libs/Models/Topic/SubTopicTopic";

export const getSubOutcomes: RequestHandler = async (req: any, res) => {
    const clause: any = { [Op.and]: [] };

    const andSymbol: any = Object.getOwnPropertySymbols(clause)[0];

    if (req.query.status) {
        clause.status = req.query.status;
    }

    if (req.query.search) {
        clause[andSymbol].push({
            [Op.or]: [
                { title: { [Op.iLike]: `%${req.query.search}%` } },
                { "$outcomes.title$": { [Op.iLike]: `%${req.query.search}%` } },
            ],
        });
    }

    // Get topic ids if any filters applied
    clause.id = { [Op.in]: await getFilteredSubOutcomes(req.query) };

    const { rows, count } = await SubOutcome.findAndCountAll({
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

        for (const sub_outcome of rows) {
            sub_outcome.setDataValue(
                "sub_outcome_country",
                await getCountryData(sub_outcome.id, req.query.country_id, "sub_outcomes")
            );
        }

        return { rows, count };
    });

    const pages = req.query.limit ? count / Number(req.query.limit) : 1;

    return api("", res, { total: count, pages: Math.ceil(pages), data: rows });
};

export const getSubOutcome: RequestHandler = async (req, res) => {
    const stateClause: any = {};

    const countryClause: any = {};

    const clause: any = { uuid: req.params.uuid };

    if (req.query.country_id) {
        stateClause.country_id = req.query.country_id;
        countryClause.country_id = req.query.country_id;
    }

    if (req.query.state_id) {
        stateClause.state_id = req.query.state_id;
    }

    let subOutcome: any = await SubOutcome.findOne({
        where: clause,
        attributes: { exclude: ["updated_at", "deleted_at"] },
        include: [
            {
                as: "outcome_countries",
                model: OutcomeCountry,
                attributes: { exclude: ["outcome_id", "updated_at", "deleted_at"] },
                where: countryClause,
                include: ["country"],
                required: false,
            },
            {
                as: "outcomes",
                model: Outcome,
                attributes: ["uuid", "id", "title", "status", "logo"],
                required: false,
            },
            {
                model: Topic,
                as: "topics",
                attributes: ["uuid", "id", "title", "logo"],
                where: { status: "published" },
                through: { where: { deleted_at: null } },
                required: false,
            },
            {
                model: SubTopic,
                as: "sub_topics",
                attributes: ["uuid", "id", "title", "logo"],
                where: { status: "published" },
                through: { where: { deleted_at: null } },
                required: false,
            },
            {
                model: Barrier,
                as: "barriers",
                attributes: ["uuid", "id", "title", "logo"],
                where: { status: "published" },
                required: false,
            },
            {
                model: Solution,
                as: "solutions",
                attributes: ["uuid", "id", "title", "logo"],
                where: { status: "published" },
                required: false,
            },
        ],
    });

    if (!subOutcome) {
        throw { message: "Sub outcome not found", code: 404 };
    }

    subOutcome = subOutcome.toJSON();
    stateClause.sub_outcome_id = subOutcome.id;

    // Attach country and state data
    for (const outcome_country of subOutcome.outcome_countries) {
        outcome_country.media = await MediaData.findAll({
            where: { entity: "outcome_countries", entity_id: outcome_country.id },
        });

        outcome_country.outcome_states = await OutcomeState.findAll({
            attributes: { exclude: ["updated_at", "deleted_at"] },
            where: stateClause,
            include: ["state"],
        }).then(async (outcomeStates: any) => {
            if (outcomeStates.length <= 0) {
                return outcomeStates;
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

    return api("", res, subOutcome);
};

export const postSubOutcome: RequestHandler = async (req, res) => {
    const subOutCome: any = req.body.uuid
        ? await SubOutcome.findOne({ where: { uuid: req.body.uuid } })
        : new SubOutcome({ uuid: uuidv4(), added_by: res.locals.user.id, status: "draft" });

    if (!subOutCome) {
        throw { message: "Sub Outcome not found", code: 404 };
    }

    // Add primary details
    subOutCome.title = req.body.title ? req.body.title : subOutCome.title;
    subOutCome.expiry = req.body.expiry ? req.body.expiry : subOutCome.expiry;
    subOutCome.logo = req.body.logo ? req.body.logo : subOutCome.getDataValue("logo");
    await subOutCome.save();

    // Outcome country
    if (req.body.country_ids) {
        const all_country_ids = [...(await OutcomeCountry.findAll({ where: { sub_outcome_id: subOutCome.id } }))].map(
            (t: any) => parseInt(t.country_id)
        );

        const subOutcomeCountryToBeDeleted = all_country_ids.filter((t: any) => !req.body.country_ids.includes(t));

        const subOutcomeCountryToBeAdded = req.body.country_ids.filter((t: any) => !all_country_ids.includes(t));

        await OutcomeCountry.destroy({
            where: { country_id: { [Op.in]: subOutcomeCountryToBeDeleted }, sub_outcome_id: subOutCome.id },
        });

        const subOutcomeCountryCreate: any = [];

        for (const id of subOutcomeCountryToBeAdded) {
            subOutcomeCountryCreate.push({ sub_outcome_id: subOutCome.id, country_id: id });
        }

        await OutcomeCountry.bulkCreate(subOutcomeCountryCreate);
    }

    // Map sub outcome to topic
    if (req.body.topic_ids) {
        const all_topic_ids = [
            ...(await OutcomeTopic.findAll({
                where: { sub_outcome_id: subOutCome.id, topic_id: { [Op.ne]: null } },
            })),
        ].map((t: any) => parseInt(t.topic_id));

        const subOutcomeTopicToBeDeleted = all_topic_ids.filter((t: any) => !req.body.topic_ids.includes(t));

        const subOutcomeTopicToBeAdded = req.body.topic_ids.filter((t: any) => !all_topic_ids.includes(t));

        // determine sub topics of the topics

        const subtopics = await SubTopicTopic.findAll({ where: { topic_id: { [Op.in]: subOutcomeTopicToBeDeleted } } });

        const subOutcomeSubtopicsToBeDeleted = subtopics.map((entry) => entry.sub_topic_id);

        await OutcomeTopic.destroy({
            where: { topic_id: { [Op.in]: subOutcomeTopicToBeDeleted }, sub_outcome_id: subOutCome.id },
        });

        await OutcomeTopic.destroy({
            where: { sub_topic_id: { [Op.in]: subOutcomeSubtopicsToBeDeleted }, sub_outcome_id: subOutCome.id },
        });

        const subOutcomeTopicCreate: any = [];

        for (const id of subOutcomeTopicToBeAdded) {
            subOutcomeTopicCreate.push({ sub_outcome_id: subOutCome.id, topic_id: id });
        }

        await OutcomeTopic.bulkCreate(subOutcomeTopicCreate);
    }

    // Map sub outcome to sub topics
    if (req.body.sub_topic_ids) {
        const all_sub_topic_ids = [
            ...(await OutcomeTopic.findAll({
                where: { sub_outcome_id: subOutCome.id, sub_topic_id: { [Op.ne]: null } },
            })),
        ].map((t: any) => parseInt(t.sub_topic_id));

        const subOoutcomeSubTopicToBeDeleted = all_sub_topic_ids.filter(
            (t: any) => !req.body.sub_topic_ids.includes(t)
        );

        const subOutcomeSubTopicToBeAdded = req.body.sub_topic_ids.filter((t: any) => !all_sub_topic_ids.includes(t));

        await OutcomeTopic.destroy({
            where: { sub_topic_id: { [Op.in]: subOoutcomeSubTopicToBeDeleted }, sub_outcome_id: subOutCome.id },
        });

        const subOutcomeSubTopicCreate: any = [];

        for (const id of subOutcomeSubTopicToBeAdded) {
            subOutcomeSubTopicCreate.push({ sub_outcome_id: subOutCome.id, sub_topic_id: id });
        }

        await OutcomeTopic.bulkCreate(subOutcomeSubTopicCreate);
    }

    // Map sub outcomes to outcomes
    if (req.body.outcome_ids) {
        const mapOutcomesToBeAdded: any = req.body.outcome_ids.map((out_id: any) => {
            return { outcome_id: out_id, sub_outcome_id: subOutCome.id };
        });

        // Delete the old mapping
        await SubOutcomeOutcome.destroy({ where: { sub_outcome_id: subOutCome.id } });

        // Update the mapping
        await SubOutcomeOutcome.bulkCreate(mapOutcomesToBeAdded);
    }

    return api("Sub Outcome details saved successfully", res, subOutCome);
};

export const putSubOutcomeCountry: RequestHandler = async (req, res) => {
    const subOutcome: any = await SubOutcome.findOne({ where: { uuid: req.params.uuid } });

    if (!subOutcome) {
        throw { message: "Sub outcome not found", code: 404 };
    }

    for (const subOutcomeCountryObj of req.body.outcome_countries) {
        let subOutcomeCountry: any = await OutcomeCountry.findOne({
            where: { sub_outcome_id: subOutcome.id, country_id: subOutcomeCountryObj.country_id },
        });

        if (!subOutcomeCountry) {
            subOutcomeCountry = new OutcomeCountry({
                sub_outcome_id: subOutcome.id,
                country_id: subOutcomeCountryObj.country_id,
            });
        }

        subOutcomeCountry.brief = subOutcomeCountryObj.brief ? subOutcomeCountryObj.brief : subOutcomeCountry.brief;
        subOutcomeCountry.description = subOutcomeCountryObj.description
            ? subOutcomeCountryObj.description
            : subOutcomeCountry.description;
        subOutcomeCountry.banner = subOutcomeCountryObj.banner
            ? subOutcomeCountryObj.banner
            : subOutcomeCountry.getDataValue("banner");
        await subOutcomeCountry.save();

        // Country media
        if (subOutcomeCountryObj.media && subOutcomeCountryObj.media.length > 0) {
            await addMedia("outcome_countries", subOutcomeCountry.id, subOutcomeCountryObj.media);
        }

        if (subOutcomeCountryObj.media == null || subOutcomeCountryObj.media == "null") {
            await deleteMedia("outcome_countries", [subOutcomeCountry.id]);
        }
    }

    // Delete the countries that are no longer mapped
    if (req.body.deleted_countries && req.body.deleted_countries.length > 0) {
        const entity_ids = [
            ...(await OutcomeCountry.findAll({
                where: { sub_outcome_id: subOutcome.id, country_id: { [Op.in]: req.body.deleted_countries } },
            })),
        ].map((t: any) => parseInt(t.id));

        await deleteMedia("outcome_countries", entity_ids);

        await OutcomeCountry.destroy({ where: { id: entity_ids } });
    }

    return api("Country details for the sub outcome saved successfully", res, {});
};

export const putSubOutcomeState: RequestHandler = async (req, res) => {
    const subOutcome: any = await SubOutcome.findOne({ where: { uuid: req.params.uuid } });

    if (!subOutcome) {
        throw { message: "Sub Outcome not found", code: 404 };
    }

    for (const subOutcomeStateObj of req.body.outcome_states) {
        let subOutcomeState: any = await OutcomeState.findOne({
            where: { sub_outcome_id: subOutcome.id, state_id: subOutcomeStateObj.state_id },
        });

        if (!subOutcomeState) {
            subOutcomeState = new OutcomeState({
                sub_outcome_id: subOutcome.id,
                state_id: subOutcomeStateObj.state_id,
            });
        }

        const state: any = await State.findByPk(subOutcomeStateObj.state_id);

        subOutcomeState.description = subOutcomeStateObj.description
            ? subOutcomeStateObj.description
            : subOutcomeState.description;
        subOutcomeState.brief = subOutcomeStateObj.brief ? subOutcomeStateObj.brief : subOutcomeState.brief;
        subOutcomeState.banner = subOutcomeStateObj.banner
            ? subOutcomeStateObj.banner
            : subOutcomeState.getDataValue("banner");
        subOutcomeState.country_id = state.country_id;

        await subOutcomeState.save();

        // State media
        if (subOutcomeStateObj.media && subOutcomeStateObj.media.length > 0) {
            await addMedia("outcome_states", subOutcomeState.id, subOutcomeStateObj.media);
        }

        if (subOutcomeStateObj.media == null || subOutcomeStateObj.media == "null") {
            await deleteMedia("outcome_states", [subOutcomeState.id]);
        }
    }

    // Delete the states that are no longer mapped
    if (req.body.deleted_states && req.body.deleted_states.length > 0) {
        const entity_ids = [
            ...(await OutcomeState.findAll({
                where: { sub_outcome_id: subOutcome.id, state_id: { [Op.in]: req.body.deleted_states } },
            })),
        ].map((t: any) => parseInt(t.id));

        await deleteMedia("outcome_states", entity_ids);

        await OutcomeState.destroy({ where: { id: entity_ids } });
    }

    return api("State details for the sub outcome saved successfully", res, {});
};

export const putSubOutcomeStatus: RequestHandler = async (req, res) => {
    const subOutcome: any = await SubOutcome.findOne({ where: { uuid: req.params.uuid } });

    if (!subOutcome) {
        throw { message: "Sub outcome not found", code: 404 };
    }

    if (subOutcome.status != "published" && req.body.status == "unpublished") {
        throw { message: "Action not allowed. Sub outcome is not published yet", code: 422 };
    }

    const mes =
        req.body.status == "published" ? "Sub outcome published successfully" : "Sub outcome unpublished successfully";

    subOutcome.status = req.body.status;
    await subOutcome.save();

    return api(mes, res, {});
};
