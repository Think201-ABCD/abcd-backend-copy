import { RequestHandler, Response } from "express";
import { uploadFile } from "./FileUploadHelper";
import moment from "moment";
import { redisLpushAsync } from "../Loaders/redis";
import axios from "axios";

/* eslint-disable @typescript-eslint/no-var-requires */
const debug = require("debug");

export const error = debug("abcd:error");
error.color = debug.colors[5];
export const info = debug("abcd:info");
info.color = debug.colors[1];
export const exception = debug("abcd:exception");
exception.color = debug.colors[2];

info.log = console.log.bind(console);

export const api = async (message: any, res: Response, data: any) => {
    const response: any = {};

    response.error = false;
    response.message = message;
    response.status = 200;
    response.body = data;

    return res.status(200).json(response);
};

export const apiError = async (error: any, res: Response, data: any, status = 406) => {
    const response: any = {};

    response.error = true;
    response.message = error.message ? error.message : String(error);
    response.status = status;
    response.body = data;

    if (process.env.NODE_ENV != "development") {
        postlogApi(error, "error");
    }

    return res.status(status).json(response);
};

export const apiException = async (message: any, res: Response, data: any, status = 406) => {
    const response: any = {};

    response.error = true;
    response.message = message;
    response.status = status;
    response.body = data;
    response.date = new Date();

    if (process.env.NODE_ENV != "development") {
        postlogApi(response, "error");
    }

    return res.status(status).json(response);
};

export const fileUploader: RequestHandler = async (req: any, res: Response) => {
    try {
        const path = await uploadFile(req.file, req.body);

        const uploadData = {
            filename: req.file.originalname,
            path: path,
            url: `${process.env.AWS_BASE_URL + path}`,
            mime_type: req.file.mimetype,
        };

        return api("File uploaded successfully.", res, uploadData);
    } catch (e) {
        return apiException(String(e), res, {}, 500);
    }
};

export const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000);
};

export const postlogApi = async (error_response, type) => {
    const payload = {
        type: type, // info or error
        app: process.env.APP_NAME, // Application name
        env: process.env.NODE_ENV, // Staging or Prod
        data: error_response ? error_response : null,
        stack: error_response.stack,

        // file: request.body.file_name ? request.body.file_name : null,
        // service: request.body.service, //service name
    };

    const response = axios.post(`${process.env.LOG_API_URL}`, payload);
};
