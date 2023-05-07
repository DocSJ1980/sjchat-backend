import ChatModel from "../models/chatModel.js";

export const createChat = async (req, res) => {
    const senderId = req.body.senderId;
    const receiverId = req.body.receiverId;

    // Check if chat already exists with given members
    const existingChat = await ChatModel.findOne({
        members: { $all: [senderId, receiverId] },
    });
    if (existingChat) {
        return res.status(201).json({ message: 'Chat already exists' });
    }

    // Create new chat if chat does not exist
    const chat = await ChatModel.create({
        members: [senderId, receiverId],
    });

    try {
        const result = await chat.save();
        res.status(201).json({ message: "Chat created successfully" });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};


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