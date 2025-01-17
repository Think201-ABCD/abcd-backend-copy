import { RequestHandler } from "express";
import { v4 as uuidv4 } from "uuid";
import { Op } from "sequelize";

//Helpers
import { api, apiException } from "@redlof/libs/Helpers/helpers";
import { getCountryData, getFilteredTopics, getFilteredSubTopics } from "@redlof/libs/Helpers/DataFilterHelper";
import { addMedia, deleteMedia } from "@redlof/libs/Helpers/MediaHelper";

// Models
import { Topic } from "@redlof/libs/Models/Topic/Topic";
import { TopicCountry } from "@redlof/libs/Models/Topic/TopicCountry";
import { TopicState } from "@redlof/libs/Models/Topic/TopicState";
import { User } from "@redlof/libs/Models/Auth/User";
import { SubTopic } from "@redlof/libs/Models/Topic/SubTopic";
import { MediaData } from "@redlof/libs/Models/Media/MediaData";
import { Sdgs } from "@redlof/libs/Models/Data/Sdgs";
import { State } from "@redlof/libs/Models/Data/State";
import { Outcome } from "@redlof/libs/Models/Outcome/Outcome";
import { Barrier } from "@redlof/libs/Models/Barrier/Barrier";
import { Solution } from "@redlof/libs/Models/Solution/Solution";
import { SubTopicTopic } from "@redlof/libs/Models/Topic/SubTopicTopic";
import { Behaviour } from "@redlof/libs/Models/Behaviour/Behaviour";
import { BarrierTopic } from "@redlof/libs/Models/Barrier/BarrierTopic";
import { OutcomeTopic } from "@redlof/libs/Models/Outcome/OutcomeTopic";
import { SolutionTopic } from "@redlof/libs/Models/Solution/SolutionTopic";
import { BehaviourTopic } from "@redlof/libs/Models/Behaviour/BehaviourTopic";
import { SolutionCategory } from "@redlof/libs/Models/Solution/SolutionCategory";
import { BarrierCategory } from "@redlof/libs/Models/Barrier/BarrierCategory";

export const getTopics: RequestHandler = async (req: any, res) => {
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
    clause.id = { [Op.in]: await getFilteredTopics(req.query) };

    const { rows, count } = await Topic.findAndCountAll({
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

        for (const topic of rows) {
            topic.setDataValue("topic_country", await getCountryData(topic.id, req.query.country_id, "topics"));

            // Get all the sub-topics for a topic
            topic.setDataValue("sub_topics", []);

            const subTopicIds = await getFilteredSubTopics({ topic_ids: [topic.id] });

            if (subTopicIds.length <= 0) {
                continue;
            }

            await SubTopic.findAll({ where: { id: { [Op.in]: subTopicIds }, status: "published" } }).then(
                async (subTopics: any) => {
                    for (const subTopic of subTopics) {
                        subTopic.setDataValue(
                            "sub_topic_country",
                            await getCountryData(subTopic.id, req.query.country_id, "sub_topics")
                        );
                    }

                    topic.setDataValue("sub_topics", subTopics);
                }
            );
        }

        return { rows, count };
    });

    const pages = req.query.limit ? count / Number(req.query.limit) : 1;

    return api("Topics fetched successfully", res, { total: count, pages: Math.ceil(pages), data: rows });
};

