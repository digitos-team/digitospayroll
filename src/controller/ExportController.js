import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import PDFDocument from "pdfkit";
import { fileURLToPath } from "url";
import {
  generateMonthlyRevenueReport,
  generateMonthlyExpensesReport,
  generateMonthlyOrdersReport,
  generateMonthlyPurchasesReport,
  generateComprehensiveMonthlyReport,
  generateAnnualReportPDF,
} from "../utils/MonthlyReportPdfGenerator.js";
import { Revenue } from "../models/RevenueSchema.js";
import { Expense } from "../models/ExpenseSchema.js";
import { Order } from "../models/OrderSchema.js";
import { SalarySlip } from "../models/SalaryCalculateSchema.js";
import { User } from "../models/UserSchema.js";
import { RecentActivity } from "../models/RecentActivitySchema.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const EXPORT_DIR = path.join(process.cwd(), "exports");
if (!fs.existsSync(EXPORT_DIR)) fs.mkdirSync(EXPORT_DIR, { recursive: true });

// -------------------- Helpers --------------------
const parseNumber = (v, fallback = null) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

const buildMonthRange = (month, year) => {
  const monthNum = parseNumber(month);
  const yearNum = parseNumber(year);
  if (!monthNum || !yearNum) return null;

  const startDate = new Date(yearNum, monthNum - 1, 1);
  const endDate = new Date(yearNum, monthNum, 1);
  return { startDate, endDate, monthNum, yearNum };
};

const sendAndCleanupFile = (res, filePath, downloadName) => {
  // send file and delete after sending
  res.download(filePath, downloadName, (err) => {
    if (err) {
      console.error("Error sending file:", err);
      if (!res.headersSent) res.status(500).json({ success: false, message: "Error sending file" });
    }
    // attempt cleanup
    fs.unlink(filePath, (unlinkErr) => {
      if (unlinkErr) console.warn("Could not delete temp file:", unlinkErr.message);
    });
  });
};

// -------------------- Monthly Revenue --------------------
export const exportMonthlyRevenuePDF = async (req, res) => {
  try {
    const { month, year, CompanyId } = req.query;
    const range = buildMonthRange(month, year);
    if (!range) return res.status(400).json({ message: "month and year required" });

    const filter = { RevenueDate: { $gte: range.startDate, $lt: range.endDate } };
    if (CompanyId) filter.CompanyId = new mongoose.Types.ObjectId(CompanyId);

    const revenues = await Revenue.find(filter)
      .populate("CompanyId", "CompanyName")
      .populate("OrderId", "ServiceTitle")
      .populate("AddedBy", "Name Email")
      .sort({ RevenueDate: -1 })
      .lean();

    const totalAmount = revenues.reduce((s, r) => s + (r.Amount || 0), 0);
    const data = {
      summary: { totalRevenue: totalAmount, count: revenues.length, averageRevenue: revenues.length ? totalAmount / revenues.length : 0 },
      revenues: revenues.map((r) => ({ ...r, ClientName: r.ClientName || "N/A", Source: r.Source || "Client Service" })),
    };

    const filePath = await generateMonthlyRevenueReport(data, range.monthNum, range.yearNum);
    sendAndCleanupFile(res, filePath, path.basename(filePath));
  } catch (error) {
    console.error("exportMonthlyRevenuePDF:", error);
    res.status(500).json({ message: "Error generating PDF", error: error.message });
  }
};

// -------------------- Monthly Expenses --------------------
export const exportMonthlyExpensesPDF = async (req, res) => {
  try {
    const { month, year, CompanyId } = req.query;
    const range = buildMonthRange(month, year);
    if (!range) return res.status(400).json({ message: "month and year required" });

    const filter = { ExpenseDate: { $gte: range.startDate, $lt: range.endDate } };
    if (CompanyId) filter.CompanyId = new mongoose.Types.ObjectId(CompanyId);

    const expenses = await Expense.find(filter)
      .populate("CompanyId", "CompanyName")
      .populate("OrderId", "ServiceTitle")
      .populate("AddedBy", "Name Email")
      .sort({ ExpenseDate: -1 })
      .lean();

    const totalAmount = expenses.reduce((s, r) => s + (r.Amount || 0), 0);

    const data = {
      summary: { totalExpenses: totalAmount, count: expenses.length, averageExpense: expenses.length ? totalAmount / expenses.length : 0 },
      expenses: expenses.map((e) => ({ ...e, ExpenseTitle: e.ExpenseTitle, ExpenseType: e.ExpenseType || "Other" })),
    };

    const filePath = await generateMonthlyExpensesReport(data, range.monthNum, range.yearNum);
    sendAndCleanupFile(res, filePath, path.basename(filePath));
  } catch (error) {
    console.error("exportMonthlyExpensesPDF:", error);
    res.status(500).json({ message: "Error generating PDF", error: error.message });
  }
};

