import bodyParser from "body-parser";
import express from "express";
import dotenv from "dotenv";
import { Adminroutes } from "./src/routes/Adminroutes.js";
import { Departmentroutes } from "./src/routes/Departmentroutes.js";
import { DesignationRoutes } from "./src/routes/DesignationRoutes.js";
import { Branchroutes } from "./src/routes/Branchroutes.js";
import { connectToDatabase } from "./src/database/admindatabse.js";
import { UserRoutes } from "./src/routes/Userroutes.js";
import { LoginRoutes } from "./src/routes/LoginRoutes.js";
import { ExpenseRoutes } from "./src/routes/ExpenseRoutes.js";
import { SalaryHeadsRoutes } from "./src/routes/SalaryHeadRoutes.js";
import { OrderRoutes } from "./src/routes/OrderRoutes.js";
import { RevenueRoutes } from "./src/routes/RevenueRoutes.js";
import { ProfitRoutes } from "./src/routes/ProfitRoutes.js";
import { TaxRoutes } from "./src/routes/TaxRoutes.js";
import { PurchaseRoutes } from "./src/routes/PurchaseRoutes.js";
import SalarySettingRoutes from "./src/routes/SalarySettingRoutes.js";
import { SalaryRoutes } from "./src/routes/SalaryRoutes.js";
import { CsvRoutes } from "./src/routes/CsvRoutes.js";
import { ExportRoutes } from "./src/routes/ExportRoutes.js";
import { RecentActivitiesRoutes } from "./src/routes/RecentActivitesRoutes.js";
import { PayrollHistoryRoutes } from "./src/routes/PayrollHistoryRoutes.js";
import { TrendsRoutes } from "./src/routes/TrendsRoutes.js";
import cors from "cors";
dotenv.config();

let Server = express();
Server.use(cors());
Server.use(bodyParser.json());
connectToDatabase();

// Mailer configuration check - provides early, clear feedback on startup
const mailerConfigured = !!(
  process.env.SENDGRID_API_KEY ||
  (process.env.EMAIL_USER && process.env.EMAIL_PASS)
);
if (!mailerConfigured) {
  console.warn(
    "[Warning] Mailer not configured: set SENDGRID_API_KEY or both EMAIL_USER and EMAIL_PASS. See .env.example"
  );
} else {
  console.log("Mailer appears configured.");
}
Server.get("/", (req, res) => {
  res.send("hello payroll...");
});

Server.use("/api", Adminroutes);
Server.use("/api", Departmentroutes);
Server.use("/api", DesignationRoutes);
Server.use("/api", Branchroutes);
Server.use("/api", UserRoutes);
Server.use("/api", LoginRoutes);
Server.use("/api", SalaryHeadsRoutes);
Server.use("/api", ExpenseRoutes);
Server.use("/api", OrderRoutes);
Server.use("/api", RevenueRoutes);
Server.use("/api", ProfitRoutes);
Server.use("/api", TaxRoutes);
Server.use("/api", PurchaseRoutes);
Server.use("/api", SalarySettingRoutes);
Server.use("/api", SalaryRoutes);
Server.use("/api", CsvRoutes);
Server.use("/api", ExportRoutes);
Server.use("/api", RecentActivitiesRoutes);
Server.use("/api", PayrollHistoryRoutes);
Server.use("/api", TrendsRoutes);
Server.use("/uploads", express.static("uploads"));

Server.listen(5000, () => {
  console.log("server started");
});
