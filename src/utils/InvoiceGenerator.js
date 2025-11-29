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

// Local font paths (NO axios, NO CDN)
const REGULAR_FONT = path.join(
  process.cwd(),
  "assets",
  "fonts",
  "NotoSans-Regular.ttf"
);
const BOLD_FONT = path.join(
  process.cwd(),
  "assets",
  "fonts",
  "NotoSans-Bold.ttf"
);

// Helper: draw horizontal line
const drawLine = (doc, y) => {
  doc.strokeColor("#000000").lineWidth(1).moveTo(50, y).lineTo(550, y).stroke();
};

// Helper: table header
const createTableHeader = (doc, y) => {
  doc
    .font("Bold")
    .fontSize(11)
    .fillColor("#000")
    .text("Description", 50, y)
    .text("Quantity", 250, y)
    .text("Unit Price", 350, y)
    .text("Total", 480, y);

  drawLine(doc, y + 18);
};

// ============= ORDER INVOICE (Receipt Format) =================
export const generateOrderInvoice = (order) => {
  return new Promise((resolve, reject) => {
    const exportDir = path.join(process.cwd(), "exports");
    if (!fs.existsSync(exportDir)) fs.mkdirSync(exportDir);

    const filePath = path.join(exportDir, `invoice_${order._id}.pdf`);
    const stream = fs.createWriteStream(filePath);
    const doc = new PDFDocument({ margin: 50, size: "A4" });

    doc.pipe(stream);

    // Register local fonts (fallback to Helvetica if missing)
    if (fs.existsSync(REGULAR_FONT) && fs.existsSync(BOLD_FONT)) {
      doc.registerFont("Regular", REGULAR_FONT);
      doc.registerFont("Bold", BOLD_FONT);
      doc.font("Regular");
    } else {
      console.warn("Custom fonts not found, using default Helvetica.");
      doc.font("Helvetica");
    }

    let y = 50;

    // Logo (Top Left)
    if (fs.existsSync(COMPANY_INFO.logoPath)) {
      doc.image(COMPANY_INFO.logoPath, 50, y, { width: 60 });
    }

    // Title "Receipt" (Top Right)
    doc
      .font("Bold")
      .fontSize(24)
      .fillColor("#000")
      .text("Receipt", 350, y, { align: "right" });

    y += 70;

    // Company Info (Left side)
    doc.font("Bold").fontSize(14).fillColor("#000").text(COMPANY_INFO.name, 50, y);
    y += 20;

    doc.font("Regular").fontSize(10);
    doc.text(COMPANY_INFO.address, 50, y);
    y += 15;

    doc.text(COMPANY_INFO.city, 50, y);
    y += 20;

    doc.text(`Phone : ${COMPANY_INFO.phone}`, 50, y);
    y += 15;

    doc.text(`Email  : ${COMPANY_INFO.email}`, 50, y);

    // Reset y position for right side info
    y = 120;

    // Invoice Info (Right side)
    doc.font("Bold").fontSize(10).fillColor("#000").text("Date", 350, y);
    doc
      .font("Regular")
      .text(`: ${moment(order.createdAt).format("DD MMMM YYYY")}`, 430, y);

    y += 15;
    doc.font("Bold").text("Invoice Number", 350, y);
    doc
      .font("Regular")
      .text(`: ${order._id.toString().slice(-4).toUpperCase()}`, 450, y);

    y += 15;
    doc.font("Bold").text("Customer Name", 350, y);
    doc.font("Regular").text(`: ${order.ClientName}`, 450, y);

    y += 15;
    doc.font("Bold").text("Customer Address", 350, y);
    doc.font("Regular").text(`: ${order.ClientAddress || "Ch Sambhaji Nagar"}`, 450, y);

    y += 50;

    // Line above table
    drawLine(doc, y);
    y += 10;

    // Table Header
    createTableHeader(doc, y);
    y += 30;

    // Item Row
    doc.font("Regular").fontSize(10).fillColor("#000");
    doc.text(order.ServiceTitle, 50, y, { width: 180 });
    doc.text("1", 260, y);

    // Unit Price and Total aligned with header, with ₹ sign
    doc.text(`₹${order.Amount}`, 350, y);
    doc.text(`₹${order.Amount}`, 480, y);

    y += 40;

    // Description
    if (order.ServiceDescription) {
      doc.fontSize(9).fillColor("#444").text(order.ServiceDescription, 50, y, { width: 200 });
      y += 30;
    }

    // Watermark
    doc
      .font("Bold")
      .fontSize(90)
      .fillColor("#cce3d8")
      .opacity(0.22)
      .text("digitos", 100, y, { align: "center" });

    doc.opacity(1);
    y += 100;

    // Totals
    doc.font("Regular").fontSize(11).fillColor("#000").text("Subtotal :", 400, y);
    doc.text(`₹${order.Amount}`, 480, y);

    y += 20;

    doc.font("Bold").text("Total Amount Due :", 350, y);
    doc.font("Regular").text(`₹${order.Amount}`, 480, y);

    // Divider line
    y += 40;
    drawLine(doc, y);

    y += 20;

    // Footer Payment Terms
    doc.font("Bold").fontSize(10).text("Delivery Time :", 50, y);
    doc.font("Regular").text("35 Days for version 1", 150, y);

    y += 15;

    doc.font("Bold").text("Payment Terms :", 50, y);
    doc
      .font("Regular")
      .text("40k Advance 50k Version 1 and 50k During version 1", 150, y);

    y += 15;

    doc.font("Bold").text("Payment Methods :", 50, y);
    doc
      .font("Regular")
      .text("Check, Credit Card, or Bank Transfer", 150, y);

    y += 30;

    doc.font("Bold").text("Thank you for your business!", 50, y);

    // Bottom Footer
    doc
      .font("Regular")
      .fontSize(9)
      .fillColor("#444")
      .text("Please contact us if you have any questions regarding this invoice.", 50, 750, {
        width: 500,
        align: "center",
      });

    doc.end();

    stream.on("finish", () => resolve(filePath));
    stream.on("error", reject);
  });
};

