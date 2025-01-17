import express from "express";
import { CorpusUserController } from "../Controllers/CorpusUsersController";
import { CorpusController } from "../Controllers/CorpusController";
export const router = express.Router();

const CorpusControllerObj = new CorpusController()
const CorpusUserControllerObj = new CorpusUserController()


router.use("/", CorpusControllerObj.router)

router.use("/member", CorpusUserControllerObj.router)




export default router;
