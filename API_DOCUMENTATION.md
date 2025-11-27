# Monthly Analytics API Documentation

## Overview

Complete API endpoints for monthly revenue, orders, expenses, and purchases generation with detailed analytics.

---

## 📊 REVENUE ENDPOINTS

### 1. **Get Monthly Revenue Summary**

- **URL:** `/api/revenue/monthly`
- **Method:** `GET`
- **Query Parameters:**
  - `year` (optional): Year to filter (default: current year)
  - `CompanyId` (optional): Filter by company ID
- **Response:**

```json
{
  "year": 2024,
  "data": [
    {
      "month": "January",
      "monthNumber": 1,
      "year": 2024,
      "totalRevenue": 50000,
      "count": 5,
      "averageRevenue": 10000
    }
  ],
  "grandTotal": 600000
}
```

### 2. **Get Revenue for Specific Month**

- **URL:** `/api/revenue/monthly-details`
- **Method:** `GET`
- **Query Parameters:**
  - `month` (required): Month number (1-12)
  - `year` (required): Year
  - `CompanyId` (optional): Filter by company
- **Response:**

```json
{
  "month": "January 2024",
  "count": 5,
  "totalAmount": 50000,
  "revenues": [
    {
      "_id": "...",
      "Amount": 10000,
      "RevenueDate": "2024-01-15",
      "CompanyId": {...},
      "OrderId": {...}
    }
  ]
}
```

---

## 📦 ORDERS ENDPOINTS

### 1. **Get Monthly Orders Summary**

- **URL:** `/api/orders/monthly`
- **Method:** `GET`
- **Query Parameters:**
  - `year` (optional): Year to filter
  - `CompanyId` (optional): Filter by company
- **Response:**

```json
{
  "year": 2024,
  "data": [
    {
      "month": "January",
      "monthNumber": 1,
      "year": 2024,
      "totalOrders": 5,
      "totalOrderValue": 100000,
      "completedOrders": 3,
      "paidOrders": 2,
      "averageOrderValue": 20000
    }
  ],
  "summary": {
    "grandTotal": 600000,
    "totalOrdersInYear": 50,
    "totalCompletedOrders": 35,
    "totalPaidOrders": 20
  }
}
```

### 2. **Get Orders for Specific Month**

- **URL:** `/api/orders/monthly-details`
- **Method:** `GET`
- **Query Parameters:**
  - `month` (required): Month number (1-12)
  - `year` (required): Year
  - `CompanyId` (optional): Filter by company
- **Response:**

```json
{
  "month": "January 2024",
  "count": 5,
  "totalValue": 100000,
  "orders": [
    {
      "_id": "...",
      "ClientName": "Client A",
      "ServiceTitle": "Web Development",
      "Amount": 20000,
      "OrderStatus": "Completed",
      "PaymentStatus": "Paid",
      "createdAt": "2024-01-10"
    }
  ]
}
```

### 3. **Get Single Order by ID**

- **URL:** `/api/orders/getorder/:id`
- **Method:** `GET`
- **Response:**

```json
{
  "order": {...},
  "expenses": [...],
  "summary": {
    "totalExpenses": 5000,
    "estimatedProfit": 15000
  }
}
```

---

## 💰 EXPENSES ENDPOINTS

### 1. **Get Monthly Expenses Summary**

- **URL:** `/api/expenses/monthly`
- **Method:** `GET`
- **Query Parameters:**
  - `year` (optional): Year to filter
  - `CompanyId` (optional): Filter by company
- **Response:**

```json
{
  "year": 2024,
  "data": [
    {
      "month": "January",
      "monthNumber": 1,
      "year": 2024,
      "totalExpense": 25000,
      "count": 10,
      "averageExpense": 2500
    }
  ],
  "grandTotal": 300000
}
```

### 2. **Get Expenses for Specific Month**

- **URL:** `/api/expenses/monthly-details`
- **Method:** `GET`
- **Query Parameters:**
  - `month` (required): Month number (1-12)
  - `year` (required): Year
  - `CompanyId` (optional): Filter by company
- **Response:**

```json
{
  "month": "January 2024",
  "count": 10,
  "totalAmount": 25000,
  "expenses": [
    {
      "_id": "...",
      "ExpenseTitle": "Office Rent",
      "Amount": 5000,
      "ExpenseDate": "2024-01-01",
      "ExpenseType": "Rent",
      "PaymentMethod": "Bank Transfer"
    }
  ]
}
```

### 3. **Get Expenses by Order**

- **URL:** `/api/expenses/getexpensesbyorder`
- **Method:** `POST`
- **Body:**

```json
{
  "orderId": "..."
}
```

---

## 🛒 PURCHASES ENDPOINTS

### 1. **Get Monthly Purchases Summary (with Profit Analysis)**

