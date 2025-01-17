import { RequestHandler } from "express";
import { Op } from "sequelize";
import { v4 as uuidv4 } from "uuid";
import { getCountryData } from "@redlof/libs/Helpers/DataFilterHelper";

//Helpers
import { api, apiException } from "@redlof/libs/Helpers/helpers";
import { addMedia } from "@redlof/libs/Helpers/MediaHelper";

// Models
import { User } from "@redlof/libs/Models/Auth/User";
import { Behaviour } from "@redlof/libs/Models/Behaviour/Behaviour";
import { Country } from "@redlof/libs/Models/Data/Country";
import { State } from "@redlof/libs/Models/Data/State";
import { Expert } from "@redlof/libs/Models/Expert/Expert";
import { ExpertBehaviour } from "@redlof/libs/Models/Expert/ExpertBehaviour";
import { ExpertCategory } from "@redlof/libs/Models/Expert/ExpertCategory";
import { ExpertKnowledge } from "@redlof/libs/Models/Expert/ExpertKnowledge";
import { ExpertTopic } from "@redlof/libs/Models/Expert/ExpertTopic";
import { Knowledge } from "@redlof/libs/Models/Knowledge/Knowledge";
import { KnowledgeCategory } from "@redlof/libs/Models/Knowledge/KnowledgeCategory";
import { MediaData } from "@redlof/libs/Models/Media/MediaData";
import { Topic } from "@redlof/libs/Models/Topic/Topic";

export const getExpertCategories: RequestHandler = async (req, res) => {
    const clause: any = { parent_id: null };

    if (req.query.category_id) {
        clause.parent_id =
            typeof req.query.category_id == "string"
                ? { [Op.in]: [req.query.category_id] }
                : { [Op.in]: req.query.category_id };
    }

    const categories = await ExpertCategory.findAll({ where: clause });

    return api("", res, categories);
};

export const postExpert: RequestHandler = async (req, res) => {
    let user: any = null;

    if (req.body.user_id) {
        const existing = await Expert.findOne({
            where: {
                user_id: req.body.user_id,
            },
        });

        if (existing) {
            throw { message: "User is already marked as a expert", code: 422 };
        }

        user = await User.findOne({
            where: {
                id: req.body.user_id,
            },
        });
    }

    const expert: any = await Expert.create({
        uuid: uuidv4(),
        user_id: user ? user.id : null,
        country_id: req.body.country_id ? req.body.country_id : null,
        state_id: req.body.state_id ? req.body.state_id : null,
        name: req.body.name,
        email: user ? user.email : req.body.email ? req.body.email : null,
        bio: req.body.bio ? req.body.bio : null,
        brief: req.body.brief ? req.body.brief : null,
        designation: req.body.designation ? req.body.designation : null,
        organisation_id: req.body.organisation_id ? req.body.organisation_id : null,
        photo: req.body.photo ? req.body.photo : null,
        categories: req.body.categories ? req.body.categories : null,
        website: req.body.website ? req.body.website : null,
        expertise_countries: req.body.expertise_countries ? req.body.expertise_countries : null,
        offerings: req.body.offerings ? req.body.offerings : null,
        status: "active",
    });

    if (req.body.topic_ids && req.body.topic_ids.length > 0) {
        const topics = await Topic.findAll({ where: { id: { [Op.in]: req.body.topic_ids } } });

        if (topics.length <= 0) {
            throw { message: "Please select at least one topic", code: 422 };
        }

        const data: any = [];

        for (const topic of topics) {
            data.push({
                expert_id: expert.id,
                topic_id: topic.id,
                created_at: new Date(),
                updated_at: new Date(),
            });
        }

        // Remove old preferences
        await ExpertTopic.destroy({ where: { expert_id: expert.id } });

        await ExpertTopic.bulkCreate(data);
    }

    if (req.body.behaviour_ids && req.body.behaviour_ids.length > 0) {
        const behaviours = await Behaviour.findAll({ where: { id: { [Op.in]: req.body.behaviour_ids } } });

        if (behaviours.length <= 0) {
            throw { message: "Please select at least one behaviour", code: 422 };
        }

        const data: any = [];

        for (const behaviour of behaviours) {
            data.push({
                expert_id: expert.id,
                behaviour_id: behaviour.id,
                created_at: new Date(),
                updated_at: new Date(),
            });
        }

        // Remove old preferences
        await ExpertBehaviour.destroy({ where: { expert_id: expert.id } });

        await ExpertBehaviour.bulkCreate(data);
    }

    if (req.body.knowledges && req.body.knowledges.length > 0) {
        const knowledges = await Knowledge.findAll({ where: { id: { [Op.in]: req.body.knowledges } } });

        if (knowledges.length <= 0) {
            throw { message: "Please select at least one knowledge library", code: 422 };
        }

        const data: any = [];

        for (const knowledge of knowledges) {
            data.push({
                expert_id: expert.id,
                knowledge_id: knowledge.id,
                created_at: new Date(),
                updated_at: new Date(),
            });
        }

        // Remove old preferences
        await ExpertKnowledge.destroy({ where: { expert_id: expert.id } });

        await ExpertKnowledge.bulkCreate(data);
    }

    if (req.body.media && req.body.media.length > 0) {
        await addMedia("experts", expert.id, req.body.media);
    }

    return api("Successfully created a Expert", res, {});
};

