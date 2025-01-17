import express from "express";

export class ApiBaseController {
    router;

    constructor() {
        this.router = express.Router({ mergeParams: true });
    }

    initializeRoutes() {
        //

    }
}