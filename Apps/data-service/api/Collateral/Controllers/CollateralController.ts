import { RequestHandler } from "express";
import { v4 as uuidv4 } from "uuid";
import { Op } from "sequelize";

//Helpers
import { api, apiException } from "@redlof/libs/Helpers/helpers";
import { addMedia, deleteMedia } from "@redlof/libs/Helpers/MediaHelper";
import { getCountryData, getFilteredCollaterals } from "@redlof/libs/Helpers/DataFilterHelper";

// Models
import { CollateralCategory } from "@redlof/libs/Models/Collateral/CollateralCategory";
import { Collateral } from "@redlof/libs/Models/Collateral/Collateral";
import { CollateralCountry } from "@redlof/libs/Models/Collateral/CollateralCountry";
import { CollateralTopic } from "@redlof/libs/Models/Collateral/CollateralTopic";
import { CollateralOutcome } from "@redlof/libs/Models/Collateral/CollateralOutcome";
import { CollateralBehaviour } from "@redlof/libs/Models/Collateral/CollateralBehaviour";
import { CollateralSolution } from "@redlof/libs/Models/Collateral/CollateralSolution";
import { CollateralBarrier } from "@redlof/libs/Models/Collateral/CollateralBarrier";
import { CollateralState } from "@redlof/libs/Models/Collateral/CollateralState";
import { State } from "@redlof/libs/Models/Data/State";
import { User } from "@redlof/libs/Models/Auth/User";
import { MediaData } from "@redlof/libs/Models/Media/MediaData";
import { Outcome } from "@redlof/libs/Models/Outcome/Outcome";
import { SubOutcome } from "@redlof/libs/Models/Outcome/SubOutcome";
import { Topic } from "@redlof/libs/Models/Topic/Topic";
import { SubTopic } from "@redlof/libs/Models/Topic/SubTopic";
import { Barrier } from "@redlof/libs/Models/Barrier/Barrier";
import { Behaviour } from "@redlof/libs/Models/Behaviour/Behaviour";
import { Solution } from "@redlof/libs/Models/Solution/Solution";
import { Language } from "@redlof/libs/Models/Data/Language";
import { Organisation } from "@redlof/libs/Models/Organisation/Organisation";
import { SolutionCategory } from "@redlof/libs/Models/Solution/SolutionCategory";

export const getCollateralCategories: RequestHandler = async (req, res) => {
    const clause: any = { parent_id: null };

    if (req.query.category_id) {
        clause.parent_id =
            typeof req.query.category_id == "string"
                ? { [Op.in]: [req.query.category_id] }
                : { [Op.in]: req.query.category_id };
    }

    const categories = await CollateralCategory.findAll({ where: clause });

    return api("", res, categories);
};

export const getCollaterals: RequestHandler = async (req: any, res) => {
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

    if (req.query.organisation_ids) {
        const orgIds = req.query.organisation_ids.map(org => Number(org))
        clause.organisations = {[Op.contains] : orgIds}
    }

    // Get collateral ids if any filters applied
    clause.id = { [Op.in]: await getFilteredCollaterals(req.query) };

    const { rows, count } = await Collateral.findAndCountAll({
        limit: req.query.limit ? req.query.limit : null,
        offset: req.query.page && req.query.limit ? (Number(req.query.page) - 1) * Number(req.query.limit) : 0,
        attributes: ["uuid", "id", "title", "status", "languages", "logo", "license", "created_at", "organisations"],
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
                model: CollateralCategory,
                required: false,
            },
        ],
    }).then(async ({ rows, count }: any) => {
        for (const collateral of rows) {
            collateral.setDataValue(
                "languages",
                collateral.languages ? await Language.findAll({ where: { id: { [Op.in]: collateral.languages } } }) : []
            );
        }

        if (rows.length <= 0) {
            return { rows, count };
        }

        if (!req.query.country_id) {
            return { rows, count };
        }

        for (const collateral of rows) {
            collateral.setDataValue(
                "collateral_country",
                await getCountryData(collateral.id, req.query.country_id, "collaterals")
            );
        }

        return { rows, count };
    });

    const pages = req.query.limit ? count / Number(req.query.limit) : 1;

    return api("", res, { total: count, pages: Math.ceil(pages), data: rows });
};

