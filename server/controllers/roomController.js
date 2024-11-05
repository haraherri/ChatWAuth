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
      .populate("creator", "id email firstName lastName image color")
      .populate("members", "id email firstName lastName image color");

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
      .populate("members", "firstName lastName email image")
      .populate("creator", "firstName lastName email image")
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

  try {
    const room = await Room.findOne({
      _id: roomId,
      members: req.userId,
      deletedAt: null,
    });

    if (!room) {
      throw new CustomError("Room not found or access denied", 404);
    }

    const messages = await Message.find({
      room: roomId,
      deletedAt: null,
    })
      .sort({ createdAt: 1 })
      .populate("sender", "firstName lastName email image");

    res.json({
      success: true,
      messages,
    });
  } catch (error) {
    next(error);
  }
};
