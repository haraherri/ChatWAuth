import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();

const dbState = {
  0: "Disconnected",
  1: "Connected",
  2: "Connecting",
  3: "Disconnecting",
};

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.CONNECTION_URL, {
      serverSelectionTimeoutMS: 5000,
    });

    console.log(
      `Database connection status: ${dbState[mongoose.connection.readyState]}`
    );

    mongoose.connection.on("error", (err) => {
      console.error("MongoDB connection error:", err);
    });

    mongoose.connection.on("disconnected", () => {
      console.log("MongoDB disconnected");
    });

    process.on("SIGINT", async () => {
      try {
        await mongoose.connection.close();
        console.log("MongoDB connection closed due to app termination");
        process.exit(0);
      } catch (error) {
        console.error("Error closing MongoDB connection:", error);
        process.exit(1);
      }
    });
  } catch (error) {
    console.error("Database connection error:", error);
    process.exit(1);
  }
};

export default connectDB;