export const getCollateral: RequestHandler = async (req, res) => {
    const countryClause: any = {};
    const stateClause: any = {};
    let organisationArr = [];

    if (req.query.country_id) {
        countryClause.country_id = req.query.country_id;
        stateClause.country_id = req.query.country_id;
    }

    if (req.query.state_id) {
        stateClause.state_id = req.query.state_id;
    }

    let collateral: any = await Collateral.findOne({
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
                as: "collateral_countries",
                model: CollateralCountry,
                attributes: { exclude: ["sub_outcome_id", "updated_at", "deleted_at"] },
                include: ["country"],
                where: countryClause,
                required: false,
            },
            {
                as: "outcomes",
                model: Outcome,
                attributes: ["uuid", "id", "title", "status", "logo"],
                required: false,
                where: { status: "published" },
            },
            {
                as: "sub_outcomes",
                model: SubOutcome,
                attributes: ["uuid", "id", "title", "status", "logo"],
                required: false,
                where: { status: "published" },
            },
            {
                model: Topic,
                as: "topics",
                attributes: ["uuid", "id", "title", "logo"],
                required: false,
                where: { status: "published" },
            },
            {
                model: SubTopic,
                as: "sub_topics",
                attributes: ["uuid", "id", "title", "logo"],
                required: false,
                where: { status: "published" },
            },
            {
                as: "barriers",
                model: Barrier,
                attributes: ["uuid", "id", "title", "logo", "type", "confidence"],
                include: ["category"],
                required: false,
                where: { status: "published" },
            },
            {
                as: "behaviours",
                model: Behaviour,
                attributes: ["uuid", "id", "title", "logo"],
                required: false,
                where: { status: "published" },
            },
            {
                as: "solutions",
                model: Solution,
                attributes: ["uuid", "id", "title", "logo", "categories"],
                required: false,
                where: { status: "published" },
            },
        ],
    });

    if (!collateral) {
        throw { message: "Collateral details not found", code: 404 };
    }

    collateral = collateral.toJSON();

    collateral.category = await CollateralCategory.findByPk(collateral.category_id);

    collateral.sub_category = await CollateralCategory.findByPk(collateral.sub_category_id);

    collateral.solutions = await Promise.all(
        collateral.solutions.map(async (solution) => {
            let categoryDetails = await Promise.all(
                solution.categories.map(async (categoryId) => {
                    const category = await SolutionCategory.findOne({ where: { id: categoryId } });
                    return category.dataValues;
                })
            );

            return { ...solution, categories: categoryDetails };
        })
    );

    const organisationDetails = []
    for (const organisationEl of collateral.organisations) {
        if (typeof organisationEl !== "number") {
            organisationArr.push(organisationEl);
            continue;
        }

        const organisation = await Organisation.findOne({ where: { id: organisationEl } });

        if (!organisation) {
            continue;
        }

        organisationArr.push(organisation.name);
        organisationDetails.push({name: organisation.name, uuid: organisation.uuid})
    }

    collateral.organisations = organisationArr;
    collateral.organisation_details = organisationDetails

    collateral.languages = collateral.languages
        ? await Language.findAll({ where: { id: { [Op.in]: collateral.languages } } })
        : [];

    stateClause.collateral_id = collateral.id;

    for (const collateralCountry of collateral.collateral_countries) {
        collateralCountry.media = await MediaData.findAll({
            where: { entity: "collateral_countries", entity_id: collateralCountry.id },
        });

        collateralCountry.collateral_states = await CollateralState.findAll({
            attributes: { exclude: ["updated_at", "deleted_at"] },
            where: stateClause,
            include: ["state"],
        }).then(async (collateralStates: any) => {
            if (collateralStates.length <= 0) {
                collateralStates;
            }

            for (const collateralState of collateralStates) {
                collateralState.setDataValue(
                    "media",
                    await MediaData.findAll({
                        where: { entity: "collateral_states", entity_id: collateralState.id },
                    })
                );
            }

            return collateralStates;
        });
    }

    return api("", res, collateral);
};

