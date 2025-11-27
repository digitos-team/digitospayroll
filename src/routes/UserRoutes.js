import express from "express";
import {
  addUser,
  countEmployees,
  deleteUser,
  getAllUsers,
  getUserById,
  updateUser,
  countEmployeesByDepartment,
} from "../controller/UserController.js";
import { upload } from "../Middleware/upload.js";

const UserRoutes = express.Router();

// ------------------ USER ROUTES ------------------

// ✅ Add new user
UserRoutes.post("/adduser", upload.single("ProfilePhoto"), addUser);

// ✅ Get all users (can filter by CompanyId and role via query params)
UserRoutes.get("/getallusers", getAllUsers);

// ✅ Get user by ID
UserRoutes.post("/getuserbyid", getUserById);

// ✅ Update user by ID
UserRoutes.put("/updateuser", updateUser);

// ✅ Delete user by ID
UserRoutes.delete("/deleteuser", deleteUser);

// ✅ Count total employees
UserRoutes.get("/countemployees", countEmployees);
UserRoutes.get(
  "/countemployeesbydepartment",
  countEmployeesByDepartment
);

export { UserRoutes };
