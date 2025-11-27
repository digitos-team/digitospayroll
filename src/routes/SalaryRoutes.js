import express from "express"
import {  calculateSalary, getTotalSalaryDistribution,calculateSalaryForAll,getDepartmentWiseSalaryDistribution, getPayrollTrend, getHighestPaidDepartment, generateSalarySlipPDF, getAverageSalary, getPayrollByBranch } from "../controller/SalaryCalculateController.js";
let SalaryRoutes = express.Router()

// SalaryRoutes.post("/calculatesalarybycompany", calculateSalaryByCompany);
SalaryRoutes.post("/calculatesalarydetailed", calculateSalary);
SalaryRoutes.post("/gettotalsalarydistribution", getTotalSalaryDistribution);
SalaryRoutes.post("/calculatesalaryforall",  calculateSalaryForAll);
SalaryRoutes.get("/departmentwisesalary",getDepartmentWiseSalaryDistribution);
SalaryRoutes.get("/payrolltrend", getPayrollTrend);
SalaryRoutes.get("/gethighestpaiddepartment",getHighestPaidDepartment)
SalaryRoutes.post("/generatesalaryslippdf",generateSalarySlipPDF)
SalaryRoutes.post("/getavgsalary",getAverageSalary)
SalaryRoutes.get("/payrollbybranch", getPayrollByBranch);
export { SalaryRoutes }