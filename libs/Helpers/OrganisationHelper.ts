import { Op } from "sequelize";
import { OrganisationMember } from "../Models/Organisation/OrganisationMember";
import { ORGANISATION_ID } from "../Constants/emailDomain";

export const validateOrganisationAccess = async (organisation: any, user: any, roles: Array<string>) => {
    const organisationMember = await OrganisationMember.findOne({
        where: { organisation_id: organisation.id, user_id: user.id, type: { [Op.in]: roles } },
    });

    if (!organisationMember) {
        throw { message: "Invalid access. Please check your access to this action.", code: 422 };
    }

    return true;
};

export const getOrgainsationId = (email: string) => {
    const domain = email.split("@")[1];

    if (Object.keys(ORGANISATION_ID).includes(domain)) {
        return ORGANISATION_ID[domain];
    }

    return null;
};
