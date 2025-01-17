import { RequestHandler } from "express";
import { v4 as uuidv4 } from "uuid";
import { Op } from "sequelize";

//Helpers
import { api, apiException } from "@redlof/libs/Helpers/helpers";
import { addMedia, deleteMedia } from "@redlof/libs/Helpers/MediaHelper";
import { getCountryData, getFilteredBehaviours } from "@redlof/libs/Helpers/DataFilterHelper";

// Models
import { Behaviour } from "@redlof/libs/Models/Behaviour/Behaviour";
import { User } from "@redlof/libs/Models/Auth/User";

export const getBehaviours: RequestHandler = async (req: any, res) => {
    try {
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
            ],
        }).then(async ({ rows, count }: any) => {
            if (rows.length <= 0) {
                return { rows, count };
            }

            // if (!req.query.country_id)
            //     return { rows, count }

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
    } catch (e: any) {
        console.log(e);
        return apiException(e.message ? String(e.message) : String(e), res, {}, e.code ? e.code : 500);
    }
};
