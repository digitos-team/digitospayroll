import fs from "fs";
import path from "path";
import PDFDocument from "pdfkit";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ================== MONTHLY REPORTS PDF GENERATOR ==================

export const generateMonthlyRevenueReport = async (data, month, year) => {
  try {
    const exportDir = path.join(process.cwd(), "exports");
    if (!fs.existsSync(exportDir)) fs.mkdirSync(exportDir, { recursive: true });

    const fileName = `Monthly_Revenue_${month}_${year}_${Date.now()}.pdf`;
    const filePath = path.join(exportDir, fileName);

    const doc = new PDFDocument({ margin: 50, bufferPages: true });
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    // Header
    addHeader(doc, `Monthly Revenue Report - ${getMonthName(month)} ${year}`);

    // Summary Section
    doc
      .fontSize(14)
      .font("Helvetica-Bold")
      .text("Summary", { underline: true });
    doc.moveDown(0.5);

    if (data.summary) {
      doc.fontSize(11).font("Helvetica");
      doc.text(`Total Revenue: $${formatCurrency(data.summary.totalRevenue)}`);
      doc.text(`Number of Transactions: ${data.summary.count}`);
      doc.text(
        `Average Revenue: $${formatCurrency(data.summary.averageRevenue)}`
      );
    }

    doc.moveDown(1);

    // Details Section
    doc
      .fontSize(14)
      .font("Helvetica-Bold")
      .text("Revenue Details", { underline: true });
    doc.moveDown(0.5);

    if (data.revenues && data.revenues.length > 0) {
      // Table Header
      const pageWidth = doc.page.width - 100;
      const col1Width = pageWidth * 0.15;
      const col2Width = pageWidth * 0.25;
      const col3Width = pageWidth * 0.25;
      const col4Width = pageWidth * 0.35;

      const y = doc.y;
      doc.fontSize(10).font("Helvetica-Bold");
      doc.text("Date", 50, y);
      doc.text("Amount", 50 + col1Width, y);
      doc.text("Client", 50 + col1Width + col2Width, y);
      doc.text("Description", 50 + col1Width + col2Width + col3Width, y);

      // Table rows
      doc
        .moveTo(50, y + 15)
        .lineTo(doc.page.width - 50, y + 15)
        .stroke();
      doc.moveDown(1);

      doc.fontSize(9).font("Helvetica");
      data.revenues.forEach((revenue) => {
        const revenueDate = new Date(revenue.RevenueDate).toLocaleDateString();
        doc.text(revenueDate, 50);
        doc.text(`$${formatCurrency(revenue.Amount)}`, 50 + col1Width);
        doc.text(
          revenue.ClientName || "N/A",
          50 + col1Width + col2Width,
          doc.y - 11
        );
        doc.text(
          revenue.Source || "N/A",
          50 + col1Width + col2Width + col3Width,
          doc.y - 11
        );
        doc.moveDown(0.8);
      });
    } else {
      doc.text("No revenue data available.", { color: "red" });
    }

    addFooter(doc);
    doc.end();

    return new Promise((resolve, reject) => {
      stream.on("finish", () => resolve(filePath));
      stream.on("error", reject);
    });
  } catch (error) {
    console.error("Error generating monthly revenue report:", error);
    throw error;
  }
};

