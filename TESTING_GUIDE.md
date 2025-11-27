# Monthly Analytics - Quick Test Examples

## Testing the APIs

### Using cURL

#### 1. Get Monthly Revenue Summary for 2024

```bash
curl -X GET "http://localhost:3000/api/revenue/monthly?year=2024" \
  -H "Content-Type: application/json"
```

#### 2. Get Revenue for January 2024

```bash
curl -X GET "http://localhost:3000/api/revenue/monthly-details?month=1&year=2024" \
  -H "Content-Type: application/json"
```

#### 3. Get Monthly Orders Summary

```bash
curl -X GET "http://localhost:3000/api/orders/monthly?year=2024" \
  -H "Content-Type: application/json"
```

#### 4. Get Orders for Specific Month

```bash
curl -X GET "http://localhost:3000/api/orders/monthly-details?month=1&year=2024" \
  -H "Content-Type: application/json"
```

#### 5. Get Monthly Expenses

```bash
curl -X GET "http://localhost:3000/api/expenses/monthly?year=2024" \
  -H "Content-Type: application/json"
```

#### 6. Get Specific Month Expenses

```bash
curl -X GET "http://localhost:3000/api/expenses/monthly-details?month=1&year=2024" \
  -H "Content-Type: application/json"
```

#### 7. Get Monthly Purchases (With Profit Analysis)

```bash
curl -X GET "http://localhost:3000/api/purchases/monthly?year=2024" \
  -H "Content-Type: application/json"
```

#### 8. Get Specific Month Purchases with Details

```bash
curl -X GET "http://localhost:3000/api/purchases/monthly-details?month=1&year=2024" \
  -H "Content-Type: application/json"
```

#### 9. Get Purchase Statistics

```bash
curl -X GET "http://localhost:3000/api/purchases/stats" \
  -H "Content-Type: application/json"
```

---

### Using Postman

1. **Create a new collection:** "Monthly Analytics"

2. **Add requests:**

#### GET Monthly Revenue

- **Method:** GET
- **URL:** `{{baseURL}}/api/revenue/monthly`
- **Params:**
  - `year`: 2024
  - `CompanyId`: (optional - your company ID)

#### GET Month Revenue Details

- **Method:** GET
- **URL:** `{{baseURL}}/api/revenue/monthly-details`
- **Params:**
  - `month`: 1
  - `year`: 2024
  - `CompanyId`: (optional)

#### GET Monthly Orders

- **Method:** GET
- **URL:** `{{baseURL}}/api/orders/monthly`
- **Params:**
  - `year`: 2024
  - `CompanyId`: (optional)

#### GET Month Orders Details

- **Method:** GET
- **URL:** `{{baseURL}}/api/orders/monthly-details`
- **Params:**
  - `month`: 1
  - `year`: 2024
  - `CompanyId`: (optional)

#### GET Monthly Expenses

- **Method:** GET
- **URL:** `{{baseURL}}/api/expenses/monthly`
- **Params:**
  - `year`: 2024
  - `CompanyId`: (optional)

#### GET Month Expenses Details

- **Method:** GET
- **URL:** `{{baseURL}}/api/expenses/monthly-details`
- **Params:**
  - `month`: 1
  - `year`: 2024
  - `CompanyId`: (optional)

#### GET Monthly Purchases (Profit Analysis)

- **Method:** GET
- **URL:** `{{baseURL}}/api/purchases/monthly`
- **Params:**
  - `year`: 2024
  - `CompanyId`: (optional)

#### GET Month Purchases Details

- **Method:** GET
- **URL:** `{{baseURL}}/api/purchases/monthly-details`
- **Params:**
  - `month`: 1
  - `year`: 2024
  - `CompanyId`: (optional)

#### GET Purchase Stats

- **Method:** GET
- **URL:** `{{baseURL}}/api/purchases/stats`
- **Params:**
  - `CompanyId`: (optional)

---

### Using JavaScript/Node.js

```javascript
// Using fetch API

// Get Monthly Revenue
const getMonthlyRevenue = async (year = 2024, companyId = null) => {
  let url = `http://localhost:3000/api/revenue/monthly?year=${year}`;
  if (companyId) url += `&CompanyId=${companyId}`;

  const response = await fetch(url);
  const data = await response.json();
  console.log("Monthly Revenue:", data);
  return data;
};

// Get Month Revenue Details
const getMonthRevenue = async (month, year, companyId = null) => {
  let url = `http://localhost:3000/api/revenue/monthly-details?month=${month}&year=${year}`;
  if (companyId) url += `&CompanyId=${companyId}`;

  const response = await fetch(url);
  const data = await response.json();
  console.log("Month Revenue Details:", data);
  return data;
};

// Get Monthly Orders
const getMonthlyOrders = async (year = 2024, companyId = null) => {
  let url = `http://localhost:3000/api/orders/monthly?year=${year}`;
  if (companyId) url += `&CompanyId=${companyId}`;

  const response = await fetch(url);
  const data = await response.json();
  console.log("Monthly Orders:", data);
  return data;
};

