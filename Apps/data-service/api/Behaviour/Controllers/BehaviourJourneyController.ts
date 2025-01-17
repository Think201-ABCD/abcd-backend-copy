import { RequestHandler } from "express";
import { v4 as uuidv4 } from "uuid";
import { Op } from "sequelize";

//Helpers
import { api, apiException } from "@redlof/libs/Helpers/helpers";

// Models
import { Behaviour } from "@redlof/libs/Models/Behaviour/Behaviour";
import { BehaviourJourney } from "@redlof/libs/Models/Behaviour/BehaviourJourney";
import { Country } from "@redlof/libs/Models/Data/Country";
import { State } from "@redlof/libs/Models/Data/State";
import { BehaviourJourneyStage } from "@redlof/libs/Models/Behaviour/BehaviourJourneyStage";
import { BehaviourJourneyBarrier } from "@redlof/libs/Models/Behaviour/BehaviourJourneyBarrier";
import { BehaviourJourneySolution } from "@redlof/libs/Models/Behaviour/BehaviourJourneySolution";
import { Barrier } from "@redlof/libs/Models/Barrier/Barrier";
import { Solution } from "@redlof/libs/Models/Solution/Solution";

export const getBehaviourJourneys: RequestHandler = async (req, res) => {
    const behaviour: any = await Behaviour.findOne({ where: { uuid: req.params.uuid } });

    if (!behaviour) {
        throw { message: "Behaviour not found", code: 404 };
    }

    const query: any = { behaviour_id: behaviour.id };

    if (req.query.country_id) {
        query.country_id = req.query.country_id;
    }

    if (req.query.state_id) {
        query.state_id = req.query.state_id;
    }

    if (!req.query.state_id) {
        query.state_id = null;
    }

    if (req.query.status) {
        query.status = req.query.status;
    }

    const behaviourJourneys = await BehaviourJourney.findAll({
        where: query,
        order: [
            ["id", "desc"],
            ["behaviour_journey_stages", "sequence", "asc"],
        ],
        include: [
            { model: Country, as: "country", attributes: ["id", "name"], required: false },
            { model: State, as: "state", attributes: ["id", "name"], required: false },
            {
                model: Behaviour,
                as: "behaviour",
                attributes: ["id", "uuid", "title", "logo", "status"],
                required: false,
            },
            {
                model: BehaviourJourneyStage,
                as: "behaviour_journey_stages",
                required: false,
                include: [
                    {
                        model: Barrier,
                        as: "barriers",
                        attributes: ["id", "uuid", "title", "type", "logo"],
                        required: false,
                        where: { status: "published" },
                    },
                    {
                        model: Solution,
                        as: "solutions",
                        attributes: ["id", "uuid", "title", "logo", "status"],
                        required: false,
                        where: { status: "published" },
                    },
                ],
            },
        ],
    });

    return api("", res, behaviourJourneys);
};

export const postBehaviourJourneys: RequestHandler = async (req: any, res) => {
    const behaviour: any = await Behaviour.findOne({ where: { uuid: req.params.uuid } });
    let state: any = null;

    if (!behaviour) {
        throw { message: "Behaviour not found", code: 404 };
    }

    const country = await Country.findOne({ where: { id: req.body.country_id } });

    if (!country) {
        throw { message: "Country not found", code: 422 };
    }

    if (req.body.state_id) {
        state = await State.findOne({ where: { id: req.body.state_id, country_id: country.id } });

        if (!state) {
            throw { message: "State not found", code: 422 };
        }
    }

    const query: any = { behaviour_id: behaviour.id, country_id: country.id, state_id: state ? state.id : null };

    if (req.body.uuid) {
        query.uuid = req.body.uuid;
    }

    let behaviourJourney: any = await BehaviourJourney.findOne({ where: query });

    if (!behaviourJourney) {
        delete query.uuid;
        behaviourJourney = new BehaviourJourney({
            uuid: uuidv4(),
            added_by: res.locals.user.id,
            status: "draft",
            behaviour_id: behaviour.id,
            ...query,
        });
    }

    behaviourJourney.title = req.body.title ? req.body.title : behaviourJourney.title;
    behaviourJourney.banner = req.body.banner ? req.body.banner : behaviourJourney.getDataValue("banner");
    behaviourJourney.description = req.body.description ? req.body.description : behaviourJourney.description;
    behaviourJourney.stages = req.body.stages ? req.body.stages : behaviourJourney.stages;
    await behaviourJourney.save();

    // Seed the stages for the journey
    if (req.body.stages && req.body.stages > 0) {
        const existsingStages = [
            ...(await BehaviourJourneyStage.findAll({ where: { behaviour_journey_id: behaviourJourney.id } })),
        ].map((journeyStage: any) => parseInt(journeyStage.id));
        const stageIds: any = [];

        for (let stage = 1; stage <= req.body.stages; stage++) {
            // Check if the stae is already exists
            let journeyStage = await BehaviourJourneyStage.findOne({
                where: { behaviour_journey_id: behaviourJourney.id, sequence: stage },
            });

            if (!journeyStage) {
                journeyStage = await BehaviourJourneyStage.create({
                    behaviour_journey_id: behaviourJourney.id,
                    sequence: stage,
                });
            }

            stageIds.push(Number(journeyStage.id));
        }

        // Get the difference if Ids and remove them
        const stagesToBeRemoved = existsingStages.filter((stageId) => !stageIds.includes(stageId));

        if (stagesToBeRemoved.length) {
            await BehaviourJourneyStage.destroy({
                where: { id: { [Op.in]: stagesToBeRemoved }, behaviour_journey_id: behaviourJourney.id },
            });
        }
    }

    return api("Behaviour journey details saved successfully", res, behaviourJourney);
};