export const postCollateral: RequestHandler = async (req: any, res) => {
    const collateral: any = req.body.uuid
        ? await Collateral.findOne({ where: { uuid: req.body.uuid } })
        : new Collateral({ uuid: uuidv4(), added_by: res.locals.user.id, status: "draft" });

    if (!collateral) {
        throw { message: "Collateral data not found", code: 404 };
    }

    const organisationIds = await Promise.all(
        req.body.organisations.map(async (uuid) => {
            const organisationData = await Organisation.findOne({ where: { uuid: uuid } });
            return Number(organisationData.id);
        })
    );

    // Add primary details
    collateral.title = req.body.title ? req.body.title : collateral.title;
    collateral.logo = req.body.logo ? req.body.logo : collateral.getDataValue("logo");
    collateral.category_id = req.body.category_id ? req.body.category_id : collateral.category_id;
    collateral.sub_category_id = req.body.sub_category_id ? req.body.sub_category_id : collateral.sub_category_id;
    collateral.organisations = organisationIds ? organisationIds : collateral.organisations;
    collateral.person = req.body.person ? req.body.person : collateral.person;
    collateral.languages = req.body.language_ids ? req.body.language_ids : collateral.languages;
    collateral.source = req.body.source ? req.body.source : collateral.source;
    collateral.license = req.body.license ? req.body.license : collateral.license;
    collateral.start_year = req.body.start_year ? req.body.start_year : collateral.start_year;
    collateral.end_year = req.body.end_year ? req.body.end_year : collateral.end_year;
    collateral.impact = req.body.impact ? req.body.impact : collateral.impact;
    collateral.confidence = req.body.confidence ? req.body.confidence : collateral.confidence;
    collateral.expiry = req.body.expiry ? req.body.expiry : collateral.expiry;
    await collateral.save();

    // Add country details
    if (req.body.country_ids) {
        const all_country_ids = [...(await CollateralCountry.findAll({ where: { collateral_id: collateral.id } }))].map(
            (t: any) => parseInt(t.country_id)
        );

        const collateralCountryToBeDeleted = all_country_ids.filter((t: any) => !req.body.country_ids.includes(t));

        const collateralCountryToBeAdded = req.body.country_ids.filter((t: any) => !all_country_ids.includes(t));

        await CollateralCountry.destroy({
            where: { country_id: { [Op.in]: collateralCountryToBeDeleted }, collateral_id: collateral.id },
        });

        const collateralCountryCreate: any = [];

        for (const id of collateralCountryToBeAdded) {
            collateralCountryCreate.push({ collateral_id: collateral.id, country_id: id });
        }

        await CollateralCountry.bulkCreate(collateralCountryCreate);
    }

    // Topic / Sub topic
    if (req.body.topic_ids) {
        const all_topic_ids = [
            ...(await CollateralTopic.findAll({
                where: { collateral_id: collateral.id, topic_id: { [Op.ne]: null } },
            })),
        ].map((t: any) => parseInt(t.topic_id));

        const collateralTopicToBeDeleted = all_topic_ids.filter((t: any) => !req.body.topic_ids.includes(t));

        const collateralTopicToBeAdded = req.body.topic_ids.filter((t: any) => !all_topic_ids.includes(t));

        await CollateralTopic.destroy({
            where: { topic_id: { [Op.in]: collateralTopicToBeDeleted }, collateral_id: collateral.id },
        });

        const collateralTopicCreate: any = [];

        for (const id of collateralTopicToBeAdded) {
            collateralTopicCreate.push({ collateral_id: collateral.id, topic_id: id });
        }

        await CollateralTopic.bulkCreate(collateralTopicCreate);
    }

    if (req.body.sub_topic_ids) {
        const all_topic_ids = [
            ...(await CollateralTopic.findAll({
                where: { collateral_id: collateral.id, sub_topic_id: { [Op.ne]: null } },
            })),
        ].map((t: any) => parseInt(t.sub_topic_id));

        const collateralSubTopicToBeDeleted = all_topic_ids.filter((t: any) => !req.body.sub_topic_ids.includes(t));

        const collateralSubTopicToBeAdded = req.body.sub_topic_ids.filter((t: any) => !all_topic_ids.includes(t));

        await CollateralTopic.destroy({
            where: { sub_topic_id: { [Op.in]: collateralSubTopicToBeDeleted }, collateral_id: collateral.id },
        });

        const collateralSubTopicCreate: any = [];

        for (const id of collateralSubTopicToBeAdded) {
            collateralSubTopicCreate.push({ collateral_id: collateral.id, sub_topic_id: id });
        }

        await CollateralTopic.bulkCreate(collateralSubTopicCreate);
    }

    // Outcome / Sub outcome
    if (req.body.outcome_ids) {
        const all_outcome_ids = [
            ...(await CollateralOutcome.findAll({
                where: { collateral_id: collateral.id, outcome_id: { [Op.ne]: null } },
            })),
        ].map((t: any) => parseInt(t.outcome_id));

        const collateralOutcomeToBeDeleted = all_outcome_ids.filter((t: any) => !req.body.outcome_ids.includes(t));

        const collateralOutcomeToBeAdded = req.body.outcome_ids.filter((t: any) => !all_outcome_ids.includes(t));

        await CollateralOutcome.destroy({
            where: { outcome_id: { [Op.in]: collateralOutcomeToBeDeleted }, collateral_id: collateral.id },
        });

        const collateralOutcomeCreate: any = [];

        for (const id of collateralOutcomeToBeAdded) {
            collateralOutcomeCreate.push({ collateral_id: collateral.id, outcome_id: id });
        }

        await CollateralOutcome.bulkCreate(collateralOutcomeCreate);
    }

    if (req.body.sub_outcome_ids) {
        const all_outcome_ids = [
            ...(await CollateralOutcome.findAll({
                where: { collateral_id: collateral.id, sub_outcome_id: { [Op.ne]: null } },
            })),
        ].map((t: any) => parseInt(t.sub_outcome_id));

        const collateralSubOutcomeToBeDeleted = all_outcome_ids.filter(
            (t: any) => !req.body.sub_outcome_ids.includes(t)
        );

        const collateralSubOutcomeToBeAdded = req.body.sub_outcome_ids.filter((t: any) => !all_outcome_ids.includes(t));

        await CollateralOutcome.destroy({
            where: { sub_outcome_id: { [Op.in]: collateralSubOutcomeToBeDeleted }, collateral_id: collateral.id },
        });

        const collateralSubOutcomeCreate: any = [];

        for (const id of collateralSubOutcomeToBeAdded) {
            collateralSubOutcomeCreate.push({ collateral_id: collateral.id, sub_outcome_id: id });
        }

        await CollateralOutcome.bulkCreate(collateralSubOutcomeCreate);
    }

    // Behaviour
    if (req.body.behaviour_ids) {
        const all_behaviour_ids = [
            ...(await CollateralBehaviour.findAll({ where: { collateral_id: collateral.id } })),
        ].map((t: any) => parseInt(t.behaviour_id));

        const collateralBehaviourToBeDeleted = all_behaviour_ids.filter(
            (t: any) => !req.body.behaviour_ids.includes(t)
        );

        const collateralBehaviourToBeAdded = req.body.behaviour_ids.filter((t: any) => !all_behaviour_ids.includes(t));

        await CollateralBehaviour.destroy({
            where: { behaviour_id: { [Op.in]: collateralBehaviourToBeDeleted }, collateral_id: collateral.id },
        });

        const collateralBehaviourCreate: any = [];

        for (const id of collateralBehaviourToBeAdded) {
            collateralBehaviourCreate.push({ collateral_id: collateral.id, behaviour_id: id });
        }

        await CollateralBehaviour.bulkCreate(collateralBehaviourCreate);
    }

    // Solution
    if (req.body.solution_ids) {
        const all_solution_ids = [
            ...(await CollateralSolution.findAll({ where: { collateral_id: collateral.id } })),
        ].map((t: any) => parseInt(t.solution_id));

        const solutionToBeDeleted = all_solution_ids.filter((t: any) => !req.body.solution_ids.includes(t));

        const solutionToBeAdded = req.body.solution_ids.filter((t: any) => !all_solution_ids.includes(t));

        await CollateralSolution.destroy({
            where: { solution_id: { [Op.in]: solutionToBeDeleted }, collateral_id: collateral.id },
        });

        const collateralSolutionCreate: any = [];

        for (const id of solutionToBeAdded) {
            collateralSolutionCreate.push({ collateral_id: collateral.id, solution_id: id });
        }

        await CollateralSolution.bulkCreate(collateralSolutionCreate);
    }

    // Barrier
    if (req.body.barrier_ids) {
        const all_barrier_ids = [...(await CollateralBarrier.findAll({ where: { collateral_id: collateral.id } }))].map(
            (t: any) => parseInt(t.barrier_id)
        );

        const collateralBarrierToBeDeleted = all_barrier_ids.filter((t: any) => !req.body.barrier_ids.includes(t));

        const collateralBarrierToBeAdded = req.body.barrier_ids.filter((t: any) => !all_barrier_ids.includes(t));

        await CollateralBarrier.destroy({
            where: { barrier_id: { [Op.in]: collateralBarrierToBeDeleted }, collateral_id: collateral.id },
        });

        const collateralBarrierCreate: any = [];

        for (const id of collateralBarrierToBeAdded) {
            collateralBarrierCreate.push({ collateral_id: collateral.id, barrier_id: id });
        }

        await CollateralBarrier.bulkCreate(collateralBarrierCreate);
    }

    return api("Collateral details saved successfully", res, collateral);
};

