import { RequestHandler } from "express";
import { redisLrangeAsync, redis_client } from "@redlof/libs/Loaders/redis";
import { api, apiException } from "@redlof/libs/Helpers/helpers";
import { info } from "console";

export const getErrorLog: RequestHandler = async (req: any, res) => {
    try {
        let data: any = await redisLrangeAsync(`error:exceptions:${req.query.date}`, 0, -1);


        let a = await redis_client.LRANGE(`error:exceptions:${req.query.date}`, 0, -1);

        res.send(a)
        return

        let response = [];

        for (const item of data) {
            const a = JSON.parse(item);
            response.push(a);
        }

        return api("", res, response);
    } catch (e: any) {
        return apiException(e.message ? String(e.message) : String(e), res, {}, e.code ? e.code : 500);
    }
};
