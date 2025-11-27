import express from "express";
import {
  addExpense,
  getAllExpenses,
  getExpenseById,
  updateExpense,
  deleteExpense,
  // updateExpenseStatus,
  getTotalExpense,
  getExpensesByOrder,
  getMonthlyExpenses,
  getMonthExpenses,
} from "../controller/ExpenseController.js";
import { authorizeRoles, verifyToken } from "../Middleware/authMiddleware.js";
import { upload } from "../Middleware/upload.js";

const ExpenseRoutes = express.Router();

// --------------------- ADMIN ONLY ---------------------
ExpenseRoutes.post(
  "/addexpense",
  (req, res, next) => {
    req.uploadFolder = "Receipt";
    next();
  },
  upload.single("Receipt"),
  // verifyToken,
  // authorizeRoles("Admin"),
  addExpense
);

ExpenseRoutes.put(
  "/updateexpense/:id",
  (req, res, next) => {
    req.uploadFolder = "Receipt";
    next();
  },
  upload.single("Receipt"),
  updateExpense
);


ExpenseRoutes.delete(
  "/delete-expense/:id",
  verifyToken,
  authorizeRoles("Admin"),
  deleteExpense
);

// ExpenseRoutes.put(
//   "/expensestatus",
//   // verifyToken,
//   // authorizeRoles("Admin"),
//   updateExpenseStatus
// );

// --------------------- ADMIN + CA ---------------------
ExpenseRoutes.get(
  "/getallexpense",
  // verifyToken,
  // authorizeRoles("Admin", "CA"),
  getAllExpenses
);

ExpenseRoutes.post(
  "/getexpensebyid",
  // verifyToken,
  // authorizeRoles("Admin", "CA"),
  getExpenseById
);

ExpenseRoutes.post(
  "/gettotalexpensesbycompany",
  // verifyToken,
  // authorizeRoles("Admin", "CA"),
  getTotalExpense
);
ExpenseRoutes.post(
  "/getexpensesbyorder",
  // verifyToken,
  // authorizeRoles("Admin", "CA"),
  getExpensesByOrder
);

// -------------------- MONTHLY EXPENSES --------------------
ExpenseRoutes.get(
  "/monthwiseexpenses",
  // verifyToken,
  // authorizeRoles("Admin", "CA"),
  getMonthlyExpenses
);

ExpenseRoutes.get(
  "/monthlyexpenses",
  // verifyToken,
  // authorizeRoles("Admin", "CA"),
  getMonthExpenses
);

export { ExpenseRoutes };
