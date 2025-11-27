import fs from "fs";
import path from "path";
import PDFDocument from "pdfkit";
import moment from "moment";

// Company Configuration
const COMPANY_INFO = {
  name: "Digitos IT Solutions pvt ltd",
  address: "Hudco colony",
  city: "Chhatrapati Sambhajinagar, Maharashtra 400001",
  phone: "+91 98765 43210",
  email: "info@digitositsolutions.com",
  website: "www.digitositsolutions.com",
  gst: "GST123456789",
  logoPath: path.join(process.cwd(), "assets", "logo.png"),
};

// Helper: draw horizontal line
const drawLine = (doc, y) => {
  doc
    .strokeColor("#cccccc")
    .lineWidth(1)
    .moveTo(50, y)
    .lineTo(550, y)
    .stroke();
};

// Helper: table header
const createTableHeader = (doc, y) => {
  doc.rect(50, y, 500, 25).fillAndStroke("#4a5568", "#4a5568");

  doc
    .fillColor("#ffffff")
    .fontSize(10)
    .font("Helvetica-Bold")
    .text("Description", 60, y + 8, { width: 200 })
    .text("Quantity", 270, y + 8, { width: 80, align: "center" })
    .text("Rate", 360, y + 8, { width: 80, align: "right" })
    .text("Amount", 450, y + 8, { width: 90, align: "right" });
};

export const generateOrderInvoice = (order) => {
  return new Promise((resolve, reject) => {
    const exportDir = path.join(process.cwd(), "exports");
    if (!fs.existsSync(exportDir)) fs.mkdirSync(exportDir);

    const filePath = path.join(exportDir, `invoice_${order._id}.pdf`);
    const stream = fs.createWriteStream(filePath);

    const doc = new PDFDocument({ margin: 50, size: "A4" });
    doc.pipe(stream);

    let yPosition = 50;

    // ===== HEADER WITH LOGO =====
    if (fs.existsSync(COMPANY_INFO.logoPath)) {
      doc.image(COMPANY_INFO.logoPath, 50, yPosition, { width: 80 });
    }

    doc
      .fontSize(18)
      .font("Helvetica-Bold")
      .fillColor("#2d3748")
      .text(COMPANY_INFO.name, 300, yPosition, { align: "right" });

    doc
      .fontSize(9)
      .font("Helvetica")
      .fillColor("#4a5568")
      .text(COMPANY_INFO.address, 300, yPosition + 25, { align: "right" })
      .text(COMPANY_INFO.city, 300, yPosition + 38, { align: "right" })
      .text(`Phone: ${COMPANY_INFO.phone}`, 300, yPosition + 51, { align: "right" })
      .text(`Email: ${COMPANY_INFO.email}`, 300, yPosition + 64, { align: "right" })
      .text(`GST: ${COMPANY_INFO.gst}`, 300, yPosition + 77, { align: "right" });

    yPosition += 110;

    // ===== INVOICE TITLE =====
    doc
      .fontSize(24)
      .font("Helvetica-Bold")
      .fillColor("#2d3748")
      .text("INVOICE", 50, yPosition);

    yPosition += 40;

    // ===== INVOICE INFO & CLIENT INFO =====
    doc
      .fontSize(10)
      .font("Helvetica-Bold")
      .fillColor("#2d3748")
      .text("Invoice Details:", 50, yPosition);

    doc
      .fontSize(9)
      .font("Helvetica")
      .fillColor("#4a5568")
      .text(`Invoice No: #${order._id.toString().slice(-8).toUpperCase()}`, 50, yPosition + 15)
      .text(`Invoice Date: ${moment(order.createdAt).format("DD MMM YYYY")}`, 50, yPosition + 28)
      .text(`Status: ${order.PaymentStatus}`, 50, yPosition + 41);

    doc
      .fontSize(10)
      .font("Helvetica-Bold")
      .fillColor("#2d3748")
      .text("Bill To:", 320, yPosition);

    doc
      .fontSize(9)
      .font("Helvetica")
      .fillColor("#4a5568")
      .text(order.ClientName, 320, yPosition + 15)
      .text(order.ClientEmail || "", 320, yPosition + 28)
      .text(order.ClientPhone || "", 320, yPosition + 41);

    yPosition += 70;
    drawLine(doc, yPosition);
    yPosition += 20;

    // ===== TABLE HEADER =====
    createTableHeader(doc, yPosition);
    yPosition += 30;

    // ===== SERVICE ROW =====
    doc
      .fontSize(9)
      .font("Helvetica")
      .fillColor("#2d3748")
      .text(order.ServiceTitle, 60, yPosition, { width: 200 })
      .text("1", 270, yPosition, { width: 80, align: "center" })
      .text(`₹${order.Amount.toLocaleString()}`, 360, yPosition, { width: 80, align: "right" })
      .text(`₹${order.Amount.toLocaleString()}`, 450, yPosition, { width: 90, align: "right" });

    yPosition += 15;

    if (order.ServiceDescription) {
      doc
        .fontSize(8)
        .fillColor("#718096")
        .text(order.ServiceDescription, 60, yPosition, { width: 200 });

      yPosition += 20;
    } else {
      yPosition += 5;
    }

    if (order.StartDate || order.EndDate) {
      const dateRange = `${order.StartDate ? moment(order.StartDate).format("DD MMM YYYY") : ""}${
        order.StartDate && order.EndDate ? " to " : ""
      }${order.EndDate ? moment(order.EndDate).format("DD MMM YYYY") : ""}`;

      doc
        .fontSize(8)
        .fillColor("#718096")
        .text(`Service Period: ${dateRange}`, 60, yPosition, { width: 200 });

      yPosition += 20;
    }

    yPosition += 10;
    drawLine(doc, yPosition);
    yPosition += 15;

    // ===== FINANCIAL SUMMARY =====
    const summaryX = 380;

    doc
      .fontSize(9)
      .font("Helvetica")
      .fillColor("#4a5568")
      .text("Subtotal:", summaryX, yPosition)
      .text(`₹${order.Amount.toLocaleString()}`, summaryX + 100, yPosition, { align: "right" });

    yPosition += 15;

    doc
      .text("Advance Paid:", summaryX, yPosition)
      .text(`₹${order.AdvancePaid.toLocaleString()}`, summaryX + 100, yPosition, { align: "right" });

    yPosition += 20;

    const balanceDue = order.BalanceDue ?? (order.Amount - order.AdvancePaid);

    doc.rect(summaryX - 10, yPosition - 5, 190, 25).fillAndStroke("#4a5568", "#4a5568");

    doc
      .fontSize(11)
      .font("Helvetica-Bold")
      .fillColor("#ffffff")
      .text("Balance Due:", summaryX, yPosition + 3)
      .text(`₹${balanceDue.toLocaleString()}`, summaryX + 100, yPosition + 3, { align: "right" });

    yPosition += 50;

    // ===== PAYMENT INSTRUCTIONS =====
    if (balanceDue > 0) {
      doc
        .fontSize(10)
        .font("Helvetica-Bold")
        .fillColor("#2d3748")
        .text("Payment Instructions:", 50, yPosition);

      yPosition += 15;

      doc
        .fontSize(9)
        .font("Helvetica")
        .fillColor("#4a5568")
        .text("• Please make payment within 15 days of invoice date", 60, yPosition)
        .text("• Payment can be made via bank transfer, UPI, or cash", 60, yPosition + 12)
        .text("• Please quote invoice number in payment reference", 60, yPosition + 24);

      yPosition += 50;
    }

    // ===== FOOTER =====
    const footerY = 750;
    drawLine(doc, footerY);

    doc
      .fontSize(8)
      .font("Helvetica")
      .fillColor("#718096")
      .text(
        "Terms & Conditions: Payment is due within 15 days. Late payments may incur additional charges.",
        50,
        footerY + 10,
        { width: 500, align: "center" }
      )
      .text("Thank you for your business!", 50, footerY + 25, {
        width: 500,
        align: "center",
      });

    doc.end();

    stream.on("finish", () => resolve(filePath));
    stream.on("error", reject);
  });
};