export const getTopic: RequestHandler = async (req: any, res) => {
    const stateClause: any = {};

    const clause: any = { uuid: req.params.uuid };

    if (req.query.country_id) {
        stateClause.country_id = req.query.country_id;
    }

    let topic: any = await Topic.findOne({
        where: clause,
        attributes: { exclude: ["updated_at", "deleted_at"] },
        include: [
            {
                as: "created_by",
                model: User,
                attributes: ["uuid", "first_name", "last_name", "photo"],
                required: false,
            },
            {
                as: "topic_country",
                model: TopicCountry,
                attributes: { exclude: ["sub_topic_id", "updated_at", "deleted_at"] },
                include: ["country"],
                where: stateClause,
                required: false,
            },
            {
                as: "sub_topics",
                model: SubTopic,
                attributes: ["uuid", "id", "logo", "title", "status"],
                required: false,
                where: { status: "published" },
            },
            {
                as: "barriers",
                model: Barrier,
                attributes: ["uuid", "id", "title", "logo", "type", "status"],
                where: { status: "published" },
                required: false,
            },
            {
                as: "outcomes",
                model: Outcome,
                attributes: ["uuid", "id", "title", "logo", "types"],
                where: { status: "published" },
                required: false,
            },
            {
                as: "solutions",
                model: Solution,
                attributes: ["uuid", "id", "title", "logo"],
                where: { status: "published" },
                required: false,
            },
            {
                as: "behaviours",
                model: Behaviour,
                attributes: ["uuid", "id", "title", "logo"],
                where: { status: "published" },
                required: false,
            },
        ],
    });

    if (!topic) {
        throw { message: "Topic not found", code: 404 };
    }

    topic = topic.toJSON();

    if (req.query.state_id) {
        stateClause.state_id = req.query.state_id;
    }

    stateClause.topic_id = topic.id;

    // Attach states data
    for (const topic_country of topic.topic_country) {
        topic_country.topic_states = await TopicState.findAll({
            attributes: { exclude: ["updated_at", "deleted_at"] },
            where: stateClause,
            include: ["state"],
        });

        topic_country.media = await MediaData.findAll({
            where: { entity: "topic_countries", entity_id: topic_country.id },
        });

        // Attach state media data
        for (const topic_state of topic_country.topic_states) {
            topic_state.setDataValue(
                "media",
                await MediaData.findAll({ where: { entity: "topic_states", entity_id: topic_state.id } })
            );
        }
    }

    // Attach sdgs
    topic.sdgs = await Sdgs.findAll({ where: { id: { [Op.in]: topic.sdgs } } });

    return api("Topic fetched successfully", res, topic);
};

export const getTopicDetails: RequestHandler = async (req, res) => {
    const uuid = req.params.uuid;
    const query: any = {};
    const countryQuery: any = {};

    if (req.query.country_id) {
        countryQuery.country_id = req.query.country_id;
    }

    let topic: any = await Topic.findOne({
        where: { uuid: uuid },
        attributes: { exclude: ["updated_at", "deleted_at"] },
        include: [
            {
                as: "created_by",
                model: User,
                attributes: ["uuid", "first_name", "last_name", "photo"],
                required: false,
            },
            {
                as: "topic_country",
                model: TopicCountry,
                attributes: { exclude: ["sub_topic_id", "updated_at", "deleted_at"] },
                include: ["country"],
                where: countryQuery,
                required: false,
            },
        ],
    });

    if (!topic) {
        throw { message: "Topic not found", code: 422 };
    }

    topic = topic.toJSON();

    if (req.query.state_id) {
        query.state_id = req.query.state_id;
    }

    query.topic_id = topic.id;

    for (const topic_country of topic.topic_country) {
        topic_country.topic_states = await TopicState.findAll({
            attributes: { exclude: ["updated_at", "deleted_at"] },
            where: query,
            include: ["state"],
        });

        topic_country.media = await MediaData.findAll({
            where: { entity: "topic_countries", entity_id: topic_country.id },
        });

        // Attach state media data
        for (const topic_state of topic_country.topic_states) {
            topic_state.setDataValue(
                "media",
                await MediaData.findAll({ where: { entity: "topic_states", entity_id: topic_state.id } })
            );
        }
    }

    const sdgs = await Sdgs.findAll({ where: { id: { [Op.in]: topic.sdgs } } });

    topic.sdgs = sdgs;

    return api("Topic detail fetched successfully", res, topic);
};

