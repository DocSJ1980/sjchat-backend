import User from "../models/userModel.js";

export const sendToken = async (res, foundUser, statusCode, message) => {

    const refreshToken = foundUser.getRefreshToken();
    const accessToken = foundUser.getAccessToken();
    const sentUser = await User.findById(foundUser._id);
    const options = {
        httpOnly: true,
        secure: true, //https
        sameSite: 'None', //cross-site cookie 
        expires: new Date(
            Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000
        ),
        // domain: 'dharawalpindi.tk'
    };


    res
        .status(statusCode)
        .cookie("refreshToken", refreshToken, options)
        .json({ success: true, message, user: sentUser, accessToken: "Bearer " + accessToken, });
}