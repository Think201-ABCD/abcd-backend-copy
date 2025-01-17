import express from "express";
import { authorize } from "../Middlewares/AuthenticationMiddleware";

export class AuthenticatedApiBaseController {
    router;

    constructor() {
        this.router = express.Router();
        this.router.use("/", authorize(["role-all"]));
        this.initializeRoutes();
    }

    initializeRoutes() {
        //
    }
}
