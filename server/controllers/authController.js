import User from "../models/user.model.js";
import jwt from "jsonwebtoken";
import { CustomError } from "../middlewares/error.js";
import { compare } from "bcrypt";
const maxAge = 3 * 24 * 60 * 60 * 1000;

const generateToken = (email, userId) => {
  return jwt.sign({ email, userId }, process.env.JWT_SECRET_KEY, {
    expiresIn: maxAge,
  });
};

export const signup = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      throw new CustomError("Email and Password are required!", 400);
    }

    const user = await User.create({ email, password });
    res.cookie("jwt", generateToken(email, user._id), {
      maxAge,
      sameSite: "None",
      secure: true,
    });

    return res.status(201).json({
      user: {
        id: user._id,
        email: user.email,
        profileSetup: user.profileSetup,
      },
    });
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

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      throw new CustomError("Invalid credentials", 401);
    }

    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      throw new CustomError("Invalid credentials", 401);
    }
    user.lastLogin = new Date();
    await user.save();
    res.cookie("jwt", generateToken(email, user._id), {
      maxAge,
      sameSite: "None",
      secure: true,
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
      },
    });
  } catch (error) {
    next(error);
  }
};
