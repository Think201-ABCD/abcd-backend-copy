import { RequestHandler } from "express";
import { v4 as uuidv4 } from "uuid";
import { Op } from "sequelize";

//Helpers
import { api, apiException } from "@redlof/libs/Helpers/helpers";
import { getCountryData, getFilteredSubTopics } from "@redlof/libs/Helpers/DataFilterHelper";
import { addMedia, deleteMedia } from "@redlof/libs/Helpers/MediaHelper";

// Models
import { SubTopic } from "@redlof/libs/Models/Topic/SubTopic";
import { TopicCountry } from "@redlof/libs/Models/Topic/TopicCountry";
import { TopicState } from "@redlof/libs/Models/Topic/TopicState";
import { SubTopicTopic } from "@redlof/libs/Models/Topic/SubTopicTopic";
import { Topic } from "@redlof/libs/Models/Topic/Topic";
import { User } from "@redlof/libs/Models/Auth/User";
import { MediaData } from "@redlof/libs/Models/Media/MediaData";
import { State } from "@redlof/libs/Models/Data/State";
import { Outcome } from "@redlof/libs/Models/Outcome/Outcome";
import { Barrier } from "@redlof/libs/Models/Barrier/Barrier";
import { Solution } from "@redlof/libs/Models/Solution/Solution";
import { Behaviour } from "@redlof/libs/Models/Behaviour/Behaviour";
import { SolutionCategory } from "@redlof/libs/Models/Solution/SolutionCategory";

export const getSubTopics: RequestHandler = async (req: any, res) => {
    const clause: any = { [Op.and]: [] };

    const andSymbol: any = Object.getOwnPropertySymbols(clause)[0];

    if (req.query.status) {
        clause.status = req.query.status;
    }

    if (req.query.search) {
        clause[andSymbol].push({
            [Op.or]: [
                { title: { [Op.iLike]: `%${req.query.search}%` } },
                { "$topics.title$": { [Op.iLike]: `%${req.query.search}%` } },
            ],
        });
    }

    // Get sub topic ids if any filters applied
    clause.id = { [Op.in]: await getFilteredSubTopics(req.query) };

    const { rows, count } = await SubTopic.findAndCountAll({
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

        for (const sub_topic of rows) {
            sub_topic.setDataValue(
                "sub_topic_country",
                await getCountryData(sub_topic.id, req.query.country_id, "sub_topics")
            );
        }

        return { rows, count };
    });

    const pages = req.query.limit ? count / Number(req.query.limit) : 1;

    return api("", res, { total: count, pages: Math.ceil(pages), data: rows });
};

export const getSubTopic: RequestHandler = async (req, res) => {
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

    let subTopic: any = await SubTopic.findOne({
        where: clause,
        attributes: { exclude: ["updated_at", "deleted_at"] },
        include: [
            {
                as: "topic_country",
                model: TopicCountry,
                attributes: { exclude: ["sub_topic_id", "updated_at", "deleted_at"] },
                where: countryClause,
                include: ["country"],
                required: false,
            },
            {
                as: "topics",
                model: Topic,
                attributes: { exclude: ["sdgs", "updated_at", "deleted_at"] },
                required: false,
                where: { status: "published" },
            },
            {
                as: "barriers",
                model: Barrier,
                attributes: ["uuid", "id", "title", "logo", "type", "status"],
                required: false,
                include: ["category"],
                where: { status: "published" },
            },
            {
                as: "outcomes",
                model: Outcome,
                attributes: ["uuid", "id", "title", "logo", "types"],
                required: false,
                where: { status: "published" },
            },
            {
                model: Solution,
                as: "solutions",
                attributes: ["uuid", "id", "title", "logo", "categories"],
                where: { status: "published" },
                required: false,
            },
            {
                model: Behaviour,
                as: "behaviours",
                attributes: ["uuid", "id", "title", "logo"],
                where: { status: "published" },
                required: false,
            },
        ],
    });

    if (!subTopic) {
        throw { message: "Sub topic not found", code: 404 };
    }

    subTopic = subTopic.toJSON();

    //fetch catrgory detail from category id

    const subtopicSolutions = subTopic.solutions;

    const updatedSubTopicSolutions = await Promise.all(
        subtopicSolutions.map(async (solution) => {
            let updatedCategories = null;

            if (solution.categories) {
                updatedCategories = await Promise.all(
                    solution.categories.map(async (categoryId) => {
                        const category = await SolutionCategory.findOne({ where: { id: categoryId } });

                        if (!category) {
                            throw { message: "Category not found", code: 422 };
                        }

                        return { id: category.id, name: category.name };
                    })
                );
            }
            return { ...solution, categories: updatedCategories };
        })
    );

    subTopic.solutions = updatedSubTopicSolutions;

    stateClause.sub_topic_id = subTopic.id;

    // Attach country and state data
    for (const topic_country of subTopic.topic_country) {
        topic_country.media = await MediaData.findAll({
            where: { entity: "topic_countries", entity_id: topic_country.id },
        });

        topic_country.topic_states = await TopicState.findAll({
            attributes: { exclude: ["updated_at", "deleted_at"] },
            where: stateClause,
            include: ["state"],
        }).then(async (subTopicStates: any) => {
            if (subTopicStates.length <= 0) {
                return subTopicStates;
            }

            for (const subTopicState of subTopicStates) {
                subTopicState.setDataValue(
                    "media",
                    await MediaData.findAll({ where: { entity: "topic_states", entity_id: subTopicState.id } })
                );
            }

            return subTopicStates;
        });
    }

    return api("Sub topic fetched successfully", res, subTopic);
};