export const putCollateralCountry: RequestHandler = async (req, res) => {
    const collateral: any = await Collateral.findOne({ where: { uuid: req.params.uuid } });

    if (!collateral) {
        throw { message: "Collateral not found", code: 422 };
    }

    for (const collateralCountryObj of req.body.collateral_countries) {
        let collateralCountry: any = await CollateralCountry.findOne({
            where: { collateral_id: collateral.id, country_id: collateralCountryObj.country_id },
        });

        if (!collateralCountry) {
            collateralCountry = new CollateralCountry({
                collateral_id: collateral.id,
                country_id: collateralCountryObj.country_id,
            });
        }

        collateralCountry.brief = collateralCountryObj.brief ? collateralCountryObj.brief : collateralCountry.brief;
        collateralCountry.description = collateralCountryObj.description
            ? collateralCountryObj.description
            : collateralCountry.description;
        await collateralCountry.save();

        // Country media
        if (collateralCountryObj.media && collateralCountryObj.media.length > 0) {
            await addMedia("collateral_countries", collateralCountry.id, collateralCountryObj.media);
        }

        if (collateralCountryObj.media == null || collateralCountryObj.media == "null") {
            await deleteMedia("collateral_countries", [collateralCountry.id]);
        }
    }

    // Delete the countries that are no longer mapped
    if (req.body.deleted_countries && req.body.deleted_countries.length > 0) {
        const entity_ids = [
            ...(await CollateralCountry.findAll({
                where: { collateral_id: collateral.id, country_id: { [Op.in]: req.body.deleted_countries } },
            })),
        ].map((t: any) => parseInt(t.id));

        await deleteMedia("collateral_countries", entity_ids);

        await CollateralCountry.destroy({ where: { id: entity_ids } });
    }

    return api("Country specific collateral details saved successfully.", res, {});
};

