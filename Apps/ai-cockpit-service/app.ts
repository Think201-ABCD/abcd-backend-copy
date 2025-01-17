require("express-async-errors");

// Loading env variables while starting the app
import { dotenvLoad } from "dotenv-mono";
dotenvLoad();

// Dependencies
import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import morgan from "morgan";
import path from "path";

// Loaders
import { apiError } from "@redlof/libs/Helpers/helpers";
import { queueLoaderCockpit } from "@redlof/libs/Loaders/queue";


// import routes
import authRoutes from "./auth/Routes/route-auth";
import userRoutes from "./user/Routes/route-user";
import cockpitRoutes from "./cockpit/Routes/route-cockpit";

// Initializing Express App
const app = express();
// Express router
const router = express.Router();

// Parse the request body
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// CORS
app.use(cors());

// Load all the queues
queueLoaderCockpit()

// Static serve
app.use(express.static(path.join(__dirname, "./../assets/")));

// For Logging
app.use(morgan("tiny"));

// routing
app.use("/auth", authRoutes);
app.use("/users", userRoutes);
app.use("/cockpit", cockpitRoutes);
app.use("/", router);

app.get("/", (req, res) => {
    res.status(200).json({ msg: "ABCD cockpit API's Homepage" });
});

// Listen to a port
app.listen(process.env.COCKPIT_API_SERVICE_PORT || 3001, () => {
    console.log(`Server started on port ${process.env.COCKPIT_API_SERVICE_PORT || 3001}`);
});

app.use((err, req, res, next) => {
    const message = {
        message: err.message ? String(err.message) : String(err),
    };

    return apiError(message.message, res, message, err.code ? err.code : 500);
});