export const generateFinalBill = (order) => {
    return new Promise((resolve, reject) => {
  const exportDir = path.join(process.cwd(), "exports");
  if (!fs.existsSync(exportDir)) fs.mkdirSync(exportDir);

  const filePath = path.join(exportDir, `final_bill_${order._id}.pdf`);
  const doc = new PDFDocument({ margin: 50, size: "A4" });

const stream = fs.createWriteStream(filePath);
doc.pipe(stream);

 stream.on("finish", () => resolve(filePath));
    stream.on("error", reject);
  let yPosition = 50;

  // ===== HEADER WITH LOGO =====
  if (fs.existsSync(COMPANY_INFO.logoPath)) {
    doc.image(COMPANY_INFO.logoPath, 50, yPosition, { width: 80 });
  }

  // Company Details
  doc
    .fontSize(18)
    .font("Helvetica-Bold")
    .fillColor("#2d3748")
    .text(COMPANY_INFO.name, 300, yPosition, { align: "right" });
  
  doc
    .fontSize(9)
    .font("Helvetica")
    .fillColor("#4a5568")
    .text(COMPANY_INFO.address, 300, yPosition + 25, { align: "right" })
    .text(COMPANY_INFO.city, 300, yPosition + 38, { align: "right" })
    .text(`Phone: ${COMPANY_INFO.phone}`, 300, yPosition + 51, { align: "right" })
    .text(`Email: ${COMPANY_INFO.email}`, 300, yPosition + 64, { align: "right" })
    .text(`GST: ${COMPANY_INFO.gst}`, 300, yPosition + 77, { align: "right" });

  yPosition += 110;

  // ===== FINAL BILL TITLE WITH BADGE =====
  doc
    .fontSize(24)
    .font("Helvetica-Bold")
    .fillColor("#2d3748")
    .text("FINAL BILL", 50, yPosition);

  // Paid stamp
  doc
    .rect(420, yPosition - 5, 130, 35)
    .fillAndStroke("#10b981", "#10b981");
  
  doc
    .fontSize(16)
    .font("Helvetica-Bold")
    .fillColor("#ffffff")
    .text("PAID IN FULL", 430, yPosition + 5);

  yPosition += 50;

  // ===== BILL INFO & CLIENT INFO =====
  doc
    .fontSize(10)
    .font("Helvetica-Bold")
    .fillColor("#2d3748")
    .text("Bill Details:", 50, yPosition);

  doc
    .font("Helvetica")
    .fontSize(9)
    .fillColor("#4a5568")
    .text(`Bill No: #${order._id.toString().slice(-8).toUpperCase()}`, 50, yPosition + 15)
    .text(`Issue Date: ${moment(order.createdAt).format("DD MMM YYYY")}`, 50, yPosition + 28)
    .text(`Completion Date: ${moment(order.updatedAt).format("DD MMM YYYY")}`, 50, yPosition + 41);

  doc
    .fontSize(10)
    .font("Helvetica-Bold")
    .fillColor("#2d3748")
    .text("Client:", 320, yPosition);

  doc
    .font("Helvetica")
    .fontSize(9)
    .fillColor("#4a5568")
    .text(order.ClientName, 320, yPosition + 15)
    .text(order.ClientEmail || "", 320, yPosition + 28)
    .text(order.ClientPhone || "", 320, yPosition + 41);

  yPosition += 70;
  drawLine(doc, yPosition);
  yPosition += 20;

  // ===== SERVICE DETAILS =====
  createTableHeader(doc, yPosition);
  yPosition += 30;

  doc
    .fontSize(9)
    .font("Helvetica")
    .fillColor("#2d3748")
    .text(order.ServiceTitle, 60, yPosition, { width: 200 })
    .text("1", 270, yPosition, { width: 80, align: "center" })
    .text(`₹${order.Amount.toLocaleString()}`, 360, yPosition, { width: 80, align: "right" })
    .text(`₹${order.Amount.toLocaleString()}`, 450, yPosition, { width: 90, align: "right" });

  yPosition += 15;

  if (order.ServiceDescription) {
    doc
      .fontSize(8)
      .fillColor("#718096")
      .text(order.ServiceDescription, 60, yPosition, { width: 200 });
    yPosition += 25;
  }

  yPosition += 10;
  drawLine(doc, yPosition);
  yPosition += 15;

  // ===== PAYMENT SUMMARY =====
  const summaryX = 380;
  
  doc
    .fontSize(9)
    .font("Helvetica")
    .fillColor("#4a5568")
    .text("Total Amount:", summaryX, yPosition, { width: 100, align: "left" })
    .text(`₹${order.Amount.toLocaleString()}`, summaryX + 100, yPosition, { width: 80, align: "right" });

  yPosition += 15;

  doc
    .text("Advance Paid:", summaryX, yPosition, { width: 100, align: "left" })
    .text(`₹${order.AdvancePaid.toLocaleString()}`, summaryX + 100, yPosition, { width: 80, align: "right" });

  yPosition += 15;

  const balanceCleared = order.BalanceDue ?? (order.Amount - order.AdvancePaid);
  
  doc
    .text("Balance Cleared:", summaryX, yPosition, { width: 100, align: "left" })
    .text(`₹${balanceCleared.toLocaleString()}`, summaryX + 100, yPosition, { width: 80, align: "right" });

  yPosition += 20;

  doc
    .rect(summaryX - 10, yPosition - 5, 190, 25)
    .fillAndStroke("#10b981", "#10b981");

  doc
    .fontSize(11)
    .font("Helvetica-Bold")
    .fillColor("#ffffff")
    .text("Total Paid:", summaryX, yPosition + 3, { width: 100, align: "left" })
    .text(`₹${order.Amount.toLocaleString()}`, summaryX + 100, yPosition + 3, { width: 80, align: "right" });

  yPosition += 50;

  // ===== COMPLETION MESSAGE =====
  doc
    .rect(50, yPosition, 500, 60)
    .fillAndStroke("#f0fdf4", "#10b981");

  doc
    .fontSize(11)
    .font("Helvetica-Bold")
    .fillColor("#10b981")
    .text("✓ Service Completed Successfully", 70, yPosition + 15)
    .fontSize(9)
    .font("Helvetica")
    .fillColor("#4a5568")
    .text("This bill marks the successful completion of the service.", 70, yPosition + 35);

  // ===== FOOTER =====
  const footerY = 750;
  drawLine(doc, footerY);

  doc
    .fontSize(8)
    .font("Helvetica")
    .fillColor("#718096")
    .text("This is a computer generated final bill and requires no signature.", 50, footerY + 10, {
      width: 500,
      align: "center",
    })
    .text("Thank you for your trust and business!", 50, footerY + 25, {
      width: 500,
      align: "center",
    });

  doc.end();
  return filePath;
    });
};