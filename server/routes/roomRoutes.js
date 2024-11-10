import express from "express";
import { checkRole, verifyToken } from "../middlewares/verifyToken.js";
import {
  addUsersToRoom,
  createRoom,
  getPinnedMessages,
  getRoomMessages,
  getUserRooms,
  removeUserFromRoom,
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
router.get("/:roomId/pinned-messages", verifyToken, getPinnedMessages);
router.post(
  "/:roomId/members",
  verifyToken,
  checkRole("admin", "moderator"),
  addUsersToRoom
);

router.delete(
  "/:roomId/members/:userId",
  verifyToken,
  checkRole("admin", "moderator"),
  removeUserFromRoom
);
export default router;