// ============= FINAL BILL (Same format + Paid Badge) =================
export const generateFinalBill = (order) => {
  return new Promise((resolve, reject) => {
    const exportDir = path.join(process.cwd(), "exports");
    if (!fs.existsSync(exportDir)) fs.mkdirSync(exportDir);

    const filePath = path.join(exportDir, `final_bill_${order._id}.pdf`);
    const stream = fs.createWriteStream(filePath);
    const doc = new PDFDocument({ margin: 50, size: "A4" });

    doc.pipe(stream);

    // Register fonts
    if (fs.existsSync(REGULAR_FONT) && fs.existsSync(BOLD_FONT)) {
      doc.registerFont("Regular", REGULAR_FONT);
      doc.registerFont("Bold", BOLD_FONT);
      doc.font("Regular");
    } else {
      console.warn("Custom fonts not found, using default Helvetica.");
      doc.font("Helvetica");
    }

    let y = 50;

    // Logo (Top Left)
    if (fs.existsSync(COMPANY_INFO.logoPath)) {
      doc.image(COMPANY_INFO.logoPath, 50, y, { width: 60 });
    }

    // Title "Final Bill" (Top Right)
    doc
      .font("Bold")
      .fontSize(24)
      .fillColor("#000")
      .text("Final Bill", 350, y, { align: "right" });

    // PAID IN FULL Badge (aligned with title)
    doc.rect(385, y + 30, 155, 25).fillAndStroke("#10b981", "#10b981");
    doc
      .font("Bold")
      .fontSize(13)
      .fillColor("#fff")
      .text("PAID IN FULL", 385, y + 35, { width: 155, align: "center" });

    y += 65;

    // Company Info (Left side)
    doc.font("Bold").fontSize(14).fillColor("#000").text(COMPANY_INFO.name, 50, y);
    y += 18;

    doc.font("Regular").fontSize(10);
    doc.text(COMPANY_INFO.address, 50, y);
    y += 14;

    doc.text(COMPANY_INFO.city, 50, y);
    y += 18;

    doc.text(`Phone : ${COMPANY_INFO.phone}`, 50, y);
    y += 14;

    doc.text(`Email : ${COMPANY_INFO.email}`, 50, y);

    // Reset y position for right side info
    y = 115;

    // Bill Info (Right side)
    doc.font("Bold").fontSize(10).fillColor("#000").text("Bill No", 330, y);
    doc.font("Regular").text(`: ${order._id.toString().slice(-4).toUpperCase()}`, 450, y);

    y += 15;
    doc.font("Bold").text("Issued Date", 330, y);
    doc
      .font("Regular")
      .text(`: ${moment(order.createdAt).format("DD MMMM YYYY")}`, 450, y);

    y += 15;
    doc.font("Bold").text("Completion Date", 330, y);
    doc
      .font("Regular")
      .text(`: ${moment(order.updatedAt).format("DD MMMM YYYY")}`, 450, y);

    y += 15;
    doc.font("Bold").text("Client Name", 330, y);
    doc.font("Regular").text(`: ${order.ClientName}`, 450, y);

    y += 50;

    // Line above table
    drawLine(doc, y);
    y += 10;

    // Table Header
    createTableHeader(doc, y);
    y += 30;

    // Row
    doc.font("Regular").fontSize(10).fillColor("#000").text(order.ServiceTitle, 50, y, {
      width: 180,
    });
    doc.text("1", 260, y);

    // Unit Price and Total with ₹
    doc.text(`₹${order.Amount}`, 350, y);
    doc.text(`₹${order.Amount}`, 480, y);

    y += 40;

    if (order.ServiceDescription) {
      doc.fontSize(9).fillColor("#444").text(order.ServiceDescription, 50, y, { width: 200 });
      y += 35;
    }

    // Watermark
    doc
      .font("Bold")
      .fontSize(90)
      .opacity(0.2)
      .fillColor("#cce3d8")
      .text("digitos", 100, y, { align: "center" });

    doc.opacity(1);
    y += 100;

    // Payment Summary
    doc.font("Regular").fontSize(11).fillColor("#000").text("Total Amount :", 400, y);
    doc.text(`₹${order.Amount}`, 480, y);

    y += 20;
    doc.text("Advance Paid :", 400, y);
    doc.text(`₹${order.AdvancePaid}`, 480, y);

    y += 20;
    doc.font("Bold").text("Balance Cleared :", 370, y);
    doc.font("Regular").text(`₹${order.Amount - order.AdvancePaid}`, 480, y);

    y += 40;
    drawLine(doc, y);

    // Completion Message
    y += 30;
    doc.font("Bold").fontSize(11).text("Service Completed Successfully ✓", 50, y);

    y += 20;
    doc
      .font("Regular")
      .fontSize(10)
      .fillColor("#444")
      .text("This final bill confirms project completion and full payment received.", 50, y);

    // Footer
    doc
      .font("Regular")
      .fontSize(9)
      .fillColor("#444")
      .text("Thank you for trusting Digitos IT Solutions!", 50, 750, {
        width: 500,
        align: "center",
      });

    doc.end();

    stream.on("finish", () => resolve(filePath));
    stream.on("error", reject);
  });
};


