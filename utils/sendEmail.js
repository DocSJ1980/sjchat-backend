// Imports
import { createTransport } from "nodemailer";
import ErrorResponse from "../utils/Error.js";

// Declaring consts
const sendEmail = async (email, subject, text) => {
    const transport = createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });

    // Send email
    try {
        // Send email
        const info = await transport.sendMail({
            from: process.env.SMTP_USER,
            to: email,
            subject,
            text,
        });

        console.log(info.messageId);
    } catch (error) {
        throw new Error("Email could not be sent");
    }
};

export default sendEmail;