// -------------------- Monthly Orders --------------------
export const exportMonthlyOrdersPDF = async (req, res) => {
  try {
    const { month, year, CompanyId } = req.query;
    const range = buildMonthRange(month, year);
    if (!range) return res.status(400).json({ message: "month and year required" });

    const filter = { createdAt: { $gte: range.startDate, $lt: range.endDate } };
    if (CompanyId) filter.CompanyId = new mongoose.Types.ObjectId(CompanyId);

    const orders = await Order.find(filter).populate("CompanyId", "CompanyName").populate("CreatedBy", "Name Email").sort({ createdAt: -1 }).lean();

    const totalValue = orders.reduce((s, o) => s + (o.Amount || 0), 0);
    const data = { summary: { count: orders.length, totalValue, averageValue: orders.length ? totalValue / orders.length : 0 }, orders };

    const filePath = await generateMonthlyOrdersReport(data, range.monthNum, range.yearNum);
    sendAndCleanupFile(res, filePath, path.basename(filePath));
  } catch (error) {
    console.error("exportMonthlyOrdersPDF:", error);
    res.status(500).json({ message: "Error generating PDF", error: error.message });
  }
};

// -------------------- Monthly Purchases (Profit Analysis) --------------------
export const exportMonthlyPurchasesPDF = async (req, res) => {
  try {
    const { month, year, CompanyId } = req.query;
    const range = buildMonthRange(month, year);
    if (!range) return res.status(400).json({ message: "month and year required" });

    const orderFilter = { PaymentStatus: "Paid", updatedAt: { $gte: range.startDate, $lt: range.endDate } };
    if (CompanyId) orderFilter.CompanyId = new mongoose.Types.ObjectId(CompanyId);

    const orders = await Order.find(orderFilter).lean();
    if (!orders.length) return res.status(200).json({ message: "No paid orders for this month" });

    const orderIds = orders.map((o) => o._id);
    const expenses = await Expense.find({ OrderId: { $in: orderIds }, ExpenseDate: { $gte: range.startDate, $lt: range.endDate } }).lean();

    const purchases = orders.map((order) => {
      const related = expenses.filter((e) => e.OrderId.toString() === order._id.toString());
      const totalExpense = related.reduce((s, r) => s + (r.Amount || 0), 0);
      const profit = (order.Amount || 0) - totalExpense;
      return { _id: order._id, ClientName: order.ClientName, ServiceTitle: order.ServiceTitle, OrderAmount: order.Amount || 0, TotalExpense: totalExpense, Profit: profit, profitMargin: order.Amount ? ((profit / order.Amount) * 100).toFixed(2) : "0.00" };
    });

    const data = {
      summary: {
        count: purchases.length,
        totalRevenue: purchases.reduce((s, p) => s + p.OrderAmount, 0),
        totalExpenses: purchases.reduce((s, p) => s + p.TotalExpense, 0),
        totalProfit: purchases.reduce((s, p) => s + p.Profit, 0),
      },
      purchases,
    };

    const filePath = await generateMonthlyPurchasesReport(data, range.monthNum, range.yearNum);
    sendAndCleanupFile(res, filePath, path.basename(filePath));
  } catch (error) {
    console.error("exportMonthlyPurchasesPDF:", error);
    res.status(500).json({ message: "Error generating PDF", error: error.message });
  }
};

