import { Server } from "socket.io";
import Message from "../models/message.model.js";

const setupSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.ORIGIN || "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  const userSocketMap = new Map();

  const sendMesage = async (message) => {
    const senderSocketId = userSocketMap.get(message.sender);
    const recipientSocketId = userSocketMap.get(message.recipient);

    const createdMesaage = await Message.create(message);

    const MessageData = await Message.findById(createdMesaage._id)
      .populate("sender", "id email firstName lastName image color")
      .populate("recipient", "id email firstName lastName image color");
    if (recipientSocketId) {
      io.to(recipientSocketId).emit("receiveMessage", MessageData);
    }
    if (senderSocketId) {
      io.to(senderSocketId).emit("receiveMessage", MessageData);
    }
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
    } else {
      console.log("user id not provided during connection");
    }
    socket.on("sendMessage", sendMesage);
    socket.on("disconnect", () => {
      disconnect(socket);
    });
  });

  return io;
};

export default setupSocket;
