import { randomBytes, createHash } from 'crypto';
import mongoose, { Schema, model } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
// import sendEmail from '../utils/sendEmail.js';

// Defining User Scheme with mongoose
const userSchema = new Schema({
    email: {
        type: String,
        required: [true, "Please provide a valid email"],
        unique: true,
        match: [
            /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
            "Please provide a valid email",
        ],
    },
    password: {
        type: String,
        required: [true, "Please fill the password"],
        minlength: [8, "Password must be at least 8 characters long"],
        select: false,
    },
    name: { type: String },
    gender: {
        type: String,
        enum: ['Male', 'Female'],
        required: [true, "Please select a gender"]
    },
    avatar: {
        public_id: String,
        url: String
    },
    otp: String,
    otp_expiry: Date,
    resetPasswordOtp: String,
    resetPasswordOtpExpiry: Date,
}
    , { timestamps: true });

// Hashing pw before saving
userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) {
        next();
    }
    const salt = await bcrypt.genSaltSync(10);
    this.password = await bcrypt.hashSync(this.password, salt);
    next();
});

// Creating refresh token for cookie
userSchema.methods.getRefreshToken = function () {
    return jwt.sign({ _id: this._id, username: this.name, desig: this.desig, jobType: this.jobType }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000,
    });
};

// Creating JWT token for cookie
userSchema.methods.getAccessToken = function () {
    return jwt.sign({ _id: this._id, username: this.name, desig: this.desig, jobType: this.jobType }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE * 60 * 1000
        // * 60 * 1000,
    });
};

// Comparing pw for login
userSchema.methods.comparePassword = async function (password) {
    return await bcrypt.compareSync(password, this.password);
};

// Creating Rest pw token for forgot password controller
userSchema.methods.getResetPasswordToken = function () {
    const randomToken = randomBytes(20).toString("hex")
    this.resetPasswordOtp = createHash("sha256")
        .update(randomToken)
        .digest("hex")
    this.resetPasswordOtpExpiry = Date.now() + 6000 * (60 * 1000)
}

// Deleting user if email not verified in OTP_EXPIRE time
userSchema.index({ otp_expiry: 1 }, { expireAfterSeconds: 0 });

// Declaring and exporting the scheme/model
const User = mongoose.model("User", userSchema);
export default User;