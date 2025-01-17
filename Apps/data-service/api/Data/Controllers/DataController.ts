import { RequestHandler } from "express";
import _ from "lodash";
import { Op } from "sequelize";

//Helpers
import { api, apiException } from "@redlof/libs/Helpers/helpers";
import { Barrier } from "@redlof/libs/Models/Barrier/Barrier";
import { Behaviour } from "@redlof/libs/Models/Behaviour/Behaviour";
import { Collateral } from "@redlof/libs/Models/Collateral/Collateral";
import { EntityType } from "@redlof/libs/Models/Data/EntityType";
import { getFilteredTopics } from "@redlof/libs/Helpers/DataFilterHelper";

// Models
import { Sdgs } from "@redlof/libs/Models/Data/Sdgs";
import { Knowledge } from "@redlof/libs/Models/Knowledge/Knowledge";
import { Outcome } from "@redlof/libs/Models/Outcome/Outcome";
import { SubOutcome } from "@redlof/libs/Models/Outcome/SubOutcome";
import { Proposal } from "@redlof/libs/Models/ProposalRequest/Proposal";
import { Solution } from "@redlof/libs/Models/Solution/Solution";
import { SubTopic } from "@redlof/libs/Models/Topic/SubTopic";
import { Topic } from "@redlof/libs/Models/Topic/Topic";
import { SourceDownload } from "@redlof/libs/Models/Data/SourceDownloads";
import { Organisation } from "@redlof/libs/Models/Organisation/Organisation";
import { OrganisationMember } from "@redlof/libs/Models/Organisation/OrganisationMember";

export const getSdgs: RequestHandler = async (req, res) => {
    const sdgs = await Sdgs.findAll({ order: [["name", "asc"]] });

    return api("Topic fetched successfully", res, sdgs);
};

export const getEntityTyes: RequestHandler = async (req, res) => {
    const query: any = {};

    if (req.query.entity) {
        query.entity = req.query.entity;
    }

    const types = await EntityType.findAll({
        attributes: { exclude: ["id", "created_at", "updated_at", "status"] },
        where: query,
        order: [["name", "asc"]],
    });

    return api("", res, types);
};

export const getRecentUpdates: RequestHandler = async (req, res) => {
    // no of recent udpates
    const N = 10;

    const data: any = [];

    let entity: any;

    let response: any;

    const topics: any = await Topic.findAll({
        limit: N,
        order: [["created_at", "desc"]],
        where: { status: "published" },
        attributes: ["uuid", "title", "logo", "status", "created_at"],
    });

    for (const e of topics) {
        e.setDataValue("entity", "topic");
    }

    const subTopics: any = await SubTopic.findAll({
        limit: N,
        order: [["created_at", "desc"]],
        where: { status: "published" },
        attributes: ["uuid", "title", "logo", "status", "created_at"],
    });

    for (const e of subTopics) {
        e.setDataValue("entity", "sub_topic");
    }

    const outcomes: any = await Outcome.findAll({
        limit: N,
        order: [["created_at", "desc"]],
        where: { status: "published" },
        attributes: ["uuid", "title", "logo", "types", "status", "created_at"],
    });

    for (const e of outcomes) {
        e.setDataValue("entity", "outcome");
    }

    const subOutcomes: any = await SubOutcome.findAll({
        limit: N,
        order: [["created_at", "desc"]],
        where: { status: "published" },
        attributes: ["uuid", "title", "logo", "status", "created_at"],
    });

    for (const e of subOutcomes) {
        e.setDataValue("entity", "sub_outcome");
    }

    const behaviours: any = await Behaviour.findAll({
        limit: N,
        order: [["created_at", "desc"]],
        where: { status: "published" },
        attributes: ["uuid", "title", "logo", "status", "created_at"],
    });

    for (const e of behaviours) {
        e.setDataValue("entity", "behaviour");
    }

    const barriers: any = await Barrier.findAll({
        limit: N,
        order: [["created_at", "desc"]],
        where: { status: "published" },
        attributes: ["uuid", "title", "logo", "type", "status", "created_at"],
    });

    for (const e of barriers) {
        e.setDataValue("entity", "barrier");
    }

    const solutions: any = await Solution.findAll({
        limit: N,
        order: [["created_at", "desc"]],
        where: { status: "published" },
        attributes: ["uuid", "title", "confidence", "status", "created_at"],
    });

    for (const e of solutions) {
        e.setDataValue("entity", "solution");
    }

    const knowledges: any = await Knowledge.findAll({
        limit: N,
        order: [["created_at", "desc"]],
        where: { status: "published" },
        attributes: ["uuid", "title", "type", "logo", "status", "created_at"],
    });

    for (const e of knowledges) {
        e.setDataValue("entity", "knowledge");
    }

    const collaterals: any = await Collateral.findAll({
        limit: N,
        order: [["created_at", "desc"]],
        where: { status: "published" },
        attributes: ["uuid", "title", "logo", "status", "created_at"],
    });

    for (const e of collaterals) {
        e.setDataValue("entity", "collateral");
    }

    const proposals: any = await Proposal.findAll({
        limit: N,
        order: [["created_at", "desc"]],
        where: { status: "published" },
        attributes: ["uuid", "title", "logo", "brief", "description", "status", "created_at"],
    });

    for (const e of proposals) {
        e.setDataValue("entity", "proposal");
    }

    response = [...topics, ...subTopics, ...outcomes, ...subOutcomes, ...barriers, ...behaviours, ...knowledges, ...solutions, ...collaterals, ...proposals];

    response = _.orderBy(response, "created_at", "desc");

    response = response.slice(0, 10);

    return api("", res, response);
};

