import { Server } from "socket.io";
import Message from "../models/message.model.js";
import Room from "../models/room.model.js";
import User from "../models/user.model.js";
import { producer } from "../config/kafka.js";

// Key: userId (string), Value: { socketId: string, lastActive: Date }
export const userSocketMap = new Map();

const setupSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.ORIGIN || "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  const updateUserOnlineStatus = async (userId, status) => {
    try {
      if (!userId || userId === "undefined") return;

      const user = await User.findById(userId);
      if (!user) return;

      if (status === false) {
        user.lastActive = new Date(); // just update lastActive if user goes offline
      }
      await user.updateOnlineStatus(status);

      for (const [otherUserId, otherUserInfo] of userSocketMap) {
        if (otherUserId === userId) continue;

        io.to(otherUserInfo.socketId).emit("userStatusUpdate", {
          userId,
          isOnline: status,
          lastActive: status ? otherUserInfo.lastActive : new Date(), // get lastActive from map
        });
      }
    } catch (error) {
      console.error("Error updating user online status:", error);
    }
  };

  const getRoomOnlineUsers = async (socket, roomId) => {
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

      const onlineUsers = [];
      for (const memberId of room.members) {
        if (userSocketMap.has(memberId.toString())) {
          const memberInfo = userSocketMap.get(memberId.toString());
          onlineUsers.push({
            userId: memberId.toString(),
            isOnline: true,
            lastActive: memberInfo.lastActive, // get lastActive from map
          });
        }
      }

      socket.emit("roomOnlineUsers", { roomId, onlineUsers });
    } catch (error) {
      socket.emit("roomError", error.message);
    }
  };

  const sendMessage = async (message) => {
    try {
      // Validate room messages
      if (message.room) {
        const room = await Room.findById(message.room);
        if (!room) {
          throw new Error("Room not found");
        }

        // Check if sender is member of room
        if (!room.members.includes(message.sender)) {
          const senderSocketId = userSocketMap.get(message.sender)?.socketId;
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
        // Fallback khi không có Kafka
        const createdMessage = await Message.create(message);
        const populatedMessage = await Message.findById(createdMessage._id)
          .populate("sender", "id email firstName lastName image color")
          .populate("recipient", "id email firstName lastName image color");

        // Emit to sender
        const senderSocketId = userSocketMap.get(message.sender)?.socketId;
        if (senderSocketId) {
          io.to(senderSocketId).emit("messageSent", {
            status: "success",
            messageId: populatedMessage._id,
            message: populatedMessage,
          });
        }

        // Emit to recipient or room
        if (message.recipient) {
          const recipientSocketId = userSocketMap.get(
            message.recipient
          )?.socketId;
          if (recipientSocketId) {
            io.to(recipientSocketId).emit("newMessage", populatedMessage);
          }
        } else if (message.room) {
          io.to(message.room).emit("newMessage", populatedMessage);
        }
      }
    } catch (error) {
      const senderSocketId = userSocketMap.get(message.sender)?.socketId;
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
        await Room.findByIdAndUpdate(message.room, {
          $inc: { pinnedMessagesCount: -1 },
        });

        message.isPinned = false;
        message.pinnedAt = null;
        message.pinnedBy = null;
      }

      message.deletedAt = new Date();
      message.deletedBy = userId;
      await message.save();

      const populatedMessage = await Message.findById(messageId)
        .populate("deletedBy", "firstName lastName")
        .populate("sender", "firstName lastName email image color")
        .populate("pinnedBy", "firstName lastName");

      io.to(message.room.toString()).emit("messageDeleted", {
        messageId,
        deletedBy: populatedMessage.deletedBy,
        deletedAt: message.deletedAt,
      });

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

      if (!room.members.includes(userId)) {
        socket.emit("pinMessageError", {
          error: "You are not a member of this room",
        });
        return;
      }

      const newPinStatus = !message.isPinned;

      if (newPinStatus) {
        const canPin = await room.canPinMessage();
        if (!canPin) {
          socket.emit("pinMessageError", {
            error: "Room has reached maximum number of pinned messages (10)",
          });
          return;
        }
      }

      message.isPinned = newPinStatus;
      message.pinnedAt = newPinStatus ? new Date() : null;
      message.pinnedBy = newPinStatus ? userId : null;
      await message.save();

      room.pinnedMessagesCount += newPinStatus ? 1 : -1;
      await room.save();

      const populatedMessage = await Message.findById(messageId)
        .populate("pinnedBy", "id firstName lastName")
        .populate("sender", "id email firstName lastName image color");

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

      await updateUserOnlineStatus(userId, true);

      socket.join(roomId);
      socket.emit("joinedRoom", roomId);

      socket.to(roomId).emit("userJoinedRoom", {
        userId,
        roomId,
        isOnline: true,
        timestamp: new Date(),
      });

      getRoomOnlineUsers(socket, roomId);
    } catch (error) {
      socket.emit("roomError", error.message);
    }
  };

  const leaveRoom = async (socket, roomId) => {
    const userId = socket.handshake.query.userId;

    socket.leave(roomId);
    socket.emit("leftRoom", roomId);

    socket.to(roomId).emit("userLeftRoom", {
      userId,
      roomId,
      timestamp: new Date(),
    });
  };

  const disconnect = async (socket) => {
    console.log("Client disconnected:", socket.id);
    let userId = null;

    for (const [uid, userInfo] of userSocketMap.entries()) {
      if (userInfo.socketId === socket.id) {
        userId = uid;
        userSocketMap.delete(uid); // Xóa
        break;
      }
    }

    if (userId) {
      await updateUserOnlineStatus(userId, false);
    }
  };
  const getUserStatus = async (socket, targetUserId) => {
    const userId = socket.handshake.query.userId;

    if (!userId) {
      socket.emit("userStatusError", "Unauthorized");
      return;
    }

    const isOnline = userSocketMap.has(targetUserId);
    let lastActive = null;

    if (isOnline) {
      const targetUser = userSocketMap.get(targetUserId);
      lastActive = targetUser.lastActive;
    } else {
      // trường hợp offline cần lấy lastActive từ database
      const user = await User.findById(targetUserId);
      lastActive = user?.lastActive;
    }
    socket.emit("userStatus", { userId: targetUserId, isOnline, lastActive });
  };

  io.on("connection", async (socket) => {
    const userId = socket.handshake.query.userId;

    if (userId && userId !== "undefined") {
      userSocketMap.set(userId, {
        socketId: socket.id,
        lastActive: new Date(),
      });
      console.log(`User Connected ${userId} with socket id ${socket.id}`);

      await updateUserOnlineStatus(userId, true);

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
    socket.on("getUserStatus", (targetUserId) =>
      getUserStatus(socket, targetUserId)
    );
    socket.on("getRoomOnlineUsers", (roomId) =>
      getRoomOnlineUsers(socket, roomId)
    );

    // handle user active event
    socket.on("userActiveEvent", () => {
      const userInfo = userSocketMap.get(userId);
      if (userInfo) {
        userSocketMap.set(userId, { ...userInfo, lastActive: new Date() });
      }
    });

    socket.on("disconnect", () => disconnect(socket));
  });

  return io;
};

export default setupSocket;