// import fs from "fs";
// import path from "path";
// import PDFDocument from "pdfkit";
// import moment from "moment";

// // Company Configuration
// const COMPANY_INFO = {
//   name: "Digitos IT Solutions pvt ltd",
//   address: "Hudco colony",
//   city: "Chhatrapati Sambhajinagar, Maharashtra 400001",
//   phone: "+91 98765 43210",
//   email: "info@digitositsolutions.com",
//   website: "www.digitositsolutions.com",
//   gst: "GST123456789",
//   logoPath: path.join(process.cwd(), "assets", "logo.png"),
// };

// // Local fonts
// const REGULAR_FONT = path.join(process.cwd(), "assets", "fonts", "NotoSans-Regular.ttf");
// const BOLD_FONT = path.join(process.cwd(), "assets", "fonts", "NotoSans-Bold.ttf");

// // Draw line
// const drawLine = (doc, y) => {
//   doc.strokeColor("#000").lineWidth(1).moveTo(50, y).lineTo(550, y).stroke();
// };

// // Table header
// const createTableHeader = (doc, y) => {
//   doc
//     .font("Bold")
//     .fontSize(11)
//     .fillColor("#000")
//     .text("Description", 50, y)
//     .text("Quantity", 250, y)
//     .text("Unit Price", 350, y)
//     .text("Total", 480, y);

//   drawLine(doc, y + 18);
// };

// /* ============================================================
//    ================== GENERATE ORDER INVOICE ===================
//    ============================================================ */

// export const generateOrderInvoice = (order) => {
//   return new Promise((resolve, reject) => {
//     const exportDir = path.join(process.cwd(), "exports");
//     if (!fs.existsSync(exportDir)) fs.mkdirSync(exportDir);

//     const filePath = path.join(exportDir, `invoice_${order._id}.pdf`);
//     const stream = fs.createWriteStream(filePath);

//     const doc = new PDFDocument({ margin: 50, size: "A4" });
//     doc.pipe(stream);

//     // Load fonts
//     if (fs.existsSync(REGULAR_FONT) && fs.existsSync(BOLD_FONT)) {
//       doc.registerFont("Regular", REGULAR_FONT);
//       doc.registerFont("Bold", BOLD_FONT);
//       doc.font("Regular");
//     } else {
//       doc.font("Helvetica");
//     }

//     let y = 50;

//     // Logo
//     if (fs.existsSync(COMPANY_INFO.logoPath)) {
//       doc.image(COMPANY_INFO.logoPath, 50, y, { width: 60 });
//     }

