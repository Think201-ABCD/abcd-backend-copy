import { determineModel } from "@redlof/libs/Helpers/WorkspaceHelper";
import { Barrier } from "@redlof/libs/Models/Barrier/Barrier";
import { Behaviour } from "@redlof/libs/Models/Behaviour/Behaviour";
import { Collateral } from "@redlof/libs/Models/Collateral/Collateral";
import { Knowledge } from "@redlof/libs/Models/Knowledge/Knowledge";
import { Outcome } from "@redlof/libs/Models/Outcome/Outcome";
import { SubOutcome } from "@redlof/libs/Models/Outcome/SubOutcome";
import { Proposal } from "@redlof/libs/Models/ProposalRequest/Proposal";
import { Solution } from "@redlof/libs/Models/Solution/Solution";
import { SubTopic } from "@redlof/libs/Models/Topic/SubTopic";
import { Topic } from "@redlof/libs/Models/Topic/Topic";
import { Op } from "sequelize";

export const getModelInclude = (searched_entity, filter_data) => {
    let modelInclude = [];

    for (const data of filter_data) {
        // Dont include models for knowledge, proposal and collateral since they are not connected with each other

        if (
            (searched_entity === "knowledge-library" ||
                searched_entity === "collateral-library" ||
                searched_entity === "project-and-proposal") &&
            (data.entity === "knowledge-library" ||
                data.entity === "collateral-library" ||
                data.entity === "project-and-proposal")
        ) {
            continue;
        }

        // Dont include models of the entity to be searched

        if (searched_entity === data.entity) {
            continue;
        }

        const includeData = determineEntityInclude(data.entity, data.entity_ids);
        modelInclude.push(includeData);
    }

    return modelInclude;
};

const determineEntityInclude = (entity, entity_ids) => {
    let includeData = {};

    switch (entity) {
        case "barrier": {
            includeData = {
                as: "barriers",
                model: Barrier,
                attributes: ["uuid", "id", "title", "status"],
                where: { status: "published", id: { [Op.in]: [...entity_ids] } },
                required: true,
            };
            break;
        }
        case "behaviour": {
            includeData = {
                model: Behaviour,
                as: "behaviours",
                attributes: ["uuid", "id", "title", "status"],
                where: { status: "published", id: { [Op.in]: [...entity_ids] } },
                required: true,
            };
            break;
        }
        case "collateral-library": {
            includeData = {
                model: Collateral,
                as: "collaterals",
                attributes: ["uuid", "id", "title", "status"],
                where: { status: "published", id: { [Op.in]: [...entity_ids] } },
                required: true,
            };
            break;
        }
        case "knowledge-library": {
            includeData = {
                model: Knowledge,
                as: "knowledges",
                attributes: ["uuid", "id", "title", "status"],
                where: { status: "published", id: { [Op.in]: [...entity_ids] } },
                required: true,
            };
            break;
        }
        case "outcome": {
            includeData = {
                as: "outcomes",
                model: Outcome,
                attributes: ["uuid", "id", "title", "status"],
                where: { status: "published", id: { [Op.in]: [...entity_ids] } },
                required: true,
            };
            break;
        }
        case "sub-outcome": {
            includeData = {
                model: SubOutcome,
                as: "sub_outcomes",
                attributes: ["uuid", "id", "title", "status"],
                where: { status: "published", id: { [Op.in]: [...entity_ids] } },
                required: true,
            };
            break;
        }
        case "project-and-proposal": {
            includeData = {
                model: Proposal,
                as: "proposals",
                attributes: ["uuid", "id", "title", "status"],
                where: { status: "published", id: { [Op.in]: [...entity_ids] } },
                required: true,
            };
            break;
        }
        case "solution": {
            includeData = {
                model: Solution,
                as: "solutions",
                attributes: ["uuid", "id", "title", "status"],
                where: { status: "published", id: { [Op.in]: [...entity_ids] } },
                required: true,
            };
            break;
        }
        case "topic": {
            includeData = {
                as: "topics",
                model: Topic,
                attributes: ["uuid", "id", "title", "status"],
                where: { status: "published", id: { [Op.in]: [...entity_ids] } },
                required: true,
            };
            break;
        }
        case "sub-topic": {
            includeData = {
                as: "sub_topics",
                model: SubTopic,
                attributes: ["uuid", "id", "title", "status"],
                where: { status: "published", id: { [Op.in]: [...entity_ids] } },
                required: true,
            };
            break;
        }
    }

    return includeData;
};

export const convertUuidToId = async (filter_data) => {
    // Convert uuids to ids

    for (const filter_entry of filter_data) {
        const model = determineModel(filter_entry.entity);
        let entity_id_arr = [];

        for (const entity_uuid of filter_entry.entity_ids) {
            const model_data = await model.findOne({ where: { uuid: entity_uuid } });

            if (!model_data) {
                throw { message: `Selected ${filter_entry.entity} does not exist`, code: 422 };
            }

            entity_id_arr.push(model_data.id);
        }

        filter_entry.entity_ids = entity_id_arr;
    }

    return filter_data;
};
