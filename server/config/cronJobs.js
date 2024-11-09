import cron from "node-cron";
import Message from "../models/message.model.js";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

// Validate cron expression and configuration
const validateAndStartJob = (cronExpression, jobFunction, jobName) => {
  if (cron.validate(cronExpression)) {
    cron.schedule(cronExpression, jobFunction, {
      scheduled: true,
      timezone: "Asia/Ho_Chi_Minh", // Adjust to your timezone
    });
    console.log(`✓ ${jobName} job scheduled`);
  } else {
    console.error(`✕ Invalid cron expression for ${jobName}`);
  }
};
const deleteFile = async (fileUrl) => {
  try {
    // Convert URL to local path
    const urlPath = new URL(fileUrl).pathname; // get path /uploads/files/filename.jpg
    const relativePath = urlPath.replace("/uploads/files/", ""); // get file name
    const filePath = path.join(process.cwd(), "uploads", "files", relativePath);

    // Check if file exists before deleting
    try {
      await fs.access(filePath);
      await fs.unlink(filePath);
      return true;
    } catch (err) {
      if (err.code === "ENOENT") {
        console.log(`File already deleted or not found: ${fileUrl}`);
        return true; // Consider it success since file is already gone
      }
      throw err;
    }
  } catch (error) {
    console.error(`Error deleting file ${fileUrl}:`, error);
    return false;
  }
};

// Hard delete messages that were soft deleted more than a week ago
const cleanupDeletedMessages = async () => {
  // Local test: 30 seconds
  const CLEANUP_THRESHOLD =
    process.env.NODE_ENV === "development"
      ? 14 * 24 * 60 * 60 * 1000 // 14 days
      : 30 * 24 * 60 * 60 * 1000; // 30 days

  const thresholdDate = new Date(Date.now() - CLEANUP_THRESHOLD);
  const BATCH_SIZE = 100;

  try {
    console.log(
      `Starting cleanup job. Current time: ${new Date().toISOString()}`
    );
    console.log(`Threshold date: ${thresholdDate.toISOString()}`);
    console.log(`Environment: ${process.env.NODE_ENV}`);
    // Get messages that need to be deleted
    const deletedMessages = await Message.find({
      deletedAt: {
        $lt: thresholdDate,
        $ne: null,
      },
      messageType: "file", // Only get file messages first
    }).limit(BATCH_SIZE);

    // Delete files first
    for (const message of deletedMessages) {
      try {
        if (message.fileUrl) {
          const isDeleted = await deleteFile(message.fileUrl);
          if (isDeleted) {
            console.log(`File deleted successfully: ${message.fileUrl}`);
          }
        }
      } catch (error) {
        console.error(`Error deleting file for message ${message._id}:`, error);
      }
    }

    // Then delete all messages (both files and text)
    const result = await Message.deleteMany({
      deletedAt: {
        $lt: thresholdDate,
        $ne: null,
      },
    });

    console.log(
      `Cleanup job completed: ${result.deletedCount} messages permanently deleted`
    );
  } catch (error) {
    console.error("Error during message cleanup:", error);
  }
};

// Initialize all cron jobs
export const initCronJobs = () => {
  // Both environments run at midnight (00:00)
  const cronSchedule = "0 0 * * *";

  validateAndStartJob(cronSchedule, cleanupDeletedMessages, "Message Cleanup");
  console.log(`Cron job initialized for environment: ${process.env.NODE_ENV}`);
  console.log(
    `Messages will be deleted after: ${
      process.env.NODE_ENV === "development" ? "14" : "30"
    } days`
  );
};
