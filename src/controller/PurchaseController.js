// import { Expense } from "../models/ExpenseSchema.js";
// import { Order } from "../models/OrderSchema.js";
// import { Purchase } from "../models/PurchaseSchema.js";
// import mongoose from "mongoose";

// // -------------------- Add Purchase (Manual - if needed) --------------------
// const addPurchase = async (req, res) => {
//   try {
//     const purchase = new Purchase(req.body);
//     await purchase.save();
//     res.status(201).json({ message: "Purchase added successfully", purchase });
//   } catch (error) {
//     res.status(500).json({ message: "Server error", error: error.message });
//   }
// };

// // -------------------- Get All Purchases (Paid Orders + Expenses) --------------------
// const getPurchases = async (req, res) => {
//   try {
//     const { CompanyId } = req.query;

//     // Build filter for paid and confirmed orders
//     const orderFilter = {
//       PaymentStatus: "Paid",
//       OrderStatus: "Confirmed",
//     };

//     if (CompanyId && mongoose.Types.ObjectId.isValid(CompanyId)) {
//       orderFilter.CompanyId = new mongoose.Types.ObjectId(CompanyId);
//     }

//     // Use aggregation for better performance
//     const purchasesData = await Order.aggregate([
//       { $match: orderFilter },
//       {
//         $lookup: {
//           from: "expenses", // MongoDB collection name (lowercase by default)
//           localField: "_id",
//           foreignField: "OrderId",
//           as: "expenses"
//         }
//       },
//       {
//         $lookup: {
//           from: "companies",
//           localField: "CompanyId",
//           foreignField: "_id",
//           as: "company"
//         }
//       },
//       {
//         $lookup: {
//           from: "users",
//           localField: "CreatedBy",
//           foreignField: "_id",
//           as: "creator"
//         }
//       },
//       {
//         $addFields: {
//           TotalExpense: { $sum: "$expenses.Amount" },
//           Profit: { $subtract: ["$Amount", { $sum: "$expenses.Amount" }] },
//           CompanyName: { $arrayElemAt: ["$company.CompanyName", 0] },
//           CreatedByUser: { $arrayElemAt: ["$creator", 0] }
//         }
//       },
//       {
//         $project: {
//           _id: 1,
//           OrderId: "$_id",
//           ClientName: 1,
//           ServiceTitle: 1,
//           CompanyId: 1,
//           CompanyName: 1,
//           OrderAmount: "$Amount",
//           AdvancePaid: { $ifNull: ["$AdvancePaid", 0] },
//           TotalExpense: 1,
//           Profit: 1,
//           PaymentStatus: 1,
//           OrderStatus: 1,
//           OrderDate: "$createdAt",
//           PaidDate: "$updatedAt",
//           CreatedBy: {
//             _id: "$CreatedByUser._id",
//             Name: "$CreatedByUser.Name",
//             Email: "$CreatedByUser.Email"
//           },
//           RelatedExpenses: {
//             $map: {
//               input: "$expenses",
//               as: "exp",
//               in: {
//                 _id: "$$exp._id",
//                 ExpenseTitle: "$$exp.ExpenseTitle",
//                 Amount: "$$exp.Amount",
//                 ExpenseDate: "$$exp.ExpenseDate",
//                 ExpenseType: "$$exp.ExpenseType",
//                 PaymentMethod: "$$exp.PaymentMethod",
//                 Receipt: "$$exp.Receipt"
//               }
//             }
//           }
//         }
//       },
//       { $sort: { OrderDate: -1 } }
//     ]);

//     res.status(200).json(purchasesData);
//   } catch (error) {
//     console.error("Error in getPurchases:", error);
//     res.status(500).json({ message: "Server error", error: error.message });
//   }
// };

// // -------------------- Get Single Purchase by Order ID --------------------
// const getPurchaseByOrderId = async (req, res) => {
//   try {
//     const { orderId } = req.params;

//     // Validate orderId
//     if (!mongoose.Types.ObjectId.isValid(orderId)) {
//       return res.status(400).json({ message: "Invalid order ID" });
//     }

