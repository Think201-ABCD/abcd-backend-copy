import { api, apiException, info } from "@redlof/libs/Helpers/helpers";
import { User } from "@redlof/libs/Models/Auth/User";
import { RequestHandler } from "express";
import { sendMessage } from "../Helpers/ChatAPIHelper";
import { sendWhatsAppMessage } from "../Helpers/WhatsAppHelper";

export const postTwilioWhatsappMessageReceived: RequestHandler = async (req, res) => {
    processWhatsappMessage(req.body);

    return api("Thank you", res, {});
};

const processWhatsappMessage = async (reqbody: any) => {
    let userWhatsAppNumber: any = reqbody.From;
    userWhatsAppNumber = userWhatsAppNumber.replace("whatsapp:+", "").substring(2);

    const userCheck = await User.findOne({ where: { whatsapp_number: userWhatsAppNumber } });

    // If user is not registered
    if (!userCheck) {
        const message = `Welcome to ABCD's BehaviorGPT on WhatsApp!

We are thrilled to introduce you to our AI-powered chatbot that leverages high-quality behavior research to assist you in designing effective behavior programs. Feel free to ask questions, discuss different behavior-related topics, or seek recommendations. Our goal is to empower you with the knowledge and tools to create impactful behavior programs.

To begin using BehaviorGPT on WhatsApp, please first sign up on our website at www.abcd.guide. Once you've created an account, you can enjoy the full benefits of our chatbot and unlock its powerful capabilities.

If you have any inquiries or require assistance during the sign-up process, our team is available to assist you. We look forward to seeing you onboard and helping you achieve your behavior program goals!

The ABCD Team`;

        sendWhatsAppMessage(reqbody.From, message);
    } else {
        if (reqbody.Body === "START NEW SESSION") {
            userCheck.whatsapp_session_id = null;
            userCheck.save();

            const message = "New session started";
            sendWhatsAppMessage(reqbody.From, message);

            return;
        }

        const body = {
            question: reqbody.Body,
            user_id: userCheck.id,
            user_name: `${userCheck.first_name} ${userCheck.last_name}`,
            user_email: userCheck.email,
            session_id: userCheck.whatsapp_session_id ? userCheck.whatsapp_session_id : null,
            source: "WA",
        };

        const data: any = await sendMessage(body);

        if (!data.session_id) {
            throw {
                message: "Something went wrong!, please try later",
                code: 422,
            };
        }

        if (!userCheck.whatsapp_session_id) {
            userCheck.whatsapp_session_id = data.session_id;
            userCheck.save();
        }

        const messages = data.response.split("\n");

        for (const message of messages) {
            if (message.length > 0) {
                await sendWhatsAppMessage(reqbody.From, message);
            }
            // This is to avoid any problems in sequence
            await timer(500);
        }
    }
};

export const timer = (ms: any) => new Promise((res) => setTimeout(res, ms));
