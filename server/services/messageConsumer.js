import { consumer } from "../config/kafka.js";
import Message from "../models/message.model.js";
import { userSocketMap } from "../socket/socket.js";

export const runMessageConsumer = (io) => async () => {
  await consumer.connect();
  await consumer.subscribe({ topic: "chat-messages" });

  await consumer.run({
    eachMessage: async ({ message }) => {
      const messageData = JSON.parse(message.value.toString());

      const createdMessage = await Message.create(messageData);
      const populatedMessage = await Message.findById(createdMessage._id)
        .populate("sender", "id email firstName lastName image color")
        .populate("recipient", "id email firstName lastName image color");

      // Emit to sender
      const senderSocketId = userSocketMap.get(messageData.sender);
      if (senderSocketId) {
        io.to(senderSocketId).emit("messageSent", {
          status: "success",
          messageId: populatedMessage._id,
          message: populatedMessage,
        });
      }

      // Emit to recipient or room
      if (messageData.recipient) {
        const recipientSocketId = userSocketMap.get(messageData.recipient);
        if (recipientSocketId) {
          io.to(recipientSocketId).emit("newMessage", populatedMessage);
        }
      } else if (messageData.room) {
        io.to(messageData.room).emit("newMessage", populatedMessage);
      }
    },
  });
};