//     // Title
//     doc.font("Bold").fontSize(24).fillColor("#000").text("Receipt", 350, y, { align: "right" });

//     y += 70;

//     // Company info left
//     doc.font("Bold").fontSize(14).fillColor("#000").text(COMPANY_INFO.name, 50, y);
//     y += 20;

//     doc.font("Regular").fontSize(10);
//     doc.text(COMPANY_INFO.address, 50, y);
//     y += 15;

//     doc.text(COMPANY_INFO.city, 50, y);
//     y += 20;

//     doc.text(`Phone : ${COMPANY_INFO.phone}`, 50, y);
//     y += 15;

//     doc.text(`Email : ${COMPANY_INFO.email}`, 50, y);

//     // Right info
//     y = 120;

//     doc.font("Bold").fontSize(10).text("Date", 350, y);
//     doc.font("Regular").text(`: ${moment(order.createdAt).format("DD MMMM YYYY")}`, 430, y);

//     y += 15;
//     doc.font("Bold").text("Invoice Number", 350, y);
//     doc.font("Regular").text(`: ${order._id.toString().slice(-4).toUpperCase()}`, 450, y);

//     y += 15;
//     doc.font("Bold").text("Customer Name", 350, y);
//     doc.font("Regular").text(`: ${order.ClientName}`, 450, y);

//     y += 15;
//     doc.font("Bold").text("Customer Address", 350, y);
//     doc.font("Regular").text(`: ${order.ClientAddress || "Ch Sambhaji Nagar"}`, 450, y);

//     y += 15;
//     doc.font("Bold").text("GSTIN", 350, y);
//     doc.font("Regular").text(`: ${COMPANY_INFO.gst}`, 450, y);

//     y += 50;

//     drawLine(doc, y);
//     y += 10;

//     createTableHeader(doc, y);
//     y += 30;

//     doc.font("Regular").fontSize(10).fillColor("#000").text(order.ServiceTitle, 50, y, { width: 180 });
//     doc.text("1", 260, y);
//     doc.text(`₹${order.Amount}`, 350, y);
//     doc.text(`₹${order.Amount}`, 480, y);

//     y += 40;

//     if (order.ServiceDescription) {
//       doc.fontSize(9).text(order.ServiceDescription, 50, y, { width: 200 });
//       y += 30;
//     }

//     // Watermark
//     doc
//       .font("Bold")
//       .fontSize(90)
//       .fillColor("#cce3d8")
//       .opacity(0.18)
//       .text("digitos", 100, y, { align: "center" });

//     // RESET OPACITY + COLOR
//     doc.opacity(1).fillColor("#000");

//     y += 120;

//     // Totals
//     doc.font("Bold").fontSize(11).text("Total Amount :", 350, y);
//     doc.font("Regular").text(`₹${order.Amount}`, 480, y);

//     y += 20;
//     doc.font("Bold").text("Advance Paid :", 350, y);
//     doc.font("Regular").text(`₹${order.AdvancePaid}`, 480, y);

//     y += 40;
//     drawLine(doc, y);

//     y += 20;

//     doc.font("Bold").text("Delivery Time :", 50, y);
//     doc.font("Regular").text("35 Days for version 1", 150, y);

//     y += 15;
//     doc.font("Bold").text("Payment Terms :", 50, y);
//     doc.font("Regular").text("40k Advance 50k Version 1 and 50k During version 2", 150, y);

//     y += 15;
//     doc.font("Bold").text("Payment Methods :", 50, y);
//     doc.font("Regular").text("Check, Credit Card, or Bank Transfer", 150, y);

//     y += 30;
//     doc.font("Bold").text("Thank you for your business!", 50, y);

//     doc.font("Regular")
//       .fontSize(9)
//       .text("Please contact us if you have any questions regarding this invoice.", 50, 750, {
//         width: 500,
//         align: "center",
//       });

//     doc.end();

//     stream.on("finish", () => resolve(filePath));
//     stream.on("error", reject);
//   });
// };

// /* ============================================================
//    ======================= FINAL BILL ==========================
//    ============================================================ */

// export const generateFinalBill = (order) => {
//   return new Promise((resolve, reject) => {
//     const exportDir = path.join(process.cwd(), "exports");
//     if (!fs.existsSync(exportDir)) fs.mkdirSync(exportDir);

//     const filePath = path.join(exportDir, `final_bill_${order._id}.pdf`);
//     const stream = fs.createWriteStream(filePath);

//     const doc = new PDFDocument({ margin: 50, size: "A4" });
//     doc.pipe(stream);

