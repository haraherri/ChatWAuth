import Message from "../models/message.model.js";
import { CustomError } from "../middlewares/error.js";
import fs from "fs";
import path from "path";
import User from "../models/user.model.js";

export const getMessagesBetweenUsers = async (req, res, next) => {
  try {
    const userId1 = req.userId;
    const { userId2 } = req.body;

    if (!userId1 || !userId2) {
      throw new CustomError("Both user IDs are required", 400);
    }

    const messages = await Message.find({
      $or: [
        { sender: userId1, recipient: userId2 },
        { sender: userId2, recipient: userId1 },
      ],
    }).sort({ createdAt: 1 });

    res.status(200).json({ messages });
  } catch (error) {
    next(error);
  }
};
const generateFileUrl = (filename) => {
  return process.env.URL + `/uploads/files/${filename}`;
};

export const uploadMessageFile = async (req, res, next) => {
  const { userId } = req;
  const { recipient } = req.body;

  try {
    const recipientUser = await User.findById(recipient);
    if (!recipientUser) {
      throw new CustomError("Recipient not found!", 404);
    }

    if (!req.file) {
      throw new CustomError("No file uploaded!", 400);
    }

    const { filename, originalname, size, mimetype } = req.file;

    res.status(201).json({
      success: true,
      fileData: {
        fileUrl: generateFileUrl(filename),
        originalName: originalname,
        size: size,
        type: mimetype,
      },
    });
  } catch (error) {
    if (req.file) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error("Error deleting file:", err);
      });
    }
    next(error);
  }
};
