import { RequestHandler } from "express";
import { v4 as uuidv4 } from "uuid";
import { Op } from "sequelize";

//Helpers
import { api, apiException } from "@redlof/libs/Helpers/helpers";

// Models
import { Prevalence } from "@redlof/libs/Models/Prevalence/Prevalence";
import { PrevalenceBehaviour } from "@redlof/libs/Models/Prevalence/PrevalenceBehaviour";
import { User } from "@redlof/libs/Models/Auth/User";
import { PrevalenceCountry } from "@redlof/libs/Models/Prevalence/PrevalenceCountry";
import { State } from "@redlof/libs/Models/Data/State";
import { Behaviour } from "@redlof/libs/Models/Behaviour/Behaviour";
import { rearrangePrevalenceData } from "@redlof/libs/Helpers/DataHelper";

export const getPrevalences: RequestHandler = async (req: any, res) => {
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

    const { rows, count } = await Prevalence.findAndCountAll({
        limit: req.query.limit ? req.query.limit : null,
        offset: req.query.page && req.query.limit ? (Number(req.query.page) - 1) * Number(req.query.limit) : 0,
        attributes: { exclude: ["added_by", "updated_at", "deleted_at"] },
        order: [["created_at", "desc"]],
        where: clause,
        subQuery: false,
        distinct: true,
    });

    const pages = req.query.limit ? count / Number(req.query.limit) : 1;

    return api("", res, { total: count, pages: Math.ceil(pages), data: rows });
};

export const getPrevalence: RequestHandler = async (req, res) => {
    const countryClause: any = {};

    if (req.query.country_id) {
        countryClause.country_id = req.query.country_id;
        countryClause.state_id = null;
    }

    if (req.query.state_id) {
        countryClause.state_id = req.query.state_id;
    }

    let prevalence: any = await Prevalence.findOne({
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
                model: Behaviour,
                as: "behaviours",
                attributes: ["id", "uuid", "title", "logo"],
                required: false,
                where: { status: "published" },
            },
        ],
    });

    if (!prevalence) {
        throw { message: "Prevalence not found", code: 404 };
    }

    prevalence = prevalence.toJSON();
    countryClause.prevalence_id = prevalence.id;

    const prevalenceData = await PrevalenceCountry.findAll({
        where: countryClause,
        attributes: { exclude: ["updated_at", "deleted_at"] },
    });

    const data = await rearrangePrevalenceData(prevalenceData);

    prevalence = { ...prevalence, ...data };

    return api("", res, prevalence);
};

export const postPrevalence: RequestHandler = async (req: any, res) => {
    const prevalence: any = req.body.uuid
        ? await Prevalence.findOne({ where: { uuid: req.body.uuid } })
        : new Prevalence({ uuid: uuidv4(), added_by: res.locals.user.id, status: "draft" });

    if (!prevalence) {
        throw { message: "Prevalence data not found", code: 404 };
    }

    // Add primary details
    prevalence.name = req.body.name ? req.body.name : prevalence.name;
    prevalence.license = req.body.license ? req.body.license : prevalence.license;
    await prevalence.save();

    // Behaviours
    if (req.body.behaviour_ids) {
        const all_behaviour_ids = [
            ...(await PrevalenceBehaviour.findAll({ where: { prevalence_id: prevalence.id } })),
        ].map((t: any) => parseInt(t.behaviour_id));

        const behaviourToBeDeleted = all_behaviour_ids.filter((t: any) => !req.body.behaviour_ids.includes(t));

        const prevalenceBehaviourBeAdded = req.body.behaviour_ids.filter((t: any) => !all_behaviour_ids.includes(t));

        await PrevalenceBehaviour.destroy({
            where: { behaviour_id: { [Op.in]: behaviourToBeDeleted }, prevalence_id: prevalence.id },
        });

        const prevalenceBehaviourCreate: any = [];

        for (const id of prevalenceBehaviourBeAdded) {
            prevalenceBehaviourCreate.push({ prevalence_id: prevalence.id, behaviour_id: id });
        }

        await PrevalenceBehaviour.bulkCreate(prevalenceBehaviourCreate);
    }

    return api("Prevalence data saved successfully.", res, prevalence);
};

export const putPrevalenceDataSet: RequestHandler = async (req, res) => {
    const prevalence: any = await Prevalence.findOne({ where: { uuid: req.params.uuid } });

    if (!prevalence) {
        throw { message: "Prevalence not found", code: 422 };
    }

    for (const dataSet of req.body.data_set) {
        for (const datavalue of dataSet.data) {
            if (datavalue.id) {
                let prevalenceData: any = await PrevalenceCountry.findOne({
                    where: {
                        id: datavalue.id,
                    },
                });

                prevalenceData.start_year = datavalue.start_year ? datavalue.start_year : prevalenceData.start_year;
                prevalenceData.end_year = datavalue.end_year ? datavalue.end_year : prevalenceData.end_year;
                prevalenceData.meta = datavalue.meta ? datavalue.meta : prevalenceData.meta;

                await prevalenceData.save();
            } else {
                await PrevalenceCountry.create({
                    prevalence_id: prevalence.id,
                    country_id: dataSet.country_id,
                    start_year: datavalue.start_year,
                    end_year: datavalue.end_year,
                    meta: datavalue.meta,
                    status: "active",
                    state_id: dataSet.state_id ? dataSet.state_id : null,
                });
            }
        }
    }

    // Delete the countries that are no longer mapped
    if (req.body.deleted_data && req.body.deleted_data.length > 0) {
        await PrevalenceCountry.destroy({ where: { id: { [Op.in]: req.body.deleted_data } } });
    }

    return api("Prevalence details saved successfully.", res, {});
};

export const putPrevalenceStatus: RequestHandler = async (req, res) => {
    const prevalence: any = await Prevalence.findOne({ where: { uuid: req.params.uuid } });

    if (!prevalence) {
        throw { message: "Prevalence not found", code: 404 };
    }

    if (prevalence.status != "published" && req.body.status == "unpublished") {
        throw { message: "Action not allowed. prevalence is not published yet", code: 422 };
    }

    const mes =
        req.body.status == "published" ? "Prevalence published successfully" : "Prevalence unpublished successfully";

    prevalence.status = req.body.status;
    await prevalence.save();

    return api(mes, res, {});
};
