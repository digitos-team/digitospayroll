import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  // Basic info
  Name: { type: String, required: true },
  Email: { type: String, required: true, unique: true },
  Phone: { type: String },
  Password: { type: String, required: true },
  role: {
    type: String,
    enum: ["HR", "Employee", "CA"],
    required: true
  },

  // Company connection
  CompanyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true },

  // Optional links (for employees)
  DepartmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Department" },
  DesignationId: { type: mongoose.Schema.Types.ObjectId, ref: "Designation" },
  BranchId: { type: mongoose.Schema.Types.ObjectId, ref: "Branch" },

  // Employee details
  EmployeeCode: { type: String },
  JoiningDate: { type: Date },

  // ✅ Bank Details
  BankDetails: {
    BankName: { type: String },
    AccountHolderName: { type: String },
    AccountNumber: { type: String },
    IFSCCode: { type: String },
    BranchName: { type: String },
   
  },
  ProfilePhoto: {
    type: String, // store the file path or URL
    default: "", 
  },
  // Audit info
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

}, { timestamps: true });
// UserSchema.pre("save", async function (next) {
//   if (!this.isModified("Password")) return next();
//   this.Password = await bcrypt.hash(this.Password, 10);
//   next();
// });
export const User = mongoose.model("User", UserSchema);