export const getExperts: RequestHandler = async (req, res) => {
    const clause: any = { [Op.and]: [] };

    const andSymbol: any = Object.getOwnPropertySymbols(clause)[0];
    if (req.query.topic_ids) {
        clause[andSymbol].push({
            "$topics.id$": {
                [Op.in]: typeof req.query.topic_ids == "string" ? [req.query.topic_ids] : req.query.topic_ids,
            },
        });
    }

    if (req.query.behaviour_ids) {
        clause[andSymbol].push({
            "$behaviours.id$": {
                [Op.in]:
                    typeof req.query.behaviour_ids == "string" ? [req.query.behaviour_ids] : req.query.behaviour_ids,
            },
        });
    }

    const experts = await Expert.findAll({
        attributes: { exclude: ["updated_at", "deleted_at"] },
        where: clause,
        include: [
            {
                model: Topic,
                as: "topics",
                required: false,
                attributes: ["id", "uuid", "title", "logo"],
                where: { status: "published" },
            },
            {
                model: Behaviour,
                as: "behaviours",
                required: false,
                attributes: ["uuid", "id", "title", "logo"],
                where: { status: "published" },
            },
            {
                model: Country,
                as: "country",
                required: false,
            },
            {
                model: State,
                as: "state",
                required: false,
            },
        ],
    });

    for (const expert of experts) {
        if (expert.expertise_countries && expert.expertise_countries.length > 0) {
            const countries: any = await Country.findAll({
                where: { id: { [Op.in]: Array(expert.expertise_countries) } },
            });

            expert.setDataValue("expertise_countries", countries);
        }
    }

    return api("", res, experts);
};

export const getExpert: RequestHandler = async (req, res) => {
    let expert: any = await Expert.findOne({
        attributes: { exclude: ["updated_at", "deleted_at"] },
        where: { uuid: req.params.uuid },
        include: [
            {
                model: Topic,
                as: "topics",
                required: false,
                attributes: ["id", "uuid", "title", "logo"],
                where: { status: "published" },
            },
            {
                model: Behaviour,
                as: "behaviours",
                required: false,
                attributes: ["uuid", "id", "title", "logo"],
                where: { status: "published" },
            },
            {
                model: Knowledge,
                as: "knowledges",
                required: false,
                attributes: ["uuid", "id", "title", "type", "logo"],
                where: { status: "published" },
                include: [
                    {
                        model: KnowledgeCategory,
                        as: "category",
                        required: false,
                    },
                ],
            },
        ],
    });

    if (!expert) {
        throw { message: "Expert not found", code: 404 };
    }

    expert = expert.toJSON();

    expert.country = expert.country_id ? await Country.findOne({ where: { id: expert.country_id } }) : null;

    expert.state = expert.state_id ? await State.findOne({ where: { id: expert.state_id } }) : null;

    expert.media = await MediaData.findAll({ where: { entity: "experts", entity_id: expert.id } });

    if (expert.categories && expert.categories.length > 0) {
        expert.categories = await ExpertCategory.findAll({ where: { id: { [Op.in]: expert.categories } } });
    }

    if (expert.expertise_countries && expert.expertise_countries.length > 0) {
        expert.expertise_countries = await Country.findAll({
            where: { id: { [Op.in]: expert.expertise_countries } },
        });
    }

    if (!req.query.country_id) {
        return api("", res, expert);
    }

    // Get country details for knowledges and behaviours
    for (const behaviour of expert.behaviours) {
        behaviour.behaviour_country = await getCountryData(behaviour.id, req.query.country_id, "behaviours");
    }

    for (const knowledges of expert.knowledges) {
        knowledges.knowledges_country = await getCountryData(knowledges.id, req.query.country_id, "knowledges");
    }

    return api("", res, expert);
};

