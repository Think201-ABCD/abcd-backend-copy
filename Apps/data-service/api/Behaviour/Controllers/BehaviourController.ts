import { RequestHandler } from "express";
import { v4 as uuidv4 } from "uuid";
import { Op } from "sequelize";

//Helpers
import { api, apiException } from "@redlof/libs/Helpers/helpers";
import { addMedia, deleteMedia } from "@redlof/libs/Helpers/MediaHelper";
import { getCountryData, getFilteredBehaviours } from "@redlof/libs/Helpers/DataFilterHelper";

// Models
import { Behaviour } from "@redlof/libs/Models/Behaviour/Behaviour";
import { BehaviourCountry } from "@redlof/libs/Models/Behaviour/BehaviourCountry";
import { BehaviourTopic } from "@redlof/libs/Models/Behaviour/BehaviourTopic";
import { BehaviourOutcome } from "@redlof/libs/Models/Behaviour/BehaviourOutcome";
import { MediaData } from "@redlof/libs/Models/Media/MediaData";
import { BehaviourState } from "@redlof/libs/Models/Behaviour/BehaviourState";
import { State } from "@redlof/libs/Models/Data/State";
import { User } from "@redlof/libs/Models/Auth/User";
import { Outcome } from "@redlof/libs/Models/Outcome/Outcome";
import { SubOutcome } from "@redlof/libs/Models/Outcome/SubOutcome";
import { Topic } from "@redlof/libs/Models/Topic/Topic";
import { SubTopic } from "@redlof/libs/Models/Topic/SubTopic";
import { BehaviourCategory } from "@redlof/libs/Models/Behaviour/BehaviourCategory";
import { Barrier } from "@redlof/libs/Models/Barrier/Barrier";
import { Solution } from "@redlof/libs/Models/Solution/Solution";
import { Knowledge } from "@redlof/libs/Models/Knowledge/Knowledge";
import { Prevalence } from "@redlof/libs/Models/Prevalence/Prevalence";
import { PrevalenceBehaviour } from "@redlof/libs/Models/Prevalence/PrevalenceBehaviour";
import { getAdditionalBehaviourData, rearrangePrevalenceData } from "@redlof/libs/Helpers/DataHelper";
import { Organisation } from "@redlof/libs/Models/Organisation/Organisation";
import { Collateral } from "@redlof/libs/Models/Collateral/Collateral";
import { PrevalenceCountry } from "@redlof/libs/Models/Prevalence/PrevalenceCountry";
import { Expert } from "@redlof/libs/Models/Expert/Expert";
import { Proposal } from "@redlof/libs/Models/ProposalRequest/Proposal";
import { Language } from "@redlof/libs/Models/Data/Language";
import { KnowledgeBehaviour } from "@redlof/libs/Models/Knowledge/KnowledgeBehaviour";
import { Redshift } from "aws-sdk";
import { SolutionCategory } from "@redlof/libs/Models/Solution/SolutionCategory";
import { info } from "console";
import { BarrierOutcome } from "@redlof/libs/Models/Barrier/BarrierOutcome";
import { BarrierBehaviour } from "@redlof/libs/Models/Barrier/BarrierBehaviour";
import { SolutionBehaviour } from "@redlof/libs/Models/Solution/SolutionBehaviours";
import { BarrierCategory } from "@redlof/libs/Models/Barrier/BarrierCategory";
import { SubOutcomeOutcome } from "@redlof/libs/Models/Outcome/SubOutcomeOutcome";

export const getBehaviourCategories: RequestHandler = async (req, res) => {
    const clause: any = { parent_id: null };

    if (req.query.category_id) {
        clause.parent_id =
            typeof req.query.category_id == "string"
                ? { [Op.in]: [req.query.category_id] }
                : { [Op.in]: req.query.category_id };
    }

    const categories = await BehaviourCategory.findAll({ where: clause });

    return api("", res, categories);
};

export const getBehaviours: RequestHandler = async (req: any, res) => {
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

    // Get behaviours ids if any filters applied
    clause.id = { [Op.in]: await getFilteredBehaviours(req.query) };

    const { rows, count } = await Behaviour.findAndCountAll({
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
                model: BehaviourCategory,
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

        for (const behaviour of rows) {
            behaviour.setDataValue(
                "behaviour_country",
                await getCountryData(behaviour.id, req.query.country_id, "behaviours")
            );
        }

        return { rows, count };
    });

    const pages = req.query.limit ? count / Number(req.query.limit) : 1;

    return api("", res, { total: count, pages: Math.ceil(pages), data: rows });
};

