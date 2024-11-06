import User from "../models/user.model.js";
import jwt from "jsonwebtoken";
import { CustomError } from "../middlewares/error.js";
import { compare } from "bcrypt";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  generateResetToken,
  generateVerificationToken,
} from "../utils/token.utils.js";
import { emailTemplates, transporter } from "../config/email.config.js";
const maxAge = 3 * 24 * 60 * 60 * 1000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const generateFileUrl = (filename) => {
  return process.env.URL + `/uploads/profiles/${filename}`;
};

const generateToken = (email, userId, role) => {
  return jwt.sign({ email, userId, role }, process.env.JWT_SECRET_KEY, {
    expiresIn: maxAge,
  });
};

export const signup = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      throw new CustomError("Email and Password are required!", 400);
    }

    const existingUser = await User.findOne({
      email: email.toLowerCase(),
      deletedAt: null,
    });

    if (existingUser) {
      if (!existingUser.isEmailVerified) {
        throw new CustomError(
          "Email already registered but not verified. Please login to receive a new verification email.",
          400
        );
      }
      throw new CustomError("User already exists!", 400);
    }

    const isFirstUser = (await User.countDocuments({ deletedAt: null })) === 0;

    const verificationToken = generateVerificationToken();
    const user = await User.create({
      email: email.toLowerCase(),
      password,
      role: isFirstUser ? "admin" : "user",
      emailVerificationToken: verificationToken,
      emailVerificationExpires: Date.now() + 24 * 60 * 60 * 1000,
    });

    await transporter.sendMail({
      to: email,
      ...emailTemplates.verifyEmail(verificationToken),
    });

    res.cookie("jwt", generateToken(email, user._id, user.role), {
      maxAge,
      sameSite: "None",
      secure: true,
      httpOnly: true,
    });

    return res.status(201).json({
      user: {
        id: user._id,
        email: user.email,
        profileSetup: user.profileSetup,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
      },
      message: "Please check your email to verify your account",
    });
  } catch (error) {
    next(error);
  }
};

export const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.params;
    const user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: Date.now() },
    });

    if (!user) {
      throw new CustomError("Invalid or expired verification token", 400);
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    return res.status(200).json({ message: "Email verified successfully" });
  } catch (error) {
    next(error);
  }
};

export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      throw new CustomError("User not found", 404);
    }

    const resetToken = generateResetToken();
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 60 * 60 * 1000; // 1 hour
    await user.save();

    await transporter.sendMail({
      to: email,
      ...emailTemplates.resetPassword(resetToken),
    });

    return res.status(200).json({
      message: "Password reset instructions sent to your email",
    });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      throw new CustomError("Invalid or expired reset token", 400);
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    return res.status(200).json({ message: "Password reset successfully" });
  } catch (error) {
    next(error);
  }
};
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      throw new CustomError("Email and Password are required!", 400);
    }

    const user = await User.findOne({
      email: email.toLowerCase(),
      deletedAt: null,
    });

    if (!user) {
      throw new CustomError("Invalid credentials", 401);
    }

    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      throw new CustomError("Invalid credentials", 401);
    }

    if (!user.isEmailVerified) {
      if (
        !user.emailVerificationToken ||
        user.emailVerificationExpires < Date.now()
      ) {
        const verificationToken = generateVerificationToken();
        user.emailVerificationToken = verificationToken;
        user.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000;
        await user.save();

        await transporter.sendMail({
          to: email,
          ...emailTemplates.verifyEmail(verificationToken),
        });

        throw new CustomError(
          "Please verify your email. A new verification email has been sent.",
          403
        );
      }
      throw new CustomError("Please verify your email before logging in", 403);
    }

    user.lastLogin = new Date();
    await user.save();

    res.cookie("jwt", generateToken(email, user._id, user.role), {
      maxAge,
      sameSite: "none",
      secure: true,
      httpOnly: true,
    });

    return res.status(200).json({
      user: {
        id: user._id,
        email: user.email,
        profileSetup: user.profileSetup,
        firstName: user.firstName,
        lastName: user.lastName,
        image: user.image,
        color: user.color,
        isEmailVerified: user.isEmailVerified,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getUserInfo = async (req, res, next) => {
  try {
    const userData = await User.findById(req.userId);
    if (!userData) {
      throw new CustomError("User with the given id is not found!", 404);
    }
    return res.status(200).json({
      id: userData._id,
      email: userData.email,
      profileSetup: userData.profileSetup,
      firstName: userData.firstName,
      lastName: userData.lastName,
      role: userData.role,
      image: userData.image,
      color: userData.color,
      isEmailVerified: userData.isEmailVerified,
    });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const { userId } = req;
    const { firstName, lastName, color } = req.body;

    if (!firstName || !lastName) {
      throw new CustomError("First name, last name is required!");
    }
    const userData = await User.findByIdAndUpdate(
      userId,
      {
        firstName,
        lastName,
        color,
        profileSetup: true,
      },
      { new: true, runValidators: true }
    );

    return res.status(200).json({
      id: userData._id,
      email: userData.email,
      profileSetup: userData.profileSetup,
      firstName: userData.firstName,
      lastName: userData.lastName,
      role: userData.role,
      image: userData.image,
      color: userData.color,
      isEmailVerified: userData.isEmailVerified,
    });
  } catch (error) {
    next(error);
  }
};

export const uploadProfileImage = async (req, res, next) => {
  const { userId } = req;
  const { filename } = req.file;

  try {
    const user = await User.findByIdAndUpdate(
      userId,
      { image: generateFileUrl(filename) },
      { new: true, runValidators: true }
    ).select("-password");
    if (!user) {
      throw new CustomError("User not found!", 404);
    }
    res
      .status(200)
      .json({ message: "Profile Image updated successfully!", user });
  } catch (error) {
    next(error);
  }
};

export const deleteProfileImage = async (req, res, next) => {
  const { userId } = req;

  try {
    const user = await User.findById(userId).select("-password");

    if (!user) {
      throw new CustomError("User not found!", 404);
    }

    if (!user.image) {
      throw new CustomError("No profile image found!", 404);
    }

    const filename = user.image.split("/").pop();
    const filePath = path.join(__dirname, "../uploads/profiles", filename);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    user.image = "";
    await user.save();

    res.status(200).json({
      message: "Profile image deleted successfully!",
      user,
    });
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      throw new CustomError(
        "Current password and new password are required!",
        400
      );
    }
    if (newPassword.length < 6) {
      throw new CustomError("New password must be at least 6 characters!", 400);
    }

    const userData = await User.findById(req.userId);
    if (!userData) {
      throw new CustomError("User not found!", 404);
    }

    const isPasswordValid = await userData.comparePassword(currentPassword);
    if (!isPasswordValid) {
      throw new CustomError("Current password is incorrect!", 400);
    }

    userData.password = newPassword;
    await userData.save();

    return res.status(200).json({
      message: "Password changed successfully!",
    });
  } catch (error) {
    next(error);
  }
};
export const logOut = async (req, res, next) => {
  try {
    const cookieOptions = {
      sameSite: "none",
      secure: true,
      httpOnly: true,
    };
    res.clearCookie("jwt", cookieOptions);

    return res.status(200).json({
      success: true,
      message: "User logged out successfully",
    });
  } catch (error) {
    next(error);
  }
};
