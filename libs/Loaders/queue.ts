import Bull from "bull";

import { emailHandler } from "@redlof/app/operation-service/Queues/email-handler";
import { smsHandler } from "@redlof/app/operation-service/Queues/sms-handler";

export const queueLoader = async () => {
    // Email handler
    const email_queue = new Bull(`${process.env.REDIS_EMAIL_QUEUE}`);

    email_queue.process(async (job) => {
        return emailHandler(job.data);
    });

    // SMS handler
    const sms_queue = new Bull(`${process.env.REDIS_SMS_QUEUE}`);

    sms_queue.process(async (job) => {
        return smsHandler(job.data);
    });
};

export const queueLoaderCockpit = async () => {
    // Email handler
    const email_queue = new Bull(`${process.env.REDIS_COCKPIT_EMAIL_QUEUE}`);

    email_queue.process(async (job) => {
        return emailHandler(job.data);
    });
};
