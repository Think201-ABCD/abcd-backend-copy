import axios from "axios";
import qs from "qs";
import { analyzeConfig } from "../Config/analyzeConfig";

export class AnalyzeClass {
    static api_key = analyzeConfig.api_key;
    static api_secret = analyzeConfig.api_secret;

    static sendAnalyzeData = async (data) => {
        const config: any = {
            method: "post",
            url: `${process.env.CHAT_GPT_API_ROUTE}/analyze`,
            headers: {
                ...data.getHeaders(),
                "api-key": this.api_key,
                "api-secret": this.api_secret,
            },
            data: data,
        };

        // console.log(config, "config")

        return new Promise((resolve, reject) => {
            axios(config)
                .then(function (response) {
                    resolve(response.data);
                })
                .catch(function (responseError) {
                    if (responseError.response?.status == 500) {
                        reject({ message: "Something went wrong. Please try again later or analyze a different text.", code: 422 });
                    } else {
                        reject(responseError.response?.data?.detail);
                    }
                });
        });
    };

    static sendAnalyzeDataText = async (data) => {
        const config: any = {
            method: "post",
            url: `${process.env.CHAT_GPT_API_ROUTE}/analyze`,
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                "api-key": this.api_key,
                "api-secret": this.api_secret,
            },
            data: qs.stringify(data),
        };

        return new Promise((resolve, reject) => {
            axios(config)
                .then(function (response) {
                    resolve(response.data);
                })
                .catch(function (responseError) {
                    if (responseError.response?.status == 500) {
                        reject({ message: "Something went wrong. Please try again later or analyze a different text.", code: 422 });
                    } else {
                        reject(responseError.response?.data?.detail);
                    }
                });
        });
    };

    static getAnalyzeSessions = async (query) => {
        const config: any = {
            method: "post",
            url: `${process.env.CHAT_GPT_API_ROUTE}/get_analyze_sessions`,
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
                    reject(responseError?.response?.data?.detail);
                });
        });
    };

    static getAnalyzeSessionData = async (query) => {
        const config: any = {
            method: "post",
            url: `${process.env.CHAT_GPT_API_ROUTE}/get_analyze_session_data`,
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
                    reject(responseError.response.data.detail);
                });
        });
    };

    static postAnalyzeSectionFeedback = async (query) => {
        const config: any = {
            method: "post",
            url: `${process.env.CHAT_GPT_API_ROUTE}/analyze_section_feedback`,
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
                    reject(JSON.stringify(responseError.response.data.detail));
                });
        });
    };

    static postAnalyzeFollowup = async (query) => {
        const config: any = {
            method: "post",
            url: `${process.env.CHAT_GPT_API_ROUTE}/analyze_followup`,
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
                    reject(JSON.stringify(responseError.response.data.detail));
                });
        });
    };

    static putAnalyzeSessionTitle = async (query) => {
        const config: any = {
            method: "post",
            url: `${process.env.CHAT_GPT_API_ROUTE}/add_session_title`,
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
}
