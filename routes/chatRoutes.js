import express from "express";
import { createChat, findChat, userChats } from "../controllers/chatController.js";

const router = express.Router();

router.post("/", createChat)
router.get("/:userId", userChats)
router.post("/find/:firstId/:secondId", findChat)

export default router