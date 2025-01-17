import { RequestHandler } from "express";
import { Op } from "sequelize";

//Helpers
import { api, apiException } from "@redlof/libs/Helpers/helpers";
import { getFilteredStates, getFilteredCountrys } from "@redlof/libs/Helpers/DataFilterHelper";

// Models
import { Country } from "@redlof/libs/Models/Data/Country";
import { State } from "@redlof/libs/Models/Data/State";

export const getCountries: RequestHandler = async (req, res) => {
    const clause: any = { [Op.and]: [], status: "active" };
    const andSymbol: any = Object.getOwnPropertySymbols(clause)[0];

    // Get country ids if any filters applied
    clause.id = { [Op.in]: await getFilteredCountrys(req.query) };

    if (req.query.search) {
        clause[andSymbol].push({
            [Op.or]: [{ name: { [Op.iLike]: `%${req.query.search}%` } }],
        });
    }

    if (req.query.usecase == "source") {
        clause.status = { [Op.in]: ["active", "inactive"] };
    }

    const countries: any = await Country.findAll({
        where: clause,
        attributes: { exclude: ["currency", "phone_code"] },
    });

    return api("", res, countries);
};

export const getStates: RequestHandler = async (req, res) => {
    const clause: any = { [Op.and]: [], status: "active" };
    const andSymbol: any = Object.getOwnPropertySymbols(clause)[0];

    // Get state ids if any filters applied
    clause.id = { [Op.in]: await getFilteredStates(req.query) };

    if (req.query.search) {
        clause[andSymbol].push({
            [Op.or]: [{ name: { [Op.iLike]: `%${req.query.search}%` } }],
        });
    }

    if (req.query.usecase == "source") {
        clause.status = { [Op.in]: ["active", "inactive"] };
    }

    const states: any = await State.findAll({
        where: clause,
        order: [["name", "asc"]],
    });

    return api("", res, states);
};
