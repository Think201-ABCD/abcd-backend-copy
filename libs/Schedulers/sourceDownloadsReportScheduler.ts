import { uniq, groupBy } from "lodash";
import { Op } from "sequelize";
import cron from "node-cron";
import moment from "moment";
import Bull from "bull";

// Models
import { Knowledge } from "@redlof/libs/Models/Knowledge/Knowledge";
import { Collateral } from "@redlof/libs/Models/Collateral/Collateral";
import { SourceDownload } from "@redlof/libs/Models/Data/SourceDownloads";
import { Organisation } from "@redlof/libs/Models/Organisation/Organisation";
import { User } from "../Models/Auth/User";

export const sourceDownloadReportScheduler = async () => {
    // cron.schedule("0 0 1 */1 *", async () => {
    cron.schedule("0 18 */2 * *", async () => {
        const mailDatas = await _getMailDatas();

        Object.keys(mailDatas).forEach(async (key: any) => {
            await new Bull(`${process.env.REDIS_EMAIL_QUEUE}`).add({
                type: "monthly-source-download-report",
                data: mailDatas[key],
            });
        });
    });
};

const _getMailDatas = async () => {
    const sourceDownloads = await SourceDownload.findAll({
        where: { created_at: { [Op.gte]: moment().subtract(1, "month").toDate() } },
        include: [
            {
                model: Knowledge,
                as: "knowledge",
                required: false,
                attributes: ["id", "uuid", "title", "organisation_ids"],
            },
            {
                model: Collateral,
                as: "collateral",
                required: false,
                attributes: ["id", "uuid", "title", "organisations"],
            },
            {
                model: Organisation,
                as: "organisation",
                required: false,
                attributes: ["id", "uuid", "name"],
            },
        ],
    });

    const organisationIds: any = [];
    sourceDownloads.forEach((data: any) => {
        if (data.knowledge) {
            organisationIds.push(data.knowledge.organisation_ids.map(Number));
        }
        if (data.collateral) {
            organisationIds.push(data.collateral.organisations);
        }
    });

    const uniqOrgIds = uniq(organisationIds.flat());

    const organisations = await Organisation.findAll({
        where: { id: { [Op.in]: uniqOrgIds } },
        attributes: ["id", "name"],
        include: [
            {
                model: User,
                as: "admin",
                attributes: ["id", "email", "first_name", "last_name"],
            },
        ],
    });

    const mailData: any = {};
    organisations.forEach((organisation: any) => {
        mailData[organisation.id] = {
            org_id: organisation.id,
            org_admin_email: organisation.admin.email,
            org_admin: organisation.admin.first_name,
            org_name: organisation.name,
            knowledgeData: [],
            collateralData: [],
        };
    });

    // Get knowledge data
    const sourceGroupByKnowledge = groupBy(sourceDownloads, "knowledge.id");
    Object.keys(sourceGroupByKnowledge).forEach((key: string) => {
        const data = sourceGroupByKnowledge[key];
        const knowledgeOrgIds = data[0]?.knowledge?.organisation_ids;
        if (!knowledgeOrgIds) return;

        const knowledgeData: any = {
            knowledge_title: data[0]?.knowledge?.title,
            total_downloads: data.length,
        };

        const dataGroupByUserOrg = groupBy(data, "organisation.name");
        Object.keys(dataGroupByUserOrg).forEach((key) => {
            if (key === "undefined") return (knowledgeData["no_org_user"] = dataGroupByUserOrg[key].length);
            knowledgeData[key] = dataGroupByUserOrg[key].length;
        });

        knowledgeOrgIds.forEach((orgId) => {
            mailData[orgId].knowledgeData.push(knowledgeData);
        });
    });

    // Get collateral data
    const sourceGroupByCollateral = groupBy(sourceDownloads, "collateral.id");
    Object.keys(sourceGroupByCollateral).forEach((key: string) => {
        const data = sourceGroupByCollateral[key];
        const collateralOrgIds = data[0]?.collateral?.organisations;
        if (!collateralOrgIds) return;

        const collateralData: any = {
            collateral_title: data[0]?.collateral?.title,
            total_downloads: data.length,
        };

        const dataGroupByUserOrg = groupBy(data, "organisation.name");
        Object.keys(dataGroupByUserOrg).forEach((key) => {
            if (key === "undefined") return (collateralData["no_org_user"] = dataGroupByUserOrg[key].length);
            collateralData[key] = dataGroupByUserOrg[key].length;
        });

        collateralOrgIds.forEach((orgId) => {
            mailData[orgId].collateralData.push(collateralData);
        });
    });

    return mailData;
};
