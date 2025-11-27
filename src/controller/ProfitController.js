import { Expense } from "../models/ExpenseSchema.js";
import { Revenue } from "../models/RevenueSchema.js";

const getRevenueWithProfitByOrder = async (req, res) => {
  try {
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({ message: "OrderId is required" });
    }

    // Get revenue for the order
    const revenue = await Revenue.find({ OrderId: orderId })
      .populate("CompanyId", "CompanyName")
      .populate("OrderId", "ServiceTitle OrderStatus TotalAmount")
      .populate("AddedBy", "Name Email");

    if (!revenue || revenue.length === 0) {
      return res
        .status(404)
        .json({ message: "No revenue found for this order" });
    }

    // Calculate total revenue amount
    const totalRevenue = revenue.reduce((acc, r) => acc + r.Amount, 0);

    // Get total expense for the same order
    const expenses = await Expense.find({ OrderId: orderId });
    const totalExpense = expenses.reduce((acc, e) => acc + e.Amount, 0);

    // Calculate profit
    const profit = totalRevenue - totalExpense;

    res.status(200).json({
      revenue,
      totalRevenue,
      totalExpense,
      profit,
    });
  } catch (error) {
    console.error("Error in getRevenueWithProfitByOrder:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// -------------------- Get Total Profit --------------------
const getTotalProfitfromTotalOrder = async (req, res) => {
  try {
    const { CompanyId } = req.body;

    // 1️⃣ Get total revenue for company
    const revenueResult = await Revenue.aggregate([
      { $match: CompanyId ? { CompanyId: CompanyId } : {} },
      { $group: { _id: null, totalRevenue: { $sum: "$Amount" } } },
    ]);

    // 2️⃣ Get total expenses related to orders
    const expenseResult = await Expense.aggregate([
      {
        $match: CompanyId
          ? { CompanyId: CompanyId, OrderId: { $ne: null } }
          : { OrderId: { $ne: null } },
      },
      { $group: { _id: null, totalExpense: { $sum: "$Amount" } } },
    ]);

    const totalRevenue = revenueResult[0]?.totalRevenue || 0;
    const totalExpense = expenseResult[0]?.totalExpense || 0;
    const totalProfit = totalRevenue - totalExpense;

    res.status(200).json({
      totalRevenue,
      totalExpense,
      totalProfit,
    });
  } catch (error) {
    console.error("Error in getTotalProfit:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getTotalProfit = async (req, res) => {
  try {
    // Total Revenue: all revenues (including linked to orders)
    const revenueAgg = await Revenue.aggregate([
      { $group: { _id: null, totalRevenue: { $sum: "$Amount" } } },
    ]);

    // Total Expense: include all expenses, whether linked to orders or not
    const expenseAgg = await Expense.aggregate([
      { $group: { _id: null, totalExpense: { $sum: "$Amount" } } },
    ]);

    const totalRevenue = revenueAgg[0]?.totalRevenue || 0;
    const totalExpense = expenseAgg[0]?.totalExpense || 0;
    const totalProfit = totalRevenue - totalExpense;

    res.status(200).json({
      totalRevenue,
      totalExpense,
      totalProfit,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export {
  getRevenueWithProfitByOrder,
  getTotalProfit,
  getTotalProfitfromTotalOrder,
};