export const getBehaviour: RequestHandler = async (req, res) => {
    const countryClause: any = {};
    const stateClause: any = {};

    if (req.query.country_id) {
        countryClause.country_id = req.query.country_id;
        stateClause.country_id = req.query.country_id;
    }

    if (req.query.state_id) {
        stateClause.state_id = req.query.state_id;
    }

    let behaviour: any = await Behaviour.findOne({
        where: { uuid: req.params.uuid },
        attributes: { exclude: ["updated_at", "deleted_at"] },
        include: [
            "category",
            "sub_category",
            {
                model: User,
                as: "created_by",
                attributes: ["uuid", "first_name", "last_name", "photo"],
                required: true,
            },
            {
                model: BehaviourCountry,
                as: "behaviour_countries",
                attributes: { exclude: ["sub_outcome_id", "updated_at", "deleted_at"] },
                include: ["country"],
                where: countryClause,
                required: false,
            },
            {
                model: Topic,
                as: "topics",
                attributes: ["id", "uuid", "title", "logo"],
                where: { status: "published" },
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
                model: Outcome,
                as: "outcomes",
                attributes: ["id", "uuid", "title", "status", "logo"],
                where: { status: "published" },
                required: false,
            },
            {
                model: SubOutcome,
                as: "sub_outcomes",
                attributes: ["id", "uuid", "title", "status", "logo"],
                where: { status: "published" },
                required: false,
            },
            {
                model: Barrier,
                as: "barriers",
                attributes: ["id", "uuid", "title", "status", "logo", "type", "confidence"],
                where: { status: "published" },
                required: false,
                include: ["barrier_countries", "category"],
            },
            {
                model: Solution,
                as: "solutions",
                attributes: ["id", "uuid", "title", "status", "logo", "categories"],
                where: { status: "published" },
                required: false,
                include: ["solution_countries"],
            },
        ],
    });

    if (!behaviour) {
        throw { message: "Behaviour not found", code: 404 };
    }

    behaviour = behaviour.toJSON();
    behaviour.category = behaviour.category_id ? await BehaviourCategory.findByPk(behaviour.category_id) : null;

    behaviour.sub_category = behaviour.sub_category_id
        ? await BehaviourCategory.findByPk(behaviour.sub_category_id)
        : null;

    // Add the remaining data like knowledge,prevalence,Collateral etc
    // Get additional behaviour data
    behaviour = await getAdditionalBehaviourData(behaviour);

    // Add prevalence data
    if (behaviour.prevalences && behaviour.prevalences.length > 0) {
        const prevalenceIds = behaviour.prevalences.map((p: any) => p.id);

        const clause = { prevalence_id: { [Op.in]: prevalenceIds }, ...stateClause };

        const prevalenceData: any = await PrevalenceCountry.findAll({ where: clause });

        for (const prevalence of behaviour.prevalences) {
            prevalence.countries = prevalenceData.filter(
                (p: any) => p.state_id == null && p.prevalence_id == prevalence.id
            );
            prevalence.states = prevalenceData.filter(
                (p: any) => p.state_id != null && p.prevalence_id == prevalence.id
            );
        }
    }

    // Add languages to proposal data
    if (behaviour.proposals) {
        for (const proposal of behaviour.proposals) {
            proposal.languages = proposal.languages
                ? await Language.findAll({ where: { id: { [Op.in]: proposal.languages } } })
                : [];
        }
    }

    stateClause.behaviour_id = behaviour.id;

    for (const behaviourCountry of behaviour.behaviour_countries) {
        behaviourCountry.media = await MediaData.findAll({
            where: { entity: "behaviour_countries", entity_id: behaviourCountry.id },
        });

        behaviourCountry.behaviour_states = await BehaviourState.findAll({
            attributes: { exclude: ["updated_at", "deleted_at"] },
            where: stateClause,
            include: ["state"],
        }).then(async (behaviourStates: any) => {
            if (behaviourStates.length <= 0) {
                behaviourStates;
            }

            for (const behaviourState of behaviourStates) {
                behaviourState.setDataValue(
                    "media",
                    await MediaData.findAll({ where: { entity: "behaviour_states", entity_id: behaviourState.id } })
                );
            }

            return behaviourStates;
        });
    }

    for (const soln of behaviour.solutions) {
        let category_ids = soln.categories ? soln.categories : [];

        let categories = await SolutionCategory.findAll({
            where: {
                id: { [Op.in]: category_ids },
            },
        });

        // soln.setDataValue('solution_categories', categories)
        soln.solution_categories = categories;
    }

    return api("", res, behaviour);
};

