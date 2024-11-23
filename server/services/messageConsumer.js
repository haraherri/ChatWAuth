import { consumer } from "../config/kafka.js";
import Message from "../models/message.model.js";
import { userSocketMap } from "../socket/socket.js";

export const runMessageConsumer = (io) => async () => {
  try {
    await consumer.connect();
    console.log("Consumer connected successfully");

    await consumer.subscribe({
      topic: "chat-messages",
      fromBeginning: false,
    });
    console.log("Consumer subscribed to chat-messages topic");

    await consumer.run({
      eachBatchAutoResolve: true,
      eachBatch: async ({ batch, resolveOffset, heartbeat, isRunning }) => {
        for (let message of batch.messages) {
          if (!isRunning()) break;

          try {
            const messageData = JSON.parse(message.value.toString());

            // Create and populate message
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
              const recipientSocketId = userSocketMap.get(
                messageData.recipient
              );
              if (recipientSocketId) {
                io.to(recipientSocketId).emit("newMessage", populatedMessage);
              }
            } else if (messageData.room) {
              io.to(messageData.room).emit("newMessage", populatedMessage);
            }

            resolveOffset(message.offset);
            await heartbeat();
          } catch (error) {
            console.error("Error processing message:", error);
            continue;
          }
        }
      },
      autoCommit: true,
      autoCommitInterval: 5000,
      autoCommitThreshold: 100,
    });
  } catch (error) {
    console.error("Consumer failed to start:", error);
    process.exit(1);
  }
};