export const generateMonthlyExpensesReport = async (data, month, year) => {
  try {
    const exportDir = path.join(process.cwd(), "exports");
    if (!fs.existsSync(exportDir)) fs.mkdirSync(exportDir, { recursive: true });

    const fileName = `Monthly_Expenses_${month}_${year}_${Date.now()}.pdf`;
    const filePath = path.join(exportDir, fileName);

    const doc = new PDFDocument({ margin: 50, bufferPages: true });
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    // Header
    addHeader(doc, `Monthly Expenses Report - ${getMonthName(month)} ${year}`);

    // Summary Section
    doc
      .fontSize(14)
      .font("Helvetica-Bold")
      .text("Summary", { underline: true });
    doc.moveDown(0.5);

    if (data.summary) {
      doc.fontSize(11).font("Helvetica");
      doc.text(
        `Total Expenses: $${formatCurrency(data.summary.totalExpenses)}`
      );
      doc.text(`Number of Transactions: ${data.summary.count}`);
      doc.text(
        `Average Expense: $${formatCurrency(data.summary.averageExpense)}`
      );
    }

    doc.moveDown(1);

    // Details Section
    doc
      .fontSize(14)
      .font("Helvetica-Bold")
      .text("Expense Details", { underline: true });
    doc.moveDown(0.5);

    if (data.expenses && data.expenses.length > 0) {
      // Table Header
      const pageWidth = doc.page.width - 100;
      const col1Width = pageWidth * 0.15;
      const col2Width = pageWidth * 0.2;
      const col3Width = pageWidth * 0.25;
      const col4Width = pageWidth * 0.4;

      const y = doc.y;
      doc.fontSize(10).font("Helvetica-Bold");
      doc.text("Date", 50, y);
      doc.text("Amount", 50 + col1Width, y);
      doc.text("Type", 50 + col1Width + col2Width, y);
      doc.text("Description", 50 + col1Width + col2Width + col3Width, y);

      doc
        .moveTo(50, y + 15)
        .lineTo(doc.page.width - 50, y + 15)
        .stroke();
      doc.moveDown(1);

      doc.fontSize(9).font("Helvetica");
      data.expenses.forEach((expense) => {
        const expenseDate = new Date(expense.ExpenseDate).toLocaleDateString();
        doc.text(expenseDate, 50);
        doc.text(`$${formatCurrency(expense.Amount)}`, 50 + col1Width);
        doc.text(
          expense.ExpenseType || "Other",
          50 + col1Width + col2Width,
          doc.y - 11
        );
        doc.text(
          expense.ExpenseTitle || "N/A",
          50 + col1Width + col2Width + col3Width,
          doc.y - 11
        );
        doc.moveDown(0.8);
      });
    } else {
      doc.text("No expense data available.", { color: "red" });
    }

    addFooter(doc);
    doc.end();

    return new Promise((resolve, reject) => {
      stream.on("finish", () => resolve(filePath));
      stream.on("error", reject);
    });
  } catch (error) {
    console.error("Error generating monthly expenses report:", error);
    throw error;
  }
};

export const generateMonthlyOrdersReport = async (data, month, year) => {
  try {
    const exportDir = path.join(process.cwd(), "exports");
    if (!fs.existsSync(exportDir)) fs.mkdirSync(exportDir, { recursive: true });

    const fileName = `Monthly_Orders_${month}_${year}_${Date.now()}.pdf`;
    const filePath = path.join(exportDir, fileName);

    const doc = new PDFDocument({ margin: 50, bufferPages: true });
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    // Header
    addHeader(doc, `Monthly Orders Report - ${getMonthName(month)} ${year}`);

    // Summary Section
    doc
      .fontSize(14)
      .font("Helvetica-Bold")
      .text("Summary", { underline: true });
    doc.moveDown(0.5);

    if (data.summary) {
      doc.fontSize(11).font("Helvetica");
      doc.text(`Total Orders: ${data.summary.count}`);
      doc.text(
        `Total Order Value: $${formatCurrency(data.summary.totalValue)}`
      );
      doc.text(
        `Average Order Value: $${formatCurrency(
          data.summary.totalValue / data.summary.count
        )}`
      );
    }

    doc.moveDown(1);

    // Details Section
    doc
      .fontSize(14)
      .font("Helvetica-Bold")
      .text("Order Details", { underline: true });
    doc.moveDown(0.5);

    if (data.orders && data.orders.length > 0) {
      // Table Header
      const y = doc.y;
      doc.fontSize(10).font("Helvetica-Bold");
      doc.text("Order Date", 50, y);
      doc.text("Client", 150, y);
      doc.text("Service", 280, y);
      doc.text("Amount", 420, y);
      doc.text("Status", 480, y);

      doc
        .moveTo(50, y + 15)
        .lineTo(doc.page.width - 50, y + 15)
        .stroke();
      doc.moveDown(1);

      doc.fontSize(9).font("Helvetica");
      data.orders.forEach((order) => {
        const orderDate = new Date(order.createdAt).toLocaleDateString();
        doc.text(orderDate, 50);
        doc.text(order.ClientName || "N/A", 150, doc.y - 11);
        doc.text(order.ServiceTitle || "N/A", 280, doc.y - 11);
        doc.text(`$${formatCurrency(order.Amount)}`, 420, doc.y - 11);
        doc.text(order.PaymentStatus || "Pending", 480, doc.y - 11);
        doc.moveDown(0.8);
      });
    } else {
      doc.text("No order data available.", { color: "red" });
    }

    addFooter(doc);
    doc.end();

    return new Promise((resolve, reject) => {
      stream.on("finish", () => resolve(filePath));
      stream.on("error", reject);
    });
  } catch (error) {
    console.error("Error generating monthly orders report:", error);
    throw error;
  }
};

