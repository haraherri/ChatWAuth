import mongoose, { mongo } from "mongoose";
import { CustomError } from "../middlewares/error.js";
import User from "../models/user.model.js";
import Message from "../models/message.model.js";

export const searchContacts = async (req, res, next) => {
  try {
    const { searchTerm } = req.body;

    if (searchTerm === undefined || searchTerm === null) {
      throw new CustomError("SearchTerm is required!", 400);
    }

    const sanitizedSearchTerm = searchTerm
      .trim()
      .replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(sanitizedSearchTerm, "i");

    const contacts = await User.find({
      $and: [
        { _id: { $ne: req.userId } },
        { deletedAt: null },
        {
          $or: [
            { firstName: regex },
            { lastName: regex },
            { email: regex },
            {
              $expr: {
                $regexMatch: {
                  input: { $concat: ["$firstName", " ", "$lastName"] },
                  regex: sanitizedSearchTerm,
                  options: "i",
                },
              },
            },
          ],
        },
      ],
    });

    return res.status(200).json({ contacts });
  } catch (error) {
    next(error);
  }
};

export const getContactforDMList = async (req, res, next) => {
  try {
    let { userId } = req;
    userId = new mongoose.Types.ObjectId(userId);

    const contacts = await Message.aggregate([
      // Stage 1: Filter messages
      {
        $match: {
          $or: [{ sender: userId }, { recipient: userId }],
          deletedAt: null, // Thêm điều kiện này để lọc tin nhắn chưa bị xóa
        },
      },

      // Stage 2: Sort by creation time
      {
        $sort: { createdAt: -1 },
      },

      // Stage 3: Group by contact
      {
        $group: {
          _id: {
            $cond: {
              if: { $eq: ["$sender", userId] },
              then: "$recipient",
              else: "$sender",
            },
          },
          lastMessage: { $first: "$$ROOT" }, // Lưu lại toàn bộ document tin nhắn cuối
          lastMessageTime: { $first: "$createdAt" },
        },
      },

      // Stage 4: Join with users collection
      {
        $lookup: {
          from: "users",
          let: { contactId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$_id", "$$contactId"] },
                deletedAt: null,
              },
            },
          ],
          as: "contactInfo",
        },
      },

      // Stage 5: Unwind contactInfo
      {
        $unwind: "$contactInfo",
      },

      // Stage 6: Format return data
      {
        $project: {
          _id: 1,
          lastMessageTime: 1,
          email: "$contactInfo.email",
          firstName: "$contactInfo.firstName",
          lastName: "$contactInfo.lastName",
          image: "$contactInfo.image",
          color: "$contactInfo.color",
          lastMessage: {
            _id: "$lastMessage._id",
            content: "$lastMessage.content",
            messageType: "$lastMessage.messageType",
            createdAt: "$lastMessage.createdAt",
            sender: "$lastMessage.sender",
            recipient: "$lastMessage.recipient",
          },
        },
      },

      // Stage 7: Sort by newest message
      {
        $sort: { lastMessageTime: -1 },
      },

      // Stage 8: Populate sender info trong lastMessage
      {
        $lookup: {
          from: "users",
          let: { senderId: "$lastMessage.sender" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$_id", "$$senderId"] },
              },
            },
            {
              $project: {
                _id: 1,
                firstName: 1,
                lastName: 1,
                email: 1,
                image: 1,
                color: 1,
              },
            },
          ],
          as: "lastMessage.sender",
        },
      },
      {
        $addFields: {
          "lastMessage.sender": { $arrayElemAt: ["$lastMessage.sender", 0] },
        },
      },
    ]);

    return res.status(200).json({ contacts });
  } catch (error) {
    next(error);
  }
};

export const getAllContacts = async (req, res, next) => {
  try {
    const contacts = await User.aggregate([
      {
        $match: {
          $and: [
            { _id: { $ne: new mongoose.Types.ObjectId(req.userId) } },
            { deletedAt: null },
            { isEmailVerified: true },
          ],
        },
      },

      {
        $sort: {
          firstName: 1,
          email: 1,
        },
      },

      {
        $project: {
          value: "$_id",
          label: {
            $cond: {
              if: {
                $and: [
                  { $ne: ["$firstName", null] },
                  { $ne: ["$lastName", null] },
                ],
              },
              then: { $concat: ["$firstName", " ", "$lastName"] },
              else: "$email",
            },
          },
          email: 1,
          image: 1,
          lastLogin: 1,
          role: 1,
        },
      },
    ]);

    return res.status(200).json({
      status: "success",
      contacts,
      total: contacts.length,
    });
  } catch (error) {
    next(error);
  }
};
