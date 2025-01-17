import redis from "redis";
const publisher = redis.createClient();

// Helpers
import * as SmsHelper from "@redlof/libs/Helpers/SMSHelper";

// Models

export const smsHandler = async function ({ type, data }: any) {
    try {
        switch (type) {
            case "sms-send-otp":
                await SmsHelper.sendOTP(data.phone);

                break;

            case "sms-resend-otp":
                await SmsHelper.resendOTP(data.phone);

                break;

            default:
                break;
        }

        return;
    } catch (e) {
        console.error("SMS Handler error", e);

        return;
    }
};
