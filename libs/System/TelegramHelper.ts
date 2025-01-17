import Queue from "bull";

export class TelegramHelper {
    //
    static async sendToBot(data: any ) {
        // Add to Queue

        const queue = new Queue(`${process.env.ERROR_NOTIFY_QUEUE}`, {
            limiter: {
                max: 1,
                duration: 600,
            },
        });

        // options
        const options = {
            removeOnComplete: true,
        };

        const queueJob = {
            data:data,
            // userDetails: // Userdata yet to be added
        };

        queue.add(queueJob, options);
    }
    
}