// -------------------- Comprehensive Monthly Report --------------------
export const exportComprehensiveMonthlyReportPDF = async (req, res) => {
  try {
    const { month, year, CompanyId } = req.query;
    const range = buildMonthRange(month, year);
    if (!range) return res.status(400).json({ message: "month and year required" });

    // Revenue
    const revenueFilter = { RevenueDate: { $gte: range.startDate, $lt: range.endDate } };
    if (CompanyId) revenueFilter.CompanyId = new mongoose.Types.ObjectId(CompanyId);
    const revenues = await Revenue.find(revenueFilter).populate("CompanyId", "CompanyName").lean();
    const revenueData = { summary: { totalRevenue: revenues.reduce((s, r) => s + (r.Amount || 0), 0), count: revenues.length }, revenues };

    // Expenses
    const expenseFilter = { ExpenseDate: { $gte: range.startDate, $lt: range.endDate } };
    if (CompanyId) expenseFilter.CompanyId = new mongoose.Types.ObjectId(CompanyId);
    const allExpenses = await Expense.find(expenseFilter).populate("CompanyId", "CompanyName").lean();
    const expensesData = { summary: { totalExpenses: allExpenses.reduce((s, e) => s + (e.Amount || 0), 0), count: allExpenses.length }, expenses: allExpenses };

    // Orders
    const orderFilter = { createdAt: { $gte: range.startDate, $lt: range.endDate } };
    if (CompanyId) orderFilter.CompanyId = new mongoose.Types.ObjectId(CompanyId);
    const orders = await Order.find(orderFilter).populate("CompanyId", "CompanyName").lean();
    const ordersData = { summary: { count: orders.length, totalValue: orders.reduce((s, o) => s + (o.Amount || 0), 0) }, orders };

    // Purchases/profit
    const paidOrderFilter = { PaymentStatus: "Paid", updatedAt: { $gte: range.startDate, $lt: range.endDate } };
    if (CompanyId) paidOrderFilter.CompanyId = new mongoose.Types.ObjectId(CompanyId);
    const paidOrders = await Order.find(paidOrderFilter).lean();
    const paidOrderIds = paidOrders.map((o) => o._id);
    const purchaseExpenses = await Expense.find({ OrderId: { $in: paidOrderIds }, ExpenseDate: { $gte: range.startDate, $lt: range.endDate } }).lean();

    const purchases = paidOrders.map((order) => {
      const related = purchaseExpenses.filter((e) => e.OrderId.toString() === order._id.toString());
      const totalExpense = related.reduce((s, r) => s + (r.Amount || 0), 0);
      const profit = (order.Amount || 0) - totalExpense;
      return { _id: order._id, ClientName: order.ClientName, ServiceTitle: order.ServiceTitle, OrderAmount: order.Amount || 0, TotalExpense: totalExpense, Profit: profit, profitMargin: order.Amount ? ((profit / order.Amount) * 100).toFixed(2) : "0.00" };
    });

    const purchasesData = { summary: { count: purchases.length, totalRevenue: purchases.reduce((s, p) => s + p.OrderAmount, 0), totalExpenses: purchases.reduce((s, p) => s + p.TotalExpense, 0), totalProfit: purchases.reduce((s, p) => s + p.Profit, 0) }, purchases };

    const filePath = await generateComprehensiveMonthlyReport(revenueData, expensesData, ordersData, purchasesData, range.monthNum, range.yearNum);
    sendAndCleanupFile(res, filePath, path.basename(filePath));
  } catch (error) {
    console.error("exportComprehensiveMonthlyReportPDF:", error);
    res.status(500).json({ message: "Error generating PDF", error: error.message });
  }
};

// -------------------- Annual Report --------------------
export const exportAnnualReportPDF = async (req, res) => {
  try {
    const { year, CompanyId } = req.query;
    const yearNum = parseNumber(year);
    if (!yearNum) return res.status(400).json({ message: "year is required" });

    const yearStart = new Date(`${yearNum}-01-01`);
    const yearEnd = new Date(`${yearNum + 1}-01-01`);

    const revenueFilter = { RevenueDate: { $gte: yearStart, $lt: yearEnd } };
    const expenseFilter = { ExpenseDate: { $gte: yearStart, $lt: yearEnd } };
    const orderFilter = { createdAt: { $gte: yearStart, $lt: yearEnd } };

    if (CompanyId) {
      const companyObjectId = new mongoose.Types.ObjectId(CompanyId);
      revenueFilter.CompanyId = companyObjectId;
      expenseFilter.CompanyId = companyObjectId;
      orderFilter.CompanyId = companyObjectId;
    }

    const revenues = await Revenue.find(revenueFilter).lean();
    const expenses = await Expense.find(expenseFilter).lean();
    const orders = await Order.find(orderFilter).lean();

    const monthlyRevenue = await Revenue.aggregate([
      { $match: revenueFilter },
      { $group: { _id: { $month: "$RevenueDate" }, total: { $sum: "$Amount" } } },
      { $sort: { _id: 1 } },
    ]);

    const data = { year: yearNum, totals: { revenue: revenues.reduce((s, r) => s + (r.Amount || 0), 0), expenses: expenses.reduce((s, e) => s + (e.Amount || 0), 0), profit: revenues.reduce((s, r) => s + (r.Amount || 0), 0) - expenses.reduce((s, e) => s + (e.Amount || 0), 0), orders: orders.length }, monthlyBreakdown: monthlyRevenue };

    const filePath = await generateAnnualReportPDF(data);
    sendAndCleanupFile(res, filePath, `Annual_Report_${yearNum}.pdf`);
  } catch (error) {
    console.error("exportAnnualReportPDF:", error);
    res.status(500).json({ message: "Error generating PDF", error: error.message });
  }
};

