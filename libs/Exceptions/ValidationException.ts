import { RequestHandler } from "express";
import { validationResult } from "express-validator";
import { apiException } from "../Helpers/helpers";
import { fn, col, where, Op } from "sequelize";

export const throwError: RequestHandler = (req, res, next) => {
    const errorsResult = validationResult.withDefaults({
        formatter: (error) => {
            return {
                value: error.value,
                message: error.msg,
                param: error.param,
                location: error.location,
            };
        },
    });

    const errors = errorsResult(req);

    if (!errors.isEmpty()) {
        return apiException("", res, errors.array(), 422);
    }

    next();
};

export const validateTitle = async (Model: any, value: string, uuid: string | null, column = "title") => {
    const andClause: any = [where(fn("lower", col(column)), `${value.toLowerCase()}`)];

    if (uuid) {
        andClause.push({ uuid: { [Op.ne]: uuid } });
    }

    const topic: any = await Model.findOne({ where: { [Op.and]: andClause } });

    if (topic) {
        return Promise.reject("Name already exists. Please enter a different one");
    }

    return Promise.resolve();
};
