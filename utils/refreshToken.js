import User from "../models/userModel.js";
import jwt from "jsonwebtoken";

export const sendRefreshToken = async (req, res) => {
    const { refreshToken } = req.cookies;
    if (!refreshToken) {
        return res.status(401).json(
            {
                success: false,
                message: "Login First. No Cookie"
            }
        );
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
    const foundUser = await User.findById(decoded._id)
    const accessToken = foundUser.getAccessToken();

    res
        .status(200)
        .json({ success: true, accessToken: "Bearer " + accessToken, });
};