export const postBehaviour: RequestHandler = async (req: any, res) => {
    const behaviour: any = req.body.uuid
        ? await Behaviour.findOne({ where: { uuid: req.body.uuid } })
        : new Behaviour({ uuid: uuidv4(), added_by: res.locals.user.id, status: "draft" });

    if (!behaviour) {
        throw { message: "Behaviour not found", code: 404 };
    }

    // Add primary details
    behaviour.title = req.body.title ? req.body.title : behaviour.title;
    behaviour.logo = req.body.logo ? req.body.logo : behaviour.getDataValue("logo");
    behaviour.category_id = req.body.category_id ? req.body.category_id : behaviour.category_id;
    behaviour.sub_category_id = req.body.sub_category_id ? req.body.sub_category_id : behaviour.sub_category_id;
    await behaviour.save();

    // Add country details
    if (req.body.country_ids) {
        const all_country_ids = [...(await BehaviourCountry.findAll({ where: { behaviour_id: behaviour.id } }))].map(
            (t: any) => parseInt(t.country_id)
        );

        const behaviourCountryToBeDeleted = all_country_ids.filter((t: any) => !req.body.country_ids.includes(t));

        const behaviourCountryToBeAdded = req.body.country_ids.filter((t: any) => !all_country_ids.includes(t));

        await BehaviourCountry.destroy({
            where: { country_id: { [Op.in]: behaviourCountryToBeDeleted }, behaviour_id: behaviour.id },
        });

        const behaviourCountryCreate: any = [];

        for (const id of behaviourCountryToBeAdded) {
            behaviourCountryCreate.push({ behaviour_id: behaviour.id, country_id: id });
        }

        await BehaviourCountry.bulkCreate(behaviourCountryCreate);
    }

    // Topic / Sub topic
    if (req.body.topic_ids) {
        const all_topic_ids = [
            ...(await BehaviourTopic.findAll({
                where: { behaviour_id: behaviour.id, topic_id: { [Op.ne]: null } },
            })),
        ].map((t: any) => parseInt(t.topic_id));

        const behaviourTopicToBeDeleted = all_topic_ids.filter((t: any) => !req.body.topic_ids.includes(t));

        const behaviourTopicToBeAdded = req.body.topic_ids.filter((t: any) => !all_topic_ids.includes(t));

        await BehaviourTopic.destroy({
            where: { topic_id: { [Op.in]: behaviourTopicToBeDeleted }, behaviour_id: behaviour.id },
        });

        const behaviourTopicCreate: any = [];

        for (const id of behaviourTopicToBeAdded) {
            behaviourTopicCreate.push({ behaviour_id: behaviour.id, topic_id: id });
        }

        await BehaviourTopic.bulkCreate(behaviourTopicCreate);
    }

    if (req.body.sub_topic_ids) {
        const all_topic_ids = [
            ...(await BehaviourTopic.findAll({
                where: { behaviour_id: behaviour.id, sub_topic_id: { [Op.ne]: null } },
            })),
        ].map((t: any) => parseInt(t.sub_topic_id));

        const behaviourSubTopicToBeDeleted = all_topic_ids.filter((t: any) => !req.body.sub_topic_ids.includes(t));

        const behaviourSubTopicToBeAdded = req.body.sub_topic_ids.filter((t: any) => !all_topic_ids.includes(t));

        await BehaviourTopic.destroy({
            where: { sub_topic_id: { [Op.in]: behaviourSubTopicToBeDeleted }, behaviour_id: behaviour.id },
        });

        const behaviourSubTopicCreate: any = [];

        for (const id of behaviourSubTopicToBeAdded) {
            behaviourSubTopicCreate.push({ behaviour_id: behaviour.id, sub_topic_id: id });
        }

        await BehaviourTopic.bulkCreate(behaviourSubTopicCreate);
    }

    // Outcome / Sub outcome
    if (req.body.sub_outcome_ids) {
        const all_outcome_ids = [
            ...(await BehaviourOutcome.findAll({
                where: { behaviour_id: behaviour.id, sub_outcome_id: { [Op.ne]: null } },
            })),
        ].map((t: any) => parseInt(t.sub_outcome_id));

        const behaviourSubOutcomeToBeDeleted = all_outcome_ids.filter(
            (t: any) => !req.body.sub_outcome_ids.includes(t)
        );

        const behaviourSubOutcomeToBeAdded = req.body.sub_outcome_ids.filter((t: any) => !all_outcome_ids.includes(t));

        await BehaviourOutcome.destroy({
            where: { sub_outcome_id: { [Op.in]: behaviourSubOutcomeToBeDeleted }, behaviour_id: behaviour.id },
        });

        const behaviourSubOutcomeCreate: any = [];

        for (const id of behaviourSubOutcomeToBeAdded) {
            behaviourSubOutcomeCreate.push({ behaviour_id: behaviour.id, sub_outcome_id: id });
        }

        await BehaviourOutcome.bulkCreate(behaviourSubOutcomeCreate);
    }

    if (req.body.outcome_ids) {
        const all_outcome_ids = [
            ...(await BehaviourOutcome.findAll({
                where: { behaviour_id: behaviour.id, outcome_id: { [Op.ne]: null } },
            })),
        ].map((t: any) => parseInt(t.outcome_id));

        const behaviourOutcomeToBeDeleted = all_outcome_ids.filter((t: any) => !req.body.outcome_ids.includes(t)); // 62 [40]

        const behaviourOutcomeToBeAdded = req.body.outcome_ids.filter((t: any) => !all_outcome_ids.includes(t)); // 61

        await BehaviourOutcome.destroy({
            where: { outcome_id: { [Op.in]: behaviourOutcomeToBeDeleted }, behaviour_id: behaviour.id },
        });

        const behaviourOutcomeCreate: any = [];

        for (const id of behaviourOutcomeToBeAdded) {
            behaviourOutcomeCreate.push({ behaviour_id: behaviour.id, outcome_id: id });
        }

        await BehaviourOutcome.bulkCreate(behaviourOutcomeCreate);

        // Task: delete sub-outcomes that are mapped to the deleted outcomes
        // Step 1: get all sub-outcomes that are mapped deleted outcomes

        if (behaviourOutcomeToBeDeleted.length > 0 && req.body.sub_outcome_ids.length > 0) {
            const all_sub_outcomes_for_deleted_outcomes = await SubOutcomeOutcome.findAll({
                where: { outcome_id: behaviourOutcomeToBeDeleted }
            });

            if (all_sub_outcomes_for_deleted_outcomes.length > 0) {
                req.body.sub_outcome_ids.map(async (sub_outcome_id: number) => {

                    let is_inlcude = all_sub_outcomes_for_deleted_outcomes.find((f: any) => f.sub_outcome_id == sub_outcome_id);

                    if (is_inlcude) {
                        let data = await BehaviourOutcome.destroy({
                            where: { behaviour_id: Number(behaviour.id), sub_outcome_id: Number(sub_outcome_id) },
                            force: true,
                        });
                    }
                });
            }
        }
    }

    return api("Outcome details saved successfully", res, behaviour);
};