export const generateMonthlyPurchasesReport = async (data, month, year) => {
  try {
    const exportDir = path.join(process.cwd(), "exports");
    if (!fs.existsSync(exportDir)) fs.mkdirSync(exportDir, { recursive: true });

    const fileName = `Monthly_Purchases_${month}_${year}_${Date.now()}.pdf`;
    const filePath = path.join(exportDir, fileName);

    const doc = new PDFDocument({ margin: 50, bufferPages: true });
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    // Header
    addHeader(
      doc,
      `Monthly Purchases & Profit Report - ${getMonthName(month)} ${year}`
    );

    // Summary Section
    doc
      .fontSize(14)
      .font("Helvetica-Bold")
      .text("Summary", { underline: true });
    doc.moveDown(0.5);

    if (data.summary) {
      doc.fontSize(11).font("Helvetica");
      doc.text(`Total Revenue: $${formatCurrency(data.summary.totalRevenue)}`);
      doc.text(
        `Total Expenses: $${formatCurrency(data.summary.totalExpenses)}`
      );
      doc.text(`Total Profit: $${formatCurrency(data.summary.totalProfit)}`, {
        color: "green",
      });
      doc.text(`Profit Margin: ${data.summary.profitMargin}%`);
      doc.text(`Number of Purchases: ${data.summary.count}`);
    }

    doc.moveDown(1);

    // Details Section
    doc
      .fontSize(14)
      .font("Helvetica-Bold")
      .text("Purchase Details", { underline: true });
    doc.moveDown(0.5);

    if (data.purchases && data.purchases.length > 0) {
      // Table Header
      const y = doc.y;
      doc.fontSize(10).font("Helvetica-Bold");
      doc.text("Client", 50, y);
      doc.text("Revenue", 200, y);
      doc.text("Expenses", 280, y);
      doc.text("Profit", 360, y);
      doc.text("Margin", 440, y);

      doc
        .moveTo(50, y + 15)
        .lineTo(doc.page.width - 50, y + 15)
        .stroke();
      doc.moveDown(1);

      doc.fontSize(9).font("Helvetica");
      data.purchases.forEach((purchase) => {
        const profitMargin =
          purchase.OrderAmount > 0
            ? (
                ((purchase.OrderAmount - purchase.TotalExpense) /
                  purchase.OrderAmount) *
                100
              ).toFixed(2)
            : 0;

        doc.text(purchase.ClientName || "N/A", 50);
        doc.text(`$${formatCurrency(purchase.OrderAmount)}`, 200, doc.y - 11);
        doc.text(`$${formatCurrency(purchase.TotalExpense)}`, 280, doc.y - 11);
        doc.text(
          `$${formatCurrency(purchase.OrderAmount - purchase.TotalExpense)}`,
          360,
          doc.y - 11,
          { color: "green" }
        );
        doc.text(`${profitMargin}%`, 440, doc.y - 11);
        doc.moveDown(0.8);
      });
    } else {
      doc.text("No purchase data available.", { color: "red" });
    }

    addFooter(doc);
    doc.end();

    return new Promise((resolve, reject) => {
      stream.on("finish", () => resolve(filePath));
      stream.on("error", reject);
    });
  } catch (error) {
    console.error("Error generating monthly purchases report:", error);
    throw error;
  }
};

