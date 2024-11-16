import User from "../models/user.model.js";
import jwt from "jsonwebtoken";
import { CustomError } from "../middlewares/error.js";
import { generateResetToken } from "../utils/token.utils.js";
import {
  emailTemplates,
  testTransporter,
  transporter,
} from "../config/email.config.js";
import crypto from "crypto";
import Room from "../models/room.model.js";
import Message from "../models/message.model.js";
import { userSocketMap } from "../socket/socket.js";

const generateToken = (email, userId, role) => {
  return jwt.sign({ email, userId, role }, process.env.JWT_SECRET_KEY, {
    expiresIn: maxAge,
  });
};
const maxAge = 3 * 24 * 60 * 60 * 1000;
export const adminLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      throw new CustomError("Email and password are required", 400);
    }

    const admin = await User.findOne({
      email,
      role: "admin",
      deletedAt: null,
    });

    if (!admin) {
      throw new CustomError("Invalid credentials", 401);
    }

    const isValid = await admin.comparePassword(password);
    if (!isValid) {
      throw new CustomError("Invalid credentials", 401);
    }
    const token = generateToken(admin.email, admin._id, admin.role);

    res.cookie("jwt", token, {
      maxAge,
      sameSite: "None",
      secure: true,
    });

    return res.status(200).json({
      user: {
        id: admin._id,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (error) {
    next(error);
  }
};
export const adminChangePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      throw new CustomError(
        "Current password and new password are required",
        400
      );
    }

    const admin = await User.findOne({
      _id: req.userId,
      role: "admin",
      deletedAt: null,
    });

    if (!admin) {
      throw new CustomError("Admin not found", 404);
    }

    const isValid = await admin.comparePassword(currentPassword);
    if (!isValid) {
      throw new CustomError("Current password is incorrect", 401);
    }

    admin.password = newPassword;
    await admin.save();

    return res.status(200).json({
      message: "Password changed successfully",
    });
  } catch (error) {
    next(error);
  }
};
export const adminForgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    const admin = await User.findOne({
      email: email.toLowerCase(),
      role: "admin",
      deletedAt: null,
    });

    if (!admin) {
      throw new CustomError("Admin not found", 404);
    }

    const resetToken = generateResetToken();
    admin.resetPasswordToken = resetToken;
    admin.resetPasswordExpires = Date.now() + 60 * 60 * 1000;
    await admin.save();

    const mailer =
      process.env.NODE_ENV === "production" ? transporter : testTransporter;

    await mailer.sendMail({
      to: email,
      subject: "Admin Password Reset",
      html: `
        <h1>Reset Your Admin Password</h1>
        <p>Click the link below to reset your admin password:</p>
        <a href="${process.env.ORIGIN}/admin/reset-password/${resetToken}">Reset Password</a>
        <p>This link will expire in 1 hour.</p>
        <p>If you did not request this, please ignore this email.</p>
      `,
    });

    return res.status(200).json({
      message: "Password reset instructions sent to your email",
    });
  } catch (error) {
    next(error);
  }
};

export const adminResetPassword = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password || password.length < 6) {
      throw new CustomError("Password must be at least 6 characters", 400);
    }

    const admin = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
      role: "admin",
      deletedAt: null,
    });

    if (!admin) {
      throw new CustomError("Invalid or expired reset token", 400);
    }

    admin.password = password;
    admin.resetPasswordToken = undefined;
    admin.resetPasswordExpires = undefined;
    await admin.save();

    return res
      .status(200)
      .json({ message: "Admin password reset successfully" });
  } catch (error) {
    next(error);
  }
};
export const adminLogout = async (req, res) => {
  try {
    res.clearCookie("jwt", {
      sameSite: "None",
      secure: true,
    });

    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    next(error);
  }
};
export const getUsers = async (req, res, next) => {
  try {
    const users = await User.find({
      deletedAt: null,
      role: { $ne: "admin" },
    }).select("-password -emailVerificationToken -resetPasswordToken");

    return res.status(200).json(users);
  } catch (error) {
    next(error);
  }
};