export const putExpert: RequestHandler = async (req, res) => {
    const expert: any = await Expert.findOne({ where: { uuid: req.params.uuid } });

    if (!expert) {
        throw { message: "Expert details not found", code: 422 };
    }

    expert.country_id = req.body.country_id ? req.body.country_id : expert.country_id;
    expert.state_id = req.body.state_id ? req.body.state_id : expert.state_id;
    expert.name = req.body.name;
    expert.bio = req.body.bio ? req.body.bio : expert.bio;
    expert.brief = req.body.brief ? req.body.brief : expert.brief;
    expert.designation = req.body.designation ? req.body.designation : expert.designation;
    expert.organisation_id = req.body.organisation_id ? req.body.organisation_id : expert.organisation_id;
    expert.photo = req.body.photo ? req.body.photo : expert.getDataValue("photo");
    expert.categories = req.body.categories ? req.body.categories : expert.categories;
    expert.website = req.body.website ? req.body.website : expert.website;
    expert.expertise_countries = req.body.expertise_countries
        ? req.body.expertise_countries
        : expert.expertise_countries;
    expert.offerings = req.body.offerings ? req.body.offerings : expert.offerings;
    await expert.save();

    if (req.body.topic_ids && req.body.topic_ids.length > 0) {
        const topics = await Topic.findAll({ where: { id: { [Op.in]: req.body.topic_ids } } });

        if (topics.length <= 0) {
            throw { message: "Please select at least one topic", code: 422 };
        }

        const data: any = [];

        for (const topic of topics) {
            data.push({
                expert_id: expert.id,
                topic_id: topic.id,
                created_at: new Date(),
                updated_at: new Date(),
            });
        }

        // Remove old preferences
        await ExpertTopic.destroy({ where: { expert_id: expert.id } });

        await ExpertTopic.bulkCreate(data);
    }

    if (req.body.behaviour_ids && req.body.behaviour_ids.length > 0) {
        const behaviours = await Behaviour.findAll({ where: { id: { [Op.in]: req.body.behaviour_ids } } });

        if (behaviours.length <= 0) {
            throw { message: "Please select at least one behaviour", code: 422 };
        }

        const data: any = [];

        for (const behaviour of behaviours) {
            data.push({
                expert_id: expert.id,
                behaviour_id: behaviour.id,
                created_at: new Date(),
                updated_at: new Date(),
            });
        }

        // Remove old preferences
        await ExpertBehaviour.destroy({ where: { expert_id: expert.id } });

        await ExpertBehaviour.bulkCreate(data);
    }

    if (req.body.knowledges && req.body.knowledges.length > 0) {
        const knowledges = await Knowledge.findAll({ where: { id: { [Op.in]: req.body.knowledges } } });

        if (knowledges.length <= 0) {
            throw { message: "Please select at least one knowledge library", code: 422 };
        }

        const data: any = [];

        for (const knowledge of knowledges) {
            data.push({
                expert_id: expert.id,
                knowledge_id: knowledge.id,
                created_at: new Date(),
                updated_at: new Date(),
            });
        }

        // Remove old preferences
        await ExpertKnowledge.destroy({ where: { expert_id: expert.id } });

        await ExpertKnowledge.bulkCreate(data);
    }

    if (req.body.media && req.body.media.length > 0) {
        await addMedia("experts", expert.id, req.body.media);
    }

    return api("Expert details saved successfully.", res, {});
};

export const patchExperStatus: RequestHandler = async (req, res) => {
    const expert: any = await Expert.findOne({ where: { uuid: req.params.uuid } });

    if (!expert) {
        throw { message: "Expert details not found", code: 422 };
    }

    expert.status = req.body.status;
    await expert.save()

    return api("Expert status updated successfully.", res, {});
}
