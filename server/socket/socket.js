import { Server } from "socket.io";
import Message from "../models/message.model.js";
import Room from "../models/room.model.js";
import User from "../models/user.model.js";
import { producer } from "../config/kafka.js";

export const userSocketMap = new Map();
const setupSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.ORIGIN || "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  const sendMessage = async (message) => {
    try {
      // Add validation for room messages
      if (message.room) {
        const room = await Room.findById(message.room);
        if (!room) {
          throw new Error("Room not found");
        }

        // Check if sender is member of room
        if (!room.members.includes(message.sender)) {
          const senderSocketId = userSocketMap.get(message.sender);
          if (senderSocketId) {
            io.to(senderSocketId).emit("messageSent", {
              status: "error",
              error: "You are not authorized to send messages in this room",
            });
          }
          return;
        }
      }

      if (process.env.ENABLE_KAFKA === "true") {
        // Kafka logic giữ nguyên...
        await producer.connect();
        await producer.send({
          topic: "chat-messages",
          messages: [
            {
              key: message.room || message.recipient,
              value: JSON.stringify(message),
            },
          ],
        });
      } else {
        // Fallback logic khi không có Kafka
        const createdMessage = await Message.create(message);
        const populatedMessage = await Message.findById(createdMessage._id)
          .populate("sender", "id email firstName lastName image color")
          .populate("recipient", "id email firstName lastName image color");

        // Emit to sender
        const senderSocketId = userSocketMap.get(message.sender);
        if (senderSocketId) {
          io.to(senderSocketId).emit("messageSent", {
            status: "success",
            messageId: populatedMessage._id,
            message: populatedMessage,
          });
        }

        // Emit to recipient or room
        if (message.recipient) {
          const recipientSocketId = userSocketMap.get(message.recipient);
          if (recipientSocketId) {
            io.to(recipientSocketId).emit("newMessage", populatedMessage);
          }
        } else if (message.room) {
          io.to(message.room).emit("newMessage", populatedMessage);
        }
      }
    } catch (error) {
      const senderSocketId = userSocketMap.get(message.sender);
      if (senderSocketId) {
        io.to(senderSocketId).emit("messageSent", {
          status: "error",
          error: error.message,
        });
      }
    }
  };
  const deleteMessage = async (socket, { messageId }) => {
    try {
      const message = await Message.findById(messageId);
      if (!message || !message.room) {
        socket.emit("deleteMessageError", {
          error: "Message not found or not in a room",
        });
        return;
      }

      const userId = socket.handshake.query.userId;
      const user = await User.findById(userId);

      if (!user) {
        socket.emit("deleteMessageError", {
          error: "User not found",
        });
        return;
      }

      if (message.isPinned) {
        // update room's pinned message count
        await Room.findByIdAndUpdate(message.room, {
          $inc: { pinnedMessagesCount: -1 },
        });

        // update message pin status
        message.isPinned = false;
        message.pinnedAt = null;
        message.pinnedBy = null;
      }

      message.deletedAt = new Date();
      message.deletedBy = userId;
      await message.save();

      // Populate deletedBy information before emitting
      const populatedMessage = await Message.findById(messageId)
        .populate("deletedBy", "firstName lastName")
        .populate("sender", "firstName lastName email image color")
        .populate("pinnedBy", "firstName lastName");

      // emit two events: messageDeleted and messagePin (if message was pinned)
      io.to(message.room.toString()).emit("messageDeleted", {
        messageId,
        deletedBy: populatedMessage.deletedBy,
        deletedAt: message.deletedAt,
      });

      // if message was pinned, emit unpinned event
      if (message.isPinned) {
        io.to(message.room.toString()).emit("messagePin", {
          messageId,
          action: "unpinned",
          message: populatedMessage,
        });
      }
    } catch (error) {
      socket.emit("deleteMessageError", {
        error: error.message,
      });
    }
  };
  const pinMessage = async (socket, { messageId }) => {
    try {
      const message = await Message.findById(messageId);
      if (!message || !message.room) {
        socket.emit("pinMessageError", {
          error: "Message not found or not in a room",
        });
        return;
      }

      const userId = socket.handshake.query.userId;
      const user = await User.findById(userId);
      const room = await Room.findById(message.room);

      if (!user) {
        socket.emit("pinMessageError", {
          error: "User not found",
        });
        return;
      }

      // check user is a member of the room
      if (!room.members.includes(userId)) {
        socket.emit("pinMessageError", {
          error: "You are not a member of this room",
        });
        return;
      }

      // Toggle pin status
      const newPinStatus = !message.isPinned;

      // if pinning, check if room has reached max pinned messages
      if (newPinStatus && room.pinnedMessagesCount >= 10) {
        socket.emit("pinMessageError", {
          error: "Room has reached maximum number of pinned messages (10)",
        });
        return;
      }

      // update pin status
      message.isPinned = newPinStatus;
      message.pinnedAt = newPinStatus ? new Date() : null;
      message.pinnedBy = newPinStatus ? userId : null;
      await message.save();

      // Update room's pinned message count
      room.pinnedMessagesCount += newPinStatus ? 1 : -1;
      await room.save();

      // Populate pinnedBy information before emitting
      const populatedMessage = await Message.findById(messageId)
        .populate("pinnedBy", "id firstName lastName")
        .populate("sender", "id email firstName lastName image color");

      // Emit message pin event to all users in the room ( action: pinned/unpinned )
      io.to(message.room.toString()).emit("messagePin", {
        messageId,
        action: newPinStatus ? "pinned" : "unpinned",
        pinnedBy: populatedMessage.pinnedBy,
        pinnedAt: message.pinnedAt,
        message: populatedMessage,
      });
    } catch (error) {
      socket.emit("pinMessageError", {
        error: error.message,
      });
    }
  };

  const getPinnedMessages = async (socket, roomId) => {
    try {
      const CLEANUP_THRESHOLD = 14 * 24 * 60 * 60 * 1000;
      const thresholdDate = new Date(Date.now() - CLEANUP_THRESHOLD);

      const messages = await Message.find({
        room: roomId,
        isPinned: true,
        $or: [{ deletedAt: null }, { deletedAt: { $gt: thresholdDate } }],
      })
        .sort({ pinnedAt: -1 })
        .populate("sender", "firstName lastName email image color")
        .populate("pinnedBy", "firstName lastName")
        .populate("deletedBy", "firstName lastName");

      socket.emit("pinnedMessages", messages);
    } catch (error) {
      socket.emit("pinnedMessagesError", {
        error: error.message,
      });
    }
  };
  // Handle joining room
  const joinRoom = async (socket, roomId) => {
    try {
      const room = await Room.findById(roomId);
      if (!room) {
        socket.emit("roomError", "Room not found");
        return;
      }

      const userId = socket.handshake.query.userId;
      if (!room.members.includes(userId)) {
        socket.emit("roomError", "Not a member of this room");
        return;
      }

      socket.join(roomId);
      socket.emit("joinedRoom", roomId);
    } catch (error) {
      socket.emit("roomError", error.message);
    }
  };

  // Handle leaving room
  const leaveRoom = (socket, roomId) => {
    socket.leave(roomId);
    socket.emit("leftRoom", roomId);
  };

  const disconnect = (socket) => {
    console.log("Client disconnected:", socket.id);
    for (const [userId, socketId] of userSocketMap.entries()) {
      if (socketId === socket.id) {
        userSocketMap.delete(userId);
        break;
      }
    }
  };

  io.on("connection", (socket) => {
    const userId = socket.handshake.query.userId;

    if (userId && userId !== "undefined") {
      userSocketMap.set(userId, socket.id);
      console.log(`User Connected ${userId} with socket id ${socket.id}`);

      Room.find({ members: userId, deletedAt: null })
        .then((rooms) => {
          rooms.forEach((room) => {
            socket.join(room._id.toString());
          });
        })
        .catch((error) => console.error("Error joining rooms:", error));
    }

    socket.on("sendMessage", sendMessage);
    socket.on("deleteMessage", (data) => deleteMessage(socket, data));
    socket.on("pinMessage", (data) => pinMessage(socket, data));
    socket.on("getPinnedMessages", (roomId) =>
      getPinnedMessages(socket, roomId)
    );
    socket.on("joinRoom", (roomId) => joinRoom(socket, roomId));
    socket.on("leaveRoom", (roomId) => leaveRoom(socket, roomId));
    socket.on("disconnect", () => disconnect(socket));
  });

  return io;
};

export default setupSocket;
