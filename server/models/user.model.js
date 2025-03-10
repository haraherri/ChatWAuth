import mongoose from "mongoose";
import { genSalt, hash, compare } from "bcrypt";

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, "Email is required!"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required!"],
      minlength: [6, "Password must be at least 6 characters"],
    },
    firstName: {
      type: String,
      trim: true,
    },
    lastName: {
      type: String,
      trim: true,
    },
    image: String,
    color: Number,
    profileSetup: {
      type: Boolean,
      default: false,
    },
    isOnline: {
      type: Boolean,
      default: false,
    },
    lastActive: {
      type: Date,
      default: Date.now,
    },
    lastLogin: {
      type: Date,
      default: Date.now,
    },
    role: {
      type: String,
      enum: ["admin", "moderator", "user"],
      default: "user",
    },
    deletedAt: {
      type: Date,
      default: null,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: String,
    emailVerificationExpires: Date,
    resetPasswordToken: String,
    resetPasswordExpires: Date,
  },
  {
    timestamps: true,
  }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    const salt = await genSalt(12);
    this.password = await hash(this.password, salt);
    return next();
  } catch (error) {
    return next(error);
  }
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  try {
    return await compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error("Error comparing passwords");
  }
};

userSchema.methods.updateOnlineStatus = async function (status) {
  this.isOnline = status;
  this.lastActive = new Date();
  return this.save();
};

// Thêm phương thức để kiểm tra nếu người dùng còn trực tuyến
userSchema.methods.isActivelyOnline = function (timeoutMinutes = 5) {
  if (!this.isOnline) return false;

  const now = new Date();
  const lastActiveTime = new Date(this.lastActive);
  const diffMinutes = (now - lastActiveTime) / (1000 * 60);

  return diffMinutes <= timeoutMinutes;
};

const User = mongoose.model("User", userSchema);

export default User;