export const generateComprehensiveMonthlyReport = async (
  revenueData,
  expensesData,
  ordersData,
  purchasesData,
  month,
  year
) => {
  try {
    const exportDir = path.join(process.cwd(), "exports");
    if (!fs.existsSync(exportDir)) fs.mkdirSync(exportDir, { recursive: true });

    const fileName = `Comprehensive_Report_${month}_${year}_${Date.now()}.pdf`;
    const filePath = path.join(exportDir, fileName);

    const doc = new PDFDocument({ margin: 50, bufferPages: true });
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    // Title Page
    doc
      .fontSize(24)
      .font("Helvetica-Bold")
      .text("COMPREHENSIVE MONTHLY REPORT", { align: "center" });
    doc.moveDown(0.5);
    doc
      .fontSize(16)
      .text(`${getMonthName(month)} ${year}`, { align: "center" });
    doc.moveDown(1);
    doc.fontSize(12).text(`Generated on: ${new Date().toLocaleDateString()}`, {
      align: "center",
    });

    doc.addPage();

    // Executive Summary
    doc.fontSize(18).font("Helvetica-Bold").text("Executive Summary");
    doc.moveDown(0.5);

    const totalRevenue = purchasesData.summary?.totalRevenue || 0;
    const totalExpenses = purchasesData.summary?.totalExpenses || 0;
    const totalProfit = purchasesData.summary?.totalProfit || 0;
    const profitMargin = purchasesData.summary?.profitMargin || 0;

    doc.fontSize(12).font("Helvetica");
    doc.text(`Total Revenue: $${formatCurrency(totalRevenue)}`);
    doc.text(`Total Expenses: $${formatCurrency(totalExpenses)}`);
    doc.text(`Total Profit: $${formatCurrency(totalProfit)}`, {
      color: totalProfit >= 0 ? "green" : "red",
    });
    doc.text(`Profit Margin: ${profitMargin}%`);
    doc.moveDown(1);

    // Key Metrics
    doc.fontSize(14).font("Helvetica-Bold").text("Key Metrics").moveDown(0.5);
    doc.fontSize(11).font("Helvetica");
    doc.text(`Total Orders: ${ordersData.summary?.count || 0}`);
    doc.text(
      `Average Order Value: $${formatCurrency(
        (ordersData.summary?.totalValue || 0) / (ordersData.summary?.count || 1)
      )}`
    );
    doc.text(`Paid Orders: ${purchasesData.summary?.count || 0}`);
    doc.text(
      `Average Profit per Order: $${formatCurrency(
        totalProfit / (purchasesData.summary?.count || 1)
      )}`
    );

    doc.addPage();

    // Revenue Section
    addSectionToReport(doc, "REVENUE REPORT", revenueData.revenues, [
      { label: "Date", key: "RevenueDate", width: 0.15 },
      { label: "Amount", key: "Amount", width: 0.2, format: "currency" },
      { label: "Client", key: "ClientName", width: 0.3 },
      { label: "Source", key: "Source", width: 0.35 },
    ]);

    if (revenueData.revenues?.length > 0) {
      doc.addPage();
    }

    // Expenses Section
    addSectionToReport(doc, "EXPENSES REPORT", expensesData.expenses, [
      { label: "Date", key: "ExpenseDate", width: 0.15 },
      { label: "Amount", key: "Amount", width: 0.2, format: "currency" },
      { label: "Type", key: "ExpenseType", width: 0.25 },
      { label: "Description", key: "ExpenseTitle", width: 0.4 },
    ]);

    if (expensesData.expenses?.length > 0) {
      doc.addPage();
    }

    // Orders Section
    addSectionToReport(doc, "ORDERS REPORT", ordersData.orders, [
      { label: "Client", key: "ClientName", width: 0.25 },
      { label: "Service", key: "ServiceTitle", width: 0.3 },
      { label: "Amount", key: "Amount", width: 0.15, format: "currency" },
      { label: "Status", key: "PaymentStatus", width: 0.3 },
    ]);

    if (ordersData.orders?.length > 0) {
      doc.addPage();
    }

    // Purchases Section
    addSectionToReport(doc, "PURCHASES REPORT", purchasesData.purchases, [
      { label: "Client", key: "ClientName", width: 0.2 },
      { label: "Revenue", key: "OrderAmount", width: 0.2, format: "currency" },
      {
        label: "Expenses",
        key: "TotalExpense",
        width: 0.2,
        format: "currency",
      },
      { label: "Profit", key: "Profit", width: 0.2, format: "currency" },
      {
        label: "Margin %",
        key: "profitMargin",
        width: 0.2,
        format: "percentage",
      },
    ]);

    addFooter(doc);
    doc.end();

    return new Promise((resolve, reject) => {
      stream.on("finish", () => resolve(filePath));
      stream.on("error", reject);
    });
  } catch (error) {
    console.error("Error generating comprehensive report:", error);
    throw error;
  }
};