// Get Monthly Expenses
const getMonthlyExpenses = async (year = 2024, companyId = null) => {
  let url = `http://localhost:3000/api/expenses/monthly?year=${year}`;
  if (companyId) url += `&CompanyId=${companyId}`;

  const response = await fetch(url);
  const data = await response.json();
  console.log("Monthly Expenses:", data);
  return data;
};

// Get Monthly Purchases with Profit Analysis
const getMonthlyPurchases = async (year = 2024, companyId = null) => {
  let url = `http://localhost:3000/api/purchases/monthly?year=${year}`;
  if (companyId) url += `&CompanyId=${companyId}`;

  const response = await fetch(url);
  const data = await response.json();
  console.log("Monthly Purchases:", data);
  return data;
};

// Get Month Purchases Details
const getMonthPurchases = async (month, year, companyId = null) => {
  let url = `http://localhost:3000/api/purchases/monthly-details?month=${month}&year=${year}`;
  if (companyId) url += `&CompanyId=${companyId}`;

  const response = await fetch(url);
  const data = await response.json();
  console.log("Month Purchases:", data);
  return data;
};

// Usage Example
(async () => {
  // Get all months for 2024
  await getMonthlyRevenue(2024);

  // Get January 2024 details
  await getMonthRevenue(1, 2024);

  // Get orders for the year
  await getMonthlyOrders(2024);

  // Get profit analysis for the year
  await getMonthlyPurchases(2024);
})();
```

---

### Using Axios

```javascript
import axios from "axios";

const API_BASE = "http://localhost:3000/api";

// Monthly Revenue
const monthlyRevenue = async (year = 2024, companyId = null) => {
  try {
    const response = await axios.get(`${API_BASE}/revenue/monthly`, {
      params: { year, CompanyId: companyId },
    });
    console.log(response.data);
    return response.data;
  } catch (error) {
    console.error("Error:", error);
  }
};

// Month Revenue Details
const monthRevenue = async (month, year, companyId = null) => {
  try {
    const response = await axios.get(`${API_BASE}/revenue/monthly-details`, {
      params: { month, year, CompanyId: companyId },
    });
    console.log(response.data);
    return response.data;
  } catch (error) {
    console.error("Error:", error);
  }
};

// Monthly Orders
const monthlyOrders = async (year = 2024, companyId = null) => {
  try {
    const response = await axios.get(`${API_BASE}/orders/monthly`, {
      params: { year, CompanyId: companyId },
    });
    console.log(response.data);
    return response.data;
  } catch (error) {
    console.error("Error:", error);
  }
};

// Monthly Expenses
const monthlyExpenses = async (year = 2024, companyId = null) => {
  try {
    const response = await axios.get(`${API_BASE}/expenses/monthly`, {
      params: { year, CompanyId: companyId },
    });
    console.log(response.data);
    return response.data;
  } catch (error) {
    console.error("Error:", error);
  }
};

// Monthly Purchases
const monthlyPurchases = async (year = 2024, companyId = null) => {
  try {
    const response = await axios.get(`${API_BASE}/purchases/monthly`, {
      params: { year, CompanyId: companyId },
    });
    console.log(response.data);
    return response.data;
  } catch (error) {
    console.error("Error:", error);
  }
};

// Purchase Stats
const purchaseStats = async (companyId = null) => {
  try {
    const response = await axios.get(`${API_BASE}/purchases/stats`, {
      params: { CompanyId: companyId },
    });
    console.log(response.data);
    return response.data;
  } catch (error) {
    console.error("Error:", error);
  }
};
```

---

## Response Examples

### Monthly Revenue Response

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
    },
    {
      "month": "February",
      "monthNumber": 2,
      "year": 2024,
      "totalRevenue": 60000,
      "count": 6,
      "averageRevenue": 10000
    }
  ],
  "grandTotal": 110000
}
```

### Monthly Purchases with Profit Response

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

---

## Troubleshooting

### No data returned?

1. Make sure data exists for the specified date range
2. Check if CompanyId is correct (if filtering)
3. Ensure dates in database are valid

### Wrong calculations?

1. Verify all orders are properly linked to expenses
2. Check that PaymentStatus = "Paid" for purchases
3. Ensure OrderStatus = "Confirmed" for purchases

### Date issues?

1. Make sure month is 1-12 (1-based)
2. Verify year format (2024, not '24')
3. Check server timezone settings

---

## Performance Notes

- Endpoints use MongoDB aggregation for efficiency
- Large datasets may take a few seconds
- Consider adding pagination for future enhancements
- Consider adding caching for frequently accessed data

---

## Next Steps

1. Test all endpoints with sample data
2. Integrate into your dashboard/frontend
3. Add data visualization (charts/graphs)
4. Set up email reports
5. Add export functionality (CSV/PDF)
