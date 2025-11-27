import bcrypt from "bcryptjs";
import { User } from "../models/UserSchema.js";
import { RecentActivity } from "../models/RecentActivitySchema.js";
import { sendEmail } from "../utils/Mailer.js";


const addUser = async (req, res) => {
  try {
    const {
      Name,
      Email,
      Phone,
      Password,
      role,
      CompanyId,
      DepartmentId,
      DesignationId,
      BranchId,
      EmployeeCode,
      JoiningDate,
      createdBy,
      BankDetails,
    } = req.body;

    // Check if email exists
    const existingUser = await User.findOne({ Email });
    if (existingUser)
      return res.status(400).json({ message: "Email already exists" });

    // Hash password
    const hashedPassword = await bcrypt.hash(Password, 10);

    // Create user
    const newUser = new User({
      Name,
      Email,
      Phone,
      Password: hashedPassword,
      role,
      CompanyId,
      DepartmentId,
      DesignationId,
      BranchId,
      EmployeeCode,
      JoiningDate,
      createdBy,
      BankDetails,
      ProfilePhoto: req.file ? req.file.path : "",
    });

    await newUser.save();

    // ------------------ Recent Activity ------------------
    const activity = await RecentActivity.create({
      CompanyId,
      EmployeeId: newUser._id,
      // ActivityType: "Employee Added",
      Details: `Employee ${Name} added`,
      isEmailSent: false, // optional, to track email
      action: `Employee ${Name} added`,
    });

    // ------------------ Send Email to Admin ------------------
    const adminEmails = ["nileshjadhav01776@gmail.com"]; // replace with dynamic if needed
    const subject = `New Employee Added: ${Name}`;
    const text = `A new employee has been added:\n\nName: ${Name}\nJoining Date: ${JoiningDate}\nEmployee Code: ${EmployeeCode}`;
    const html = `<p>A new employee has been added:</p>
                  <ul>
                    <li><b>Name:</b> ${Name}</li>
                    <li><b>Joining Date:</b> ${JoiningDate}</li>
                    <li><b>Employee Code:</b> ${EmployeeCode}</li>
                  </ul>`;

    try {
      await sendEmail({ to: adminEmails, subject, text, html });
      // Optionally mark activity as email sent
      activity.isEmailSent = true;
      await activity.save();
    } catch (emailErr) {
      // Log email failure but do not fail user creation
      console.error(
        "Failed to send admin notification email:",
        emailErr?.message || emailErr
      );
      // activity.isEmailSent remains false; save activity to persist the record
      try {
        await activity.save();
      } catch (saveErr) {
        console.error(
          "Failed to save activity after email failure:",
          saveErr?.message || saveErr
        );
      }
    }

    res
      .status(201)
      .json({
        message: "User created successfully and admin notified",
        user: newUser,
      });
  } catch (error) {
    console.error("Error in addUser:", error);
    res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
};

// -------------------- Update User --------------------
const updateUser = async (req, res) => {
  try {
    const { id, Password, BankDetails, ...otherFields } = req.body;

    const updatedData = { ...otherFields };
    if (Password) updatedData.Password = await bcrypt.hash(Password, 10);

    if (BankDetails && typeof BankDetails === "object") {
      for (const key in BankDetails) {
        updatedData[`BankDetails.${key}`] = BankDetails[key];
      }
    }

    const user = await User.findByIdAndUpdate(id, updatedData, { new: true });
    if (!user) return res.status(404).json({ message: "User not found" });

    // Log recent activity
    await RecentActivity.create({
      CompanyId: user.CompanyId,
      EmployeeId: user._id,
      ActivityType: "Employee Updated",
      Details: `Employee ${user.Name} updated`,
    });

    res.status(200).json({ message: "User updated successfully", user });
  } catch (error) {
    console.error("Error in updateUser:", error);
    res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
};

// -------------------- Delete User --------------------
const deleteUser = async (req, res) => {
  try {
    const { id } = req.body;
    const user = await User.findByIdAndDelete(id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Log recent activity
    await RecentActivity.create({
      CompanyId: user.CompanyId,
      EmployeeId: user._id,
      ActivityType: "Employee Deleted",
      Details: `Employee ${user.Name} deleted`,
    });

    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error in deleteUser:", error);
    res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
};

// -------------------- Get All Users --------------------
const getAllUsers = async (req, res) => {
  try {
    const { CompanyId, role } = req.query;
    const filter = {};
    if (CompanyId) filter.CompanyId = CompanyId;
    if (role) filter.role = role;

    const users = await User.find(filter)
      .populate("CompanyId", "CompanyName")
      .populate("DepartmentId", "DepartmentName")
      .populate("DesignationId", "DesignationName")
      .populate("BranchId", "BranchName");

    res.status(200).json(users);
  } catch (error) {
    console.error("Error in getAllUsers:", error);
    res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
};

// -------------------- Get User by ID --------------------
const getUserById = async (req, res) => {
  try {
    const { id } = req.body;
    const user = await User.findById(id)
      .populate("CompanyId", "CompanyName")
      .populate("DepartmentId", "DepartmentName")
      .populate("DesignationId", "DesignationName")
      .populate("BranchId", "BranchName");

    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(200).json(user);
  } catch (error) {
    console.error("Error in getUserById:", error);
    res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
};

// -------------------- Count Employees --------------------
const countEmployees = async (req, res) => {
  try {
    const totalEmployees = await User.countDocuments();
    res.status(200).json({
      success: true,
      totalEmployees,
      message: "Total number of employees fetched successfully",
    });
  } catch (error) {
    console.error("Error counting employees:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// -------------------- Count Employees by Department --------------------
const countEmployeesByDepartment = async (req, res) => {
  try {
    const { CompanyId } = req.query;
    const matchStage = CompanyId ? { CompanyId } : {};

    const result = await User.aggregate([
      { $match: matchStage },
      { $group: { _id: "$DepartmentId", totalEmployees: { $sum: 1 } } },
      {
        $lookup: {
          from: "departments",
          localField: "_id",
          foreignField: "_id",
          as: "DepartmentInfo",
        },
      },
      {
        $unwind: { path: "$DepartmentInfo", preserveNullAndEmptyArrays: true },
      },
      {
        $project: {
          _id: 0,
          DepartmentId: "$_id",
          DepartmentName: "$DepartmentInfo.DepartmentName",
          totalEmployees: 1,
        },
      },
    ]);

    res.status(200).json({
      success: true,
      message: "Employee count by department fetched successfully",
      data: result,
    });
  } catch (error) {
    console.error("Error counting employees by department:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export {
  addUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  countEmployees,
  countEmployeesByDepartment,
};
