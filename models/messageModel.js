import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
    {
        id: {
            type: String,
        },
        senderId: {
            type: String,
        },
        text: {
            type: String,
        },
    },
    { timestamps: true, }
)

const MessageModel = mongoose.model("Message", messageSchema)
export default MessageModel