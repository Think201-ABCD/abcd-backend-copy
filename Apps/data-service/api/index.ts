import express from "express";
export const router = express.Router();

// Import module routes
import TopicRoutes from "./Topics/Routes/route-topic";
import SubTopicRoutes from "./Topics/Routes/route-sub-topic";
import LocationRoutes from "./Location/Routes/routes-location";
import DataRoutes from "./Data/Routes/route-data";
import LanguageRoutes from "./Languages/Routes/route-languages";
import OutcomeRoutes from "./Outcomes/Routes/route-outcome";
import SubOutcomeRoutes from "./Outcomes/Routes/route-sub-outcome";
import BehaviourRoutes from "./Behaviour/Routes/route-behaviour";
import BehaviourJourneyRoutes from "./Behaviour/Routes/route-behaviour-journey";
import BarrierRoutes from "./Barrier/Routes/route-barrier";
import SolutionRoutes from "./Solution/Routes/route-solution";
import CollateralRoutes from "./Collateral/Routes/route-collateral";
import KnowledgeRoutes from "./Knowledge/Routes/route-knowledge";
import PrevalenceRoutes from "./Prevalence/Routes/route-prevalence";
import ProposalRoutes from "./ProposalRequests/Routes/route-proposal";

router.use("/", LocationRoutes);

router.use("/", DataRoutes);

router.use("/languages", LanguageRoutes);

router.use("/topics", TopicRoutes);

router.use("/sub-topics", SubTopicRoutes);

router.use("/outcomes", OutcomeRoutes);

router.use("/sub-outcomes", SubOutcomeRoutes);

router.use("/behaviours", BehaviourRoutes);
router.use("/behaviours", BehaviourJourneyRoutes);

router.use("/solutions", SolutionRoutes);

router.use("/barriers", BarrierRoutes);

router.use("/collaterals", CollateralRoutes);

router.use("/knowledges", KnowledgeRoutes);

router.use("/prevalences", PrevalenceRoutes);

router.use("/proposals", ProposalRoutes);

export default router;
