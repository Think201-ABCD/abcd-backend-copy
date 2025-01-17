// Dependencies
require("express-async-errors");

import express from "express";
import bodyParser from "body-parser";
import { dotenvLoad } from "dotenv-mono";
dotenvLoad();

import morgan from "morgan";
import cors from "cors";

// Loaders
import { queueLoader } from "@redlof/app/operation-service/Loaders/queue";
queueLoader();

// import routes
import RouteChemLabs from "./chemLab/Routes/index";
import RouteScripts from "./scripts/Routes/routes-scripts";

// Initializing Express App
const app = express();

// Parse the request body
app.use(bodyParser.json({ limit: "200mb" }));

app.use(bodyParser.urlencoded({ limit: "200mb", extended: true }));

app.use(cors());

// For Logging
// app.use(morgan("tiny"));

// Express router
const router = express.Router();

// Member api Routes
router.use("/scripts", RouteScripts);
router.use("/", RouteChemLabs);

// Use imported routes
app.use("/api", router);

app.get("/", (_req, res) => {
    res.status(200).json({ msg: "Labs Service Hello" });
});

// Listen to a port
app.listen(3000, () => {
    console.log(`Labs Server started on port 3000`);
});
