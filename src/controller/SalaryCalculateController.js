import mongoose from "mongoose";
import { SalarySettings } from "../models/SalarySettingSchema.js";
import { SalarySlip } from "../models/SalaryCalculateSchema.js";
import { TaxSlab } from "../models/TaxSlabsSchema.js";
import { Expense } from "../models/ExpenseSchema.js";
import { User } from "../models/UserSchema.js";
import PDFDocument from "pdfkit";

// import { Department } from "../models/DepartmentSchema.js";
import { RecentActivity } from "../models/RecentActivitySchema.js";
const calculateSalary = async (req, res) => {
  try {
    const { EmployeeID, CompanyId, Month } = req.body;

    if (!EmployeeID || !CompanyId || !Month) {
      return res.status(400).json({
        success: false,
        message: "EmployeeID, CompanyId, and Month are required",
      });
    }

    const existingSlip = await SalarySlip.findOne({
      EmployeeID,
      CompanyId,
      Month,
    });

    if (existingSlip) {
      return res.status(400).json({
        success: false,
        message: "Salary slip already exists for this month",
        data: existingSlip,
      });
    }

    const salarySettings = await SalarySettings.findOne({
      EmployeeID,
      CompanyId,
    }).populate("SalaryHeads.SalaryHeadId");

    if (!salarySettings) {
      return res.status(404).json({
        success: false,
        message: "Salary settings not found for this employee",
      });
    }

    const basicSalaryHead = salarySettings.SalaryHeads.find(
      (head) => head.SalaryHeadId.ShortName === "BS"
    );

    if (!basicSalaryHead || !basicSalaryHead.applicableValue) {
      return res.status(400).json({
        success: false,
        message: "Basic salary not found or not configured",
      });
    }

    const basicSalaryAmount = basicSalaryHead.applicableValue;

    const earnings = [];
    const deductions = [];

    for (const head of salarySettings.SalaryHeads) {
      const salaryHead = head.SalaryHeadId;
      let amount = 0;

      if (head.applicableValue) {
        amount = head.applicableValue;
      } else if (head.percentage) {
        amount = (head.percentage / 100) * basicSalaryAmount;
      }

      amount = Math.round(amount * 100) / 100;

      const headData = {
        title: salaryHead.SalaryHeadsTitle,
        shortName: salaryHead.ShortName,
        amount: amount,
      };

      if (salaryHead.SalaryHeadsType === "Earnings") {
        earnings.push(headData);
      } else if (salaryHead.SalaryHeadsType === "Deductions") {
        deductions.push(headData);
      }
    }

    const totalEarnings = earnings.reduce((sum, e) => sum + e.amount, 0);
    const totalDeductions = deductions.reduce((sum, d) => sum + d.amount, 0);
    const grossSalary = totalEarnings;

    let TaxAmount = 0;

    if (salarySettings.isTaxApplicable) {
      const projectedAnnualIncome = grossSalary * 12;
      const salaryMonthDate = new Date(Month + "-01");

      const taxSlabs = await TaxSlab.find({
        CompanyId,
        effectiveFrom: { $lte: salaryMonthDate },
      }).sort({ minIncome: 1 });

      if (taxSlabs.length > 0) {
        let annualTax = 0;

        for (const slab of taxSlabs) {
          const slabMin = slab.minIncome;
          const slabMax = slab.maxIncome || Infinity;

          if (projectedAnnualIncome > slabMin) {
            const taxableInThisSlab = Math.min(
              projectedAnnualIncome - slabMin,
              slabMax - slabMin
            );

            if (taxableInThisSlab > 0) {
              const taxForThisSlab = (taxableInThisSlab * slab.taxRate) / 100;
              annualTax += taxForThisSlab;
            }
          }
        }

        TaxAmount = Math.round((annualTax / 12) * 100) / 100;
      }
    }

    const netSalary = grossSalary - totalDeductions - TaxAmount;

    const salarySlip = await SalarySlip.create({
      CompanyId,
      EmployeeID,
      Month,
      Earnings: earnings,
      Deductions: deductions,
      totalEarnings: Math.round(totalEarnings * 100) / 100,
      totalDeductions: Math.round(totalDeductions * 100) / 100,
      grossSalary: Math.round(grossSalary * 100) / 100,
      netSalary: Math.round(netSalary * 100) / 100,
      TaxAmount,
    });

    // ✅ Log recent activity
    await RecentActivity.create({
      CompanyId,
      UserId: EmployeeID,
      ActivityType: "SalaryGeneration",
    });

    return res.status(201).json({
      success: true,
      message: "Salary calculated successfully",
      data: salarySlip,
    });
  } catch (error) {
    console.error("Error calculating salary:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};
const getTotalSalaryDistribution = async (req, res) => {
  try {
    const { CompanyId, Month } = req.body;

    if (!CompanyId || !Month) {
      return res.status(400).json({
        success: false,
        message: "CompanyId and Month are required",
      });
    }

    const result = await SalarySlip.aggregate([
      {
        $match: {
          CompanyId: new mongoose.Types.ObjectId(CompanyId),
          Month: Month,
        },
      },
      {
        $group: {
          _id: null,
          totalGrossSalary: { $sum: "$grossSalary" },
          totalDeductions: { $sum: "$totalDeductions" },
          totalTaxes: { $sum: "$TaxAmount" },
        },
      },
      {
        $project: {
          _id: 0,
          totalGrossSalary: { $round: ["$totalGrossSalary", 2] },
          totalDeductions: { $round: ["$totalDeductions", 2] },
          totalTaxes: { $round: ["$totalTaxes", 2] },
        },
      },
    ]);

    if (!result.length) {
      return res.status(404).json({
        success: false,
        message: "No salary slips found",
      });
    }

    const { totalGrossSalary, totalDeductions, totalTaxes } = result[0];

    res.status(200).json({
      success: true,
      message: "Salary distribution fetched successfully",
      CompanyId,
      Month,
      totalGrossSalary,
      totalDeductions,
      totalTaxes,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

const calculateSalaryForAll = async (req, res) => {
  try {
    const { CompanyId, Month } = req.body;

    if (!CompanyId || !Month) {
      return res.status(400).json({
        success: false,
        message: "CompanyId and Month are required",
      });
    }

    const companyObjectId = mongoose.Types.ObjectId.isValid(CompanyId)
      ? new mongoose.Types.ObjectId(CompanyId)
      : CompanyId;

    const employees = await User.find({ CompanyId: companyObjectId });
    const employeeUsers = employees.filter((user) => user.role === "Employee");

    if (!employeeUsers.length) {
      return res.status(404).json({
        success: false,
        message:
          "No employees found for this company (users exist but none have Employee role)",
      });
    }

    let processedCount = 0;
    let skippedCount = 0;
    let totalGrossSalary = 0;
    const errors = [];

    for (const emp of employeeUsers) {
      const EmployeeID = emp._id;

      try {
        const existingSlip = await SalarySlip.findOne({
          EmployeeID,
          CompanyId,
          Month,
        });
        if (existingSlip) {
          skippedCount++;
          continue;
        }

        const salarySettings = await SalarySettings.findOne({
          EmployeeID,
          CompanyId,
        }).populate("SalaryHeads.SalaryHeadId");

        if (!salarySettings) {
          skippedCount++;
          errors.push({
            employeeId: EmployeeID,
            reason: "No salary settings found",
          });
          continue;
        }

        const basicSalaryHead = salarySettings.SalaryHeads.find(
          (head) => head.SalaryHeadId.ShortName === "BS"
        );
        if (!basicSalaryHead || !basicSalaryHead.applicableValue) {
          skippedCount++;
          errors.push({
            employeeId: EmployeeID,
            reason: "Basic salary not configured",
          });
          continue;
        }

        const basicSalaryAmount = basicSalaryHead.applicableValue;
        const earnings = [];
        const deductions = [];

        for (const head of salarySettings.SalaryHeads) {
          const salaryHead = head.SalaryHeadId;
          let amount = 0;

          if (head.applicableValue) {
            amount = head.applicableValue;
          } else if (head.percentage) {
            amount = (head.percentage / 100) * basicSalaryAmount;
          }

          amount = Math.round(amount * 100) / 100;

          const headData = {
            title: salaryHead.SalaryHeadsTitle,
            shortName: salaryHead.ShortName,
            amount: amount,
          };

          if (salaryHead.SalaryHeadsType === "Earnings") {
            earnings.push(headData);
          } else if (salaryHead.SalaryHeadsType === "Deductions") {
            deductions.push(headData);
          }
        }

        const totalEarnings = earnings.reduce((sum, e) => sum + e.amount, 0);
        const totalDeductions = deductions.reduce(
          (sum, d) => sum + d.amount,
          0
        );
        const grossSalary = totalEarnings;

        let TaxAmount = 0;
        if (salarySettings.isTaxApplicable) {
          const projectedAnnualIncome = grossSalary * 12;
          const salaryMonthDate = new Date(Month + "-01");

          const taxSlabs = await TaxSlab.find({
            CompanyId,
            effectiveFrom: { $lte: salaryMonthDate },
          }).sort({ minIncome: 1 });

          if (taxSlabs.length > 0) {
            let annualTax = 0;

            for (const slab of taxSlabs) {
              const slabMin = slab.minIncome;
              const slabMax = slab.maxIncome || Infinity;

              if (projectedAnnualIncome > slabMin) {
                const taxableInThisSlab = Math.min(
                  projectedAnnualIncome - slabMin,
                  slabMax - slabMin
                );
                if (taxableInThisSlab > 0) {
                  const taxForThisSlab =
                    (taxableInThisSlab * slab.taxRate) / 100;
                  annualTax += taxForThisSlab;
                }
              }
            }
            TaxAmount = Math.round((annualTax / 12) * 100) / 100;
          }
        }

        const netSalary = grossSalary - totalDeductions - TaxAmount;

        await SalarySlip.create({
          CompanyId,
          EmployeeID,
          Month,
          Earnings: earnings,
          Deductions: deductions,
          totalEarnings: Math.round(totalEarnings * 100) / 100,
          totalDeductions: Math.round(totalDeductions * 100) / 100,
          grossSalary: Math.round(grossSalary * 100) / 100,
          netSalary: Math.round(netSalary * 100) / 100,
          TaxAmount,
        });

        totalGrossSalary += grossSalary;
        processedCount++;
      } catch (empError) {
        console.error(`Error processing employee ${EmployeeID}:`, empError);
        skippedCount++;
        errors.push({
          employeeId: EmployeeID,
          reason: empError.message,
        });
      }
    }

    if (totalGrossSalary > 0) {
      const existingExpense = await Expense.findOne({
        CompanyId,
        Month,
        ExpenseType: "Salary",
      });

      if (existingExpense) {
        existingExpense.Amount = totalGrossSalary;
        await existingExpense.save();
      } else {
        await Expense.create({
          CompanyId,
          ExpenseTitle: `Salary Expense - ${Month}`,
          Amount: totalGrossSalary,
          ExpenseType: "Salary",
          Month,
        });
      }
    }

    // ✅ Log recent activity
    await RecentActivity.create({
      CompanyId,
      ActivityType: `Salary slips generated for all employees for ${Month} (Processed: ${processedCount}, Skipped: ${skippedCount})`,
    });

    return res.status(201).json({
      success: true,
      message: "Salary slips generated for all employees",
      processedCount,
      skippedCount,
      totalGrossSalary: Math.round(totalGrossSalary * 100) / 100,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("Error generating salary for all:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

const getDepartmentWiseSalaryDistribution = async (req, res) => {
  try {
    const { CompanyId, Month } = req.query;

    if (!CompanyId) {
      return res
        .status(400)
        .json({ success: false, message: "CompanyId is required" });
    }

    const pipeline = [
      {
        $lookup: {
          from: "users",
          localField: "EmployeeID",
          foreignField: "_id",
          as: "employee",
        },
      },
      { $unwind: "$employee" },
      {
        $match: {
          "employee.CompanyId": new mongoose.Types.ObjectId(CompanyId),
          ...(Month ? { Month } : {}),
        },
      },
      {
        $lookup: {
          from: "departments",
          localField: "employee.DepartmentId",
          foreignField: "_id",
          as: "department",
        },
      },
      { $unwind: "$department" },
      {
        $group: {
          _id: "$department.DepartmentName",
          totalGrossSalary: { $sum: "$grossSalary" },
          employeeCount: { $sum: 1 },
        },
      },
      {
        $project: {
          DepartmentName: "$_id",
          totalGrossSalary: 1,
          employeeCount: 1,
          _id: 0,
        },
      },
      { $sort: { totalGrossSalary: -1 } },
    ];

    const result = await SalarySlip.aggregate(pipeline);

    // ✅ Log recent activity
    await RecentActivity.create({
      CompanyId,
      Activity: `Viewed department-wise salary distribution for ${
        Month || "all months"
      }`,
    });

    res.status(200).json({
      success: true,
      CompanyId,
      Month: Month || "All months",
      data: result,
    });
  } catch (error) {
    console.error("Error in department-wise salary distribution:", error);
    res.status(500).json({
      success: false,
      message:
        "Server error while fetching department-wise salary distribution",
      error: error.message,
    });
  }
};

const getPayrollTrend = async (req, res) => {
  try {
    const { CompanyId } = req.query;
    if (!CompanyId)
      return res
        .status(400)
        .json({ success: false, message: "CompanyId required" });

    const today = new Date();
    const months = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
        2,
        "0"
      )}`;
      months.push(monthStr);
    }

    const trend = [];

    for (const month of months) {
      const result = await SalarySlip.aggregate([
        {
          $match: {
            CompanyId: new mongoose.Types.ObjectId(CompanyId),
            Month: month,
          },
        },
        {
          $group: {
            _id: null,
            totalGrossSalary: { $sum: "$grossSalary" },
            totalTax: { $sum: "$TaxAmount" }, // ✅ Correct field
          },
        },
        {
          $project: {
            _id: 0,
            totalGrossSalary: { $round: ["$totalGrossSalary", 2] },
            totalTax: { $round: ["$totalTax", 2] },
          },
        },
      ]);

      trend.push({
        Month: month,
        totalGrossSalary: result.length ? result[0].totalGrossSalary : 0,
        totalTax: result.length ? result[0].totalTax : 0,
      });
    }

    await RecentActivity.create({
      CompanyId,
      ActivityType: `Viewed payroll trend for last 6 months`,
    });

    res.status(200).json({
      success: true,
      CompanyId,
      trend,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

const getHighestPaidDepartment = async (req, res) => {
  try {
    const { CompanyId, Month } = req.query;

    if (!CompanyId) {
      return res
        .status(400)
        .json({ success: false, message: "CompanyId is required" });
    }

    const pipeline = [
      {
        $lookup: {
          from: "users",
          localField: "EmployeeID",
          foreignField: "_id",
          as: "employee",
        },
      },
      { $unwind: "$employee" },
      {
        $match: {
          "employee.CompanyId": new mongoose.Types.ObjectId(CompanyId),
          ...(Month ? { Month } : {}),
        },
      },
      {
        $lookup: {
          from: "departments",
          localField: "employee.DepartmentId",
          foreignField: "_id",
          as: "department",
        },
      },
      { $unwind: "$department" },
      {
        $group: {
          _id: "$department.DepartmentName",
          totalSalary: { $sum: "$grossSalary" },
        },
      },
      { $sort: { totalSalary: -1 } },
      { $limit: 1 }, // Only the highest paid department
      {
        $project: {
          DepartmentName: "$_id",
          totalSalary: 1,
          _id: 0,
        },
      },
    ];

    const result = await SalarySlip.aggregate(pipeline);

    res.status(200).json({
      success: true,
      CompanyId,
      Month: Month || "All months",
      highestPaidDepartment: result[0] || null,
    });
  } catch (error) {
    console.error("Error fetching highest paid department:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching highest paid department",
      error: error.message,
    });
  }
};
const generateSalarySlipPDF = async (req, res) => {
  try {
    const { EmployeeID, Month } = req.body;

    if (!EmployeeID || Month === undefined) {
      return res
        .status(400)
        .json({ success: false, message: "EmployeeID and Month required" });
    }

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(EmployeeID)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid EmployeeID" });
    }

    const employeeObjectId = new mongoose.Types.ObjectId(EmployeeID);

    // Debug: log all slips for this employee
    const allSlips = await SalarySlip.find({ EmployeeID: employeeObjectId });
    if (!allSlips || allSlips.length === 0) {
      return res
        .status(404)
        .json({
          success: false,
          message: "No salary slips found for this employee",
        });
    }

    // Find slip for the requested month (convert Month to number)
    const slip = await SalarySlip.findOne({
      EmployeeID: new mongoose.Types.ObjectId(EmployeeID),
      Month: Month,
    }).populate("EmployeeID");

    if (!slip) {
      // Log existing months for debugging
      const months = allSlips.map((s) => s.Month);
      console.log(`Salary slips exist for months: ${months}`);
      return res.status(404).json({
        success: false,
        message: `Salary slip not found for Month ${Month}`,
      });
    }

    // PDF generation
    const doc = new PDFDocument({ margin: 50 });
    let buffers = [];
    doc.on("data", buffers.push.bind(buffers));
    doc.on("end", async () => {
      const pdfData = Buffer.concat(buffers);

      // Log recent activity
      await RecentActivity.create({
        CompanyId: slip.CompanyId,
        UserId: employeeObjectId,
        ActivityType: `Generated salary slip PDF for Month ${Month}`,
      });

      res
        .writeHead(200, {
          "Content-Length": pdfData.length,
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename=SalarySlip-${Month}.pdf`,
        })
        .end(pdfData);
    });

    // PDF content
    doc.fontSize(20).text("Salary Slip", { align: "center" });
    doc.moveDown();
    doc.fontSize(12).text(`Employee Name: ${slip.EmployeeID.Name}`);
    doc.text(`Employee ID: ${slip.EmployeeID._id}`);
    doc.text(`Month: ${slip.Month}`);
    doc.moveDown();

    doc.text("Earnings:", { underline: true });
    slip.Earnings.forEach((e) => {
      doc.text(`${e.title} (${e.shortName}): ₹${e.amount}`);
    });
    doc.text(`Total Earnings: ₹${slip.totalEarnings}`);
    doc.moveDown();

    doc.text("Deductions:", { underline: true });
    slip.Deductions.forEach((d) => {
      doc.text(`${d.title} (${d.shortName}): ₹${d.amount}`);
    });
    doc.text(`Total Deductions: ₹${slip.totalDeductions}`);
    doc.moveDown();

    doc.text(`Tax Amount: ₹${slip.TaxAmount}`);
    doc.text(`Gross Salary: ₹${slip.grossSalary}`);
    doc.text(`Net Salary: ₹${slip.netSalary}`);

    doc.end();
  } catch (error) {
    console.error("Error generating salary slip PDF:", error);
    res
      .status(500)
      .json({
        success: false,
        message: "Internal server error",
        error: error.message,
      });
  }
};

const getAverageSalary = async (req, res) => {
  try {
    const { CompanyId } = req.body;

    if (!CompanyId) {
      return res
        .status(400)
        .json({ success: false, message: "CompanyId is required" });
    }

    if (!mongoose.Types.ObjectId.isValid(CompanyId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid CompanyId" });
    }

    const companyObjectId = new mongoose.Types.ObjectId(CompanyId);

    // Aggregate average salary for this company
    const result = await SalarySlip.aggregate([
      { $match: { CompanyId: companyObjectId } },
      {
        $group: {
          _id: null,
          averageSalary: { $avg: "$netSalary" },
          totalEmployees: { $sum: 1 },
        },
      },
    ]);

    if (!result || result.length === 0) {
      return res
        .status(404)
        .json({
          success: false,
          message: "No salary slips found for this company",
        });
    }

    res.status(200).json({
      success: true,
      averageSalary: result[0].averageSalary,
      totalEmployees: result[0].totalEmployees,
    });
  } catch (error) {
    console.error(
      "Error calculating overall average salary by company:",
      error
    );
    res
      .status(500)
      .json({
        success: false,
        message: "Internal server error",
        error: error.message,
      });
  }
};

const getPayrollByBranch = async (req, res) => {
  try {
    const { CompanyId } = req.query;

    if (!CompanyId || !mongoose.Types.ObjectId.isValid(CompanyId)) {
      return res
        .status(400)
        .json({ success: false, message: "Valid CompanyId is required" });
    }

    const companyId = new mongoose.Types.ObjectId(CompanyId);

    const payrollData = await SalarySlip.aggregate([
      { $match: { CompanyId: companyId } },

      // Join with User to get BranchId
      {
        $lookup: {
          from: "users",
          localField: "EmployeeID",
          foreignField: "_id",
          as: "employee",
        },
      },
      { $unwind: "$employee" },

      // Group by BranchId
      {
        $group: {
          _id: "$employee.BranchId",
          totalPayroll: { $sum: "$netSalary" },
          employeeCount: { $sum: 1 },
        },
      },

      // Join with Branch to get Branch Name
      {
        $lookup: {
          from: "branches",
          localField: "_id",
          foreignField: "_id",
          as: "branch",
        },
      },
      {
        $unwind: {
          path: "$branch",
          preserveNullAndEmptyArrays: true,
        },
      },

      // Format response
      {
        $project: {
          _id: 0,
          branchId: "$_id",
          branchName: "$branch.BranchName",
          totalPayroll: 1,
          employeeCount: 1,
        },
      },
      { $sort: { totalPayroll: -1 } },
    ]);

    res.status(200).json({
      success: true,
      data: payrollData,
    });
  } catch (error) {
    console.error("Error fetching payroll by branch:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};
export {
  calculateSalary,
  getTotalSalaryDistribution,
  calculateSalaryForAll,
  getDepartmentWiseSalaryDistribution,
  getPayrollTrend,
  getHighestPaidDepartment,
  generateSalarySlipPDF,
  getAverageSalary,
  getPayrollByBranch,
};
