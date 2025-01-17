import Bull from "bull";

import { emailHandler } from "../Queues/email-handler";
import { smsHandler } from "../Queues/sms-handler";
import {analysisHandler } from "../Queues/analysis-handler"

export const queueLoader = async () => {
    // Intialize queue handlers

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

    // analyzer handler
    const analysis_queue = new Bull(`${process.env.REDIS_ANALYSIS_QUEUE}`)

    analysis_queue.process(async(job)=> {
        return analysisHandler(job.data)
    })
};
