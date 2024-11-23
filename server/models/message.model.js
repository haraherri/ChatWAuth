import mongoose from "mongoose";
import Room from "./room.model.js";

const MessageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      required: function () {
        return !this.recipient;
      },
    },
    messageType: {
      type: String,
      enum: ["text", "file"],
      required: true,
    },
    content: {
      type: String,
      required: function () {
        return this.messageType === "text";
      },
      maxlength: [4000, "Message cannot be longer than 4000 characters"],
      trim: true,
    },
    fileUrl: {
      type: String,
      required: function () {
        return this.messageType === "file";
      },
    },
    isPinned: {
      type: Boolean,
      default: false,
    },
    pinnedAt: {
      type: Date,
      default: null,
    },
    pinnedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

MessageSchema.pre(
  "deleteOne",
  { document: true, query: false },
  async function () {
    if (this.isPinned && this.room) {
      await Room.findByIdAndUpdate(this.room, {
        $inc: { pinnedMessagesCount: -1 },
      });
    }
  }
);

MessageSchema.pre("deleteMany", async function () {
  const messages = await this.model.find(this.getQuery());

  const roomCounts = messages.reduce((acc, msg) => {
    if (msg.isPinned && msg.room) {
      acc[msg.room] = (acc[msg.room] || 0) + 1;
    }
    return acc;
  }, {});

  const updates = Object.entries(roomCounts).map(([roomId, count]) =>
    Room.findByIdAndUpdate(roomId, {
      $inc: { pinnedMessagesCount: -count },
    })
  );

  await Promise.all(updates);
});

const Message = mongoose.model("Messages", MessageSchema);

export default Message;
