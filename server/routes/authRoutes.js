import { Router } from "express";
import {
  forgotPassword,
  login,
  resetPassword,
  signup,
  verifyEmail,
  getUserInfo,
  updateProfile,
  uploadProfileImage,
  deleteProfileImage,
  changePassword,
  logOut,
} from "../controllers/authController.js";
import verifyToken from "../middlewares/verifyToken.js";
import { uploadProfile } from "../middlewares/upload.js";

const router = Router();

router.post("/signup", signup);
router.post("/login", login);
router.get("/verify-email/:token", verifyEmail);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);
router.get("/user-info", verifyToken, getUserInfo);
router.put("/update-profile", verifyToken, updateProfile);
router.post(
  "/upload-profile-image",
  uploadProfile.single("profile-image"),
  verifyToken,
  uploadProfileImage
);
router.delete("/delete-profile-image", verifyToken, deleteProfileImage);

router.put("/change-password", verifyToken, changePassword);

router.post("/logout", verifyToken, logOut);
export default router;
