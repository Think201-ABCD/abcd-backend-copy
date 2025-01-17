import Bull from "bull";
import moment from "moment";

import redis from "redis";
const redis_client = redis.createClient();

import { promisify } from "util";

const redlofLog = function (
    user_id: bigint | number | null,
    type: string,
    operation: string,
    time: any,
    log: string,
    meta: any
) {
    const redlofLogQueue = new Bull("queue:redlof:logs");

    const data = {
        user_id: user_id,
        operation: operation,
        type: type,
        origin: "bas-auth-service",
        log: log,
        meta: meta,
        time: time,
    };

    redlofLogQueue.add(data);

    return;
};

export const logInfo = function (user_id: bigint | number | null, operation: string, log: string, meta?: any) {
    const current_time = moment();

    const formatted_current_time = current_time.format("MM-DD HH:mm:ss.SSS");

    console.log("\x1b[36m%s\x1b[0m", formatted_current_time, log);

    redlofLog(user_id, "info", operation, current_time, log, meta);

    return;
};

export const logError = function (user_id: bigint | number | null, operation: string, log: string, meta?: any) {
    const current_time = moment();

    const formatted_current_time = current_time.format("MM-DD HH:mm:ss.SSS");

    console.error("\x1b[36m%s\x1b[0m", formatted_current_time, log);

    redlofLog(user_id, "error", operation, current_time, log, meta);

    return;
};

export const redlofUser = async function (user_id: number) {
    const hget = promisify(redis_client.hget).bind(redis_client);

    const current_user = await hget("current_users", user_id);

    return JSON.parse(current_user);
};