export const putBehaviourJourneyStatus: RequestHandler = async (req, res) => {
    const behaviour: any = await Behaviour.findOne({ where: { uuid: req.params.uuid } });

    if (!behaviour) {
        throw { message: "Behaviour not found", code: 404 };
    }

    const query: any = { behaviour_id: behaviour.id, uuid: req.params.journey_uuid };

    // Get the behaviour journey
    const behaviourJourney = await BehaviourJourney.findOne({ where: query });

    if (!behaviourJourney) {
        throw { message: "Behaviour journey not found", code: 404 };
    }

    if (behaviourJourney.status != "published" && req.body.status == "unpublished") {
        throw { message: "Action not allowed. Behaviour is not published yet", code: 422 };
    }

    const mes =
        req.body.status == "published" ? "Behaviour published successfully" : "Behaviour unpublished successfully";

    behaviourJourney.status = req.body.status;
    await behaviourJourney.save();

    return api(mes, res, {});
};

export const putBehaviourJourneyStage: RequestHandler = async (req, res) => {
    const behaviour: any = await Behaviour.findOne({ where: { uuid: req.params.uuid } });

    if (!behaviour) {
        throw { message: "Behaviour not found", code: 404 };
    }

    const query: any = { behaviour_id: behaviour.id, uuid: req.params.journey_uuid };

    // Get the behaviour journey
    const behaviourJourney = await BehaviourJourney.findOne({ where: query });

    if (!behaviourJourney) {
        throw { message: "Behaviour journey not found", code: 404 };
    }

    // Get the journey stage
    const journeyStage = await BehaviourJourneyStage.findOne({
        where: { id: req.params.stage_id, behaviour_journey_id: behaviourJourney.id },
    });

    if (!journeyStage) {
        throw { message: "Journey stage details not found", code: 404 };
    }

    journeyStage.title = req.body.title ? req.body.title : journeyStage.title;
    journeyStage.description = req.body.description ? req.body.description : journeyStage.description;
    journeyStage.banner = req.body.banner ? req.body.banner : journeyStage.getDataValue("banner");
    await journeyStage.save();

    if (req.body.barrier_ids) {
        const stageBarrierIds = [
            ...(await BehaviourJourneyBarrier.findAll({ where: { behaviour_journey_stage_id: journeyStage.id } })),
        ].map((journeyBarrier: any) => parseInt(journeyBarrier.barrier_id));

        const stageBarrierToBeDeleted = stageBarrierIds.filter((t: any) => !req.body.barrier_ids.includes(t));

        const stageBarrierToBeAdded = req.body.barrier_ids.filter((t: any) => !stageBarrierIds.includes(t));

        await BehaviourJourneyBarrier.destroy({
            where: {
                barrier_id: { [Op.in]: stageBarrierToBeDeleted },
                behaviour_journey_stage_id: journeyStage.id,
            },
        });

        const stageBarrierCreate: any = [];

        for (const id of stageBarrierToBeAdded) {
            stageBarrierCreate.push({
                behaviour_journey_id: behaviourJourney.id,
                behaviour_journey_stage_id: journeyStage.id,
                barrier_id: id,
            });
        }

        await BehaviourJourneyBarrier.bulkCreate(stageBarrierCreate);
    }

    if (req.body.solution_ids) {
        const stagesolutionIds = [
            ...(await BehaviourJourneySolution.findAll({ where: { behaviour_journey_stage_id: journeyStage.id } })),
        ].map((journeySolution: any) => parseInt(journeySolution.solution_id));

        const stagesolutionToBeDeleted = stagesolutionIds.filter((t: any) => !req.body.solution_ids.includes(t));

        const stagesolutionToBeAdded = req.body.solution_ids.filter((t: any) => !stagesolutionIds.includes(t));

        await BehaviourJourneySolution.destroy({
            where: {
                solution_id: { [Op.in]: stagesolutionToBeDeleted },
                behaviour_journey_stage_id: journeyStage.id,
            },
        });

        const stagesolutionCreate: any = [];

        for (const id of stagesolutionToBeAdded) {
            stagesolutionCreate.push({
                behaviour_journey_id: behaviourJourney.id,
                behaviour_journey_stage_id: journeyStage.id,
                solution_id: id,
            });
        }

        await BehaviourJourneySolution.bulkCreate(stagesolutionCreate);
    }

    return api("Behaviour journey stage details saved successfully", res, journeyStage);
};
