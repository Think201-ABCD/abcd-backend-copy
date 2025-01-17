import jwt from "jsonwebtoken";

// Models
import { User } from "../Models/Auth/User";

import { redisHsetAsync, redisHdelAsync } from "../Loaders/redis";

export const setTokenInRedis = (user: User, token: string) => {
    const data = {
        user_id: user.id,
        token: token,
        ip_address: null,
        device: null,
    };

    redisHsetAsync(`${process.env.REDIS_AUTH_TOKENS}`, user.uuid, data);

    return;
};

export const deleteTokenFromRedis = (user: User) => {
    redisHdelAsync("user_tokens", user.uuid);

    return;
};

export const generateAuthToken = (payload: any) => {
    try {
        return jwt.sign(payload, `${process.env.TOKEN_SECRET}`, { expiresIn: `${process.env.TOKEN_EXPIRY_HOURS}h` });
    } catch (e) {
        throw String(e);
    }
};