export const putCollateralState: RequestHandler = async (req, res) => {
    const collateral: any = await Collateral.findOne({ where: { uuid: req.params.uuid } });

    if (!collateral) {
        throw { message: "Collateral not found", code: 422 };
    }

    if (req.body.collateral_states && req.body.collateral_states.length > 0) {
        for (const collateralStateObj of req.body.collateral_states) {
            let collateralState: any = await CollateralState.findOne({
                where: { collateral_id: collateral.id, state_id: collateralStateObj.state_id },
            });

            if (!collateralState) {
                collateralState = new CollateralState({
                    collateral_id: collateral.id,
                    state_id: collateralStateObj.state_id,
                });
            }

            const state: any = await State.findByPk(collateralStateObj.state_id);

            collateralState.description = collateralStateObj.description
                ? collateralStateObj.description
                : collateralState.description;
            collateralState.brief = collateralStateObj.brief ? collateralStateObj.brief : collateralState.brief;
            collateralState.country_id = state.country_id;

            await collateralState.save();

            // State media
            if (collateralStateObj.media && collateralStateObj.media.length > 0) {
                await addMedia("collateral_states", collateralState.id, collateralStateObj.media);
            }

            if (collateralStateObj.media == null || collateralStateObj.media == "null") {
                await deleteMedia("collateral_states", [collateralState.id]);
            }
        }
    }

    // Delete the states that are no longer mapped
    if (req.body.deleted_states && req.body.deleted_states.length > 0) {
        const entity_ids = [
            ...(await CollateralState.findAll({
                where: { collateral_id: collateral.id, state_id: { [Op.in]: req.body.deleted_states } },
            })),
        ].map((t: any) => parseInt(t.id));

        await deleteMedia("collateral_states", entity_ids);

        await CollateralState.destroy({ where: { id: entity_ids } });
    }

    return api("State specific collateral details saved successfully.", res, {});
};

export const putCollateralStatus: RequestHandler = async (req, res) => {
    const collateral: any = await Collateral.findOne({ where: { uuid: req.params.uuid } });

    if (!collateral) {
        throw { message: "Collateral data not found", code: 404 };
    }

    if (collateral.status != "published" && req.body.status == "unpublished") {
        throw { message: "Action not allowed. Collateral data is not published yet", code: 422 };
    }

    const mes =
        req.body.status == "published"
            ? "Collateral data published successfully"
            : "Collateral data unpublished successfully";

    collateral.status = req.body.status;
    await collateral.save();

    return api(mes, res, {});
};
