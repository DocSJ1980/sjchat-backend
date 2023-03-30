// Imports
import ErrorResponse from "../utils/Error.js"
import User from "../models/userModel.js"
import crypto from 'crypto'
import sendEmail from "../utils/sendEmail.js"
import { sendToken } from "../utils/sendToken.js"
// import fs from 'fs'
// import path from 'path'
// import csv from 'fast-csv'
// import DengueTeam from "../models/dengueTeamModel.js"


//. FIRST ROUTE:  New User Registration controller
export const newUser = async (req, res, next) => {
    const { name, email, password, gender } = req.body
    let foundUser = await User.findOne({ email });
    // console.log("FoundUser: ", foundUser, "name: ", name)
    if (foundUser) {
        return res
            .status(400)
            .json({ success: false, message: "User already exisits" });
    }
    const randomOtp = crypto.randomBytes(20).toString("hex")
    const otp = crypto
        .createHash("sha256")
        .update(randomOtp)
        .digest("hex")
    // console.log("OTP: ", otp)
    try {
        // const { avatar } = req.files;
        foundUser = new User({
            name,
            email,
            password,
            gender,
            avatar: {
                public_id: "",
                url: ""
            },
            otp,
            otp_expiry: Date.now() + process.env.OTP_EXPIRE * 60 * 60 * 1000
        });
        await foundUser.save();
        // console.log(foundUser)
        const message = `Your OTP is ${otp}`
        await sendEmail(
            email, "Verify Your Accout", message
        )

        await sendToken(
            res,
            foundUser,
            201,
            "OTP sent to your email, please verify your account"
        )
    } catch (error) {
        console.log(error)
        return res
            .status(400)
            .json({ success: false, message: "Sorry account could not be created." })
    }
};

//. SECOND ROUTE: Email Verification controller
export const verify = async (req, res, next) => {
    try {
        const { otp } = req.body

        let foundUser = await User.findById(req.user._id)
        if (foundUser.otp !== otp || foundUser.otp_expiry < Date.now()) {
            return res
                .status(400)
                .json({ success: false, message: "Invalid OTP or has been Expired" });
        }
        foundUser.verified = true;
        foundUser.otp = null;
        foundUser.otp_expiry = null;

        await foundUser.save();
        // console.log(foundUser)

        sendToken(res, foundUser, 200, "Account Verified");
    } catch (error) {
        return res
            .status(400)
            .json({ success: false, message: "Sorry e-mail not verified" })
    }
};

//. THIRD ROUTE: Login controller
export const login = async (req, res, next) => {
    // console.log("request received")
    const { email, password } = req.body;

    if (!email || !password) {
        return res
            .status(400)
            .json({ success: false, message: "Please provide an email and password" });
    };

    try {
        const foundUser = await User.findOne({ email }).select("+password");
        if (!foundUser) {
            return res
                .status(400)
                .json({ success: false, message: "Invalid credentials" });
        };

        const isMatch = await foundUser.comparePassword(password);

        if (!isMatch) {
            return res
                .status(400)
                .json({ success: false, message: "Invalid credentials" });
        }

        sendToken(res, foundUser, 200, "Login Successful");

    } catch (error) {
        return res
            .status(400)
            .json({ success: false, message: "Login attemp un-successful" })
    }
};

//. FOURTH ROUTE: Forgot Password controller
export const forgotPassword = async (req, res, next) => {
    const { email } = req.body;

    try {
        const foundUser = await User.findOne({ email });
        if (!foundUser) {
            return res
                .status(400)
                .json({ success: false, message: "Email could not be found" })
        }

        await foundUser.getResetPasswordToken()
        await foundUser.save()
        const resetToken = foundUser.resetPasswordOtp

        const resetUrl = `http://scraper.sjcloud.ga:5232/user/restpassword/?resetToken=${resetToken}`
        const message = `TODO= Reset URL: ${resetUrl}`
        try {
            await sendEmail(
                foundUser.email,
                "Password Reset Requeest",
                message
            )
            res.status(200).json({
                success: true,
                data: "Email sent"
            })
        } catch (error) {
            foundUser.resetPasswordOtp = undefined;
            foundUser.resetPasswordOtpExpiry = undefined;
            await foundUser.save();
            return res
                .status(400)
                .json({ success: false, message: "Email Could not be sent" })
        }
    } catch (error) {
        return res
            .status(400)
            .json({ success: false, message: "Email not found" })
    }
}

