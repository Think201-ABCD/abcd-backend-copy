import express from "express";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import fs from "fs";

import { authorize } from "@redlof/libs/Middlewares/AuthenticationMiddleware";
import { throwError } from "@redlof/libs/Exceptions/ValidationException";
import { Validate } from "../Validations/validations";
import { api } from "@redlof/libs/Helpers/helpers";
import { uploadToGoogleDrive } from "@redlof/libs/Helpers/GoogleDriveHelper";

// Models
import { User } from "@redlof/libs/Models/Auth/User";
import { Corpus } from "@redlof/libs/Models/Corpus/Corpus";

export class CorpusController {
    router;

    constructor() {
        this.router = express.Router();
        this.initializeRoutes();
    }

    initializeRoutes = () => {
        this.router.route("/").get(authorize(["role-corpus-reviewer", "role-admin"]), this.getCorpus);
        this.router.route("/add").post(authorize(["role-corpus-editor"]), Validate("addCorpus"), throwError, this.addCorpus);
        this.router.route("/update").put(authorize(["role-corpus-reviewer", "role-admin"]), Validate("editCorpus"), throwError, this.editCorpus);
        this.router.route("/list").get(authorize(["role-corpus-reviewer", "role-admin"]), this.listCorpus);
        this.router.route("/update-status").put(authorize(["role-corpus-reviewer", "role-admin"]), Validate("updateStatus"), throwError, this.updateStatus);
    };

    addCorpus = async (req, res) => {
        // Check if the corpus is URl or file

        // If the corpus is URL
        // check for the content is provided, if the content is not provided make a python call to get the content.
        // get the meta data of the page

        // If the corpus is file
        // get the file name and comment and store the data.
        // is_govt, page range to be stored in file meta.

        let data: any = {
            uuid: uuidv4(),
            type: req.body.corpus_type,
            user_id: res.locals.user.id,
            comment: req.body.comment,
            tags: req.body.tags,
            status: "pending",
        };

        if (req.body.corpus_type == "url") {
            if (!req.body.url) {
                throw { message: "Please provide the url", code: 422 };
            }

            // Type URL
            data.url = req.body.url;

            let content: any;

            if (!req.body.content) {
                // get the content from other service
                let pageContent: any = await this._getPageContent(data.url);
                content = pageContent.body.content;
            } else {
                content = req.body.content;
            }

            let metaData: any = await this._getPageMeta(data.url);

            data.page_meta = JSON.stringify({
                content: content,
                meta_data: {
                    title: metaData.body.title ? metaData.body.title : null,
                    image: metaData.body.icon ? metaData.body.icon : null,
                },
            });
        } else {
            if (!req.body.file_name || !req.body.file || !req.body.page_range) {
                throw { message: "Please provide all the file details", code: 422 };
            }

            data.file = req.body.file;
            data.file_meta = {
                file_name: req.body.file_name,
                is_govt: req.body.is_govt ? req.body.is_govt : false,
                page_range: req.body.page_range,
            };
        }

        await Corpus.create(data);

        return api(`Thank you! corpus submitted successfully`, res, {});
    };

    editCorpus = async (req, res) => {
        let corpus: any = await Corpus.findOne({
            where: {
                uuid: req.body.uuid,
            },
        });

        if (!corpus) {
            throw {
                message: "Invalid Corpus details",
                code: 422,
            };
        }

        if (corpus.reviewer_id && corpus.reviewer_id != res.locals.user_id) {
            throw {
                message: "Sorry you are not allowed to edit this Corpus! This Corpus is reviwed by another reviwer.",
                code: 422,
            };
        }

        corpus.comment = req.body.comment ? req.body.comment : corpus.comment;
        corpus.tags = req.body.tags ? req.body.tags : corpus.tags;

        await corpus.save();

        return api(`Thank you! corpus updated successfully`, res, corpus);
    };

