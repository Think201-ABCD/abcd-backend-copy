import { Request, RequestHandler, Response, Router } from "express";
import { Op } from "sequelize";

// Models
import { Barrier } from "@redlof/libs/Models/Barrier/Barrier";
import { Solution } from "@redlof/libs/Models/Solution/Solution";
import { Knowledge } from "@redlof/libs/Models/Knowledge/Knowledge";
import { Organisation } from "@redlof/libs/Models/Organisation/Organisation";
import { Collateral } from "@redlof/libs/Models/Collateral/Collateral";

export class ScriptController {
    router;

    constructor() {
        this.router = Router();
        this.initializeRoutes();
    }

    // Initialise the routes
    initializeRoutes = () => {
        // Public
        this.router.route("/barriers/source-links").put(this.addBarrierSourceLinks);
        this.router.route("/solutions/source-links").put(this.addSolutionsSourceLinks);
        this.router.route("/knowledge-library/organisation-ids").put(this.addKnowledgeOrganisationIds);
        this.router.route("/collateral-library/organisation-ids").put(this.putCollateralOrganisations);
    };

    addBarrierSourceLinks: RequestHandler = async (req: Request, res: Response) => {
        const barrierSourceLinks = await Barrier.findAll({
            attributes: ["id", "source_link"],
        });

        barrierSourceLinks.forEach(async (barrier: any) => {
            if (barrier.source_link) {
                const data: any = { source_links: [barrier.source_link] };
                await Barrier.update(data, {
                    where: { id: barrier.id },
                });
            }
        });

        res.send("operation successfull");
    };

    addSolutionsSourceLinks: RequestHandler = async (req: Request, res: Response) => {
        const solutionSourceLinks = await Solution.findAll({
            attributes: ["id", "source_link"],
        });

        solutionSourceLinks.forEach(async (solution: any) => {
            if (solution.source_link) {
                const data: any = { source_links: [solution.source_link] };
                await Solution.update(data, {
                    where: { id: solution.id },
                });
            }
        });

        res.send("operation successfull");
    };

    addKnowledgeOrganisationIds: RequestHandler = async (req: Request, res: Response) => {
        const knowledges = await Knowledge.findAll({
            attributes: ["id", "organisations", "title", "organisation_ids"],
        });

        knowledges.forEach(async (knowledge: any) => {
            const organisations = await Organisation.findAll({
                where: {
                    name: { [Op.in]: knowledge.organisations },
                },
                attributes: ["id", "name"],
            });

            const organisation_ids = organisations.map((organisation: any) => organisation.id);
            knowledge.organisation_ids = organisation_ids;
            await knowledge.save();
        });

        res.send("operation successfull");
    };

    // To update the organisation field in collateral from organisation name to organisation id
    putCollateralOrganisations: RequestHandler = async (req: Request, res: Response) => {
        const collateral = await Collateral.findAll({
            attributes: ["id", "organisations", "title"],
        });

        collateral.forEach(async (collateral: any) => {
            if (typeof collateral.organisations[0] !== "number") {
                const organisations = await Organisation.findAll({
                    where: {
                        name: { [Op.in]: collateral.organisations },
                    },
                    attributes: ["id", "name"],
                });

                const organisation_ids = organisations.map((organisation: any) => organisation.id);
                collateral.organisations = organisation_ids;
                await collateral.save();
            }
        });

        res.send("operation successfull");
    };
}