// ================== HELPER FUNCTIONS ==================

const addHeader = (doc, title) => {
  doc.fontSize(18).font("Helvetica-Bold").text(title, { align: "center" });
  doc.moveDown(0.5);
  doc
    .fontSize(11)
    .font("Helvetica")
    .text(`Generated on: ${new Date().toLocaleString()}`, { align: "center" });
  doc.moveDown(1);
};

const addFooter = (doc) => {
  const pageCount = doc.bufferedPageRange().count;
  for (let i = 0; i < pageCount; i++) {
    doc.switchToPage(i);
    doc
      .fontSize(10)
      .text(`Page ${i + 1} of ${pageCount}`, 50, doc.page.height - 50, {
        align: "center",
      });
  }
};

const addSectionToReport = (doc, title, data, columns) => {
  doc.fontSize(14).font("Helvetica-Bold").text(title, { underline: true });
  doc.moveDown(0.5);

  if (!data || data.length === 0) {
    doc
      .fontSize(11)
      .font("Helvetica")
      .text("No data available.", { color: "red" });
    return;
  }

  // Calculate column positions
  const pageWidth = doc.page.width - 100;
  let currentX = 50;
  const columnPositions = columns.map((col) => {
    const pos = currentX;
    currentX += pageWidth * col.width;
    return { ...col, position: pos };
  });

  // Header row
  const y = doc.y;
  doc.fontSize(10).font("Helvetica-Bold");
  columnPositions.forEach((col) => {
    doc.text(col.label, col.position, y);
  });

  doc
    .moveTo(50, y + 15)
    .lineTo(doc.page.width - 50, y + 15)
    .stroke();
  doc.moveDown(1);

  // Data rows
  doc.fontSize(9).font("Helvetica");
  data.forEach((row) => {
    const rowY = doc.y;
    columnPositions.forEach((col) => {
      let value = row[col.key] || "N/A";

      if (col.format === "currency") {
        value = `$${formatCurrency(value)}`;
      } else if (col.format === "percentage") {
        const profit =
          row.OrderAmount > 0
            ? (
                ((row.OrderAmount - row.TotalExpense) / row.OrderAmount) *
                100
              ).toFixed(2)
            : 0;
        value = `${profit}%`;
      } else if (col.key === "RevenueDate" || col.key === "ExpenseDate") {
        value = new Date(value).toLocaleDateString();
      }

      doc.text(String(value).substring(0, 30), col.position, rowY);
    });
    doc.moveDown(0.8);
  });
};

const formatCurrency = (value) => {
  if (!value) return "0.00";
  return parseFloat(value).toFixed(2);
};

const getMonthName = (monthNum) => {
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  return months[parseInt(monthNum) - 1] || "Unknown";
};
export const generateAnnualReportPDF = (data) => {
  return new Promise((resolve, reject) => {
    try {
      const reportsDir = path.join(process.cwd(), "reports"); // absolute path
      if (!fs.existsSync(reportsDir)) {
        fs.mkdirSync(reportsDir, { recursive: true });
      }

      const filePath = path.join(reportsDir, `Annual_Report_${data.year}.pdf`);
      const doc = new PDFDocument({ margin: 30 });

      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      doc
        .fontSize(20)
        .text(`Annual Report - ${data.year}`, { align: "center" });
      doc.moveDown();

      doc.fontSize(14).text(`Total Revenue: ${data.totals.revenue}`);
      doc.text(`Total Expenses: ${data.totals.expenses}`);
      doc.text(`Total Profit: ${data.totals.profit}`);
      doc.text(`Total Orders: ${data.totals.orders}`);
      doc.moveDown();

      doc.text("Monthly Revenue Breakdown:", { underline: true });
      data.monthlyBreakdown.forEach((month) => {
        doc.text(`Month ${month._id}: ${month.total}`);
      });

      doc.end();

      stream.on("finish", () => resolve(filePath));
      stream.on("error", reject);
    } catch (err) {
      reject(err);
    }
  });
};