//     // Fonts
//     if (fs.existsSync(REGULAR_FONT) && fs.existsSync(BOLD_FONT)) {
//       doc.registerFont("Regular", REGULAR_FONT);
//       doc.registerFont("Bold", BOLD_FONT);
//       doc.font("Regular");
//     } else {
//       doc.font("Helvetica");
//     }

//     let y = 50;

//     // Logo
//     if (fs.existsSync(COMPANY_INFO.logoPath)) {
//       doc.image(COMPANY_INFO.logoPath, 50, y, { width: 60 });
//     }

//     doc.font("Bold").fontSize(24).text("Final Bill", 350, y, { align: "right" });

//     doc.rect(385, y + 30, 155, 25).fillAndStroke("#10b981", "#10b981");
//     doc
//       .font("Bold")
//       .fontSize(13)
//       .fillColor("#fff")
//       .text("PAID IN FULL", 385, y + 35, { width: 155, align: "center" });

//     y += 70;

//     // Left company info
//     doc.font("Bold").fontSize(14).fillColor("#000").text(COMPANY_INFO.name, 50, y);
//     y += 18;

//     doc.font("Regular").fontSize(10);
//     doc.text(COMPANY_INFO.address, 50, y);
//     y += 14;

//     doc.text(COMPANY_INFO.city, 50, y);
//     y += 14;

//     doc.text(`Phone: ${COMPANY_INFO.phone}`, 50, y);
//     y += 14;

//     doc.text(`Email: ${COMPANY_INFO.email}`, 50, y);

//     // Right side
//     y = 115;

//     doc.font("Bold").fontSize(10).text("Bill No", 330, y);
//     doc.font("Regular").text(`: ${order._id.toString().slice(-4).toUpperCase()}`, 450, y);

//     y += 15;
//     doc.font("Bold").text("Issued Date", 330, y);
//     doc.font("Regular").text(`: ${moment(order.createdAt).format("DD MMMM YYYY")}`, 450, y);

//     y += 15;
//     doc.font("Bold").text("Completion Date", 330, y);
//     doc.font("Regular").text(`: ${moment(order.updatedAt).format("DD MMMM YYYY")}`, 450, y);

//     y += 15;
//     doc.font("Bold").text("Client Name", 330, y);
//     doc.font("Regular").text(`: ${order.ClientName}`, 450, y);

//     y += 15;
//     doc.font("Bold").text("GSTIN", 330, y);
//     doc.font("Regular").text(`: ${COMPANY_INFO.gst}`, 450, y);

//     y += 50;

//     drawLine(doc, y);
//     y += 10;

//     createTableHeader(doc, y);
//     y += 30;

//     doc.font("Regular").fillColor("#000").text(order.ServiceTitle, 50, y, { width: 180 });
//     doc.text("1", 260, y);
//     doc.text(`₹${order.Amount}`, 350, y);
//     doc.text(`₹${order.Amount}`, 480, y);

//     y += 40;

//     if (order.ServiceDescription) {
//       doc.fontSize(9).text(order.ServiceDescription, 50, y, { width: 200 });
//       y += 35;
//     }

//     // Watermark
//     doc
//       .font("Bold")
//       .fontSize(90)
//       .fillColor("#cce3d8")
//       .opacity(0.18)
//       .text("digitos", 100, y, { align: "center" });

//     // RESET OPACITY + COLOR
//     doc.opacity(1).fillColor("#000");

//     y += 120;

//     // Payment Summary
//     doc.font("Bold").fontSize(11).text("Total Amount :", 350, y);
//     doc.font("Regular").text(`₹${order.Amount}`, 480, y);

//     y += 20;
//     doc.font("Bold").text("Advance Paid :", 350, y);
//     doc.font("Regular").text(`₹${order.AdvancePaid}`, 480, y);

//     y += 20;
//     doc.font("Bold").text("Balance Cleared :", 350, y);
//     doc.font("Regular").text(`₹${order.Amount - order.AdvancePaid}`, 480, y);

//     y += 40;
//     drawLine(doc, y);

//     y += 30;
//     doc.font("Bold").text("Service Completed Successfully ✓", 50, y);

//     y += 20;
//     doc.font("Regular")
//       .fontSize(10)
//       .text("This final bill confirms project completion and full payment received.", 50, y);

//     doc.font("Regular")
//       .fontSize(9)
//       .text("Thank you for trusting Digitos IT Solutions!", 50, 750, { width: 500, align: "center" });

//     doc.end();
//     stream.on("finish", () => resolve(filePath));
//     stream.on("error", reject);
//   });
// };