//     const purchaseData = await Order.aggregate([
//       {
//         $match: {
//           _id: new mongoose.Types.ObjectId(orderId),
//           PaymentStatus: "Paid",
//           OrderStatus: "Confirmed"
//         }
//       },
//       {
//         $lookup: {
//           from: "expenses",
//           localField: "_id",
//           foreignField: "OrderId",
//           as: "expenses"
//         }
//       },
//       {
//         $lookup: {
//           from: "companies",
//           localField: "CompanyId",
//           foreignField: "_id",
//           as: "company"
//         }
//       },
//       {
//         $lookup: {
//           from: "users",
//           localField: "CreatedBy",
//           foreignField: "_id",
//           as: "creator"
//         }
//       },
//       {
//         $addFields: {
//           TotalExpense: { $sum: "$expenses.Amount" },
//           Profit: { $subtract: ["$Amount", { $sum: "$expenses.Amount" }] }
//         }
//       },
//       {
//         $project: {
//           _id: 1,
//           OrderId: "$_id",
//           ClientName: 1,
//           ClientEmail: 1,
//           ClientPhone: 1,
//           ServiceTitle: 1,
//           ServiceDescription: 1,
//           CompanyId: {
//             _id: { $arrayElemAt: ["$company._id", 0] },
//             CompanyName: { $arrayElemAt: ["$company.CompanyName", 0] }
//           },
//           OrderAmount: "$Amount",
//           AdvancePaid: { $ifNull: ["$AdvancePaid", 0] },
//           BalanceDue: { $ifNull: ["$BalanceDue", 0] },
//           TotalExpense: 1,
//           Profit: 1,
//           PaymentStatus: 1,
//           OrderStatus: 1,
//           StartDate: 1,
//           EndDate: 1,
//           OrderDate: "$createdAt",
//           PaidDate: "$updatedAt",
//           CreatedBy: {
//             _id: { $arrayElemAt: ["$creator._id", 0] },
//             Name: { $arrayElemAt: ["$creator.Name", 0] },
//             Email: { $arrayElemAt: ["$creator.Email", 0] }
//           },
//           RelatedExpenses: {
//             $map: {
//               input: "$expenses",
//               as: "exp",
//               in: {
//                 _id: "$$exp._id",
//                 ExpenseTitle: "$$exp.ExpenseTitle",
//                 Amount: "$$exp.Amount",
//                 ExpenseDate: "$$exp.ExpenseDate",
//                 ExpenseType: "$$exp.ExpenseType",
//                 PaymentMethod: "$$exp.PaymentMethod",
//                 Description: "$$exp.Description",
//                 Receipt: "$$exp.Receipt"
//               }
//             }
//           }
//         }
//       }
//     ]);

//     if (!purchaseData.length) {
//       return res.status(404).json({ message: "Paid order not found" });
//     }

//     res.status(200).json(purchaseData[0]);
//   } catch (error) {
//     console.error("Error in getPurchaseByOrderId:", error);
//     res.status(500).json({ message: "Server error", error: error.message });
//   }
// };

// // -------------------- Get Purchase Statistics --------------------
// const getPurchaseStats = async (req, res) => {
//   try {
//     const { CompanyId } = req.query;

//     const matchFilter = {
//       PaymentStatus: "Paid",
//       OrderStatus: "Confirmed",
//     };

//     if (CompanyId && mongoose.Types.ObjectId.isValid(CompanyId)) {
//       matchFilter.CompanyId = new mongoose.Types.ObjectId(CompanyId);
//     }

//     const stats = await Order.aggregate([
//       { $match: matchFilter },
//       {
//         $lookup: {
//           from: "expenses",
//           localField: "_id",
//           foreignField: "OrderId",
//           as: "expenses"
//         }
//       },
//       {
//         $group: {
//           _id: null,
//           totalPurchases: { $sum: 1 },
//           totalRevenue: { $sum: "$Amount" },
//           totalExpenses: { $sum: { $sum: "$expenses.Amount" } },
//           orders: { $push: "$$ROOT" }
//         }
//       },
//       {
//         $project: {
//           _id: 0,
//           totalPurchases: 1,
//           totalRevenue: 1,
//           totalExpenses: 1,
//           totalProfit: { $subtract: ["$totalRevenue", "$totalExpenses"] },
//           averageOrderValue: { $divide: ["$totalRevenue", "$totalPurchases"] },
//           averageProfitPerOrder: {
//             $divide: [
//               { $subtract: ["$totalRevenue", "$totalExpenses"] },
//               "$totalPurchases"
//             ]
//           }
//         }
//       }
//     ]);

