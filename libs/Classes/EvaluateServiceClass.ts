import axios from "axios";
import qs from "qs";
import { analyzeConfig } from "@redlof/libs/Config/analyzeConfig";

export class EvaluateServiceClass {
    static api_key = analyzeConfig.api_key;
    static api_secret = analyzeConfig.api_secret;

    static sendEvaluateData = async (data) => {
        const config: any = {
            method: "post",
            url: `${process.env.CHAT_GPT_API_ROUTE}/custom_evaluator`,
            headers: {
                ...data.getHeaders(),
                "api-key": this.api_key,
                "api-secret": this.api_secret,
            },
            data: data,
            'maxContentLength': Infinity,
            'maxBodyLength': Infinity
        };

        console.log(config)

        // console.log(config, "config");

        return new Promise((resolve, reject) => {
            axios(config)
                .then(function (response) {
                    resolve(response.data);
                })
                .catch(function (responseError) {
                    if (responseError.response?.status == 500) {
                        reject({ message: "Something went wrong. Please try again later or evaluate a different file.", code: 422 });
                    } else {

                        console.log("Error in the api", responseError)
                        reject(responseError?.response?.data?.detail);
                    }
                });
        });
    };

    static getEvaluateSessions = async (query) => {
        const config: any = {
            method: "post",
            url: `${process.env.CHAT_GPT_API_ROUTE}/get_custom_evaluator_sessions`,
            headers: {
                accept: "application/json",
                "api-key": this.api_key,
                "api-secret": this.api_secret,
            },
            params: query,
        };

        // console.log(config, "config")

        return new Promise((resolve, reject) => {
            axios(config)
                .then(function (response) {
                    resolve(response.data);
                })
                .catch(function (responseError) {
                    if (responseError?.response?.data?.detail === "No sessions found for this user.") {
                        resolve([]);
                    }
                    reject(responseError?.response?.data?.detail);
                });
        });
    };

    static getSessionData = async (data) => {
        const config: any = {
            method: "post",
            url: `${process.env.CHAT_GPT_API_ROUTE}/get_custom_evaluator_session_data`,
            headers: {
                "Content-Type": "application/json",
                "api-key": this.api_key,
                "api-secret": this.api_secret,
            },
            params: data,
        };

        // console.log(config, "config")

        return new Promise((resolve, reject) => {
            axios(config)
                .then(function (response) {
                    resolve(response.data);
                })
                .catch(function (responseError) {
                    reject(responseError.response.data.detail);
                });
        });
    };

    static putEvaluateSessionTitle = async (query) => {
        const config: any = {
            method: "post",
            url: `${process.env.CHAT_GPT_API_ROUTE}/add_custom_evaluator_session_title`,
            headers: {
                accept: "application/json",
                "api-key": this.api_key,
                "api-secret": this.api_secret,
            },
            params: query,
        };

        return new Promise((resolve, reject) => {
            axios(config)
                .then(function (response) {
                    resolve(response.data);
                })
                .catch(function (responseError) {
                    reject(JSON.stringify(responseError.response?.data?.detail || responseError.response?.data));
                });
        });
    };

    static sendFeedback = async (data) => {
        const config: any = {
            method: "post",
            url: `${process.env.CHAT_GPT_API_ROUTE}/custom_evaluator_section_feedback`,
            headers: {
                "Content-Type": "application/json",
                "api-key": this.api_key,
                "api-secret": this.api_secret,
            },
            params: data,
        };

        // console.log(config, "config")

        return new Promise((resolve, reject) => {
            axios(config)
                .then(function (response) {
                    resolve(response.data);
                })
                .catch(function (responseError) {
                    reject(JSON.stringify(responseError.response.data.detail));
                });
        });
    };

    static postEvaluateFollowup = async (data) => {
        const config: any = {
            method: "post",
            url: `${process.env.CHAT_GPT_API_ROUTE}/custom_evaluator_followup`,
            headers: {
                "Content-Type": "application/json",
                "api-key": this.api_key,
                "api-secret": this.api_secret,
            },
            params: data,
        };

        return new Promise((resolve, reject) => {
            axios(config)
                .then(function (response) {
                    resolve(response.data);
                })
                .catch(function (responseError) {
                    reject(JSON.stringify(responseError.response.data.detail));
                });
        });
    };

    static getOrganisationIds = async () => {
        const config: any = {
            method: "post",
            url: `${process.env.CHAT_GPT_API_ROUTE}/get_organization_id`,
            headers: {
                accept: "application/json",
                "api-key": this.api_key,
                "api-secret": this.api_secret,
            },
        };

        // console.log(config, "config")

        return new Promise((resolve, reject) => {
            axios(config)
                .then(function (response) {
                    resolve(response?.data);
                })
                .catch(function (responseError) {
                    reject(responseError?.response?.data?.detail);
                });
        });
    };
}