export const addUser = async (req, res, next) => {
  try {
    const { email, password, firstName, lastName, role = "user" } = req.body;

    if (!email || !password) {
      throw new CustomError("Email and password are required", 400);
    }

    const existingUser = await User.findOne({ email, deletedAt: null });
    if (existingUser) {
      throw new CustomError("Email already exists", 400);
    }

    const user = await User.create({
      email,
      password,
      firstName,
      lastName,
      role,
      isEmailVerified: true,
    });

    return res.status(201).json({
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};
export const updateUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { firstName, lastName, role } = req.body;

    const user = await User.findById(userId);

    if (!user) {
      throw new CustomError("User not found", 404);
    }

    if (userId === req.userId && role) {
      throw new CustomError("Admin cannot change their own role", 403);
    }

    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (role) user.role = role;

    await user.save();

    return res.status(200).json({
      message: "User updated successfully",
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getUser = async (req, res) => {
  const { userId } = req.params;

  if (!userId) {
    throw new CustomError("User ID is required", 400);
  }

  const user = await User.findOne({
    _id: userId,
    deletedAt: null,
  }).select("-password");
  if (!user) {
    throw new CustomError("User not found", 404);
  }

  res.json(user);
};
export const deleteUser = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);

    if (!user) {
      throw new CustomError("User not found", 404);
    }

    if (userId === req.userId) {
      throw new CustomError("Admin cannot delete themselves", 403);
    }

    if (user.role === "admin") {
      const adminCount = await User.countDocuments({
        role: "admin",
        deletedAt: null,
      });

      if (adminCount <= 1) {
        throw new CustomError("Cannot delete the only admin", 403);
      }
    }

    // Soft delete
    user.deletedAt = new Date();
    await user.save();

    return res.status(200).json({
      message: "User deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
export const restoreUser = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      throw new CustomError("User not found", 404);
    }

    if (!user.deletedAt) {
      throw new CustomError("User is not deleted", 400);
    }

    user.deletedAt = null;
    await user.save();

    res.status(200).json({
      message: "User restored successfully",
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};
export const getDeletedUsers = async (req, res, next) => {
  try {
    const deletedUsers = await User.find({
      deletedAt: { $ne: null },
    }).select("-password");

    return res.status(200).json({
      users: deletedUsers,
    });
  } catch (error) {
    next(error);
  }
};
export const adminResetUserPassword = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const user = await User.findOne({
      _id: userId,
      deletedAt: null,
    });

    if (!user) {
      throw new CustomError("User not found", 404);
    }
    const resetToken = generateResetToken();
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 24 * 60 * 60 * 1000; // 24h
    await user.save();

    const mailer =
      process.env.NODE_ENV === "production" ? transporter : testTransporter;

    await mailer.sendMail({
      to: user.email,
      ...emailTemplates.adminResetUserPassword(resetToken, req.userEmail),
    });

    return res.status(200).json({
      message: "Password reset instructions sent to user's email",
    });
  } catch (error) {
    next(error);
  }
};
export const getRooms = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const rooms = await Room.find({ deletedAt: null })
      .populate({
        path: "creator",
        select: "firstName lastName email",
      })
      .populate({
        path: "members",
        select: "firstName lastName email",
      })
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Room.countDocuments({ deletedAt: null });

    return res.status(200).json({
      message: "Rooms retrieved successfully",
      data: {
        rooms,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getRoom = async (req, res, next) => {
  try {
    const { roomId } = req.params;

    const room = await Room.findOne({
      _id: roomId,
      deletedAt: null,
    }).populate([
      {
        path: "creator",
        select: "firstName lastName email",
      },
      {
        path: "members",
        select: "firstName lastName email",
      },
    ]);

    if (!room) {
      throw new CustomError("Room not found", 404);
    }

    const pinnedMessages = await Message.find({
      room: roomId,
      isPinned: true,
      deletedAt: null,
    })
      .populate({
        path: "sender",
        select: "firstName lastName email",
      })
      .sort({ pinnedAt: -1 });

    return res.status(200).json({
      message: "Room retrieved successfully",
      data: {
        room,
        pinnedMessages,
      },
    });
  } catch (error) {
    next(error);
  }
};
export const adminCreateRoom = async (req, res, next) => {
  const { name, memberIds } = req.body;

  try {
    // Validate room name
    if (!name || name.trim().length === 0) {
      throw new CustomError("Room name is required", 400);
    }

    // Validate admin creating room
    const adminUser = await User.findOne({
      _id: req.userId,
      role: "admin",
      deletedAt: null,
    });

    if (!adminUser) {
      throw new CustomError(
        "Only admin can create rooms from admin panel",
        403
      );
    }

    // Validate và lọc memberIds
    const uniqueMemberIds = memberIds ? [...new Set(memberIds)] : [];

    // Kiểm tra users tồn tại và chưa bị xóa
    if (uniqueMemberIds.length > 0) {
      const existingUsers = await User.find({
        _id: { $in: uniqueMemberIds },
        deletedAt: null,
      }).select("role");

      if (existingUsers.length !== uniqueMemberIds.length) {
        throw new CustomError("Some users do not exist", 400);
      }

      // Kiểm tra không cho phép thêm admin vào members
      const hasAdmin = existingUsers.some((user) => user.role === "admin");
      if (hasAdmin) {
        throw new CustomError("Cannot add admin users as members", 400);
      }
    }

    // Tạo room mới, creator là admin nhưng không thêm vào members
    const newRoom = await Room.create({
      name: name.trim(),
      creator: req.userId, // Admin là creator
      members: uniqueMemberIds,
    });

    // Populate thông tin cần thiết
    const populatedRoom = await Room.findById(newRoom._id)
      .populate("creator", "id email firstName lastName role")
      .populate("members", "id email firstName lastName role");

    // Xử lý realtime notification cho members
    const io = req.app.get("io");
    if (io) {
      const roomId = populatedRoom._id.toString();

      // Lấy socket IDs của các members
      const memberSocketIds = populatedRoom.members
        .map((member) => userSocketMap.get(member._id.toString()))
        .filter((socketId) => socketId);

      // Join room và emit event cho members
      memberSocketIds.forEach((socketId) => {
        io.sockets.sockets.get(socketId)?.join(roomId);
      });

      // Thông báo cho tất cả members về room mới
      io.to(roomId).emit("newRoom", populatedRoom);
    }

    res.status(201).json({
      success: true,
      message: "Room created successfully",
      room: populatedRoom,
    });
  } catch (error) {
    if (error.code === 11000) {
      throw new CustomError("Room name already exists", 400);
    }
    next(error);
  }
};