// -------------------- Salary Report --------------------
export const generateSalaryReportPDF = async (req, res) => {
  try {
    const { CompanyId, Month } = req.query;
    if (!CompanyId) return res.status(400).json({ success: false, message: "CompanyId required" });

    const query = Month ? { CompanyId: new mongoose.Types.ObjectId(CompanyId), Month } : { CompanyId: new mongoose.Types.ObjectId(CompanyId) };
    const slips = await SalarySlip.find(query).lean();
    if (!slips.length) return res.status(404).json({ success: false, message: "No salary data found" });

    // fetch users
    const employeeIds = [...new Set(slips.map((s) => s.EmployeeID?.toString()).filter(Boolean))];
    const employees = await User.find({ _id: { $in: employeeIds } }).select("_id Name Email EmployeeCode DepartmentId").lean();
    const employeeMap = new Map(employees.map((e) => [e._id.toString(), e]));

    const validSlips = slips.map((slip) => {
      const emp = employeeMap.get(slip.EmployeeID?.toString());
      if (!emp) return null;
      return { ...slip, Employee: emp };
    }).filter(Boolean);

    if (!validSlips.length) return res.status(404).json({ success: false, message: "No valid employee data found for slips" });

    // dept aggregation
    const deptAggregation = await SalarySlip.aggregate([
      { $match: query },
      { $lookup: { from: "users", localField: "EmployeeID", foreignField: "_id", as: "employee" } },
      { $unwind: { path: "$employee", preserveNullAndEmptyArrays: false } },
      { $lookup: { from: "departments", localField: "employee.DepartmentId", foreignField: "_id", as: "department" } },
      { $unwind: { path: "$department", preserveNullAndEmptyArrays: true } },
      { $group: { _id: { $ifNull: ["$department.DepartmentName", "Unassigned"] }, totalGrossSalary: { $sum: "$grossSalary" }, totalNetSalary: { $sum: "$netSalary" }, employeeCount: { $sum: 1 } } },
      { $project: { DepartmentName: "$_id", totalGrossSalary: 1, totalNetSalary: 1, employeeCount: 1, _id: 0 } },
      { $sort: { totalGrossSalary: -1 } },
    ]);

    // generate PDF in-memory
    const doc = new PDFDocument({ margin: 50 });
    const buffers = [];
    doc.on("data", (b) => buffers.push(b));
    doc.on("end", async () => {
      const pdfData = Buffer.concat(buffers);
      await RecentActivity.create({ CompanyId, ActivityType: `Generated salary report PDF for ${Month || "all months"}` });
      res.writeHead(200, { "Content-Length": pdfData.length, "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename=SalaryReport-${Month || "AllMonths"}.pdf` });
      res.end(pdfData);
    });

    doc.fontSize(20).text(`Salary Report ${Month || "All Months"}`, { align: "center" });
    doc.moveDown();

    const totalGross = validSlips.reduce((s, slip) => s + (slip.grossSalary || 0), 0);
    const totalNet = validSlips.reduce((s, slip) => s + (slip.netSalary || 0), 0);

    doc.fontSize(12).text(`Total Employees: ${validSlips.length}`);
    doc.text(`Total Gross Salary: ₹${totalGross.toLocaleString("en-IN")}`);
    doc.text(`Total Net Salary: ₹${totalNet.toLocaleString("en-IN")}`);
    doc.moveDown();

    doc.fontSize(14).text("Individual Employee Salary Slips:", { underline: true });
    doc.moveDown();

    validSlips.forEach((slip, i) => {
      const emp = slip.Employee;
      const employeeName = emp?.Name || emp?.Email?.split("@")[0] || emp?.EmployeeCode || `Employee ID: ${emp?._id || "Unknown"}`;
      doc.fontSize(10).text(`${i + 1}. ${employeeName} - Gross: ₹${(slip.grossSalary || 0).toLocaleString("en-IN")}, Net: ₹${(slip.netSalary || 0).toLocaleString("en-IN")}, Month: ${slip.Month}`);
      if ((i + 1) % 40 === 0 && i < validSlips.length - 1) {
        doc.addPage();
        doc.fontSize(14).text("Individual Employee Salary Slips (continued):", { underline: true });
        doc.moveDown();
      }
    });

    if (deptAggregation.length) {
      doc.addPage();
      doc.fontSize(14).text("Department-wise Salary Distribution:", { underline: true });
      doc.moveDown();
      deptAggregation.forEach((d, idx) => {
        doc.fontSize(10).text(`${idx + 1}. ${d.DepartmentName}`);
        doc.fontSize(9).text(`   Total Gross: ₹${d.totalGrossSalary.toLocaleString("en-IN")}, Total Net: ₹${d.totalNetSalary.toLocaleString("en-IN")}, Employees: ${d.employeeCount}`, { indent: 20 });
        doc.moveDown(0.5);
      });
    }

    doc.end();
  } catch (error) {
    console.error("generateSalaryReportPDF:", error);
    res.status(500).json({ success: false, message: "Internal server error", error: error.message });
  }
};

// -------------------- Monthly Payroll (Branch-wise) --------------------
export const exportMonthlyPayrollPDF = async (req, res) => {
  try {
    const { CompanyId, Month } = req.query;
    if (!CompanyId || !Month) return res.status(400).json({ success: false, message: "CompanyId and Month are required" });

    const payrollData = await SalarySlip.aggregate([
      { $match: { CompanyId: new mongoose.Types.ObjectId(CompanyId), Month } },
      { $lookup: { from: "branches", localField: "BranchId", foreignField: "_id", as: "branchData" } },
      { $unwind: { path: "$branchData", preserveNullAndEmptyArrays: true } },
      { $group: { _id: { Branch: { $ifNull: ["$branchData.BranchName", "Unknown Branch"] } }, totalGross: { $sum: "$grossSalary" }, totalNet: { $sum: "$netSalary" }, employeeCount: { $sum: 1 } } },
      { $project: { _id: 0, Branch: "$_id.Branch", totalGross: 1, totalNet: 1, employeeCount: 1 } },
    ]);

    if (!payrollData.length) return res.status(404).json({ success: false, message: "No payroll data found for this month" });

    const fileName = `Payroll_${Month}.pdf`;
    const filePath = path.join(EXPORT_DIR, fileName);

    const doc = new PDFDocument({ margin: 50 });
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    doc.fontSize(20).text("Branch-wise Monthly Payroll Report", { align: "center" });
    doc.moveDown();
    doc.fontSize(12).text(`Month: ${Month}`, { align: "center" });
    doc.moveDown(1);

    doc.fontSize(12).text("Branch", 50, doc.y, { width: 150, continued: true });
    doc.text("Employees", 200, doc.y, { width: 100, continued: true });
    doc.text("Total Gross", 300, doc.y, { width: 100, continued: true });
    doc.text("Total Net", 400, doc.y, { width: 100 });
    doc.moveDown(0.5);
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(0.5);

    payrollData.forEach((row) => {
      doc.fontSize(11).text(row.Branch, 50, doc.y, { width: 150, continued: true });
      doc.text(row.employeeCount.toString(), 200, doc.y, { width: 100, continued: true });
      doc.text(row.totalGross.toFixed(2), 300, doc.y, { width: 100, continued: true });
      doc.text(row.totalNet.toFixed(2), 400, doc.y, { width: 100 });
      doc.moveDown(0.3);
    });

    const totalGrossAll = payrollData.reduce((s, d) => s + d.totalGross, 0);
    const totalNetAll = payrollData.reduce((s, d) => s + d.totalNet, 0);
    const totalEmployees = payrollData.reduce((s, d) => s + d.employeeCount, 0);

    doc.moveDown(1);
    doc.fontSize(12).text("Summary", { underline: true });
    doc.moveDown(0.5);
    doc.text(`Total Branches: ${payrollData.length}`);
    doc.text(`Total Employees: ${totalEmployees}`);
    doc.text(`Total Gross Salary: ₹${totalGrossAll.toFixed(2)}`);
    doc.text(`Total Net Salary: ₹${totalNetAll.toFixed(2)}`);

    doc.end();

    stream.on("finish", () => sendAndCleanupFile(res, filePath, fileName));
  } catch (error) {
    console.error("exportMonthlyPayrollPDF:", error);
    res.status(500).json({ success: false, message: "Failed to export PDF", error: error.message });
  }
};

// -------------------- NEW: Overall Orders PDF --------------------
// Generates a PDF of orders optionally filtered by company and date-range
export const exportOverallOrdersPDF = async (req, res) => {
  try {
    const { CompanyId, startDate: start, endDate: end } = req.query;

    const filter = {};
    if (CompanyId) filter.CompanyId = new mongoose.Types.ObjectId(CompanyId);
    if (start || end) {
      filter.createdAt = {};
      if (start) filter.createdAt.$gte = new Date(start);
      if (end) filter.createdAt.$lt = new Date(end);
    }

    const orders = await Order.find(filter).populate("CompanyId", "CompanyName").populate("CreatedBy", "Name Email").sort({ createdAt: -1 }).lean();

    if (!orders.length) return res.status(404).json({ message: "No orders found for given filters" });

    const fileName = `Orders_${CompanyId ? CompanyId : "All"}_${Date.now()}.pdf`;
    const filePath = path.join(EXPORT_DIR, fileName);

    const doc = new PDFDocument({ margin: 40, size: "A4" });
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    doc.fontSize(18).text("Orders Report", { align: "center" });
    doc.moveDown();
    doc.fontSize(10).text(`Generated: ${new Date().toLocaleString()}`);
    if (CompanyId) doc.text(`CompanyId: ${CompanyId}`);
    if (start || end) doc.text(`Range: ${start || "(any)"} to ${end || "(any)"}`);
    doc.moveDown();

    // Table header
    doc.fontSize(11).text("#", 50, doc.y, { width: 30, continued: true });
    doc.text("Order ID", 80, doc.y, { width: 120, continued: true });
    doc.text("Client", 200, doc.y, { width: 100, continued: true });
    doc.text("Amount", 300, doc.y, { width: 80, continued: true });
    doc.text("Status", 380, doc.y, { width: 80, continued: true });
    doc.text("Date", 460, doc.y, { width: 120 });
    doc.moveDown(0.5);
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(0.5);

    orders.forEach((o, idx) => {
      const date = new Date(o.createdAt).toLocaleString();
      doc.fontSize(10).text(String(idx + 1), 50, doc.y, { width: 30, continued: true });
      doc.text(String(o._id).slice(-8), 80, doc.y, { width: 120, continued: true });
      doc.text(o.ClientName || (o.CreatedBy?.Name || "-"), 200, doc.y, { width: 100, continued: true });
      doc.text(o.Amount != null ? `₹${Number(o.Amount).toFixed(2)}` : "-", 300, doc.y, { width: 80, continued: true });
      doc.text(o.PaymentStatus || o.Status || "-", 380, doc.y, { width: 80, continued: true });
      doc.text(date, 460, doc.y, { width: 120 });
      doc.moveDown(0.3);

      // New page if necessary
      if (doc.y > 720) {
        doc.addPage();
      }
    });

    doc.end();

    stream.on("finish", () => sendAndCleanupFile(res, filePath, fileName));
  } catch (error) {
    console.error("exportOverallOrdersPDF:", error);
    res.status(500).json({ message: "Error generating Orders PDF", error: error.message });
  }
};

export default {
  exportMonthlyRevenuePDF,
  exportMonthlyExpensesPDF,
  exportMonthlyOrdersPDF,
  exportMonthlyPurchasesPDF,
  exportComprehensiveMonthlyReportPDF,
  exportAnnualReportPDF,
  generateSalaryReportPDF,
  exportMonthlyPayrollPDF,
  exportOverallOrdersPDF,
};
