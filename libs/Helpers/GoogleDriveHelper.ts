import { GoogleDriveService } from "../Classes/GoogleDriveService";
import fs from "fs";

const driveClientId = process.env.GOOGLE_DRIVE_CLIENT_ID || "";
const driveClientSecret = process.env.GOOGLE_DRIVE_CLIENT_SECRET || "";
const driveRedirectUri = process.env.GOOGLE_DRIVE_REDIRECT_URI || "";
const driveRefreshToken = process.env.GOOGLE_DRIVE_REFRESH_TOKEN || "";

export const uploadToGoogleDrive = async (fileName: string, folderName: string, mimeType: string = "application/pdf") => {
    const googleDriveService = new GoogleDriveService(driveClientId, driveClientSecret, driveRedirectUri, driveRefreshToken);

    const finalPath = `${process.env.APP_PUBLIC_PATH}/temp/${fileName}`;

    if (!fs.existsSync(finalPath)) {
        throw new Error("File not found!");
    }

    let folder = await googleDriveService.searchFolder(folderName).catch((error) => {
        console.error(error);
        return null;
    });

    if (!folder) {
        const response: any = await googleDriveService.createFolder(folderName);
        folder = response.data;
    }

    await googleDriveService.saveFile(fileName, finalPath, mimeType, folder.id).catch((error) => {
        console.error(error);
    });

    console.info("File uploaded successfully!");

    // Delete the file on the server
    // fs.unlinkSync(finalPath);
};
