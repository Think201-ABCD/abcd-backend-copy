import axios from "axios";

import { logInfo } from "./LogHelper";

const getPhoneNumber = async (phone: string) => {
    if (process.env.OTP_PHONE) {
        return process.env.OTP_PHONE;
    }

    return phone;
};

export const sendOTP = async (phone: any) => {
    const response = await axios.get("https://api.msg91.com/api/v5/otp", {
        params: {
            otp_length: "6",
            template_id: `${process.env.MSG_OTP_TEMPLATE}`,
            mobile: "91" + (await getPhoneNumber(phone)),
            authkey: `${process.env.MSG_API_KEY}`,
        },
    });

    logInfo(phone, "action", "OTP sent to user");

    return true;
};

export const resendOTP = async (phone: any) => {
    await axios.get("https://api.msg91.com/api/v5/otp/retry", {
        params: {
            authkey: `${process.env.MSG_API_KEY}`,
            mobile: "91" + (await getPhoneNumber(phone)),
        },
    });

    logInfo(phone, "action", "OTP re-sent to user");

    return true;
};