export const putBehaviourCountry: RequestHandler = async (req, res) => {
    const behaviour: any = await Behaviour.findOne({ where: { uuid: req.params.uuid } });

    if (!behaviour) {
        throw { message: "Behaviour not found", code: 422 };
    }

    for (const behaviourCountryObj of req.body.behaviour_countries) {
        let behaviourCountry: any = await BehaviourCountry.findOne({
            where: { behaviour_id: behaviour.id, country_id: behaviourCountryObj.country_id },
        });

        if (!behaviourCountry) {
            behaviourCountry = new BehaviourCountry({
                behaviour_id: behaviour.id,
                country_id: behaviourCountryObj.country_id,
            });
        }

        behaviourCountry.brief = behaviourCountryObj.brief ? behaviourCountryObj.brief : behaviourCountry.brief;
        behaviourCountry.banner = behaviourCountryObj.banner
            ? behaviourCountryObj.banner
            : behaviourCountry.getDataValue("banner");
        behaviourCountry.description = behaviourCountryObj.description
            ? behaviourCountryObj.description
            : behaviourCountry.description;
        await behaviourCountry.save();

        // Country media
        if (behaviourCountryObj.media && behaviourCountryObj.media.length > 0) {
            await addMedia("behaviour_countries", behaviourCountry.id, behaviourCountryObj.media);
        }

        // Delete all the media if media is null
        if (behaviourCountryObj.media == null || behaviourCountryObj.media == "null") {
            await deleteMedia("behaviour_countries", [behaviourCountry.id]);
        }
    }

    // Delete the countries that are no longer mapped
    if (req.body.deleted_countries && req.body.deleted_countries.length > 0) {
        const entity_ids = [
            ...(await BehaviourCountry.findAll({
                where: { behaviour_id: behaviour.id, country_id: { [Op.in]: req.body.deleted_countries } },
            })),
        ].map((t: any) => parseInt(t.id));

        await deleteMedia("behaviour_countries", entity_ids);

        await BehaviourCountry.destroy({ where: { id: entity_ids } });
    }

    return api("Country specific behaviour details saved successfully.", res, {});
};

