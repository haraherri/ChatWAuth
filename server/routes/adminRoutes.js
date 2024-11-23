import { Router } from "express";
import {
  addUser,
  adminChangePassword,
  adminCreateRoom,
  adminDeleteRoom,
  adminForgotPassword,
  adminLogin,
  adminLogout,
  adminResetPassword,
  adminResetUserPassword,
  deleteUser,
  getDeletedRooms,
  getDeletedUsers,
  getMessageStats,
  getOverallStats,
  getRoom,
  getRooms,
  getRoomStats,
  getUser,
  getUsers,
  getUserStats,
  restoreRoom,
  restoreUser,
  updateRoom,
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

// Room management routes
router.get("/rooms", verifyToken, checkRole("admin"), getRooms);
router.get("/rooms/deleted", verifyToken, checkRole("admin"), getDeletedRooms);
router.get("/rooms/:roomId", verifyToken, checkRole("admin"), getRoom);
router.post("/rooms", verifyToken, checkRole("admin"), adminCreateRoom);
router.put("/rooms/:roomId", verifyToken, checkRole("admin"), updateRoom);
router.patch(
  "/rooms/:roomId/status",
  verifyToken,
  checkRole("admin"),
  adminDeleteRoom
); // soft delete
router.post(
  "/rooms/:roomId/restore",
  verifyToken,
  checkRole("admin"),
  restoreRoom
);

//dashboard routes
router.get(
  "/dashboard/stats",
  verifyToken,
  checkRole("admin"),
  getOverallStats
);
router.get(
  "/dashboard/user-stats",
  verifyToken,
  checkRole("admin"),
  getUserStats
);
router.get(
  "/dashboard/message-stats",
  verifyToken,
  checkRole("admin"),
  getMessageStats
);
router.get(
  "/dashboard/room-stats",
  verifyToken,
  checkRole("admin"),
  getRoomStats
);
export default router;
