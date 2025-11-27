# PDF Export - Complete Integration Example

## 🎯 Full Working Example for React Dashboard

### Component: MonthlyReportDashboard.jsx

```jsx
import React, { useState, useEffect } from "react";
import "./MonthlyReportDashboard.css";

export const MonthlyReportDashboard = () => {
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [companyId, setCompanyId] = useState("");
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState({});
  const [error, setError] = useState(null);

  useEffect(() => {
    // Fetch companies on mount
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      // Replace with your API endpoint
      const response = await fetch("/api/companies");
      const data = await response.json();
      setCompanies(data);
    } catch (err) {
      console.error("Error fetching companies:", err);
    }
  };

  const generatePDF = async (reportType) => {
    if (!month || !year) {
      setError("Please select month and year");
      return;
    }

    setLoading({ ...loading, [reportType]: true });
    setError(null);

    try {
      let url = `/api/export/${reportType}/pdf?month=${month}&year=${year}`;
      if (companyId) url += `&CompanyId=${companyId}`;

      const response = await fetch(url);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to generate PDF");
      }

      // Trigger download
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;

      const monthName = new Date(year, month - 1).toLocaleString("en-US", {
        month: "long",
      });
      a.download = `${reportType}_${monthName}_${year}.pdf`;

      document.body.appendChild(a);
      a.click();

      window.URL.revokeObjectURL(downloadUrl);
      document.body.removeChild(a);

      // Optional: Show success message
      console.log(`✅ ${reportType} PDF exported successfully`);
    } catch (err) {
      console.error(`Error exporting ${reportType}:`, err);
      setError(`Failed to export ${reportType}: ${err.message}`);
    } finally {
      setLoading({ ...loading, [reportType]: false });
    }
  };

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

  return (
    <div className="report-dashboard">
      <div className="dashboard-header">
        <h1>📊 Monthly Reports Export</h1>
        <p>Generate and export professional monthly reports</p>
      </div>

      {error && <div className="error-message">⚠️ {error}</div>}

      <div className="controls-section">
        <div className="control-group">
          <label htmlFor="month">Month:</label>
          <select
            id="month"
            value={month}
            onChange={(e) => setMonth(parseInt(e.target.value))}
            className="form-control"
          >
            {months.map((m, i) => (
              <option key={i} value={i + 1}>
                {m}
              </option>
            ))}
          </select>
        </div>

        <div className="control-group">
          <label htmlFor="year">Year:</label>
          <input
            id="year"
            type="number"
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value))}
            min="2020"
            max="2030"
            className="form-control"
          />
        </div>

        <div className="control-group">
          <label htmlFor="company">Company (Optional):</label>
          <select
            id="company"
            value={companyId}
            onChange={(e) => setCompanyId(e.target.value)}
            className="form-control"
          >
            <option value="">All Companies</option>
            {companies.map((company) => (
              <option key={company._id} value={company._id}>
                {company.CompanyName}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="reports-grid">
        {/* Revenue Report */}
        <div className="report-card revenue-card">
          <div className="card-icon">📊</div>
          <div className="card-title">Revenue Report</div>
          <div className="card-description">
            Track all monthly revenue transactions
          </div>
          <button
            onClick={() => generatePDF("revenue")}
            disabled={loading.revenue}
            className="btn btn-primary"
          >
            {loading.revenue ? (
              <>⏳ Generating...</>
            ) : (
              <>📥 Export Revenue PDF</>
            )}
          </button>
          {loading.revenue && <div className="progress-bar"></div>}
        </div>

        {/* Expenses Report */}
        <div className="report-card expenses-card">
          <div className="card-icon">💰</div>
          <div className="card-title">Expenses Report</div>
          <div className="card-description">
            Detailed breakdown of all expenses
          </div>
          <button
            onClick={() => generatePDF("expenses")}
            disabled={loading.expenses}
            className="btn btn-primary"
          >
            {loading.expenses ? (
              <>⏳ Generating...</>
            ) : (
              <>📥 Export Expenses PDF</>
            )}
          </button>
          {loading.expenses && <div className="progress-bar"></div>}
        </div>

        {/* Orders Report */}
        <div className="report-card orders-card">
          <div className="card-icon">📦</div>
          <div className="card-title">Orders Report</div>
          <div className="card-description">
            Complete list of monthly orders
          </div>
          <button
            onClick={() => generatePDF("orders")}
            disabled={loading.orders}
            className="btn btn-primary"
          >
            {loading.orders ? <>⏳ Generating...</> : <>📥 Export Orders PDF</>}
          </button>
          {loading.orders && <div className="progress-bar"></div>}
        </div>

        {/* Purchases Report (Profit Analysis) */}
        <div className="report-card purchases-card">
          <div className="card-icon">💹</div>
          <div className="card-title">Profit Analysis</div>
          <div className="card-description">
            Profit & margin analysis for paid orders
          </div>
          <button
            onClick={() => generatePDF("purchases")}
            disabled={loading.purchases}
            className="btn btn-success"
          >
            {loading.purchases ? (
              <>⏳ Generating...</>
            ) : (
              <>📥 Export Profit Analysis</>
            )}
          </button>
          {loading.purchases && <div className="progress-bar"></div>}
        </div>
      </div>

      {/* Comprehensive Report - Full Width */}
      <div className="comprehensive-section">
        <div className="report-card comprehensive-card">
          <div className="card-icon">📋</div>
          <div className="card-title">Comprehensive Monthly Report</div>
          <div className="card-description">
            All-in-one professional report with revenue, expenses, orders, and
            profit analysis
          </div>
          <button
            onClick={() => generatePDF("comprehensive")}
            disabled={loading.comprehensive}
            className="btn btn-primary btn-large"
          >
            {loading.comprehensive ? (
              <>⏳ Generating Comprehensive Report...</>
            ) : (
              <>📥 Export Comprehensive Report (Multi-Page PDF)</>
            )}
          </button>
          {loading.comprehensive && <div className="progress-bar"></div>}
        </div>
      </div>

      <div className="info-section">
        <h3>💡 Report Information</h3>
        <ul>
          <li>
            <strong>Revenue Report:</strong> All revenue transactions for the
            selected month
          </li>
          <li>
            <strong>Expenses Report:</strong> Complete expense breakdown and
            audit trail
          </li>
          <li>
            <strong>Orders Report:</strong> All orders created in the selected
            month
          </li>
          <li>
            <strong>Profit Analysis:</strong> Revenue vs Expenses and profit
            margins
          </li>
          <li>
            <strong>Comprehensive:</strong> All above reports in one
            professional multi-page PDF
          </li>
        </ul>
      </div>
    </div>
  );
};
```