export const putBehaviourState: RequestHandler = async (req, res) => {
    const behaviour: any = await Behaviour.findOne({ where: { uuid: req.params.uuid } });

    if (!behaviour) {
        throw { message: "Behaviour not found", code: 422 };
    }

    for (const behaviourStateObj of req.body.behaviour_states) {
        let behaviourState: any = await BehaviourState.findOne({
            where: { behaviour_id: behaviour.id, state_id: behaviourStateObj.state_id },
        });

        if (!behaviourState) {
            behaviourState = new BehaviourState({
                behaviour_id: behaviour.id,
                state_id: behaviourStateObj.state_id,
            });
        }

        const state: any = await State.findByPk(behaviourStateObj.state_id);

        behaviourState.description = behaviourStateObj.description
            ? behaviourStateObj.description
            : behaviourState.description;
        behaviourState.brief = behaviourStateObj.brief ? behaviourStateObj.brief : behaviourState.brief;
        behaviourState.banner = behaviourStateObj.banner
            ? behaviourStateObj.banner
            : behaviourState.getDataValue("banner");
        behaviourState.country_id = state.country_id;
        behaviourState.prevalence = behaviourStateObj.prevalence
            ? behaviourStateObj.prevalence
            : behaviourState.prevalence;
        await behaviourState.save();

        // State media
        if (behaviourStateObj.media && behaviourStateObj.media.length > 0) {
            await addMedia("behaviour_states", behaviourState.id, behaviourStateObj.media);
        }

        if (behaviourStateObj.media == null || behaviourStateObj.media == "null") {
            await deleteMedia("behaviour_states", [behaviourState.id]);
        }
    }

    // Delete the states that are no longer mapped
    if (req.body.deleted_states && req.body.deleted_states.length > 0) {
        const entity_ids = [
            ...(await BehaviourState.findAll({
                where: { behaviour_id: behaviour.id, state_id: { [Op.in]: req.body.deleted_states } },
            })),
        ].map((t: any) => parseInt(t.id));

        await deleteMedia("behaviour_states", entity_ids);

        await BehaviourState.destroy({ where: { id: entity_ids } });
    }

    return api("State specific behaviour details saved successfully.", res, {});
};

export const putBehaviourStatus: RequestHandler = async (req, res) => {
    const behaviour: any = await Behaviour.findOne({ where: { uuid: req.params.uuid } });

    if (!behaviour) {
        throw { message: "Behaviour not found", code: 404 };
    }

    if (behaviour.status != "published" && req.body.status == "unpublished") {
        throw { message: "Action not allowed. Behaviour is not published yet", code: 422 };
    }

    const mes =
        req.body.status == "published" ? "Behaviour published successfully" : "Behaviour unpublished successfully";

    behaviour.status = req.body.status;
    await behaviour.save();

    return api(mes, res, {});
};

