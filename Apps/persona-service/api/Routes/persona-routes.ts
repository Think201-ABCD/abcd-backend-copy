import express from "express";
export const router = express.Router();

import { PersonaController } from "../Controllers/PersonaController";
import {PersonaDataController} from "../Controllers/personaDataController"

const PersonaControllerObj = new PersonaController();
const PersonaDataControllerObj = new PersonaDataController()

router.use("/data", PersonaDataControllerObj.router)
router.use("/", PersonaControllerObj.router);

export default router;
