// server/config/kafka.js
import { Kafka } from "kafkajs";

const kafka = new Kafka({
  clientId: "chat-service",
  brokers: ["localhost:9092"], // Kafka broker URLs
});

const producer = kafka.producer();
const consumer = kafka.consumer({ groupId: "chat-group" });

export { producer, consumer };
