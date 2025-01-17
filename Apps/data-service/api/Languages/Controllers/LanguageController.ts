import { RequestHandler } from "express";

//Helpers
import { api, apiException } from "@redlof/libs/Helpers/helpers";

// Models
import { Language } from "@redlof/libs/Models/Data/Language";

export const getLanguages: RequestHandler = async (req, res) => {
    const languages = await Language.findAll({ order: [["name", "asc"]] });

    return api("", res, languages);
};
