import jwt from "jsonwebtoken";
import { User } from "../models/UserSchema.js";
export const verifyToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token)
      return res.status(401).json({ message: "Access denied, token missing" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // ✅ Fetch full user data from DB
    const user = await User.findById(decoded.id).select(
      "_id Name Email role CompanyId"
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // ✅ Attach to req.user
    req.user = {
      _id: user._id,
      Name: user.Name,
      Email: user.Email,
      role: user.role,
      CompanyId: user.CompanyId,
    };

    next();
  } catch (error) {
    console.error("Error in verifyToken:", error);
    res.status(401).json({ message: "Invalid or expired token" });
  }
};

// Restrict route by role
export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role))
      return res.status(403).json({ message: "Forbidden: Access denied" });
    next();
  };
};