export const getBehaviourDetails: RequestHandler = async (req, res) => {
    const countryClause: any = {};
    const stateClause: any = {};

    if (req.query.country_id) {
        countryClause.country_id = req.query.country_id;
        stateClause.country_id = req.query.country_id;
    }

    if (req.query.state_id) {
        stateClause.state_id = req.query.state_id;
    }

    let behaviour: any = await Behaviour.findOne({
        where: { uuid: req.params.uuid },
        attributes: { exclude: ["updated_at", "deleted_at"] },
        include: [
            "category",
            "sub_category",
            {
                model: User,
                as: "created_by",
                attributes: ["uuid", "first_name", "last_name", "photo"],
                required: true,
            },
            {
                model: BehaviourCountry,
                as: "behaviour_countries",
                attributes: { exclude: ["sub_outcome_id", "updated_at", "deleted_at"] },
                include: ["country"],
                where: countryClause,
                required: false,
            },
        ],
    });

    if (!behaviour) {
        throw { message: "Behaviour not found", code: 404 };
    }

    behaviour = behaviour.toJSON();
    behaviour.category = behaviour.category_id ? await BehaviourCategory.findByPk(behaviour.category_id) : null;

    behaviour.sub_category = behaviour.sub_category_id
        ? await BehaviourCategory.findByPk(behaviour.sub_category_id)
        : null;

    // Add the remaining data like knowledge,prevalence,Collateral etc
    // Get additional behaviour data
    behaviour = await getAdditionalBehaviourData(behaviour);

    // Add prevalence data
    if (behaviour.prevalences && behaviour.prevalences.length > 0) {
        const prevalenceIds = behaviour.prevalences.map((p: any) => p.id);

        const clause = { prevalence_id: { [Op.in]: prevalenceIds }, ...stateClause };

        const prevalenceData: any = await PrevalenceCountry.findAll({ where: clause });

        for (const prevalence of behaviour.prevalences) {
            prevalence.countries = prevalenceData.filter(
                (p: any) => p.state_id == null && p.prevalence_id == prevalence.id
            );
            prevalence.states = prevalenceData.filter(
                (p: any) => p.state_id != null && p.prevalence_id == prevalence.id
            );
        }
    }

    // Add languages to proposal data
    if (behaviour.proposals) {
        for (const proposal of behaviour.proposals) {
            proposal.languages = proposal.languages
                ? await Language.findAll({ where: { id: { [Op.in]: proposal.languages } } })
                : [];
        }
    }

    stateClause.behaviour_id = behaviour.id;

    for (const behaviourCountry of behaviour.behaviour_countries) {
        behaviourCountry.media = await MediaData.findAll({
            where: { entity: "behaviour_countries", entity_id: behaviourCountry.id },
        });

        behaviourCountry.behaviour_states = await BehaviourState.findAll({
            attributes: { exclude: ["updated_at", "deleted_at"] },
            where: stateClause,
            include: ["state"],
        }).then(async (behaviourStates: any) => {
            if (behaviourStates.length <= 0) {
                behaviourStates;
            }

            for (const behaviourState of behaviourStates) {
                behaviourState.setDataValue(
                    "media",
                    await MediaData.findAll({ where: { entity: "behaviour_states", entity_id: behaviourState.id } })
                );
            }

            return behaviourStates;
        });
    }

    return api("", res, behaviour);
};

export const getBehaviourOutcomes: RequestHandler = async (req, res) => {
    const uuid = req.params.uuid;
    const country_id = req.query.country_id;

    let behaviour: any = await Behaviour.findOne({
        where: { uuid: req.params.uuid },
        attributes: { exclude: ["updated_at", "deleted_at"] },
        include: [
            "category",
            "sub_category",
            {
                model: User,
                as: "created_by",
                attributes: ["uuid", "first_name", "last_name", "photo"],
                required: true,
            },
            {
                model: BehaviourCountry,
                as: "behaviour_countries",
                attributes: { exclude: ["sub_outcome_id", "updated_at", "deleted_at"] },
                include: ["country"],
                where: { country_id: country_id },
                required: false,
            },
        ],
    });

    const outcomeBehaviours = await BehaviourOutcome.findAll({
        where: { behaviour_id: behaviour.id },
        attributes: ["outcome_id"],
    });

    if (outcomeBehaviours.length <= 0) {
        return api("Behaviour does not have any outcome", res, {});
    }

    const outcomeIds = outcomeBehaviours.map((entry) => entry.outcome_id);

    const behaviourOutcomes = await Outcome.findAll({
        where: { id: { [Op.in]: outcomeIds }, status: "published" },
    });

    return api("", res, behaviourOutcomes);
};

