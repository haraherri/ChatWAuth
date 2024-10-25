import jwt from "jsonwebtoken";
import { CustomError } from "./error.js";

const verifyToken = (req, res, next) => {
  const token = req.cookies.jwt;
  if (!token) {
    throw new CustomError("Authentication required", 401);
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    req.userId = decoded.userId;
    req.userEmail = decoded.email;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new CustomError("Token has expired", 401);
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new CustomError("Invalid token", 401);
    }
    throw new CustomError("Token verification failed", 500);
  }
};
export default verifyToken;