export const postSubTopic: RequestHandler = async (req, res) => {
    const subTopic: any = req.body.uuid
        ? await SubTopic.findOne({ where: { uuid: req.body.uuid } })
        : new SubTopic({ uuid: uuidv4(), added_by: res.locals.user.id, status: "draft" });

    if (!subTopic) {
        throw { message: "Topic not found", code: 404 };
    }

    subTopic.title = req.body.title ? req.body.title : subTopic.title;
    subTopic.logo = req.body.logo ? req.body.logo : subTopic.getDataValue("logo");
    subTopic.status = req.body.status ? req.body.status : subTopic.status;

    await subTopic.save();

    // Add sub topic country
    if (req.body.country_ids) {
        const topicCountry = await TopicCountry.findAll({ where: { sub_topic_id: subTopic.id } });

        const all_country_ids = topicCountry.map((t: any) => parseInt(t.country_id));

        // A - B
        const subTopicCountryToBeDeleted = all_country_ids.filter((t: any) => !req.body.country_ids.includes(t));

        // B - A
        const subTopicCountryToBeAdded = req.body.country_ids.filter((t: any) => !all_country_ids.includes(t));

        await TopicCountry.destroy({
            where: { country_id: { [Op.in]: subTopicCountryToBeDeleted }, sub_topic_id: subTopic.id },
        });

        const subTopicCountryCreate: any = [];
        for (const id of subTopicCountryToBeAdded) {
            subTopicCountryCreate.push({ sub_topic_id: subTopic.id, country_id: id });
        }

        await TopicCountry.bulkCreate(subTopicCountryCreate);
    }

    // Map sub topic to topics
    if (req.body.topic_ids) {
        const mapTopicsToBeAdded: any = req.body.topic_ids.map((t_id: any) => {
            return { topic_id: t_id, sub_topic_id: subTopic.id };
        });

        // Delete the old mapping
        await SubTopicTopic.destroy({ where: { sub_topic_id: subTopic.id } });

        // Update the mapping
        await SubTopicTopic.bulkCreate(mapTopicsToBeAdded);
    }

    return api("Sub Topic details saved successfully", res, subTopic);
};