export const getBehaviourSubOutcomes: RequestHandler = async (req, res) => {
    const countryClause: any = {};
    const stateClause: any = {};

    if (req.query.country_id) {
        countryClause.country_id = req.query.country_id;
        stateClause.country_id = req.query.country_id;
    }

    if (req.query.state_id) {
        stateClause.state_id = req.query.state_id;
    }

    let behaviour: any = await Behaviour.findOne({
        where: { uuid: req.params.uuid },
        attributes: { exclude: ["updated_at", "deleted_at"] },
        include: [
            {
                model: SubOutcome,
                as: "sub_outcomes",
                attributes: ["id", "uuid", "title", "status", "logo"],
                where: { status: "published" },
                required: false,
            },
        ],
    });

    if (!behaviour) {
        throw { message: "Behaviour not found", code: 404 };
    }

    return api("", res, behaviour.sub_outcomes);
};

export const getBehaviourBarriers: RequestHandler = async (req, res) => {
    const uuid = req.params.uuid;
    const country_id = req.query.country_id;

    let behaviour: any = await Behaviour.findOne({
        where: { uuid: req.params.uuid },
        attributes: { exclude: ["updated_at", "deleted_at"] },
        include: [
            "category",
            "sub_category",
            {
                model: User,
                as: "created_by",
                attributes: ["uuid", "first_name", "last_name", "photo"],
                required: true,
            },
            {
                model: BehaviourCountry,
                as: "behaviour_countries",
                attributes: { exclude: ["sub_outcome_id", "updated_at", "deleted_at"] },
                include: ["country"],
                where: { country_id: country_id },
                required: false,
            },
        ],
    });

    const barrierBehaviours = await BarrierBehaviour.findAll({
        where: { behaviour_id: behaviour.id },
        attributes: ["barrier_id"],
    });

    if (barrierBehaviours.length <= 0) {
        return api("Behaviour does not have any barrier", res, {});
    }

    const barrierIds = barrierBehaviours.map((entry) => entry.barrier_id);

    const behaviourBarriers = await Barrier.findAll({
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

    return api("", res, behaviourBarriers);
};

export const getBehaviourSolutions: RequestHandler = async (req, res) => {
    const uuid = req.params.uuid;
    const country_id = req.query.country_id;

    let behaviour: any = await Behaviour.findOne({
        where: { uuid: req.params.uuid },
        attributes: { exclude: ["updated_at", "deleted_at"] },
        include: [
            "category",
            "sub_category",
            {
                model: User,
                as: "created_by",
                attributes: ["uuid", "first_name", "last_name", "photo"],
                required: true,
            },
            {
                model: BehaviourCountry,
                as: "behaviour_countries",
                attributes: { exclude: ["sub_outcome_id", "updated_at", "deleted_at"] },
                include: ["country"],
                where: { country_id: country_id },
                required: false,
            },
        ],
    });

    const solutionBehaviours = await SolutionBehaviour.findAll({
        where: { behaviour_id: behaviour.id },
        attributes: ["solution_id"],
    });

    if (solutionBehaviours.length <= 0) {
        return api("Topic does not have any solution", res, {});
    }

    const solutionIds = solutionBehaviours.map((entry) => entry.solution_id);

    let behaviourSolutions: any = await Solution.findAll({
        where: {
            id: { [Op.in]: solutionIds },
            status: "published",
        },
    });

    let updatedBehaviourSolutions = await Promise.all(
        behaviourSolutions?.map(async (solution: any) => {
            let categoryDetails = await Promise.all(
                solution?.categories?.map(async (categoryId: any) => {
                    const category = await SolutionCategory.findOne({ where: { id: categoryId } });
                    return category.dataValues;
                })
            );

            solution = solution.toJSON();

            return { ...solution, categories: categoryDetails };
        })
    );

    return api("", res, updatedBehaviourSolutions);
};
