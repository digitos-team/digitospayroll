import mongoose from "mongoose";

const OrderSchema = new mongoose.Schema(
  {
    // Company & Branch
    CompanyId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Company", 
      required: true 
    },
    BranchId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Branch" 
    },

    // Client Information
    ClientName: { 
      type: String, 
      required: true 
    },
    ClientEmail: { 
      type: String 
    },
    ClientPhone: { 
      type: String 
    },
    
    // ✅ GST Information - NEW
    ClientGSTIN: { 
      type: String,
      uppercase: true,
      validate: {
        validator: function(v) {
          if (!v) return true; // Optional field
          // GST format: 22AAAAA0000A1Z5 (15 characters)
          return /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(v);
        },
        message: 'Invalid GSTIN format'
      }
    },
    ClientState: { 
      type: String,
      enum: [
        "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
        "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
        "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
        "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
        "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
        "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu",
        "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry"
      ]
    },
    ClientAddress: {
      street: String,
      city: String,
      state: String,
      pincode: String
    },

    // Service Details

    // Service Details
    ServiceTitle: { 
      type: String, 
      required: true 
    },
    ServiceDescription: { 
      type: String 
    },
    
    // ✅ HSN/SAC Code for services - NEW
    HSNCode: {
      type: String,
      default: "998314", // Default for IT/Software services
      comment: "HSN/SAC code for GST"
    },
    
    StartDate: { 
      type: Date 
    },
    EndDate: { 
      type: Date 
    },

    // ✅ Financial Details - UPDATED WITH GST
    BaseAmount: { 
      type: Number, 
      required: true,
      min: 0,
      comment: "Amount before GST"
    },
    
    GSTRate: {
      type: Number,
      enum: [0, 5, 12, 18, 28],
      default: 18,
      comment: "GST percentage"
    },
    
    // Auto-calculated GST fields
    CGSTAmount: { 
      type: Number, 
      default: 0,
      comment: "Central GST (for intra-state)"
    },
    SGSTAmount: { 
      type: Number, 
      default: 0,
      comment: "State GST (for intra-state)"
    },
    IGSTAmount: { 
      type: Number, 
      default: 0,
      comment: "Integrated GST (for inter-state)"
    },
    
    TotalGSTAmount: {
      type: Number,
      default: 0,
      comment: "Total GST amount"
    },
    
    Amount: { 
      type: Number,
      min: 0,
      default: 0,
      comment: "Total amount including GST (auto-calculated)"
    },
    
    AdvancePaid: { 
      type: Number, 
      default: 0,
      min: 0
    },
    BalanceDue: { 
      type: Number,
      default: 0
    },

    // ✅ GST Transaction Type - NEW
    GSTType: {
      type: String,
      enum: ["CGST+SGST", "IGST", "Non-GST"],
      default: "CGST+SGST"
    },
    
    IsIGST: {
      type: Boolean,
      default: false,
      comment: "True if inter-state transaction"
    },

    // Status Fields
    PaymentStatus: {
      type: String,
      enum: ["Pending", "Partially Paid", "Paid"],
      default: "Pending",
    },
    OrderStatus: {
      type: String,
      enum: ["Pending", "Confirmed", "In Progress", "Completed", "Cancelled"],
      default: "Pending",
    },

    // Invoice Tracking
    OrderNumber: {
      type: String,
      unique: true,
      sparse: true,
      comment: "Simple order reference number"
    },
    TaxInvoiceNumber: { 
      type: String, 
      unique: true, 
      sparse: true,
      comment: "Generated when payment is complete"
    },
    InvoiceGeneratedAt: { 
      type: Date 
    },

    // Payment History
    PaymentHistory: [{
      amount: { type: Number, required: true },
      date: { type: Date, default: Date.now },
      paymentMethod: { 
        type: String, 
        enum: ["Cash", "Bank Transfer", "UPI", "Card", "Cheque", "Other"],
        default: "Bank Transfer"
      },
      transactionId: { type: String },
      notes: { type: String },
      recordedBy: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "User" 
      }
    }],

    // Notes & Tracking
    Notes: { 
      type: String 
    },
    CreatedBy: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User" 
    },
  },
  { 
    timestamps: true 
  }
);

// ✅ PRE-SAVE HOOK: Calculate GST automatically
OrderSchema.pre('save', async function(next) {
  try {
    // Always recalculate if BaseAmount or GSTRate is modified, or if it's a new document
    if (this.isModified('BaseAmount') || this.isModified('GSTRate') || this.isModified('IsIGST') || this.isNew) {
      const baseAmount = this.BaseAmount || 0;
      const gstRate = this.GSTRate || 0;

      // Calculate GST amount
      const totalGST = (baseAmount * gstRate) / 100;

      if (this.IsIGST) {
        // Inter-state: IGST only
        this.IGSTAmount = totalGST;
        this.CGSTAmount = 0;
        this.SGSTAmount = 0;
        this.GSTType = "IGST";
      } else {
        // Intra-state: CGST + SGST (split equally)
        this.CGSTAmount = totalGST / 2;
        this.SGSTAmount = totalGST / 2;
        this.IGSTAmount = 0;
        this.GSTType = "CGST+SGST";
      }

      // Set total GST and final amount
      this.TotalGSTAmount = totalGST;
      this.Amount = baseAmount + totalGST;

      // Recalculate balance due
      this.BalanceDue = Math.max(0, this.Amount - (this.AdvancePaid || 0));
    }

    next();
  } catch (error) {
    next(error);
  }
});