export const getSearchResults: RequestHandler = async (req, res) => {
    const primary_value: any = req?.query?.primary_value;
    const requested_values: any = req?.query?.requested_values;

    const requested_values_array: any = requested_values?.split(",");

    let data: any = {};

    // filter code start's here
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

    if (requested_values_array.includes("barrier")) {
        let barrier = await Barrier.findAll({
            where: clause,
        });

        data.barrier = barrier;
    }

    if (requested_values_array.includes("behaviour")) {
        let behaviour = await Behaviour.findAll({
            where: clause,
        });

        data.behaviour = behaviour;
    }

    if (requested_values_array.includes("solution")) {
        let solutions = await Solution.findAll({
            where: clause,
        });

        data.solutions = solutions;
    }

    if (requested_values_array.includes("outcome")) {
        let outcome = await Outcome.findAll({
            where: clause,
        });

        data.outcome = outcome;
    }

    if (requested_values_array.includes("topic")) {
        let topic = await Topic.findAll({
            where: clause,
        });

        data.topic = topic;
    }

    return api("", res, data);
};

export const postSourceDownloads: RequestHandler = async (req, res) => {
    const domain = res.locals.user.email.split("@")[1];

    const sourceDownloadCreationData: any = {
        user_id: res.locals.user.id,
    };

    const query: any = { user_id: res.locals.user.id };

    if (req.body.knowledge_id) {
        sourceDownloadCreationData.knowledge_id = req.body.knowledge_id;
        query.knowledge_id = req.body.knowledge_id;
    }

    if (req.body.collateral_id) {
        sourceDownloadCreationData.collateral_id = req.body.collateral_id;
        query.collateral_id = req.body.collateral_id;
    }

    const sourceDownloadRecorded = await SourceDownload.findOne({
        where: query,
        attributes: ["id"],
    });

    if (sourceDownloadRecorded) {
        return api("", res, {});
    }

    const primaryOrganisation: any = await Organisation.findOne({
        where: {
            [Op.or]: [{ domain: domain }, { added_by: res.locals.user.id }],
        },
        attributes: ["id", "uuid"],
        include: [
            {
                model: OrganisationMember,
                as: "members",
                where: { user_id: res.locals.user.id, status: "active" },
                attributes: [],
            },
        ],
    });

    if (primaryOrganisation) sourceDownloadCreationData.organisation_id = primaryOrganisation.id;

    await SourceDownload.create(sourceDownloadCreationData);

    api("success", res, {});
};

export const getOrganisations: RequestHandler = async (req, res) => {
    const query: any = {};

    if (req.query.country_id) {
        query.country_id = req.query.country_id;
    }

    const { rows, count } = await Organisation.findAndCountAll({
        where: query,
        attributes: ["id", "uuid", "name", "country_id"],
    });

    const data = JSON.parse(JSON.stringify(rows))

    data.forEach((org: any) => {
            org.title = org.name
    });

    const pages = req.query.limit ? count / Number(req.query.limit) : 1;
    api("Fetched organisations successfully", res, { total: count, pages: Math.ceil(pages), data: data });
};
