import { MediaData } from "../Models/Media/MediaData";
import { Op } from "sequelize";

export const addMedia = async (entity: string, entity_id: number, media: any[]) => {
    try {
        const mediaData: any = [];

        for (const m of media) {
            mediaData.push({
                entity: entity,
                entity_id: entity_id,
                type: m.type,
                file: m.file,
                file_name: m.file_name ? m.file_name : null,
            });
        }

        // Delete any previous media
        await MediaData.destroy({ where: { entity: entity, entity_id: entity_id } });

        // Update the media
        await MediaData.bulkCreate(mediaData);
    } catch (e: any) {
        throw { message: "Something went wrong storing the media" };
    }
};

export const deleteMedia = async (entity: string, entity_ids: any[]) => {
    try {
        await MediaData.destroy({ where: { entity: entity, entity_id: { [Op.in]: entity_ids } } });
    } catch (e: any) {
        throw { message: "Something went wrong deleting the media" };
    }
};