//. FIFTH ROUTE: Reset Password Controller
export const resetPassword = async (req, res, next) => {
    try {
        const { resetOtp, newPassword } = req.body;

        const foundUser = await User.findOne({
            resetPasswordOtp: resetOtp,
            resetPasswordOtpExpiry: { $gt: new Date(Date.now()).toISOString() },
        });
        console.log(new Date(Date.now()).toISOString())
        if (!foundUser) {
            return res
                .status(400)
                .json({ success: false, message: "Otp Invalid or has been Expired" });
        }
        foundUser.password = newPassword;
        foundUser.resetPasswordOtp = null;
        foundUser.resetPasswordOtpExpiry = null;
        await foundUser.save();

        res
            .status(200)
            .json({ success: true, message: `Password Changed Successfully` });
    } catch (error) {
        return res
            .status(400)
            .json({ success: false, message: "Internal sjServer Error" })
    }
};

//. SIXTH ROUTE: Logout Controller
export const logout = async (req, res, next) => {
    try {
        res
            .status(200)
            .clearCookie("refreshToken")
            .json({ success: true, message: "Logged out successfully" });
    } catch (error) {
        return res
            .status(400)
            .json({ success: false, message: "Failed to logout" })

    }
};

//. SEVENTH ROUTE: Get profile controller
export const getMyProfile = async (req, res, next) => {
    try {
        const foundUser = await User.findById(req.user._id);

        sendToken(res, foundUser, 201, `Welcome back ${foundUser.name}`);
    } catch (error) {
        return res
            .status(400)
            .json({ success: false, message: "Failed to load profile" })
    }
};

//. EIGHTH ROUTE: Update Profile Controller
export const updateProfile = async (req, res, next) => {
    //     try {
    //         const foundUser = await User.findById(req.body.userId);

    //         const { contactNo, dob, doj, residentialAddress, fatherName, husbandName } = req.body;
    //         //   const avatar = req.files.avatar.tempFilePath;

    //         if (contactNo) foundUser.username = contactNo;
    //         if (dob) foundUser.username = dob;
    //         if (doj) foundUser.username = doj;
    //         if (residentialAddress) foundUser.username = residentialAddress;
    //         if (fatherName) foundUser.username = fatherName;
    //         if (husbandName) foundUser.username = husbandName;
    //   if (avatar) {
    //     await cloudinary.v2.uploader.destroy(user.avatar.public_id);

    //     const mycloud = await cloudinary.v2.uploader.upload(avatar);

    // fs.rmSync("./tmp", { recursive: true });

    // user.avatar = {
    //   public_id: mycloud.public_id,
    //   url: mycloud.secure_url,
    // };
    //   }

    //         await foundUser.save();

    //         res
    //             .status(200)
    //             .json({ success: true, message: "Profile Updated successfully" });
    //     } catch (error) {
    //         next(new ErrorResponse("Failed to update profile", 400))

    //     }
};

//. NINTH ROUTE: Update Password Controller
export default async (req, res, next) => {
    try {
        const foundUser = await User.findById(req.user._id).select("+password")
        const { oldPassword, newPassword } = req.body

        if (!oldPassword || !newPassword) {
            return res
                .status(400)
                .json({ success: false, message: "Please enter all fields" })
        }

        const isMatch = await foundUser.comparePassword(oldPassword)

        if (!isMatch) {
            return res
                .status(400)
                .json({ success: false, message: "Invalid Old Password" })
        }

        foundUser.password = newPassword

        await foundUser.save()

        res
            .status(200)
            .json({ success: true, message: "Password Updated successfully" })
    } catch (error) {
        return res
            .status(400)
            .json({ success: false, message: "Failed to update password" })
    }
}