import { CustomError } from "../middlewares/error.js";
import Message from "../models/message.model.js";
import Room from "../models/room.model.js";
import User from "../models/user.model.js";
import { userSocketMap } from "../socket/socket.js";

export const createRoom = async (req, res, next) => {
  const { name, memberIds } = req.body;

  if (!name || name.trim().length === 0) {
    throw new CustomError("Room name is required", 400);
  }

  try {
    const uniqueMemberIds = memberIds ? [...new Set(memberIds)] : [];

    if (uniqueMemberIds.length > 0) {
      const existingUsers = await User.find({
        _id: { $in: uniqueMemberIds },
        deletedAt: null,
      });

      if (existingUsers.length !== uniqueMemberIds.length) {
        throw new CustomError("Some users do not exist", 400);
      }
    }

    const newRoom = await Room.create({
      name: name.trim(),
      creator: req.userId,
      members: [...new Set([req.userId, ...uniqueMemberIds])],
    });

    const populatedRoom = await Room.findById(newRoom._id)
      .populate("creator", "id email firstName lastName image color role")
      .populate("members", "id email firstName lastName image color role");

    const io = req.app.get("io");
    if (io) {
      const roomId = populatedRoom._id.toString();

      const memberSocketIds = populatedRoom.members
        .map((member) => userSocketMap.get(member._id.toString()))
        .filter((socketId) => socketId);

      memberSocketIds.forEach((socketId) => {
        io.sockets.sockets.get(socketId)?.join(roomId);
      });

      io.to(roomId).emit("newRoom", populatedRoom);
    }
    res.status(201).json({
      success: true,
      message: "Room created successfully",
      rooms: populatedRoom,
    });
  } catch (error) {
    if (error.code === 11000) {
      throw new CustomError("Room name already exists", 400);
    }
    next(error);
  }
};

export const getUserRooms = async (req, res, next) => {
  try {
    const rooms = await Room.find({
      members: req.userId,
      deletedAt: null,
    })
      .populate("members", "firstName lastName email image role color")
      .populate("creator", "firstName lastName email image role color")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      rooms,
    });
  } catch (error) {
    next(error);
  }
};

export const getRoomMessages = async (req, res, next) => {
  const { roomId } = req.params;
  const CLEANUP_THRESHOLD = 14 * 24 * 60 * 60 * 1000;

  try {
    const room = await Room.findOne({
      _id: roomId,
      members: req.userId,
      deletedAt: null,
    });

    if (!room) {
      throw new CustomError("Room not found or access denied", 404);
    }

    const thresholdDate = new Date(Date.now() - CLEANUP_THRESHOLD);

    const messages = await Message.find({
      room: roomId,
      $or: [{ deletedAt: null }, { deletedAt: { $gt: thresholdDate } }],
    })
      .sort({ createdAt: 1 })
      .populate("sender", "firstName lastName email image color")
      .populate("deletedBy", "firstName lastName")
      .populate("pinnedBy", "firstName lastName");

    res.json({
      success: true,
      messages,
    });
  } catch (error) {
    next(error);
  }
};

export const getPinnedMessages = async (req, res, next) => {
  const { roomId } = req.params;
  const CLEANUP_THRESHOLD = 14 * 24 * 60 * 60 * 1000;

  try {
    const room = await Room.findOne({
      _id: roomId,
      members: req.userId,
      deletedAt: null,
    });

    if (!room) {
      throw new CustomError("Room not found or access denied", 404);
    }

    const thresholdDate = new Date(Date.now() - CLEANUP_THRESHOLD);

    const pinnedMessages = await Message.find({
      room: roomId,
      isPinned: true,
      $or: [{ deletedAt: null }, { deletedAt: { $gt: thresholdDate } }],
    })
      .sort({ pinnedAt: -1 })
      .populate("sender", "firstName lastName email image color")
      .populate("pinnedBy", "firstName lastName")
      .populate("deletedBy", "firstName lastName");

    res.json({
      success: true,
      count: pinnedMessages.length,
      pinnedMessages,
    });
  } catch (error) {
    next(error);
  }
};

