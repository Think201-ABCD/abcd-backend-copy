import { TelegramHelper } from "./TelegramHelper";

export class Logger {
    // Logger

    static async exceptionReporting(error: any, request: any, response: any) {
        if (error.report === false) {
            return;
        }

        const data: any = {
            title: "",
            url: request.originalUrl,
            message: error.message ? String(error.message) : String(error),
            user: response.locals.user ? response.locals.user.email : "unknown",
            request_type: request.method,
            payload: {},
            stack: error.stack,
        };

        if (Object.keys(request.query).length > 0) {
            data.payload.query = request.query;
        }
        if (Object.keys(request.body).length > 0) {
            data.payload.body = request.body;
        }

        const processedMessage = Logger.normalize(data);

        const trimmedMessage = processedMessage?.substring(0, 1000);

        TelegramHelper.sendToBot(trimmedMessage);
    }

    // This is not used as of now

    static normalize(message) {
        let formattedMessage = "";

        if (typeof message === "string") {
            // Message is a string
            formattedMessage = message;
            return formattedMessage;
        }

        if (typeof message === "object") {
            // Message is an object
            for (const key in message) {
                if (message.hasOwnProperty(key)) {
                    if (message[key]) {
                        const formattedKey = key.toUpperCase();

                        formattedMessage = formattedMessage + `\n\n${formattedKey}: ${JSON.stringify(message[key])}`;
                    }
                }
            }

            return formattedMessage;
        }
    }
}
