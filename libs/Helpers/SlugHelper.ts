import { sequelize } from "../Loaders/database";

export const generateSlug = async (title: string, tableName: string, columnName = "slug") => {
    const main_slug = await title.replace(/\s+/g, "-").toLowerCase();

    let slug = await title.replace(/\s+/g, "-").toLowerCase();

    while (await checkSlugExists(slug, tableName, columnName)) {
        slug = main_slug + "-" + Math.random().toString(36).substring(2, 10);
    }

    return slug;
};

export const checkSlugExists = async (slug: string, tableName: string, columnName: string) => {
    const query = "SELECT COUNT(*) FROM " + tableName + " WHERE " + columnName + " = '" + slug + "'";

    const result: any = await sequelize.query(query, { raw: true });

    return parseInt(result[0][0]["count"]);
};
