import MessageModel from "../models/messageModel.js";

export const addMessage = async (req, res) => {
    // console.log(req.body)
    const { chatId, senderId, text } = req.body
    const message = await MessageModel.create({
        chatId,
        senderId,
        text
    });
    try {
        const result = await message.save();
        res.status(201).json(result);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}

export const getMessages = async (req, res) => {
    try {
        const result = await MessageModel.find({
            chatId: req.params.chatId
        });
        res.status(200).json(result);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}