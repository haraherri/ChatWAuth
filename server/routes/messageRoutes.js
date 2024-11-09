import { Router } from "express";
import { checkRole, verifyToken } from "../middlewares/verifyToken.js";
import {
  deleteMessage,
  getMessagesBetweenUsers,
  uploadMessageFile,
} from "../controllers/messageController.js";
import { uploadChatFile } from "../middlewares/upload.js";

const router = Router();

router.post("/get-messages", verifyToken, getMessagesBetweenUsers);
router.post(
  "/upload-file",
  verifyToken,
  uploadChatFile.single("file"),
  uploadMessageFile
);
router.delete(
  "/delete-message/:messageId",
  verifyToken,
  checkRole("admin", "moderator"),
  deleteMessage
);

export default router;
