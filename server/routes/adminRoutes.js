import { Router } from "express";
import {
  addUser,
  adminChangePassword,
  adminForgotPassword,
  adminLogin,
  adminLogout,
  adminResetPassword,
  adminResetUserPassword,
  deleteUser,
  getDeletedUsers,
  getUser,
  getUsers,
  restoreUser,
  updateUser,
} from "../controllers/adminController.js";
import { checkRole, verifyToken } from "../middlewares/verifyToken.js";
const router = Router();

router.post("/login", adminLogin);

// Protected routes
router.put(
  "/change-password",
  verifyToken,
  checkRole("admin"),
  adminChangePassword
);
router.post("/forgot-password", adminForgotPassword);
router.post("/reset-password/:token", adminResetPassword);

// User management routes
router.get("/users", verifyToken, checkRole("admin"), getUsers);
router.get("/users/deleted", verifyToken, checkRole("admin"), getDeletedUsers);
// route parameter
router.get("/users/:userId", verifyToken, checkRole("admin"), getUser); //get Single User
router.post("/users", verifyToken, checkRole("admin"), addUser);
router.put("/users/:userId", verifyToken, checkRole("admin"), updateUser);
router.patch(
  "/users/:userId/status",
  verifyToken,
  checkRole("admin"),
  deleteUser
);
router.post(
  "/users/:userId/restore",
  verifyToken,
  checkRole("admin"),
  restoreUser
);
router.post(
  "/users/:userId/reset-password",
  verifyToken,
  checkRole("admin"),
  adminResetUserPassword
);
router.put("/users/:userId/role", verifyToken, checkRole("admin"));
router.post("/logout", verifyToken, checkRole("admin"), adminLogout);

export default router;