// ✅ PRE-SAVE HOOK: Auto-detect IGST based on state
OrderSchema.pre('save', async function(next) {
  if (this.isModified('ClientState') || this.isModified('CompanyId')) {
    try {
      // Get company details to compare states
      const company = await mongoose.model('Company').findById(this.CompanyId);
      
      if (company && this.ClientState) {
        // If states are different, it's IGST
        this.IsIGST = (company.State !== this.ClientState);
      }
    } catch (error) {
      console.error('Error detecting IGST:', error);
    }
  }
  next();
});

// ✅ PRE-SAVE HOOK: Auto-calculate BalanceDue and PaymentStatus
OrderSchema.pre('save', function(next) {
  if (this.isModified('Amount') || this.isModified('AdvancePaid')) {
    this.BalanceDue = Math.round((this.Amount - (this.AdvancePaid || 0)) * 100) / 100;
    
    // Ensure BalanceDue is not negative
    if (this.BalanceDue < 0) this.BalanceDue = 0;
    
    // Auto-update payment status
    if (this.BalanceDue === 0 && this.AdvancePaid > 0) {
      this.PaymentStatus = "Paid";
    } else if (this.AdvancePaid > 0 && this.BalanceDue > 0) {
      this.PaymentStatus = "Partially Paid";
    } else {
      this.PaymentStatus = "Pending";
    }
  }
  next();
});

// ✅ PRE-SAVE HOOK: Generate Simple Order Number
OrderSchema.pre('save', async function(next) {
  if (this.isNew && !this.OrderNumber) {
    try {
      const year = new Date().getFullYear();
      const month = String(new Date().getMonth() + 1).padStart(2, '0');
      
      // Find the highest existing order number for this year-month
      const lastOrder = await mongoose.model('Order')
        .findOne({ 
          OrderNumber: new RegExp(`^ORD-${year}${month}-`) 
        })
        .sort({ OrderNumber: -1 })
        .select('OrderNumber');
      
      let nextNumber = 1;
      if (lastOrder && lastOrder.OrderNumber) {
        // Extract the number from ORD-202511-001 format
        const match = lastOrder.OrderNumber.match(/ORD-\d{6}-(\d{3})/);
        if (match) {
          nextNumber = parseInt(match[1]) + 1;
        }
      }
      
      this.OrderNumber = `ORD-${year}${month}-${String(nextNumber).padStart(3, '0')}`;
    } catch (error) {
      console.error('Error generating order number:', error);
      // Fallback to timestamp-based unique number
      this.OrderNumber = `ORD-${Date.now()}`;
    }
  }
  next();
});

// ✅ Indexes for better performance
OrderSchema.index({ CompanyId: 1, OrderStatus: 1 });
OrderSchema.index({ PaymentStatus: 1 });
OrderSchema.index({ createdAt: -1 });
OrderSchema.index({ OrderNumber: 1 });
OrderSchema.index({ TaxInvoiceNumber: 1 });
OrderSchema.index({ ClientGSTIN: 1 });

// ✅ Virtual for payment completion percentage
OrderSchema.virtual('paymentPercentage').get(function() {
  if (!this.Amount || this.Amount === 0) return 0;
  return Math.round((this.AdvancePaid / this.Amount) * 100);
});

// ✅ Virtual for checking if order can be billed
OrderSchema.virtual('canGenerateBill').get(function() {
  return this.PaymentStatus === "Paid" && !this.TaxInvoiceNumber;
});

// ✅ Method to get GST breakdown
OrderSchema.methods.getGSTBreakdown = function() {
  return {
    baseAmount: Math.round(this.BaseAmount * 100) / 100,
    gstRate: this.GSTRate,
    gstType: this.GSTType,
    cgst: Math.round(this.CGSTAmount * 100) / 100,
    sgst: Math.round(this.SGSTAmount * 100) / 100,
    igst: Math.round(this.IGSTAmount * 100) / 100,
    totalGST: Math.round(this.TotalGSTAmount * 100) / 100,
    totalAmount: Math.round(this.Amount * 100) / 100,
    isInterState: this.IsIGST
  };
};

// ✅ Static method for rounding amounts
OrderSchema.statics.roundAmount = function(amount) {
  return Math.round(amount * 100) / 100;
};

export const Order = mongoose.model("Order", OrderSchema);