---

## 🎨 Styling: MonthlyReportDashboard.css

```css
.report-dashboard {
  max-width: 1200px;
  margin: 0 auto;
  padding: 30px 20px;
  font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
}

.dashboard-header {
  text-align: center;
  color: white;
  margin-bottom: 40px;
}

.dashboard-header h1 {
  font-size: 2.5em;
  margin: 0 0 10px 0;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);
}

.dashboard-header p {
  font-size: 1.1em;
  margin: 0;
  opacity: 0.9;
}

.error-message {
  background: #ff6b6b;
  color: white;
  padding: 15px 20px;
  border-radius: 8px;
  margin-bottom: 20px;
  font-weight: 500;
}

.controls-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 40px;
  background: white;
  padding: 30px;
  border-radius: 10px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.control-group {
  display: flex;
  flex-direction: column;
}

.control-group label {
  font-weight: 600;
  margin-bottom: 8px;
  color: #333;
}

.form-control {
  padding: 12px 15px;
  border: 2px solid #e0e0e0;
  border-radius: 6px;
  font-size: 1em;
  transition: border-color 0.3s;
}

.form-control:focus {
  outline: none;
  border-color: #667eea;
}

.reports-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 25px;
  margin-bottom: 40px;
}

.report-card {
  background: white;
  border-radius: 12px;
  padding: 30px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  transition: transform 0.3s, box-shadow 0.3s;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.report-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.2);
}

.card-icon {
  font-size: 3em;
  margin-bottom: 15px;
}

.card-title {
  font-size: 1.4em;
  font-weight: 700;
  color: #333;
  margin-bottom: 10px;
}

.card-description {
  color: #666;
  font-size: 0.95em;
  margin-bottom: 20px;
  flex-grow: 1;
}

.btn {
  padding: 12px 24px;
  border: none;
  border-radius: 6px;
  font-size: 1em;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  width: 100%;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  transform: scale(1.02);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.btn-success {
  background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
  color: white;
}

.btn-success:hover:not(:disabled) {
  transform: scale(1.02);
  box-shadow: 0 4px 12px rgba(17, 153, 142, 0.4);
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-large {
  padding: 15px 30px;
  font-size: 1.1em;
}

.progress-bar {
  width: 100%;
  height: 3px;
  background: #e0e0e0;
  border-radius: 2px;
  margin-top: 10px;
  overflow: hidden;
}

.progress-bar::after {
  content: "";
  display: block;
  height: 100%;
  background: linear-gradient(90deg, #667eea, #764ba2);
  animation: progress 1.5s ease-in-out infinite;
}

@keyframes progress {
  0% {
    width: 0%;
  }
  50% {
    width: 100%;
  }
  100% {
    width: 0%;
  }
}

.comprehensive-section {
  margin-bottom: 40px;
}

.comprehensive-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 40px;
  text-align: center;
}

.comprehensive-card .card-title {
  color: white;
  font-size: 1.8em;
}

.comprehensive-card .card-description {
  color: rgba(255, 255, 255, 0.9);
  font-size: 1.05em;
}

.comprehensive-card .btn-primary {
  background: white;
  color: #667eea;
}

.comprehensive-card .btn-primary:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.95);
}

.info-section {
  background: white;
  padding: 30px;
  border-radius: 12px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.info-section h3 {
  color: #333;
  margin-top: 0;
}

.info-section ul {
  list-style: none;
  padding: 0;
}

.info-section li {
  padding: 12px 0;
  color: #666;
  border-bottom: 1px solid #f0f0f0;
}

.info-section li:last-child {
  border-bottom: none;
}

.info-section strong {
  color: #333;
}

/* Responsive Design */
@media (max-width: 768px) {
  .report-dashboard {
    padding: 20px 10px;
  }

  .dashboard-header h1 {
    font-size: 1.8em;
  }

  .reports-grid {
    grid-template-columns: 1fr;
  }

  .controls-section {
    grid-template-columns: 1fr;
  }
}
```

