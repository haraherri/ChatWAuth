import express from "express";
import { checkRole, verifyToken } from "../middlewares/verifyToken.js";
import {
  createRoom,
  getRoomMessages,
  getUserRooms,
} from "../controllers/roomController.js";

const router = express.Router();

router.post(
  "/create",
  verifyToken,
  checkRole("admin", "moderator"),
  createRoom
);
router.get("/me", verifyToken, getUserRooms);
router.get("/:roomId/messages", verifyToken, getRoomMessages);
export default router;
