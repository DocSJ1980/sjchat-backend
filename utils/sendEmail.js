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
    await transport.sendMail({
        from: process.env.SMTP_USER,
        to: email,
        subject,
        text,
    },
        function (err, info) {
            if (err) {
                return res
                    .status(400)
                    .json({ success: false, message: "Email could not be sent" });
            }
            else {
                console.log(info.messageId)
            }
        }
    );
};

export default sendEmail;