---

## 🔧 Integration Steps

### Step 1: Add Component to Your App

```jsx
import { MonthlyReportDashboard } from "./components/MonthlyReportDashboard";

function App() {
  return (
    <div className="app">
      <MonthlyReportDashboard />
    </div>
  );
}
```

### Step 2: Make Sure Server is Running

```bash
npm start
# Server runs on http://localhost:5000
```

### Step 3: Test Export

- Select month and year
- Click any export button
- PDF should download automatically

---

## 📱 Alternative: Simpler Version

If you don't need the full component:

```jsx
// Simple functional component
export const SimpleExporter = () => {
  const [month, setMonth] = useState(1);
  const [year, setYear] = useState(2024);

  const handleExport = (type) => {
    window.open(
      `/api/export/${type}/pdf?month=${month}&year=${year}`,
      "_blank"
    );
  };

  return (
    <div>
      <select value={month} onChange={(e) => setMonth(e.target.value)}>
        {[...Array(12)].map((_, i) => (
          <option key={i} value={i + 1}>
            {i + 1}
          </option>
        ))}
      </select>
      <input
        type="number"
        value={year}
        onChange={(e) => setYear(e.target.value)}
      />

      <button onClick={() => handleExport("revenue")}>Export Revenue</button>
      <button onClick={() => handleExport("expenses")}>Export Expenses</button>
      <button onClick={() => handleExport("orders")}>Export Orders</button>
      <button onClick={() => handleExport("purchases")}>
        Export Purchases
      </button>
      <button onClick={() => handleExport("comprehensive")}>Export All</button>
    </div>
  );
};
```

---

## 🎯 Advanced: With Error Handling and Notifications

```jsx
import { useState } from 'react';
import { toast } from 'react-toastify'; // or your notification library

export const AdvancedExporter = () => {
  const [loading, setLoading] = useState({});
  const [month, setMonth] = useState(1);
  const [year, setYear] = useState(2024);

  const handleExport = async (type) => {
    setLoading(prev => ({ ...prev, [type]: true }));

    try {
      const url = `/api/export/${type}/pdf?month=${month}&year=${year}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }

      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `${type}_${month}_${year}.pdf`;
      a.click();
      URL.revokeObjectURL(downloadUrl);

      toast.success(`✅ ${type} PDF exported successfully!`);
    } catch (error) {
      toast.error(`❌ Failed to export ${type}: ${error.message}`);
    } finally {
      setLoading(prev => ({ ...prev, [type]: false }));
    }
  };

  return (
    // Your JSX here
  );
};
```

---

## 🚀 Ready to Use!

1. Copy the React component
2. Copy the CSS file
3. Import into your app
4. Make sure backend is running
5. Start exporting PDFs!

All endpoints are fully functional and ready for production use.

---

**Happy Exporting! 📄✨**
