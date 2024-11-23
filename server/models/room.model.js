import mongoose from "mongoose";
import Message from "./message.model.js";

const RoomSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    pinnedMessagesCount: {
      type: Number,
      default: 0,
      max: 10,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },

  {
    timestamps: true,
  }
);

RoomSchema.statics.syncPinnedCount = async function (roomId) {
  const pinnedCount = await Message.countDocuments({
    room: roomId,
    isPinned: true,
    deletedAt: null,
  });

  await this.findByIdAndUpdate(roomId, {
    pinnedMessagesCount: pinnedCount,
  });
};

RoomSchema.methods.canPinMessage = async function () {
  const actualPinnedCount = await Message.countDocuments({
    room: this._id,
    isPinned: true,
    deletedAt: null,
  });

  if (actualPinnedCount !== this.pinnedMessagesCount) {
    this.pinnedMessagesCount = actualPinnedCount;
    await this.save();
  }

  return actualPinnedCount < 10;
};

const Room = mongoose.model("Room", RoomSchema);

export default Room;