export const putSubTopicCountry: RequestHandler = async (req, res) => {
    const subTopic: any = await SubTopic.findOne({ where: { uuid: req.params.uuid } });

    if (!subTopic) {
        throw { message: "Sub topic not found", code: 404 };
    }

    for (const subTopicCountryObj of req.body.topic_country) {
        let subTopicCountry: any = await TopicCountry.findOne({
            where: { sub_topic_id: subTopic.id, country_id: subTopicCountryObj.country_id },
        });

        if (!subTopicCountry) {
            subTopicCountry = new TopicCountry({
                sub_topic_id: subTopic.id,
                country_id: subTopicCountryObj.country_id,
            });
        }

        subTopicCountry.brief = subTopicCountryObj.brief ? subTopicCountryObj.brief : subTopicCountry.brief;
        subTopicCountry.description = subTopicCountryObj.description
            ? subTopicCountryObj.description
            : subTopicCountry.description;
        subTopicCountry.banner = subTopicCountryObj.banner
            ? subTopicCountryObj.banner
            : subTopicCountry.getDataValue("banner");

        await subTopicCountry.save();

        // Country media
        if (subTopicCountryObj.media && subTopicCountryObj.media.length > 0) {
            await addMedia("topic_countries", subTopicCountry.id, subTopicCountryObj.media);
        }

        if (subTopicCountryObj.media == null || subTopicCountryObj.media == "null") {
            await deleteMedia("topic_countries", [subTopicCountry.id]);
        }
    }

    // Delete the countries that are no longer mapped
    if (req.body.deleted_countries && req.body.deleted_countries.length > 0) {
        const entity_ids = [
            ...(await TopicCountry.findAll({
                where: { sub_topic_id: subTopic.id, country_id: { [Op.in]: req.body.deleted_countries } },
            })),
        ].map((t: any) => parseInt(t.id));

        await deleteMedia("topic_countries", entity_ids);

        await TopicCountry.destroy({ where: { id: entity_ids } });
    }

    return api("Country specific details saved to sub topic successfully", res, {});
};

export const putSubTopicState: RequestHandler = async (req, res) => {
    const subTopic: any = await SubTopic.findOne({ where: { uuid: req.params.uuid } });

    if (!subTopic) {
        throw { message: "Sub topic not found", code: 404 };
    }

    for (const subTopicStateObj of req.body.topic_state) {
        let subTopicState: any = await TopicState.findOne({
            where: { sub_topic_id: subTopic.id, state_id: subTopicStateObj.state_id },
        });

        if (!subTopicState) {
            subTopicState = new TopicState({ sub_topic_id: subTopic.id, state_id: subTopicStateObj.state_id });
        }

        const state: any = await State.findByPk(subTopicState.state_id);

        subTopicState.description = subTopicStateObj.description
            ? subTopicStateObj.description
            : subTopicState.description;
        subTopicState.brief = subTopicStateObj.brief ? subTopicStateObj.brief : subTopicState.brief;
        subTopicState.banner = subTopicStateObj.banner ? subTopicStateObj.banner : subTopicState.getDataValue("banner");
        subTopicState.country_id = state.country_id;
        await subTopicState.save();

        // State media
        if (subTopicStateObj.media && subTopicStateObj.media.length > 0) {
            await addMedia("topic_states", subTopicState.id, subTopicStateObj.media);
        }

        if (subTopicStateObj.media == null || subTopicStateObj.media == "null") {
            await deleteMedia("topic_states", [subTopicState.id]);
        }
    }

    // Delete the states that are no longer mapped
    if (req.body.deleted_states && req.body.deleted_states.length > 0) {
        const entity_ids = [
            ...(await TopicState.findAll({
                where: { sub_topic_id: subTopic.id, state_id: { [Op.in]: req.body.deleted_states } },
            })),
        ].map((t: any) => t.id);

        await deleteMedia("topic_states", entity_ids);

        await TopicState.destroy({ where: { id: entity_ids } });
    }

    return api("State specific details saved to sub topic successfully", res, {});
};

export const putSubTopicStatus: RequestHandler = async (req, res) => {
    const subTopic: any = await SubTopic.findOne({ where: { uuid: req.params.uuid } });

    if (!subTopic) {
        throw { message: "Sub topic not found", code: 404 };
    }

    if (subTopic.status != "published" && req.body.status == "unpublished") {
        throw { message: "Action not allowed. Sub topic is not published yet", code: 422 };
    }

    const mes =
        req.body.status == "published" ? "Sub topic published successfully" : "Sub topic unpublished successfully";

    subTopic.status = req.body.status;
    await subTopic.save();

    return api(mes, res, {});
};