- **URL:** `/api/purchases/monthly`
- **Method:** `GET`
- **Query Parameters:**
  - `year` (optional): Year to filter
  - `CompanyId` (optional): Filter by company
- **Response:**

```json
{
  "year": 2024,
  "data": [
    {
      "month": "January",
      "monthNumber": 1,
      "year": 2024,
      "totalPurchases": 5,
      "totalRevenue": 100000,
      "totalExpenses": 25000,
      "profit": 75000,
      "profitMargin": "75.00",
      "averageOrderValue": 20000
    }
  ],
  "summary": {
    "grandTotalRevenue": 600000,
    "grandTotalExpenses": 150000,
    "grandTotalProfit": 450000,
    "totalPurchasesInYear": 30,
    "overallProfitMargin": "75.00"
  }
}
```

### 2. **Get Purchases for Specific Month**

- **URL:** `/api/purchases/monthly-details`
- **Method:** `GET`
- **Query Parameters:**
  - `month` (required): Month number (1-12)
  - `year` (required): Year
  - `CompanyId` (optional): Filter by company
- **Response:**

```json
{
  "month": "January 2024",
  "count": 5,
  "totalRevenue": 100000,
  "totalExpenses": 25000,
  "totalProfit": 75000,
  "profitMargin": "75.00",
  "purchases": [
    {
      "_id": "...",
      "ClientName": "Client A",
      "ServiceTitle": "Web Development",
      "OrderAmount": 20000,
      "TotalExpense": 5000,
      "Profit": 15000,
      "PaidDate": "2024-01-15"
    }
  ]
}
```

### 3. **Get Purchase Statistics**

- **URL:** `/api/purchases/stats`
- **Method:** `GET`
- **Query Parameters:**
  - `CompanyId` (optional): Filter by company
- **Response:**

```json
{
  "totalPurchases": 30,
  "totalRevenue": 600000,
  "totalExpenses": 150000,
  "totalProfit": 450000,
  "averageOrderValue": 20000,
  "averageProfitPerOrder": 15000
}
```

### 4. **Get All Purchases (Paid Orders + Expenses)**

- **URL:** `/api/purchases/getpurchases`
- **Method:** `POST`
- **Query Parameters:**
  - `CompanyId` (optional): Filter by company
- **Response:** Array of purchases with related expenses

### 5. **Get Single Purchase by Order ID**

- **URL:** `/api/purchases/getpurchasebyorderid`
- **Method:** `POST`
- **Body:**

```json
{
  "orderId": "..."
}
```

---

## 🔧 IMPLEMENTATION NOTES

### Query Pattern

All monthly endpoints follow this pattern:

```
GET /api/{resource}/monthly?year=2024&CompanyId=xyz
GET /api/{resource}/monthly-details?month=1&year=2024&CompanyId=xyz
```

### Date Handling

- All dates are stored in MongoDB as ISO 8601 format
- Year defaults to current year if not provided
- Month is 1-based (1 = January, 12 = December)

### Calculations

- **Profit Margin:** `(profit / revenue) * 100`
- **Average Values:** Total divided by count
- **Grand Total:** Sum of all monthly values

### Filters Available

- `CompanyId`: Filter by specific company
- `year`: Filter by specific year
- `month`: Get specific month data
- `ExpenseType`: Filter expenses by type
- `PaymentStatus`: Filter orders by payment status

---

## 📈 Example Usage

### Get January 2024 Revenue

```
GET /api/revenue/monthly-details?month=1&year=2024&CompanyId=613f5a8c9d84b00012345678
```

### Get All Months Revenue for 2024

```
GET /api/revenue/monthly?year=2024&CompanyId=613f5a8c9d84b00012345678
```

### Get Monthly Profit Analysis

```
GET /api/purchases/monthly?year=2024&CompanyId=613f5a8c9d84b00012345678
```

### Get Specific Month Purchases Details

```
GET /api/purchases/monthly-details?month=1&year=2024&CompanyId=613f5a8c9d84b00012345678
```

---

## ✅ Controller Functions Added

### RevenueController

- `getMonthlyRevenue()` - Get annual summary
- `getMonthRevenue()` - Get specific month details

### OrderController

- `getMonthlyOrders()` - Get annual summary
- `getMonthOrders()` - Get specific month details

### ExpenseController

- `getMonthlyExpenses()` - Get annual summary
- `getMonthExpenses()` - Get specific month details

### PurchaseController

- `getMonthlyPurchases()` - Get annual summary with profit
- `getMonthPurchases()` - Get specific month details

---

## 🚀 Route Files Updated

- ✅ `src/routes/RevenueRoutes.js`
- ✅ `src/routes/OrderRoutes.js`
- ✅ `src/routes/ExpenseRoutes.js`
- ✅ `src/routes/PurchaseRoutes.js`

All endpoints are ready to use!
