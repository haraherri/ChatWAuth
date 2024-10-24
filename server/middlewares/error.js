import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

const formatDate = (date) => {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? "PM" : "AM";
  const formattedHours = hours % 12 || 12; // chuyển đổi 0 thành 12
  const formattedMinutes = minutes.toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const year = date.getFullYear();

  return `${formattedHours}:${formattedMinutes} ${ampm} ${day}/${month}/${year}`;
};

const logError = async (err) => {
  const timestamp = formatDate(new Date());
  const logMessage = `${timestamp} - ${err.name}: ${err.message}\n${err.stack}\n\n`;
  console.error(logMessage);

  const logFilePath = path.join(rootDir, "error.log");

  try {
    await fs.appendFile(logFilePath, logMessage);
    console.log("Error logged to file successfully");
  } catch (appendErr) {
    console.error("Failed to write to log file:", appendErr);
  }
};

const errorHandler = (err, req, res, next) => {
  logError(err);
  if (err instanceof CustomError) {
    return res.status(err.status).json({ error: err.message });
  }
  return res.status(500).json({ error: "Internal Server Error!" });
};

class CustomError extends Error {
  constructor(message, status = 500) {
    super(message);
    this.name = this.constructor.name;
    this.status = status;
    Error.captureStackTrace(this, this.constructor);
  }
}

export { errorHandler, CustomError };
