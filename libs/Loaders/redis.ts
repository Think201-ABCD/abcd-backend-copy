import { promisify } from "util";
import redis from "redis";

import { logError, logInfo } from "../Helpers/LogHelper";

export const redis_client = redis.createClient();
export const publisher_client = redis.createClient();
export const subscriber_client = redis.createClient();

export const redisPublish = (channel: string, message_data: any) => {
    publisher_client.publish(channel, JSON.stringify(message_data));
};

export const redisHgetAsync = async (key: string, field: string | number | bigint) => {
    const hgetAsync = promisify(redis_client.hget).bind(redis_client);

    const data = await hgetAsync(key, field);

    return JSON.parse(data);
};

export const redisHdelAsync = async (key: string, field: string | number | bigint) => {
    const hdelAsync = promisify(redis_client.hdel).bind(redis_client);

    const count = await hdelAsync(key, field);

    return count;
};

export const redisHsetAsync = async (key: string, field: string | number | bigint, value: any, expireInSeconds = 0) => {
    const hsetAsync = promisify(redis_client.hset).bind(redis_client);

    const count = await hsetAsync(key, field, JSON.stringify(value));

    if(expireInSeconds){
        const expireAsync = promisify(redis_client.expire).bind(redis_client)
        await expireAsync(key, expireInSeconds)
    }

    return count;
};

//Heplers for redis List
export const redisLpushAsync = async (key: any, field: any) => {
    const data = await redis_client.LPUSH(key, field);

    return data;
};

//Heplers for redis Range
export const redisLrangeAsync = async (key: any, from: any, to: any) => {
    const data = await redis_client.LRANGE(key, from, to);

    return data;
};

// Event listner for redis clients
subscriber_client.on("subscribe", (channel: string, count: number) => {
    logInfo(null, "action", `Subscribed to ${channel} with count: ${count}`);
});

redis_client.on("error", function (error: any) {
    logError(null, "action", "Error in redis client" + error);
});
