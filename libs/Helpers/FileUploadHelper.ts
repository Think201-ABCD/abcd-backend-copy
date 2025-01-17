import AWS from "aws-sdk";
import jdenticon from "jdenticon";
import Sharp from "sharp";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { promisify } from "util";
import request from "request";

const s3 = new AWS.S3({
    accessKeyId: `${process.env.AWS_ACCESS_KEY_ID}`,
    secretAccessKey: `${process.env.AWS_SECRET_ACCESS_KEY}`,
});

const imageSizes = [
    { name: "small-", height: 480, width: 304 },
    { name: "medium-", height: 768, width: 592 },
    { name: "large-", height: 1440, width: 900 },
];

export const uploadFile = async (fileObj: any, options: any) => {
    const uploadRequest = promisify(s3.upload).bind(s3);

    const fileName = uuidv4();

    const uploadOptions: any = {
        Bucket: process.env.AWS_S3_BUCKET,
        ACL: "public-read",
    };

    if (options.type === "image" && options.optimise && options.optimise == "true") {
        for (const fileSize of imageSizes) {
            const file = await Sharp(fileObj.buffer)
                .resize(fileSize.width, fileSize.height, {
                    fit: Sharp.fit.inside,
                    withoutEnlargement: false,
                })
                .webp()
                .toBuffer();

            uploadOptions.Key = `${options.foldername}/${fileSize.name}${fileName}.webp`;
            uploadOptions.Body = file;

            await uploadRequest(uploadOptions); // Upload to S3
        }
    }

    // Check for optimization
    const file = options.type !== "image" ? fileObj.buffer : await Sharp(fileObj.buffer).webp().toBuffer();

    uploadOptions.Key = `${options.foldername}/${fileName}${
        options.type === "image" ? ".webp" : path.extname(fileObj.originalname)
    }`;
    uploadOptions.Body = file;

    const uploadData = await uploadRequest(uploadOptions); // Upload to S3

    return uploadData.Key;
};

export const uploadFileFromUrl = async (url: string, folder: string) => {
    const asyncRequest = promisify(request);

    const { statusCode, body } = await asyncRequest({ url, encoding: null });

    if (statusCode !== 200) {
        throw { message: "Invalid Url or Unable to upload the profile picture", code: 500 };
    }

    const awsPath: any = await uploadFile({ buffer: body }, { type: "image", optimise: "true", foldername: folder }); // Upload to S3

    return awsPath;
};

export const uploadIdenticon = async (folder: string, inputString: string) => {
    // Generate image from the string

    const image = jdenticon.toPng(inputString, 200);

    const awsPath: any = await uploadFile({ buffer: image }, { type: "image", optimise: "true", foldername: folder }); // Upload to S3

    return awsPath;
};
