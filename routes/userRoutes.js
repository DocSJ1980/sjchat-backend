// Imports (express, named imports from userControlller)
import express from "express"
import updatePassword, { login, newUser, forgotPassword, resetPassword, verify, logout, getMyProfile, updateProfile, userDetail, userSearch } from "../controllers/userController.js"
import { isAuthenticated } from "../middleware/auth.js";
import { sendRefreshToken } from "../utils/refreshToken.js";

// Consts (initializing router)
const router = express.Router()

// User Routes
router.post("/new", newUser)
router.post("/login", login)
router.get("/logout", logout)
router.get("/refresh", sendRefreshToken)
router.post("/forgotpassword", forgotPassword)
router.post("/restpassword", resetPassword)

// Protected user routes
router.post("/verify", isAuthenticated, verify);
router.get("/me", isAuthenticated, getMyProfile);
router.post("/userdetail", isAuthenticated, userDetail);
router.post("/search", userSearch)
router.post("/updateprofile", isAuthenticated, updateProfile);
router.post("/updatepassword", isAuthenticated, updatePassword);

// Export (default)
export default router