export const getTopicSubTopics: RequestHandler = async (req, res) => {
    const uuid = req.params.uuid;
    const countryQuery: any = {};

    if (req.query.country_id) {
        countryQuery.country_id = req.query.country_id;
    }

    let topic: any = await Topic.findOne({
        where: { uuid: uuid },
        attributes: { exclude: ["updated_at", "deleted_at"] },
        include: [
            {
                as: "topic_country",
                model: TopicCountry,
                attributes: { exclude: ["sub_topic_id", "updated_at", "deleted_at"] },
                include: ["country"],
                where: countryQuery,
                required: false,
            },
        ],
    });

    if (!topic) {
        throw { message: "Topic not found", code: 422 };
    }

    const subTopicTopics = await SubTopicTopic.findAll({
        where: { topic_id: topic.id },
        attributes: ["sub_topic_id"],
    });

    if (subTopicTopics.length <= 0) {
        return api("Topic does not have any subtopic", res, {});
    }

    const subtopicIds = subTopicTopics.map((entry) => entry.sub_topic_id);

    const subtopics = await SubTopic.findAll({ where: { id: { [Op.in]: subtopicIds }, status: "published" } });

    return api("Topic sub topics fetched successfully", res, subtopics);
};

export const getTopicBarriers: RequestHandler = async (req, res) => {
    const uuid = req.params.uuid;
    const countryQuery: any = {};

    if (req.query.country_id) {
        countryQuery.country_id = req.query.country_id;
    }

    let topic: any = await Topic.findOne({
        where: { uuid: uuid },
        attributes: { exclude: ["updated_at", "deleted_at"] },
        include: [
            {
                as: "topic_country",
                model: TopicCountry,
                attributes: { exclude: ["sub_topic_id", "updated_at", "deleted_at"] },
                include: ["country"],
                where: countryQuery,
                required: false,
            },
        ],
    });

    if (!topic) {
        throw { message: "Topic not found", code: 422 };
    }

    const barrierTopics = await BarrierTopic.findAll({ where: { topic_id: topic.id }, attributes: ["barrier_id"] });

    if (barrierTopics.length <= 0) {
        return api("Topic does not have any barrier", res, {});
    }

    const barrierIds = barrierTopics.map((entry) => entry.barrier_id);

    // const topicBarriers = await Barrier.findAll({ where: { id: { [Op.in]: barrierIds }, status: "published" } });

    const topicBarriers = await Barrier.findAll({
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

    return api("Topic barriers fetched successfully", res, topicBarriers);
};

export const getTopicOutcomes: RequestHandler = async (req, res) => {
    const uuid = req.params.uuid;
    const countryQuery: any = {};

    if (req.query.country_id) {
        countryQuery.country_id = req.query.country_id;
    }

    let topic: any = await Topic.findOne({
        where: { uuid: uuid },
        attributes: { exclude: ["updated_at", "deleted_at"] },
        include: [
            {
                as: "topic_country",
                model: TopicCountry,
                attributes: { exclude: ["sub_topic_id", "updated_at", "deleted_at"] },
                include: ["country"],
                where: countryQuery,
                required: false,
            },
        ],
    });

    if (!topic) {
        throw { message: "Topic not found", code: 422 };
    }

    const outcomeTopics = await OutcomeTopic.findAll({ where: { topic_id: topic.id }, attributes: ["outcome_id"] });

    if (outcomeTopics.length <= 0) {
        return api("Topic does not have any outcome", res, {});
    }

    const outcomeIds = outcomeTopics.map((entry) => entry.outcome_id);

    const topicOutcomes = await Outcome.findAll({ where: { id: { [Op.in]: outcomeIds }, status: "published" } });

    return api("Topic outcomes fetched successfully", res, topicOutcomes);
};

export const getTopicSolutions: RequestHandler = async (req, res) => {
    const uuid = req.params.uuid;
    const countryQuery: any = {};

    if (req.query.country_id) {
        countryQuery.country_id = req.query.country_id;
    }

    let topic: any = await Topic.findOne({
        where: { uuid: uuid },
        attributes: { exclude: ["updated_at", "deleted_at"] },
        include: [
            {
                as: "topic_country",
                model: TopicCountry,
                attributes: { exclude: ["sub_topic_id", "updated_at", "deleted_at"] },
                include: ["country"],
                where: countryQuery,
                required: false,
            },
        ],
    });

    if (!topic) {
        throw { message: "Topic not found", code: 422 };
    }

    const solutionTopics = await SolutionTopic.findAll({
        where: { topic_id: topic.id },
        attributes: ["solution_id"],
    });

    if (solutionTopics.length <= 0) {
        return api("Topic does not have any solution", res, {});
    }

    const solutionIds = solutionTopics.map((entry) => entry.solution_id);

    const topicSolutions = await Solution.findAll({ where: { id: { [Op.in]: solutionIds }, status: "published" } });

    let updatedTopicSolutions = await Promise.all(
        topicSolutions?.map(async (solution: any) => {
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

    return api("Topic solutions fetched successfully", res, updatedTopicSolutions);
};

export const getTopicBehaviours: RequestHandler = async (req, res) => {
    const uuid = req.params.uuid;
    const countryQuery: any = {};

    if (req.query.country_id) {
        countryQuery.country_id = req.query.country_id;
    }

    let topic: any = await Topic.findOne({
        where: { uuid: uuid },
        attributes: { exclude: ["updated_at", "deleted_at"] },
        include: [
            {
                as: "topic_country",
                model: TopicCountry,
                attributes: { exclude: ["sub_topic_id", "updated_at", "deleted_at"] },
                include: ["country"],
                where: countryQuery,
                required: false,
            },
        ],
    });

    if (!topic) {
        throw { message: "Topic not found", code: 422 };
    }

    const behaviourTopics = await BehaviourTopic.findAll({
        where: { topic_id: topic.id },
        attributes: ["behaviour_id"],
    });

    if (behaviourTopics.length <= 0) {
        return api("Topic does not have any behaviour", res, {});
    }

    const behaviourIds = behaviourTopics.map((entry) => entry.behaviour_id);

    const topicBehaviours = await Behaviour.findAll({
        where: { id: { [Op.in]: behaviourIds }, status: "published" },
    });

    return api("Topic behaviours fetched successfully", res, topicBehaviours);
};

export const postTopic: RequestHandler = async (req, res) => {
    const topic: any = req.body.uuid
        ? await Topic.findOne({ where: { uuid: req.body.uuid } })
        : new Topic({ uuid: uuidv4(), added_by: res.locals.user.id, status: "draft" });

    if (!topic) {
        throw { message: "Topic not found", code: 404 };
    }

    // Add primary details
    topic.title = req.body.title ? req.body.title : topic.title;
    topic.sdgs = req.body.sdgs ? req.body.sdgs : topic.sdgs;
    topic.logo = req.body.logo ? req.body.logo : topic.getDataValue("logo");

    await topic.save();

    // Add topic country
    if (req.body.country_ids) {
        const all_country_ids = [...(await TopicCountry.findAll({ where: { topic_id: topic.id } }))].map((t: any) =>
            parseInt(t.country_id)
        );

        const topicCountryToBeDeleted = all_country_ids.filter((t: any) => !req.body.country_ids.includes(t));

        const topicCountryToBeAdded = req.body.country_ids.filter((t: any) => !all_country_ids.includes(t));

        await TopicCountry.destroy({
            where: { country_id: { [Op.in]: topicCountryToBeDeleted }, topic_id: topic.id },
        });

        const topicCountryCreate: any = [];

        for (const id of topicCountryToBeAdded) {
            topicCountryCreate.push({ topic_id: topic.id, country_id: id });
        }

        await TopicCountry.bulkCreate(topicCountryCreate);
    }

    return api("Topic details saved successfully", res, topic);
};

export const putTopicCountry: RequestHandler = async (req, res) => {
    const topic: any = await Topic.findOne({ where: { uuid: req.params.uuid } });

    if (!topic) {
        throw { message: "Topic not found", code: 404 };
    }

    for (const topicCountryObj of req.body.topic_country) {
        let topicCountry: any = await TopicCountry.findOne({
            where: { topic_id: topic.id, country_id: topicCountryObj.country_id },
        });

        if (!topicCountry) {
            topicCountry = new TopicCountry({ topic_id: topic.id, country_id: topicCountryObj.country_id });
        }

        topicCountry.brief = topicCountryObj.brief ? topicCountryObj.brief : topicCountry.brief;
        topicCountry.description = topicCountryObj.description ? topicCountryObj.description : topicCountry.description;
        topicCountry.banner = topicCountryObj.banner ? topicCountryObj.banner : topicCountry.getDataValue("banner");

        await topicCountry.save();

        // Country media
        if (topicCountryObj.media && topicCountryObj.media.length > 0) {
            await addMedia("topic_countries", topicCountry.id, topicCountryObj.media);
        }

        if (topicCountryObj.media == null || topicCountryObj.media == "null") {
            await deleteMedia("topic_countries", [topicCountry.id]);
        }
    }

    // Delete the countries that are no longer mapped
    if (req.body.deleted_countries && req.body.deleted_countries.length > 0) {
        const entity_ids = [
            ...(await TopicCountry.findAll({
                where: { topic_id: topic.id, country_id: { [Op.in]: req.body.deleted_countries } },
            })),
        ].map((t: any) => parseInt(t.id));

        await deleteMedia("topic_countries", entity_ids);

        await TopicCountry.destroy({ where: { id: entity_ids } });
    }

    return api("Country specific details for the topic saved successfully", res, {});
};

export const putTopicState: RequestHandler = async (req, res) => {
    const topic: any = await Topic.findOne({ where: { uuid: req.params.uuid } });

    if (!topic) {
        throw { message: "Topic not found", code: 404 };
    }

    for (const topicStateObj of req.body.topic_state) {
        let topicState: any = await TopicState.findOne({
            where: { topic_id: topic.id, state_id: topicStateObj.state_id },
        });

        if (!topicState) {
            topicState = new TopicState({ topic_id: topic.id, state_id: topicStateObj.state_id });
        }

        const state: any = await State.findByPk(topicStateObj.state_id);

        topicState.description = topicStateObj.description ? topicStateObj.description : topicState.description;
        topicState.brief = topicStateObj.brief ? topicStateObj.brief : topicState.brief;
        topicState.banner = topicStateObj.banner ? topicStateObj.banner : topicState.getDataValue("banner");
        topicState.country_id = state.country_id;

        await topicState.save();

        // State media
        if (topicStateObj.media && topicStateObj.media.length > 0) {
            await addMedia("topic_states", topicState.id, topicStateObj.media);
        }

        if (topicStateObj.media == null || topicStateObj.media == "null") {
            await deleteMedia("topic_states", [topicState.id]);
        }
    }

    // Delete the states that are no longer mapped
    if (req.body.deleted_states && req.body.deleted_states.length > 0) {
        const entity_ids = [
            ...(await TopicState.findAll({
                where: { topic_id: topic.id, state_id: { [Op.in]: req.body.deleted_states } },
            })),
        ].map((t: any) => parseInt(t.id));

        await deleteMedia("topic_states", entity_ids);

        await TopicState.destroy({ where: { id: entity_ids } });
    }

    return api("State specific details for the topic saved successfully", res, {});
};

export const putTopicStatus: RequestHandler = async (req, res) => {
    const topic: any = await Topic.findOne({ where: { uuid: req.params.uuid } });

    if (!topic) {
        throw { message: "Topic not found", code: 404 };
    }

    if (topic.status != "published" && req.body.status == "unpublished") {
        throw { message: "Action not allowed. Topic is not published yet", code: 422 };
    }

    const mes = req.body.status == "published" ? "Topic published successfully" : "Topic unpublished successfully";

    topic.status = req.body.status;
    await topic.save();

    return api(mes, res, {});
};