    listCorpus = async (req, res) => {
        let query: any = {};

        // Status Filter
        if (req.query.status) {
            query.status = req.query.status;
        }

        if (req.query.editor_id) {
            query.user_id = req.query.editor_id;
        }

        if (req.query.reviewer_id) {
            query.reviewer_id = req.query.reviewer_id;
        }

        let { rows, count } = await Corpus.findAndCountAll({
            where: query,
            limit: req.query.limit ? req.query.limit : null,
            offset: req.query.page && req.query.limit ? (Number(req.query.page) - 1) * Number(req.query.limit) : 0,
            attributes: ["uuid", "url", "page_meta", "file", "file_meta", "tags", "user_id", "comment", "created_at"],
            include: [
                {
                    model: User,
                    as: "user",
                    attributes: ["first_name", "last_name", "email", "photo"],
                },
            ],
            order: [["created_at", "DESC"]],
        });

        const pages = req.query.limit ? count / Number(req.query.limit) : 1;

        return api(`Corpuses fetched successfully`, res, { total: count, pages: Math.ceil(pages), data: rows });
    };

    getCorpus = async (req, res) => {
        let corpus = await Corpus.findOne({
            where: {
                uuid: req.query.uuid,
            },
            include: [
                {
                    model: User,
                    as: "user",
                    attributes: ["first_name", "last_name", "email", "photo"],
                },
                {
                    model: User,
                    as: "reviewer",
                    required: false,
                    attributes: ["first_name", "last_name", "email", "photo"],
                },
            ],
        });

        return api("Corpus fetched successfully", res, corpus);
    };

    updateStatus = async (req, res) => {
        let corpus: any = await Corpus.findOne({
            where: {
                uuid: req.body.uuid,
            },
        });

        if (!corpus) {
            throw {
                message: "Invalid Corpus Id",
                code: 422,
            };
        }

        if (corpus.reviewer_id && corpus.reviewer_id != res.locals.user.id) {
            throw {
                message: "Sorry you are not allowed to edit this Corpus! This Corpus is reviwed by another reviwer.",
                code: 422,
            };
        }

        corpus.status = req.body.status;
        corpus.reviewer_id = res.locals.user.id;
        await corpus.save();

        if (corpus.status === "approved") {
            // save the corpus file to google drive
            let fileName;
            const folderName = process.env.DRIVE_CORPUS_FOLDER ? process.env.DRIVE_CORPUS_FOLDER : "ABCD_Corpus";
            const mimeType = corpus.type === "url" ? "text/plain" : "application/pdf";
            try {
                if (corpus.type == "url") {
                    fileName = corpus.page_meta?.meta_data?.title ? `${corpus.uuid}:${corpus.page_meta?.meta_data?.title}` : `${uuidv4()}`;
                    fs.writeFileSync(`${process.env.APP_PUBLIC_PATH}/temp/${fileName}`, `${corpus.page_meta?.meta_data?.title}\n\n`);
                    fs.appendFileSync(`${process.env.APP_PUBLIC_PATH}/temp/${fileName}`, `${corpus.page_meta?.content}\n`);
                }

                if (corpus.type === "file") {
                    fileName = corpus.file_meta?.file_name ? `${corpus.uuid}:${corpus.file_meta?.file_name}` : `${uuidv4()}`;

                    const config: any = {
                        method: "GET",
                        url: corpus.file,
                        responseType: "arraybuffer",
                        responseEncoding: "binary",
                    };
                    const file = await axios(config);
                    fs.writeFileSync(`${process.env.APP_PUBLIC_PATH}/temp/${corpus.uuid}:${corpus.file_meta?.file_name}`, file.data);
                }

                await uploadToGoogleDrive(fileName, folderName, mimeType);
                fs.unlinkSync(`${process.env.APP_PUBLIC_PATH}/temp/${fileName}`);
            } catch (err) {
                console.error(err);
            }
        }

        return api(`Corpus ${corpus.status} successfully`, res, corpus);
    };

    _getPageContent = async (url: any) => {
        const config: any = {
            method: "post",
            url: `${process.env.PYTHON_API_URL}/get_text`,
            headers: {
                accept: "application/json",
                "api-key": `${process.env.PYTHON_API_KEY}`,
                secret: `${process.env.PYTHON_SECRET}`,
            },
            data: {
                page_url: url,
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

    _getPageMeta = async (url: any) => {
        const config: any = {
            method: "post",
            url: `${process.env.PYTHON_API_URL}/get_meta`,
            headers: {
                accept: "application/json",
                "api-key": `${process.env.PYTHON_API_KEY}`,
                secret: `${process.env.PYTHON_SECRET}`,
            },
            data: {
                page_url: url,
            },
        };

        console.log(config);

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
}
