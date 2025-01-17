const twilio_sid = `${process.env.TWILIO_SID}`;
const twilio_auth_token = `${process.env.TWILIO_AUTH_TOKEN}`;
const twilio_from_number = `${process.env.TWILIO_FROM_WHATSAPP_NUMBER}`;

const client = require("twilio")(twilio_sid, twilio_auth_token);

export const sendWhatsAppMessage = async (to_number, message) => {
    client.messages
        .create({
            from: twilio_from_number,
            body: message,
            to: to_number,
        })
        .then((message) => console.log(message.sid));
};
