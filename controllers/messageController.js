import MessageModel from "../models/messageModel.js";

export const addMessage = async (req, res) => {
    const message = await MessageModel.create({
        senderId: req.body.senderId,
        receiverId: req.body.receiverId,
        text: req.body.text
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