import ChatModel from "../models/chatModel.js";

export const createChat = async (req, res) => {
    const chat = await ChatModel.create({
        members: [req.body.senderId, req.body.receiverId]
    });
    try {
        const result = await chat.save();
        res.status(201).json(result);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}

export const userChats = async (req, res) => {
    try {
        const result = await ChatModel.find({
            members: { $in: [req.params.userId] }
        });
        res.status(200).json(result);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}

export const findChat = async (req, res) => {
    try {
        const result = await ChatModel.findOne({
            members: { $all: [req.params.firstId, req.params.secondId] }
        });
        res.status(200).json(result);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}