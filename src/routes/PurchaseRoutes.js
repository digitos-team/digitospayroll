import express from "express";
import {
  addPurchase,
  getPurchaseByOrderId,
  getPurchases,
  getPurchaseStats,
  getMonthlyPurchases,
  getMonthPurchases,

} from "../controller/PurchaseController.js";

import { authorizeRoles, verifyToken } from "../Middleware/authMiddleware.js";
const PurchaseRoutes = express.Router();

// -------------------- ADMIN ONLY --------------------
// Only Admin can add a purchase
PurchaseRoutes.post(
  "/addpurchase",
  verifyToken,
  authorizeRoles("Admin"),
  addPurchase
);

// -------------------- ADMIN + CA --------------------
// Both Admin and CA can view purchases
PurchaseRoutes.get(
  "/getpurchases",
  //   verifyToken,
  //   authorizeRoles("Admin", "CA"),
  getPurchases
);
PurchaseRoutes.get("/getpurchasebyorderid/:id", getPurchaseByOrderId);
PurchaseRoutes.get("/getpurchasestats", getPurchaseStats);

// -------------------- MONTHLY PURCHASES --------------------
PurchaseRoutes.get(
  "/getmonthlypurchases",
  //   verifyToken,
  //   authorizeRoles("Admin", "CA"),
  getMonthlyPurchases
);



export { PurchaseRoutes };
