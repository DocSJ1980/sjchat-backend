import jwt from "jsonwebtoken";
import User from "../models/userModel.js";

export const isAuthenticated = async (req, res, next) => {

    const authHeader = req.headers.authorization || req.headers.Authorization

    if (!authHeader?.startsWith('Bearer ')) {
        return res.status(403).json({ message: 'Unauthorized' })
    }

    const accessToken = authHeader.split(' ')[1]

    jwt.verify(
        accessToken,
        process.env.JWT_SECRET,
        async (err, decoded) => {

            if (err) return res.status(403).json({ message: 'Forbidden' })
            req.user = await User.findById(decoded._id);
            next()
        })
};