import { api, apiException } from "@redlof/libs/Helpers/helpers";
import { User } from "@redlof/libs/Models/Auth/User";
import { RequestHandler } from "express";
import { Op } from "sequelize";
import { getLastSessionDetails, getSessionChatDetails, sendFeedback, sendMessage } from "../Helpers/ChatAPIHelper";
import { sendWhatsAppMessage } from "../Helpers/WhatsAppHelper";

export const getMessages: RequestHandler = async (req: any, res) => {
    const user_id = res.locals.user.id;

    const data: any = await getLastSessionDetails(user_id);

    if (!data.session_id) {
        return api("", res, {});
    }

    const response = {
        session_id: data.session_id,
        conversation: data.conversation,
        evidence: data.source ? data.source : [],
    };

    return api("", res, response);
};

export const postMessage: RequestHandler = async (req: any, res) => {
    const body = {
        question: req.body.question,
        user_id: res.locals.user.id,
        user_name: `${res.locals.user.first_name} ${res.locals.user.last_name}`,
        user_email: res.locals.user.email,
        session_id: req.body.session_id ? req.body.session_id : null,
    };

    const data: any = await sendMessage(body);

    if (!data.session_id) {
        throw {
            message: "Something went wrong!, please try later",
            code: 422,
        };
    }

    const response = {
        session_id: data.session_id,
        response_message: data.response,
        response_id: data.response_id,
        response_context: data.contextInfo,
        sources: data.sources ? data.sources : [],
    };

    return api("", res, response);
};

export const postFeedback: RequestHandler = async (req: any, res) => {
    try {
        const body = {
            response_id: req.body.response_id,
            user_id: res.locals.user.id,
            feedback: req.body.feedback,
            feedback_note: req.body.feedback_note ? req.body.feedback_note : null,
        };

        const data: any = await sendFeedback(body);

        return api("", res, data);
    } catch (e: any) {
        return apiException(e.message ? String(e.message) : String(e), res, {}, e.code ? e.code : 500);
    }
};

export const getTwilioWhatsappSent: RequestHandler = async (req, res) => {
    const twilio_sid = `${process.env.TWILIO_SID}`;
    const twilio_auth_token = `${process.env.TWILIO_AUTH_TOKEN}`;
    const twilio_from_number = `${process.env.TWILIO_FROM_WHATSAPP_NUMBER}`;
    const client = require("twilio")(twilio_sid, twilio_auth_token);

    client.messages
        .create({
            from: twilio_from_number,
            body: req.query.message,
            to: `whatsapp:+${req.query.number}`,
        })
        .then((message) => console.log(message.sid));

    return api("", res, {});
};

export const putWhatsappNumberUpdate: RequestHandler = async (req: any, res) => {
    const user: any = await User.findOne({ where: { id: res.locals.user.id } });

    // if requested number is same as added number, do nohing
    if (user.whatsapp_number === req.body.whatsapp_number) {
        return api("", res, {});
    }

    // Check number is registered with other account or not
    // if registered, throw error
    const users: any = await User.findAll({
        where: {
            id: { [Op.ne]: res.locals.user.id },
            whatsapp_number: req.body.whatsapp_number,
        },
    });

    if (users.length) {
        throw { message: "Number is registered with other account", code: 422, report: false };
    }

    user.whatsapp_number = req.body.whatsapp_number;
    user.save();

    // send welcome message on whatsApp
    const message = `Welcome to ABCD's BehaviorGPT on WhatsApp!

        We are thrilled to introduce you to our AI-powered chatbot that leverages high-quality behavior research to assist you in designing effective behavior programs. Feel free to ask questions, discuss different behavior-related topics, or seek recommendations. Our goal is to empower you with the knowledge and tools to create impactful behavior programs.
        
        Please note that while BehaviorGPT is well-informed by research, it's important to adapt its suggestions to your specific context and consult with professionals when needed. We hope you find ABCD's BehaviorGPT on WhatsApp valuable in your journey. If you have any inquiries or require further assistance, our team is always available to support you.
        
        To start a new session with BehaviorGPT, simply send a message saying "START NEW SESSION". This will initiate a dynamic and engaging conversation where BehaviorGPT can respond to your queries.
        
        The ABCD Team`;

    const to_number = `whatsapp:+91${req.body.whatsapp_number}`;

    sendWhatsAppMessage(to_number, message);

    return api("Number updated successfully", res, {});
};

export const getSessionChats: RequestHandler = async (req: any, res) => {
    const data: any = await getSessionChatDetails(386, req.query.session_id);

    const response = {
        session_id: data.session_id,
        conversation: data.conversation,
    };

    return api("", res, response);
};