//     const result = stats.length > 0 ? stats[0] : {
//       totalPurchases: 0,
//       totalRevenue: 0,
//       totalExpenses: 0,
//       totalProfit: 0,
//       averageOrderValue: 0,
//       averageProfitPerOrder: 0
//     };

//     res.status(200).json(result);
//   } catch (error) {
//     console.error("Error in getPurchaseStats:", error);
//     res.status(500).json({ message: "Server error", error: error.message });
//   }
// };

// // -------------------- MONTHLY PURCHASES --------------------
// const getMonthlyPurchases = async (req, res) => {
//   try {
//     const { CompanyId, year } = req.query;

//     const selectedYear = year ? parseInt(year) : new Date().getFullYear();

//     if (isNaN(selectedYear) || selectedYear < 2000 || selectedYear > 2100) {
//       return res.status(400).json({ message: "Invalid year" });
//     }

//     const matchFilter = {
//       PaymentStatus: "Paid",
//       OrderStatus: "Confirmed",
//       updatedAt: {
//         $gte: new Date(`${selectedYear}-01-01`),
//         $lt: new Date(`${selectedYear + 1}-01-01`),
//       },
//     };

//     if (CompanyId && mongoose.Types.ObjectId.isValid(CompanyId)) {
//       matchFilter.CompanyId = new mongoose.Types.ObjectId(CompanyId);
//     }

//     // Get monthly revenue data with expenses
//     const monthlyData = await Order.aggregate([
//       { $match: matchFilter },
//       {
//         $lookup: {
//           from: "expenses",
//           localField: "_id",
//           foreignField: "OrderId",
//           as: "expenses"
//         }
//       },
//       {
//         $addFields: {
//           orderExpenses: { $sum: "$expenses.Amount" }
//         }
//       },
//       {
//         $group: {
//           _id: {
//             month: { $month: "$updatedAt" },
//             year: { $year: "$updatedAt" },
//           },
//           totalPurchases: { $sum: 1 },
//           totalRevenue: { $sum: "$Amount" },
//           totalExpenses: { $sum: "$orderExpenses" },
//           averageOrderValue: { $avg: "$Amount" },
//         },
//       },
//       { $sort: { "_id.month": 1 } },
//       {
//         $project: {
//           _id: 1,
//           totalPurchases: 1,
//           totalRevenue: 1,
//           totalExpenses: 1,
//           profit: { $subtract: ["$totalRevenue", "$totalExpenses"] },
//           averageOrderValue: 1,
//           profitMargin: {
//             $cond: {
//               if: { $gt: ["$totalRevenue", 0] },
//               then: {
//                 $multiply: [
//                   { $divide: [{ $subtract: ["$totalRevenue", "$totalExpenses"] }, "$totalRevenue"] },
//                   100
//                 ]
//               },
//               else: 0
//             }
//           }
//         }
//       }
//     ]);

//     const monthNames = [
//       "January", "February", "March", "April", "May", "June",
//       "July", "August", "September", "October", "November", "December"
//     ];

//     const formattedData = monthlyData.map((item) => ({
//       month: monthNames[item._id.month - 1],
//       monthNumber: item._id.month,
//       year: item._id.year,
//       totalPurchases: item.totalPurchases,
//       totalRevenue: Math.round(item.totalRevenue * 100) / 100,
//       totalExpenses: Math.round(item.totalExpenses * 100) / 100,
//       profit: Math.round(item.profit * 100) / 100,
//       profitMargin: Math.round(item.profitMargin * 100) / 100,
//       averageOrderValue: Math.round(item.averageOrderValue * 100) / 100,
//     }));

