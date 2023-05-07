// Imports
import ErrorResponse from "../utils/Error.js"
import User from "../models/userModel.js"
import crypto from 'crypto'
import sendEmail from "../utils/sendEmail.js"
import { sendToken } from "../utils/sendToken.js"
import { v2 as cloudinary } from 'cloudinary';
import multer from "multer"
import fs from 'fs'
import path from 'path'
// import csv from 'fast-csv'
// import DengueTeam from "../models/dengueTeamModel.js"


//. FIRST ROUTE:  New User Registration controller
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.resolve("tmp"));
    },
    filename: function (req, file, cb) {
        cb(null, `${Date.now()}-${file.originalname}`);
    },
});

const upload = multer({ storage: storage });

export const newUser = async (req, res, next) => {
    upload.single("profile_image")(req, res, async function (err) {
        if (err instanceof multer.MulterError) {
            // Handle Multer errors
            return res
                .status(400)
                .json({ success: false, message: err.message });
        } else if (err) {
            // Handle other errors
            return res
                .status(400)
                .json({ success: false, message: err.message });
        }

        const { name, email, password, gender } = req.body;


        const randomOtp = crypto.randomBytes(20).toString("hex");
        const otp = crypto.createHash("sha256").update(randomOtp).digest("hex");

        let foundUser = await User.findOne({ email });
        if (foundUser) {
            return res
                .status(400)
                .json({ success: false, message: "User already exists" });
        }
        if (req?.file) {
            const file = req.file;
            cloudinary.config({
                cloud_name: "dsxedpy6g",
                api_key: "499585561352646",
                api_secret: "ZISXzk7gzHIzFrJs3qqhYiGFdpc",
            });
            const filePath = file.path;
            try {
                const uploadResult = await cloudinary.uploader.upload(filePath, {
                    public_id: name,
                });

                const avatar = {
                    public_id: uploadResult.public_id,
                    url: uploadResult.secure_url,
                };


                foundUser = new User({
                    name,
                    email,
                    password,
                    gender,
                    avatar,
                    otp,
                    otp_expiry: Date.now() + process.env.OTP_EXPIRE * 60 * 60 * 1000,
                });
                console.log('%cuserController.js line:84 foundUser.otp_expiry', 'color: white; background-color: #007acc;', foundUser.otp_expiry);
                await foundUser.save();

                const message = `Your OTP is ${otp}`;
                await sendEmail(email, "Verify Your Account", message);

                await sendToken(
                    res,
                    foundUser,
                    201,
                    "OTP sent to your email, please verify your account"
                );
                // Delete the local file
                fs.unlinkSync(filePath);
            } catch (error) {
                console.log("Final Catch error: ", error.message);
                // Delete the user if it was created
                if (foundUser) {
                    await User.findByIdAndDelete(foundUser._id);
                }
                // Delete the image if it was uploaded
                if (filePath) {
                    await cloudinary.uploader.destroy(name);
                    fs.unlinkSync(filePath);
                }

                return res.status(400).json({
                    success: false,
                    message: "Sorry, account could not be created.",
                });
            }
        } else {

            try {
                foundUser = new User({
                    name,
                    email,
                    password,
                    gender,
                    otp,
                    otp_expiry: Date.now() + process.env.OTP_EXPIRE * 60 * 60 * 1000,
                });
                console.log('%cuserController.js line:84 foundUser.otp_expiry.without avatar', 'color: white; background-color: #007acc;', foundUser.otp_expiry);
                await foundUser.save();

                const message = `Your OTP is ${otp}`;
                await sendEmail(email, "Verify Your Account", message);

                await sendToken(
                    res,
                    foundUser,
                    201,
                    "OTP sent to your email, please verify your account"
                );
            } catch (error) {
                console.log("Final Catch error: ", error.message);
                // Delete the user if it was created
                if (foundUser) {
                    await User.findByIdAndDelete(foundUser._id);
                }
                return res.status(400).json({
                    success: false,
                    message: "Sorry, account could not be created.",
                });
            }
        }
    });
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

//. SEVENTH ROUTE: Get profile controller
export const userDetail = async (req, res, next) => {
    try {
        const foundUser = await User.findById(req.body.userId);

        return res
            .status(200)
            .json({ success: true, foundUser })

    } catch (error) {
        return res
            .status(400)
            .json({ success: false, message: "Failed to load profile" })
    }
};

export const userSearch = async (req, res, next) => {
    try {
        const { searchTerm } = req.body;
        const regex = new RegExp(searchTerm, 'i');

        const foundUsers = await User.aggregate([
            {
                $match: {
                    $or: [
                        { email: { $regex: regex } },
                        { name: { $regex: regex } }
                    ]
                }
            },
            {
                $project: {
                    _id: 1,
                    email: 1,
                    name: 1,
                    avatar: 1,
                    score: {
                        $sum: [
                            { $cond: [{ $regexMatch: { input: '$email', regex } }, 1, 0] },
                            { $cond: [{ $regexMatch: { input: '$name', regex } }, 1, 0] }
                        ]
                    }
                }
            },
            {
                $sort: { score: -1 }
            }
        ]);

        return res.status(200).json({ success: true, foundUsers });
    } catch (error) {
        console.log(error);
        return res.status(400).json({ success: false, message: "Server Error" });
    }
};

