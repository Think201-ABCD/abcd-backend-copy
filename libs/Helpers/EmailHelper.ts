import nodemailer from "nodemailer";
import { promisify } from "util";
import path from "path";
import ejs from "ejs";

// Helpers
import { logInfo } from "./LogHelper";

// Initialize mail transport
export const MailTransport = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: Number(process.env.EMAIL_PORT),
    auth: {
        user: process.env.MAIL_USERNAME,
        pass: process.env.MAIL_PASSWORD,
    },
});

export const sendEmail = async (userEmail: any, templateName: any, templateData: any, attachments: any[] = []) => {
    try {
        if (!templateName) {
            throw "Template path not found.";
        }

        const html = await ejs.renderFile(`${process.env.APP_ASSET_PATH}/emails/${templateName}`, templateData);

        let from_email = templateData.hasOwnProperty("analysis") ? process.env.GOOGLE_EMAIL : process.env.MAIL_FROM;
        if (process.env.NODE_ENV === "staging") {
            from_email = process.env.MAIL_FROM;
        }

        const mailOptions: any = {
            from: from_email,
            to: userEmail,
            subject: templateData.subject,
            html: html,
        };

        if (attachments && attachments.length > 0) {
            mailOptions.attachments = attachments;
        }

        const sendMailAsync = promisify(MailTransport.sendMail).bind(MailTransport);

        await sendMailAsync(mailOptions);

        logInfo(null, `Email with subject ${templateData.subject} sent`, `Sending ${templateData.subject} email.`);

        return true;
    } catch (e) {
        console.error("Email Handler error", e);

        return;
    }
};
