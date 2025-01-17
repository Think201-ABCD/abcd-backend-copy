import axios from "axios";
import qs from "qs";

export class CockpitServiceClass {
    static api_key = process.env.CHAT_GPT_API_KEY;
    static api_secret = process.env.CHAT_GPT_API_SECRET;

    static getPrompts = async (query: any) => {
        const config: any = {
            method: "GET",
            url: `${process.env.AI_COCKPIT_API_ROUTE}/get_prompts`,
            params: query,
            headers: {
                "Content-Type": "application/json",
                "api-key": this.api_key,
                "api-secret": this.api_secret,
            },
        };

        // console.log(config);

        return new Promise((resolve, reject) => {
            axios(config)
                .then(function (response) {
                    resolve(response.data);
                })
                .catch(function (responseError) {
                    reject(responseError.response?.data?.detail || responseError.response.data);
                });
        });
    };

    static updatePrompts = async (data, params) => {
        const config: any = {
            method: "PUT",
            url: `${process.env.AI_COCKPIT_API_ROUTE}/update_prompts`,
            headers: {
                "Content-Type": "application/json",
                "api-key": this.api_key,
                "api-secret": this.api_secret,
            },
            data: data,
            params: params
        };

        // console.log(config, "config");

        return new Promise((resolve, reject) => {
            axios(config)
                .then(function (response) {
                    resolve(response.data);
                })
                .catch(function (responseError) {
                    reject(responseError.response?.data?.detail || responseError.response.data);
                });
        });
    };

    static getAnalyzerCommentsSummaryPrompts = async (query: any) => {
        const config: any = {
            method: "GET",
            url: `${process.env.AI_COCKPIT_API_ROUTE}/get_analyzer_comments_summary_prompts`,
            params: query,
            headers: {
                "Content-Type": "application/json",
                "api-key": this.api_key,
                "api-secret": this.api_secret,
            },
        };

        // console.log(config);

        return new Promise((resolve, reject) => {
            axios(config)
                .then(function (response) {
                    resolve(response.data);
                })
                .catch(function (responseError) {
                    reject(responseError.response?.data?.detail || responseError.response.data);
                });
        });
    };

    static getAnalyzerProposalSummaryPrompts = async (query: any) => {
        const config: any = {
            method: "GET",
            url: `${process.env.AI_COCKPIT_API_ROUTE}/get_analyzer_proposal_summary_prompts`,
            params: query,
            headers: {
                "Content-Type": "application/json",
                "api-key": this.api_key,
                "api-secret": this.api_secret,
            },
        };

        // console.log(config);

        return new Promise((resolve, reject) => {
            axios(config)
                .then(function (response) {
                    resolve(response.data);
                })
                .catch(function (responseError) {
                    reject(responseError.response?.data?.detail || responseError.response.data);
                });
        });
    };

    static updateAnalyzerCommentsSummaryPrompts = async (data) => {
        const config: any = {
            method: "PUT",
            url: `${process.env.AI_COCKPIT_API_ROUTE}/update_analyzer_comments_summary_prompts`,
            headers: {
                "Content-Type": "application/json",
                "api-key": this.api_key,
                "api-secret": this.api_secret,
            },
            data: data,
        };

        // console.log(config, "config");

        return new Promise((resolve, reject) => {
            axios(config)
                .then(function (response) {
                    resolve(response.data);
                })
                .catch(function (responseError) {
                    reject(responseError.response?.data?.detail || responseError.response.data);
                });
        });
    };

    static updateProposalSummaryPrompts = async (data) => {
        const config: any = {
            method: "PUT",
            url: `${process.env.AI_COCKPIT_API_ROUTE}/update_analyzer_proposal_summary_prompts`,
            headers: {
                "Content-Type": "application/json",
                "api-key": this.api_key,
                "api-secret": this.api_secret,
            },
            data: data,
        };

        // console.log(config, "config");

        return new Promise((resolve, reject) => {
            axios(config)
                .then(function (response) {
                    resolve(response.data);
                })
                .catch(function (responseError) {
                    reject(responseError.response?.data?.detail || responseError.response.data);
                });
        });
    };
}
