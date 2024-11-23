import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import contactRoutes from "./routes/contactRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import { errorHandler, CustomError } from "./middlewares/error.js";
import path from "path";
import http from "http";
import { fileURLToPath } from "url";
import messageRoutes from "./routes/messageRoutes.js";
import roomRoutes from "./routes/roomRoutes.js";
import setupSocket from "./socket/socket.js";
import { initCronJobs } from "./config/cronJobs.js";
import { runMessageConsumer } from "./services/messageConsumer.js";
import mongoose from "mongoose";
import { connectProducer, connectConsumer } from "./config/kafka.js";

dotenv.config();

const PORT = process.env.PORT || 8000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
let isShuttingDown = false;

const app = express();
const server = http.createServer(app);
const io = setupSocket(server);

app.set("io", io);

const corsOptions = {
  origin: process.env.ORIGIN || "http://localhost:3000",
  methods: ["GET", "PUT", "PATCH", "POST", "DELETE"],
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

// Static files
app.use(
  "/uploads/profiles",
  express.static(path.join(__dirname, "uploads/profiles"))
);
app.use(
  "/uploads/files",
  express.static(path.join(__dirname, "uploads/files"))
);

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/contacts", contactRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/rooms", roomRoutes);

// Error handling middleware
app.use(errorHandler);

// Graceful shutdown handler
const gracefulShutdown = async (signal) => {
  if (isShuttingDown) return;
  isShuttingDown = true;

  console.log(`\nReceived ${signal}. Starting graceful shutdown...`);

  try {
    // Close server
    await new Promise((resolve, reject) => {
      server.close((err) => {
        if (err) reject(err);
        console.log("HTTP server closed");
        resolve();
      });
    });

    // Disconnect Kafka if enabled
    if (process.env.ENABLE_KAFKA === "true") {
      if (producer) {
        await producer.disconnect();
        console.log("Kafka producer disconnected");
      }
      if (consumer) {
        await consumer.disconnect();
        console.log("Kafka consumer disconnected");
      }
    }

    // Close MongoDB
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log("Database connection closed");
    }

    console.log("Graceful shutdown completed");
    process.exit(0);
  } catch (error) {
    console.error("Error during shutdown:", error);
    process.exit(1);
  }
};

// Error and signal handlers
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});
process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  gracefulShutdown("Uncaught Exception");
});

// Server startup function

const startServer = async () => {
  try {
    // Connect to database
    await connectDB();
    console.log("Database connected successfully");

    // Initialize cron jobs
    initCronJobs();
    console.log("Cron jobs initialized");

    // Chỉ khởi tạo Kafka nếu ENABLE_KAFKA=true
    if (process.env.ENABLE_KAFKA === "true") {
      try {
        await connectProducer();
        await connectConsumer();

        // Initialize message consumer
        const messageConsumerInstance = runMessageConsumer(io);
        await messageConsumerInstance();
        console.log("Kafka services initialized successfully");
      } catch (error) {
        console.warn("Failed to initialize Kafka services:", error.message);
        // Không crash server, chỉ log warning
      }
    }

    // Start HTTP server
    server.listen(PORT, () => {
      console.log(`Backend server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start services:", error);
    if (!isShuttingDown) {
      console.log("Attempting to restart services...");
      setTimeout(startServer, 5000);
    }
  }
};

// Start the server
startServer();

export default app;
