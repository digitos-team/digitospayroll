# Quick Fix Guide - Critical Issues

## Issue #1: Fix RecentActivitySchema Import Path (4 Files)

### ExportController.js - Line 18

**Current:**

```javascript
import { RecentActivity } from "../models/RecentActivitySchema.js";
```

**Change to:**

```javascript
import { RecentActivity } from "../models/ActivitiesSchema.js";
```

### SalaryCalculateController.js - Line 635

**Current:**

```javascript
import { RecentActivity } from "../models/RecentActivitySchema.js";
```

**Change to:**

```javascript
import { RecentActivity } from "../models/ActivitiesSchema.js";
```

### UserController.js - Line 3

**Current:**

```javascript
import { RecentActivity } from "../models/RecentActivitySchema.js";
```

**Change to:**

```javascript
import { RecentActivity } from "../models/ActivitiesSchema.js";
```

---

## Issue #2: Fix SalaryCalculateController.js (1504-line file)

**Status**: ALL FUNCTIONS ARE COMMENTED OUT
**Solution**: Entire file needs to be rewritten with active code

See: `/SALARY_CONTROLLER_FIX.md` for complete replacement code.

---

## Issue #3: Add Authentication Middleware to server.js

**Add this after line 27 (connectToDatabase()):**

```javascript
// ✅ Import authentication middleware
import { authMiddleware } from "./src/Middleware/authMiddleware.js";

// ✅ Apply auth middleware to API routes (after Server.use(bodyParser.json()))
// Only protect sensitive routes
Server.use("/api/salary", authMiddleware);
Server.use("/api/export", authMiddleware);
Server.use("/api/user", authMiddleware);
```

---

## Issue #4: Consolidate Duplicate Imports

### OrderController.js

- **Remove lines 1-4** (commented old imports)
- Keep lines 202-204 at the top after comments

### PurchaseController.js

- **Remove lines 1-3** (commented old imports)
- Keep lines 63-65 at the top

### ExpenseController.js

- **Remove lines 2-3** (commented old imports)
- Keep line 196 at top

---

## Files Needing Immediate Attention

```
PRIORITY 1 (Won't start):
  ☐ ExportController.js         - Fix RecentActivitySchema import (line 18)
  ☐ SalaryCalculateController.js - Fix RecentActivitySchema import (line 635) + uncomment code
  ☐ UserController.js            - Fix RecentActivitySchema import (line 3)

PRIORITY 2 (Broken APIs):
  ☐ SalaryCalculateController.js - Uncomment all functions (lines 1-625)
  ☐ GetRecentActivities.js       - ✅ ALREADY FIXED

PRIORITY 3 (Code Quality):
  ☐ OrderController.js           - Remove old commented imports
  ☐ PurchaseController.js        - Remove old commented imports
  ☐ ExpenseController.js         - Remove old commented imports
  ☐ server.js                    - Add authentication middleware
```

---

## Quick Test After Fixes

```bash
# 1. Test server starts without errors
npm run start

# 2. Test a simple endpoint (should work)
curl http://localhost:5000/

# 3. Test if imports work (should see no module errors)
node -e "import('./src/controller/ExportController.js')"
node -e "import('./src/controller/SalaryCalculateController.js')"
node -e "import('./src/controller/UserController.js')"
```
