import axios from "axios";
import Bull from "bull";

const chatIds = {
    think201: 6363318166,
    // Anurag: 35890702,
    // Yash: 698277022,
    // Kewal: 43013545,
    Kunal: 431219612,
};

// This error notify queue will listen to the queue process the jobs
// From here we can have multiple triggerrs like Email, Telegram, SMS, etc
export const errorNotificationService = async () => {
    const error_notify_queue = new Bull(`${process.env.ERROR_NOTIFY_QUEUE}`);

    error_notify_queue.process(async (job) => {
        triggerTelegramMessage(job.data);
    });
};

const triggerTelegramMessage = async (jobData) => {
    for (const key of Object.keys(chatIds)) {
        sendTelegramMsg(jobData.data, "bot6740247541:AAHdNkLXnpw3o7KCKLQ3GhAdKwIjonWfWC8", chatIds[key]);
    }
};

const sendTelegramMsg = async (message: any, botSecret: any, chat_id: any) => {
    try {
        const config: any = {
            method: "post",
            url: `https://api.telegram.org/${botSecret}/sendMessage`,
            data: {
                chat_id: chat_id,
                text: message,
            },
        };

        return await new Promise((resolve, reject) => {
            axios(config)
                .then(function (response) {
                    resolve(response.data);
                })
                .catch(function (responseError) {
                    reject(responseError.response.data.detail || responseError.response.data);
                });
        });
    } catch (err) {
        console.log(err);
    }
};

const sendEmail = async (message: any, botSecret: any) => {
    // This helper will send Error email
};
