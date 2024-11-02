import { Router } from "express";
import { verifyToken } from "../middlewares/verifyToken.js";
import {
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

export default router;