//     const summary = {
//       grandTotalRevenue: formattedData.reduce((sum, item) => sum + item.totalRevenue, 0),
//       grandTotalExpenses: formattedData.reduce((sum, item) => sum + item.totalExpenses, 0),
//       grandTotalProfit: formattedData.reduce((sum, item) => sum + item.profit, 0),
//       totalPurchasesInYear: formattedData.reduce((sum, item) => sum + item.totalPurchases, 0),
//     };

//     summary.overallProfitMargin = summary.grandTotalRevenue > 0
//       ? ((summary.grandTotalProfit / summary.grandTotalRevenue) * 100).toFixed(2)
//       : "0.00";

//     // Round summary values
//     summary.grandTotalRevenue = Math.round(summary.grandTotalRevenue * 100) / 100;
//     summary.grandTotalExpenses = Math.round(summary.grandTotalExpenses * 100) / 100;
//     summary.grandTotalProfit = Math.round(summary.grandTotalProfit * 100) / 100;

//     res.status(200).json({
//       year: selectedYear,
//       data: formattedData,
//       summary,
//     });
//   } catch (error) {
//     console.error("Error in getMonthlyPurchases:", error);
//     res.status(500).json({ message: "Server error", error: error.message });
//   }
// };

// // -------------------- Get purchases for a specific month --------------------
// const getMonthPurchases = async (req, res) => {
//   try {
//     const { CompanyId, month, year } = req.query;

//     if (!month || !year) {
//       return res.status(400).json({ message: "Month and year are required" });
//     }

//     const monthNum = parseInt(month);
//     const yearNum = parseInt(year);

//     if (isNaN(monthNum) || isNaN(yearNum) || monthNum < 1 || monthNum > 12) {
//       return res.status(400).json({ message: "Invalid month or year" });
//     }

//     const startDate = new Date(yearNum, monthNum - 1, 1);
//     const endDate = new Date(yearNum, monthNum, 1);

//     const orderFilter = {
//       PaymentStatus: "Paid",
//       OrderStatus: "Confirmed",
//       updatedAt: { $gte: startDate, $lt: endDate },
//     };

//     if (CompanyId && mongoose.Types.ObjectId.isValid(CompanyId)) {
//       orderFilter.CompanyId = new mongoose.Types.ObjectId(CompanyId);
//     }

//     const orders = await Order.aggregate([
//       { $match: orderFilter },
//       {
//         $lookup: {
//           from: "expenses",
//           localField: "_id",
//           foreignField: "OrderId",
//           as: "expenses"
//         }
//       },
//       {
//         $lookup: {
//           from: "companies",
//           localField: "CompanyId",
//           foreignField: "_id",
//           as: "company"
//         }
//       },
//       {
//         $lookup: {
//           from: "users",
//           localField: "CreatedBy",
//           foreignField: "_id",
//           as: "creator"
//         }
//       },
//       {
//         $addFields: {
//           TotalExpense: { $sum: "$expenses.Amount" },
//           Profit: { $subtract: ["$Amount", { $sum: "$expenses.Amount" }] }
//         }
//       },
//       {
//         $project: {
//           _id: 1,
//           ClientName: 1,
//           ServiceTitle: 1,
//           Amount: 1,
//           TotalExpense: 1,
//           Profit: 1,
//           PaymentStatus: 1,
//           OrderStatus: 1,
//           createdAt: 1,
//           updatedAt: 1,
//           CompanyId: {
//             _id: { $arrayElemAt: ["$company._id", 0] },
//             CompanyName: { $arrayElemAt: ["$company.CompanyName", 0] }
//           },
//           CreatedBy: {
//             _id: { $arrayElemAt: ["$creator._id", 0] },
//             Name: { $arrayElemAt: ["$creator.Name", 0] },
//             Email: { $arrayElemAt: ["$creator.Email", 0] }
//           }
//         }
//       },
//       { $sort: { updatedAt: -1 } }
//     ]);

//     res.status(200).json(orders);
//   } catch (error) {
//     console.error("Error in getMonthPurchases:", error);
//     res.status(500).json({ message: "Server error", error: error.message });
//   }
// };

