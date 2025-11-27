import express from "express";
import {
  exportMonthlyRevenuePDF,
  exportMonthlyExpensesPDF,
  exportMonthlyOrdersPDF,
  exportMonthlyPurchasesPDF,
  exportComprehensiveMonthlyReportPDF,
  exportAnnualReportPDF,
  generateSalaryReportPDF,
  exportMonthlyPayrollPDF,
  exportOverallOrdersPDF,
} from "../controller/ExportController.js";

import { authorizeRoles, verifyToken } from "../Middleware/authMiddleware.js";

const ExportRoutes = express.Router();

// -------------------- MONTHLY PDF EXPORTS --------------------

// Export Monthly Revenue PDF
ExportRoutes.get(
  "/monthlyrevenuepdf",
  // verifyToken,
  // authorizeRoles("Admin", "CA"),
  exportMonthlyRevenuePDF
);

// Export Monthly Expenses PDF
ExportRoutes.get(
  "/monthlyexpensespdf",
  // verifyToken,
  // authorizeRoles("Admin", "CA"),
  exportMonthlyExpensesPDF
);

// Export Monthly Orders PDF
ExportRoutes.get(
  "/monthlyorderspdf",
  // verifyToken,
  // authorizeRoles("Admin", "CA"),
  exportMonthlyOrdersPDF
);

// Export Monthly Purchases PDF (Profit Analysis)
ExportRoutes.get(
  "/monthlypurchasespdf",
  // verifyToken,
  // authorizeRoles("Admin", "CA"),
  exportMonthlyPurchasesPDF
);

// Export Comprehensive Monthly Report PDF
ExportRoutes.get(
  "/monthlycomprehensivepdf",
  // verifyToken,
  // authorizeRoles("Admin", "CA"),
  exportComprehensiveMonthlyReportPDF
);

// Export Annual Report PDF
ExportRoutes.get(
  "/annualreportpdf",
  // verifyToken,
  // authorizeRoles("Admin", "CA"),
  exportAnnualReportPDF
);
ExportRoutes.get(
  "/generatesalaryreportpdf",generateSalaryReportPDF)

  ExportRoutes.get("/export-monthly-pdf", exportMonthlyPayrollPDF);
  ExportRoutes.get(
    "/export-overall-orders-pdf",
    // verifyToken,
    // authorizeRoles("Admin", "CA"),
    exportOverallOrdersPDF 
  );
export { ExportRoutes };
