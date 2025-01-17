require("express-async-errors");

// Loading env variables while starting the app
import { dotenvLoad } from "dotenv-mono";
dotenvLoad();

// Dependencies
import express, { response } from "express";
import cors from "cors";
import morgan from "morgan";

// Loaders
import { databaseLoader } from "@redlof/libs/Loaders/database";
import { queueLoader } from "@redlof/app/operation-service/Loaders/queue";
import { errorNotificationService } from "@redlof/app/operation-service/Queues/telegram-notification-handler";

// Import routes
import moduleRoutes from "./api/index";
import { router as authRoutes } from "@redlof/app/auth-service/api/Routes/index";
import { router as dataRoutes } from "@redlof/app/data-service/api/index";
import { router as publicDataRoutes } from "@redlof/app/data-service/Public/index";
import { router as operationRoutes } from "@redlof/app/operation-service/api/index";
import { router as chatRoutes } from "@redlof/app/chat-service/api/Routes/index";
import { router as corpusRoutes } from "@redlof/app/corpus/api/Routes/index";
import { router as courseLibraryRoutes } from "@redlof/app/course-services/api/Routes/route-course";
import analyzeRoutes from "@redlof/app/analyze-service/api/Routes/route-analyze";
import evaluatorRoutes from "@redlof/app/analyze-service/api/Routes/route-evaluate";
import { router as personaRoutes} from "@redlof/app/persona-service/api/Routes/persona-routes"

// schedulers
import { sourceDownloadReportScheduler } from "@redlof/libs/Schedulers/sourceDownloadsReportScheduler";
import { newUserStatsMailScheduler } from "@redlof/libs/Schedulers/newUserStatsMailScheduler";

import { apiError, info } from "@redlof/libs/Helpers/helpers";
import { Logger } from "@redlof/libs/System/Logger";
import AnalysisViaMailService from "@redlof/libs/Services/AnalysisViaMailService";
import path from "path";

// Initializing Express App
const app = express();

// Parse the request body
app.use(express.json());

app.use(express.urlencoded({ extended: true }));

// Enable CORS
app.use(cors());

// For Logging
// app.use(morgan("tiny"));

// Load all the queues
queueLoader();
errorNotificationService();

// Sequelize Initialization
databaseLoader();

// Schedulers
sourceDownloadReportScheduler();
newUserStatsMailScheduler();

//IMAP Server connection
if (process.env.NODE_ENV != "development") {
    AnalysisViaMailService.init();
}

// Express router
const router = express.Router();

// Use imported routes
router.use("/users", moduleRoutes);

router.use("/auth", authRoutes);

router.use("/data", dataRoutes);

router.use("/data/public", publicDataRoutes);

router.use("/operations", operationRoutes);

router.use("/chat", chatRoutes);

router.use("/corpus", corpusRoutes);

router.use("/course-library", courseLibraryRoutes);

router.use("/analyze", analyzeRoutes);
router.use("/evaluate", evaluatorRoutes);

router.use("/personas", personaRoutes)

app.use("/", router);

app.use(express.static(path.join(`../../deploy`)));

app.get("/", async (req, res) => {
    res.status(200).json({ msg: "ABCD Service API's Homepage" });
});

// Listen to a port
app.listen(process.env.USER_SERVICE_PORT || 3000, () => {
    console.log(`Server started on port ${process.env.USER_SERVICE_PORT || 3000}`);
});

app.use((err, req, res, next) => {
    if (process.env.NODE_ENV === "production") {
        Logger.exceptionReporting(err, req, res);
    }

    return apiError(err, res, {}, err.code ? err.code : 500);
});