// // -------------------- DEBUG: Check Data Connections --------------------
// const debugPurchaseData = async (req, res) => {
//   try {
//     // Get a sample paid order
//     const sampleOrder = await Order.findOne({ 
//       PaymentStatus: "Paid", 
//       OrderStatus: "Confirmed" 
//     }).lean();

//     if (!sampleOrder) {
//       return res.status(200).json({ 
//         message: "No paid orders found",
//         totalOrders: await Order.countDocuments(),
//         paidOrders: await Order.countDocuments({ PaymentStatus: "Paid" }),
//         confirmedOrders: await Order.countDocuments({ OrderStatus: "Confirmed" })
//       });
//     }

//     // Check if expenses exist for this order
//     const relatedExpenses = await Expense.find({ 
//       OrderId: sampleOrder._id 
//     }).lean();

//     // Check total expenses in system
//     const totalExpenses = await Expense.countDocuments();
//     const expensesWithOrderId = await Expense.countDocuments({ 
//       OrderId: { $exists: true, $ne: null } 
//     });

//     // Sample expense
//     const sampleExpense = await Expense.findOne().lean();

//     res.status(200).json({
//       debug: {
//         sampleOrder: {
//           _id: sampleOrder._id,
//           ClientName: sampleOrder.ClientName,
//           Amount: sampleOrder.Amount,
//           PaymentStatus: sampleOrder.PaymentStatus,
//           OrderStatus: sampleOrder.OrderStatus
//         },
//         relatedExpenses: relatedExpenses.length,
//         expenseDetails: relatedExpenses,
//         totalExpensesInSystem: totalExpenses,
//         expensesWithOrderId: expensesWithOrderId,
//         expensesWithoutOrderId: totalExpenses - expensesWithOrderId,
//         sampleExpense: sampleExpense,
//         collectionNames: {
//           ordersCollection: Order.collection.name,
//           expensesCollection: Expense.collection.name
//         }
//       }
//     });
//   } catch (error) {
//     console.error("Debug error:", error);
//     res.status(500).json({ message: "Debug error", error: error.message });
//   }
// };

// export {
//   addPurchase,
//   getPurchases,
//   getPurchaseByOrderId,
//   getPurchaseStats,
//   getMonthlyPurchases,
//   getMonthPurchases,
//   debugPurchaseData, // Add this to your routes temporarily
// };

import { Expense } from "../models/ExpenseSchema.js";
import { Order } from "../models/OrderSchema.js";
import { Purchase } from "../models/PurchaseSchema.js";
import mongoose from "mongoose";

