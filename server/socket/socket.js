import { Server } from "socket.io";
import Message from "../models/message.model.js";
import Room from "../models/room.model.js";

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
      const createdMessage = await Message.create(message);
      const messageData = await Message.findById(createdMessage._id)
        .populate("sender", "id email firstName lastName image color")
        .populate("recipient", "id email firstName lastName image color");

      // Handle private message
      if (message.recipient) {
        const recipientSocketId = userSocketMap.get(message.recipient);
        if (recipientSocketId) {
          io.to(recipientSocketId).emit("newMessage", messageData);
        }
      }
      // Handle room message
      else if (message.room) {
        io.to(message.room).emit("newMessage", messageData);
      }

      // Notify sender in both cases
      const senderSocketId = userSocketMap.get(message.sender);
      if (senderSocketId) {
        io.to(senderSocketId).emit("messageSent", {
          status: "success",
          message: messageData,
        });
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

    if (userId) {
      userSocketMap.set(userId, socket.id);
      console.log(`User Connected ${userId} with socket id ${socket.id}`);

      // Auto-join user's rooms
      Room.find({ members: userId, deletedAt: null })
        .then((rooms) => {
          rooms.forEach((room) => {
            socket.join(room._id.toString());
          });
        })
        .catch((error) => console.error("Error joining rooms:", error));
    }

    socket.on("sendMessage", sendMessage);
    socket.on("joinRoom", (roomId) => joinRoom(socket, roomId));
    socket.on("leaveRoom", (roomId) => leaveRoom(socket, roomId));
    socket.on("disconnect", () => disconnect(socket));
  });

  return io;
};

export default setupSocket;
