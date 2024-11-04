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
        },
      },

      // Stage 2: Sort by last creation time
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
          lastMessageTime: { $first: "$createdAt" },
        },
      },

      // Stage 4: Join with collection users
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "contactInfo",
        },
      },

      // Stage 5: extract array contactInfo
      {
        $unwind: "$contactInfo",
      },

      // Stage 6: Returning format
      {
        $project: {
          _id: 1,
          lastMessageTime: 1,
          email: "$contactInfo.email",
          firstName: "$contactInfo.firstName",
          lastName: "$contactInfo.lastName",
          image: "$contactInfo.image",
          color: "$contactInfo.color",
        },
      },

      // Stage 7: Sort by newest message
      {
        $sort: { lastMessageTime: -1 },
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
