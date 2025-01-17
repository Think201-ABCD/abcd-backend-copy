import axios from "axios";

const ChatGPTroutes = {
    getResponse: "/get_answer",
    getLastSession: "/get_last_session",
    getSessionChats: "/get_session_chat",
    postFeedback: "/feedback",
};

export const getLastSessionDetails = async (user_id: any) => {
    const config: any = {
        method: "get",
        url: `${process.env.CHAT_GPT_API_ROUTE}${ChatGPTroutes.getLastSession}?user_id=${user_id}`,
        headers: {
            accept: "application/json",
            "api-key": `${process.env.CHAT_GPT_API_KEY}`,
            "api-secret": `${process.env.CHAT_GPT_API_SECRET}`,
        },
    };

    return new Promise((resolve, reject) => {
        axios(config)
            .then(function (response) {
                resolve(response.data);
            })
            .catch(function (responseError) {
                reject(responseError.data);
            });
    });
};

export const sendMessage = async (data: any) => {
    const config: any = {
        method: "post",
        url: `${process.env.CHAT_GPT_API_ROUTE}${ChatGPTroutes.getResponse}`,
        headers: {
            "Content-Type": "application/json",
            "api-key": `${process.env.CHAT_GPT_API_KEY}`,
            "api-secret": `${process.env.CHAT_GPT_API_SECRET}`,
        },
        data: JSON.stringify(data),
    };

    return new Promise((resolve, reject) => {
        axios(config)
            .then(function (response) {
                resolve(response.data);
            })
            .catch(function (responseError) {
                reject(responseError.data);
            });
    });
};

export const sendFeedback = async (data: any) => {
    const config: any = {
        method: "post",
        url: `${process.env.CHAT_GPT_API_ROUTE}${ChatGPTroutes.postFeedback}`,
        headers: {
            "Content-Type": "application/json",
            "api-key": `${process.env.CHAT_GPT_API_KEY}`,
            "api-secret": `${process.env.CHAT_GPT_API_SECRET}`,
        },
        data: JSON.stringify(data),
    };

    return new Promise((resolve, reject) => {
        axios(config)
            .then(function (response) {
                resolve(response.data);
            })
            .catch(function (responseError) {
                reject(responseError.data);
            });
    });
};

export const getSessionChatDetails = async (user_id: any, session_id: any) => {
    const config: any = {
        method: "get",
        url: `${process.env.CHAT_GPT_API_ROUTE}${ChatGPTroutes.getSessionChats}?user_id=${user_id}&session_id=${session_id}`,
        headers: {
            accept: "application/json",
            "api-key": `${process.env.CHAT_GPT_API_KEY}`,
            "api-secret": `${process.env.CHAT_GPT_API_SECRET}`,
        },
    };

    return new Promise((resolve, reject) => {
        axios(config)
            .then(function (response) {
                resolve(response.data);
            })
            .catch(function (responseError) {
                reject(responseError.data);
            });
    });
};