export const addUsersToRoom = async (req, res, next) => {
  const { roomId } = req.params;
  const { userIds } = req.body;
  const currentUserId = req.userId;
  const currentUserRole = req.userRole;

  try {
    const room = await Room.findOne({
      _id: roomId,
      deletedAt: null,
    });

    if (!room) {
      throw new CustomError("Room not found", 404);
    }

    if (!Array.isArray(userIds) || userIds.length === 0) {
      throw new CustomError("User IDs are required", 400);
    }

    // Get all users to be added
    const usersToAdd = await User.find({
      _id: { $in: userIds },
      deletedAt: null,
    });

    if (usersToAdd.length !== userIds.length) {
      throw new CustomError("Some users do not exist", 400);
    }

    // Permission checks for moderator
    if (currentUserRole === "moderator") {
      // Check if trying to add admin
      const hasAdmin = usersToAdd.some((user) => user.role === "admin");
      if (hasAdmin) {
        throw new CustomError(
          "Moderators cannot add admin users to rooms",
          403
        );
      }

      // If not room creator, check if trying to add moderator
      if (room.creator.toString() !== currentUserId) {
        const hasModerator = usersToAdd.some(
          (user) => user.role === "moderator"
        );
        if (hasModerator) {
          throw new CustomError(
            "Only room creator can add other moderators",
            403
          );
        }
      }
    }

    const existingMembers = new Set(room.members.map((m) => m.toString()));
    const newUserIds = userIds.filter(
      (id) => !existingMembers.has(id.toString())
    );

    if (newUserIds.length === 0) {
      throw new CustomError("All users are already members", 400);
    }

    const updatedRoom = await Room.findByIdAndUpdate(
      roomId,
      {
        $addToSet: { members: { $each: newUserIds } },
      },
      {
        new: true,
        runValidators: true,
      }
    )
      .populate("members", "id email firstName lastName image color role")
      .populate("creator", "id email firstName lastName image color role");

    const io = req.app.get("io");
    if (io) {
      usersToAdd.forEach((user) => {
        const socketId = userSocketMap.get(user._id.toString());
        if (socketId) {
          io.sockets.sockets.get(socketId)?.join(roomId);
        }
      });

      io.to(roomId).emit("userJoinedRoom", {
        room: updatedRoom,
      });

      usersToAdd.forEach((user) => {
        const socketId = userSocketMap.get(user._id.toString());
        if (socketId) {
          io.to(socketId).emit("newRoom", updatedRoom);
        }
      });
    }

    res.status(200).json({
      success: true,
      message: "Users added to room successfully",
      room: updatedRoom,
    });
  } catch (error) {
    next(error);
  }
};

export const removeUserFromRoom = async (req, res, next) => {
  const { roomId, userId } = req.params;
  const currentUserId = req.userId;
  const currentUserRole = req.userRole;

  try {
    const room = await Room.findOne({
      _id: roomId,
      deletedAt: null,
    });

    if (!room) {
      throw new CustomError("Room not found", 404);
    }

    if (!room.members.includes(userId)) {
      throw new CustomError("User is not a member of this room", 400);
    }

    if (room.creator.toString() === userId) {
      throw new CustomError("Cannot remove room creator", 400);
    }

    // Get user being removed
    const userToRemove = await User.findById(userId);
    if (!userToRemove) {
      throw new CustomError("User not found", 404);
    }

    // Permission checks
    if (currentUserRole === "moderator") {
      // Moderator cannot remove admin
      if (userToRemove.role === "admin") {
        throw new CustomError("Moderators cannot remove admins from room", 403);
      }

      // If current user is moderator but not creator
      if (room.creator.toString() !== currentUserId) {
        // Cannot remove other moderators
        if (userToRemove.role === "moderator") {
          throw new CustomError("Only room creator can remove moderators", 403);
        }
        // Cannot remove themselves
        if (currentUserId === userId) {
          throw new CustomError(
            "Moderators cannot remove themselves from room",
            400
          );
        }
      }
    }

    const updatedRoom = await Room.findByIdAndUpdate(
      roomId,
      {
        $pull: { members: userId },
      },
      {
        new: true,
        runValidators: true,
      }
    )
      .populate("members", "id email firstName lastName image color role")
      .populate("creator", "id email firstName lastName image color role");

    const io = req.app.get("io");
    if (io) {
      const socketId = userSocketMap.get(userId);
      if (socketId) {
        io.to(socketId).emit("userLeftRoom", {
          roomId,
          userId,
          room: updatedRoom,
        });
        io.sockets.sockets.get(socketId)?.leave(roomId);
      }
      io.to(roomId).emit("userLeftRoom", {
        room: updatedRoom,
      });
    }

    res.status(200).json({
      success: true,
      message: "User removed from room successfully",
      room: updatedRoom,
    });
  } catch (error) {
    next(error);
  }
};
