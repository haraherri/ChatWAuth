import { Router } from "express";
import {
  forgotPassword,
  login,
  resetPassword,
  signup,
  verifyEmail,
  getUserInfo,
} from "../controllers/authController.js";
import verifyToken from "../middlewares/verifyToken.js";

const router = Router();

router.post("/signup", signup);
router.post("/login", login);
router.get("/verify-email/:token", verifyEmail);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);
router.get("/user-info", verifyToken, getUserInfo);
export default router;