// -------------------- Get All Purchases (Orders with Related Expenses) --------------------
const getPurchases = async (req, res) => {
  try {
    const { CompanyId } = req.query;

    // ✅ FIXED: Build filter for paid and partially paid orders
    const orderFilter = {
      PaymentStatus: { $in: ["Paid", "Partially Paid"] },
      // OrderStatus: "Confirmed", // Remove if you want all order statuses
    };

    if (CompanyId && mongoose.Types.ObjectId.isValid(CompanyId)) {
      orderFilter.CompanyId = new mongoose.Types.ObjectId(CompanyId);
    }

    // Get orders with their related expenses
    const ordersData = await Order.aggregate([
      { $match: orderFilter },
      {
        $lookup: {
          from: "expenses",
          localField: "_id",
          foreignField: "OrderId",
          as: "relatedExpenses"
        }
      },
      {
        $lookup: {
          from: "companies",
          localField: "CompanyId",
          foreignField: "_id",
          as: "company"
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "CreatedBy",
          foreignField: "_id",
          as: "creator"
        }
      },
      {
        $addFields: {
          totalExpenses: { $sum: "$relatedExpenses.Amount" },
          profit: { $subtract: ["$Amount", { $sum: "$relatedExpenses.Amount" }] }
        }
      },
      {
        $project: {
          _id: 1,
          orderId: "$_id",
          clientName: "$ClientName",
          serviceTitle: "$ServiceTitle",
          orderAmount: "$Amount",
          totalExpenses: 1,
          profit: 1,
          paymentStatus: "$PaymentStatus",
          orderStatus: "$OrderStatus",
          orderDate: "$createdAt",
          paidDate: "$updatedAt",
          company: {
            _id: { $arrayElemAt: ["$company._id", 0] },
            name: { $arrayElemAt: ["$company.CompanyName", 0] }
          },
          createdBy: {
            _id: { $arrayElemAt: ["$creator._id", 0] },
            name: { $arrayElemAt: ["$creator.Name", 0] },
            email: { $arrayElemAt: ["$creator.Email", 0] }
          },
          relatedExpenses: {
            $map: {
              input: "$relatedExpenses",
              as: "exp",
              in: {
                _id: "$$exp._id",
                title: "$$exp.ExpenseTitle",
                amount: "$$exp.Amount",
                date: "$$exp.ExpenseDate",
                type: "$$exp.ExpenseType",
                paymentMethod: "$$exp.PaymentMethod",
                receipt: "$$exp.Receipt"
              }
            }
          }
        }
      },
      { $sort: { orderDate: -1 } }
    ]);

    res.status(200).json({
      success: true,
      count: ordersData.length,
      data: ordersData
    });
  } catch (error) {
    console.error("Error in getPurchases:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

// -------------------- Get Single Order with Expenses and Profit --------------------
const getPurchasesWithOrdersExpense = async (req, res) => {
  try {
    const { orderId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID"
      });
    }

    const orderData = await Order.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(orderId) } },
      {
        $lookup: {
          from: "expenses",
          localField: "_id",
          foreignField: "OrderId",
          as: "relatedExpenses"
        }
      },
      {
        $lookup: {
          from: "companies",
          localField: "CompanyId",
          foreignField: "_id",
          as: "company"
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "CreatedBy",
          foreignField: "_id",
          as: "creator"
        }
      },
      {
        $addFields: {
          totalExpenses: { $sum: "$relatedExpenses.Amount" },
          profit: { $subtract: ["$Amount", { $sum: "$relatedExpenses.Amount" }] }
        }
      },
      {
        $project: {
          _id: 1,
          orderId: "$_id",
          clientName: "$ClientName",
          serviceTitle: "$ServiceTitle",
          orderAmount: "$Amount",
          totalExpenses: 1,
          profit: 1,
          paymentStatus: "$PaymentStatus",
          orderStatus: "$OrderStatus",
          orderDate: "$createdAt",
          paidDate: "$updatedAt",
          company: {
            _id: { $arrayElemAt: ["$company._id", 0] },
            name: { $arrayElemAt: ["$company.CompanyName", 0] }
          },
          createdBy: {
            _id: { $arrayElemAt: ["$creator._id", 0] },
            name: { $arrayElemAt: ["$creator.Name", 0] },
            email: { $arrayElemAt: ["$creator.Email", 0] }
          },
          relatedExpenses: {
            $map: {
              input: "$relatedExpenses",
              as: "exp",
              in: {
                _id: "$$exp._id",
                title: "$$exp.ExpenseTitle",
                amount: "$$exp.Amount",
                date: "$$exp.ExpenseDate",
                type: "$$exp.ExpenseType",
                paymentMethod: "$$exp.PaymentMethod",
                receipt: "$$exp.Receipt",
                description: "$$exp.Description"
              }
            }
          }
        }
      }
    ]);

    if (!orderData || orderData.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    res.status(200).json({
      success: true,
      data: orderData[0]
    });
  } catch (error) {
    console.error("Error in getOrderWithExpenses:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

// -------------------- Get Monthly Summary --------------------
const getMonthlyPurchases = async (req, res) => {
  try {
    const { CompanyId, year } = req.query;
    const selectedYear = year ? parseInt(year) : new Date().getFullYear();

    if (isNaN(selectedYear) || selectedYear < 2000 || selectedYear > 2100) {
      return res.status(400).json({
        success: false,
        message: "Invalid year"
      });
    }

    const monthlyData = await Order.aggregate([
      { $match: matchFilter },
      {
        $lookup: {
          from: "expenses",
          localField: "_id",
          foreignField: "OrderId",
          as: "expenses"
        }
      },
      {
        $addFields: {
          orderExpenses: { $sum: "$expenses.Amount" },
          orderProfit: { $subtract: ["$Amount", { $sum: "$expenses.Amount" }] }
        }
      },
      {
        $group: {
          _id: {
            month: { $month: "$updatedAt" },
            year: { $year: "$updatedAt" },
          },
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: "$Amount" },
          totalExpenses: { $sum: "$orderExpenses" },
          totalProfit: { $sum: "$orderProfit" }
        }
      },
      { $sort: { "_id.month": 1 } },
      {
        $project: {
          _id: 1,
          totalOrders: 1,
          totalRevenue: { $round: ["$totalRevenue", 2] },
          totalExpenses: { $round: ["$totalExpenses", 2] },
          totalProfit: { $round: ["$totalProfit", 2] }
        }
      }
    ]);

    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];

    const formattedData = monthlyData.map((item) => ({
      month: monthNames[item._id.month - 1],
      monthNumber: item._id.month,
      year: item._id.year,
      totalOrders: item.totalOrders,
      totalRevenue: item.totalRevenue,
      totalExpenses: item.totalExpenses,
      totalProfit: item.totalProfit
    }));

    res.status(200).json({
      success: true,
      year: selectedYear,
      data: formattedData
    });
  } catch (error) {
    console.error("Error in getMonthlyPurchases:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};
// -------------------- Get Purchases for a Specific Month --------------------
const getMonthPurchases = async (req, res) => {
  try {
    const { CompanyId, month, year } = req.query;

    if (!month || !year) {
      return res.status(400).json({
        success: false,
        message: "Month and year are required",
      });
    }

    const monthNum = parseInt(month);
    const yearNum = parseInt(year);

    if (
      isNaN(monthNum) ||
      isNaN(yearNum) ||
      monthNum < 1 ||
      monthNum > 12 ||
      yearNum < 2000 ||
      yearNum > 2100
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid month or year",
      });
    }

    const startDate = new Date(yearNum, monthNum - 1, 1);
    const endDate = new Date(yearNum, monthNum, 1);

    const matchFilter = {
      PaymentStatus: { $in: ["Paid", "Partially Paid"] },
      updatedAt: { $gte: startDate, $lt: endDate },
    };

    if (CompanyId && mongoose.Types.ObjectId.isValid(CompanyId)) {
      matchFilter.CompanyId = new mongoose.Types.ObjectId(CompanyId);
    }

    const orders = await Order.aggregate([
      { $match: matchFilter },

      // 🔍 Attach all expenses for this order
      {
        $lookup: {
          from: "expenses",
          localField: "_id",
          foreignField: "OrderId",
          as: "expenses",
        },
      },

      // ➕ Add calculated fields
      {
        $addFields: {
          orderExpenses: { $sum: "$expenses.Amount" },
          orderProfit: { $subtract: ["$Amount", { $sum: "$expenses.Amount" }] },
        },
      },

      // 🏢 Lookup company
      {
        $lookup: {
          from: "companies",
          localField: "CompanyId",
          foreignField: "_id",
          as: "company",
        },
      },

      // 🎯 Final output
      {
        $project: {
          _id: 1,
          clientName: "$ClientName",
          serviceTitle: "$ServiceTitle",
          orderAmount: "$Amount",
          paymentStatus: "$PaymentStatus",
          orderStatus: "$OrderStatus",
          orderDate: "$createdAt",
          paidDate: "$updatedAt",

          totalExpenses: "$orderExpenses",
          totalProfit: "$orderProfit",

          company: {
            _id: { $arrayElemAt: ["$company._id", 0] },
            name: { $arrayElemAt: ["$company.CompanyName", 0] },
          },
        },
      },

      { $sort: { updatedAt: -1 } },
    ]);

    res.status(200).json({
      success: true,
      month: monthNum,
      year: yearNum,
      count: orders.length,
      data: orders,
    });
  } catch (error) {
    console.error("Error getting monthly purchases:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};



export {
  getPurchases,
  getPurchasesWithOrdersExpense,
  getMonthlyPurchases,
  getMonthPurchases
};