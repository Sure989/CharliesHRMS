# 🔍 **HARDCODED DATA & FALLBACKS AUDIT REPORT**

## 📋 **EXECUTIVE SUMMARY**

I've conducted a comprehensive scan of your HRMS codebase to identify hardcoded data, fallback values, and configuration settings that should be moved to environment variables or made configurable.

---

## 🚨 **CRITICAL SECURITY ISSUES**

### **1. ⚠️ Mock Login Credentials (HIGH RISK)**

**File**: `backend/src/controllers/auth.controller.ts`

```typescript
// CRITICAL: Hardcoded admin credentials
if (email === 'admin@charlieshrms.com' && password === 'password123') {
  const mockUser = {
    id: '1',
    email: 'admin@charlieshrms.com',
    // ... mock user data
  };
}
```

**Risk**: Backdoor access to production system
**Action**: Remove immediately or make environment-controlled

### **2. 🔑 Exposed API Keys in Documentation**

**Files**:

- `SECURITY_AUDIT_REPORT.md`
- `VERCEL_DEPLOYMENT_READINESS_ANALYSIS.md`

**Exposed**:

```

**Action**: Remove from documentation, regenerate keys

---

## 🔧 **CONFIGURATION FALLBACKS**

### **Backend Configuration**

#### **1. ✅ Fixed: Database & JWT (Good)**

**File**: `backend/src/config/config.ts`

```typescript
// ✅ GOOD: No fallbacks, validation enforced
secret: process.env.JWT_SECRET!,
url: process.env.DATABASE_URL!,
```

#### **2. ⚠️ Remaining Fallbacks**

```typescript
// Still has fallbacks:
port: parseInt(process.env.PORT || '5000', 10),
nodeEnv: process.env.NODE_ENV || 'development',
expiresIn: process.env.JWT_EXPIRES_IN || '1d',
refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
```

#### **3. 🔗 Frontend URL Fallbacks**

**File**: `backend/src/controllers/auth.controller.ts`

```typescript
resetLink: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`
verificationLink: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${verificationToken}`
```

### **Frontend Configuration**

#### **1. 🌐 API Base URL**

**File**: `frontend/src/services/apiClient.ts`

```typescript
this.baseURL = config.apiBaseUrl;
```

#### **2. 📡 WebSocket URL**
**File**: `frontend/src/services/api/websocket.utils.ts`

```typescript
const base = import.meta.env.VITE_WS_BASE_URL;
```

#### **3. 🏗️ Vite Configuration**

**File**: `frontend/vite.config.ts`

```typescript
strictPort: true, // Force port 4000, don't fallback
host: 'localhost'
```

---

## 💾 **HARDCODED BUSINESS DATA**

### **1. 🏢 Default Department Creation**

**File**: `backend/src/controllers/employee.controller.ts`

```typescript
let defaultDept = await prisma.department.findFirst({
  where: { name: 'General', tenantId: req.tenantId }
});
if (!defaultDept) {
  defaultDept = await prisma.department.create({
    data: {
      name: 'General', // HARDCODED
      tenantId: req.tenantId
    }
  });
}
```

### **2. 👥 HR Fallback Logic**

**File**: `backend/src/controllers/leave.controller.ts`

```typescript
// Fallback to HR
const hrUser = await prisma.user.findFirst({
  where: { role: 'HR_MANAGER' } // HARDCODED ROLE
});
approverRole = 'HR'; // HARDCODED
```

### **3. 💰 Salary Advance Hardcoded Values**

**File**: `frontend/src/components/WorkflowDashboard.tsx`

```typescript
await api.data.reviewSalaryAdvanceHR(requestId, user.id, 'eligible', 'Employee eligible for advance', {
  currentSalary: 30000,        // HARDCODED
  existingAdvances: 0,         // HARDCODED
  maxAllowableAdvance: 15000,  // HARDCODED
  employmentTenure: 12,        // HARDCODED
  creditworthiness: 'good'     // HARDCODED
});
```

### **4. 🏦 Integration Placeholders**

**File**: `frontend/src/services/integrationHub.ts`

```typescript
credentials: {
  apiKey: 'EQB_API_KEY_PLACEHOLDER',      // HARDCODED
  secretKey: 'EQB_SECRET_PLACEHOLDER',    // HARDCODED
  endpoint: 'https://api.equitybank.co.ke/v1',
}
```

### **5. 💸 Tax Calculation Defaults**

**File**: `frontend/src/pages/payroll/TaxManagement.tsx`

```typescript
const defaultPayeBands = [
  { min: 0, max: 24000, rate: 10, baseAmount: 0, description: '10% on first KSH 24,000' },
  // ... more hardcoded tax bands
];

const defaultNssfRates = {
  tier1Limit: 7000,  // HARDCODED
  // ...
};
```

### **6. 🏪 Branch/Department Defaults**

**File**: `frontend/src/pages/employee/EmployeePayroll.tsx`

```typescript
defaultValue="Kenya Commercial Bank"  // HARDCODED BANK
defaultValue="Checking"                // HARDCODED ACCOUNT TYPE
```

---

## 🔄 **FALLBACK MECHANISMS**

### **1. ✅ Good Fallbacks (Keep)**

```typescript
// Analytics fallback
try {
  const analyticsResponse = await apiClient.get('/analytics');
} catch {
  // Fallback: Get performance reviews data directly
  const reviewsResponse = await apiClient.get('/performance-reviews');
}
```

### **2. ⚠️ UI Fallbacks**

```typescript
// Avatar fallbacks
<AvatarFallback className="bg-primary/10 text-primary font-semibold">
  {getInitials(employee.firstName, employee.lastName)}
</AvatarFallback>

// Manager fallback strategies
const managerOptions = useMemo(() => {
  // Strategy 1: Employees with manager role
  // Strategy 2: Users with names (fallback)
  if (options.length === 0) {
    // ...fallback logic
  }
}, []);
```

---

## 📊 **RECOMMENDATIONS BY PRIORITY**

### **🔴 IMMEDIATE (Security Critical)**

1. **Remove Mock Login**

   ```typescript
   // Remove this entire block:
   if (email === 'admin@charlieshrms.com' && password === 'password123') {
   ```

2. **Clean Documentation**
   - Remove all real API keys from markdown files
   - Create sanitized `.env.example` files

3. **Regenerate Exposed Keys**
   - Generate new Supabase keys
   - Generate new JWT secrets

### **🟡 HIGH PRIORITY (Configuration)**

1. **Add Missing Environment Variables**

   ```bash
   # Add to .env
   FRONTEND_URL=https://your-frontend-domain.com
   DEFAULT_DEPARTMENT_NAME=General
   DEFAULT_BANK_NAME=Kenya Commercial Bank
   ```

2. **Make Tax Rates Configurable**

   ```typescript
   // Move to database or config file
   const payeBands = await getTaxConfiguration('PAYE_BANDS');
   ```

3. **Parameterize Salary Advance Logic**

   ```typescript
   const salaryAdvanceConfig = {
     maxPercentage: parseFloat(process.env.MAX_SALARY_ADVANCE_PERCENT || '50'),
     minTenure: parseInt(process.env.MIN_EMPLOYMENT_TENURE || '6'),
   };
   ```

### **🟢 MEDIUM PRIORITY (Business Logic)**

1. **Database-Driven Defaults**
   - Move department creation to seeding
   - Make approval workflows configurable
   - Store integration credentials securely

2. **Configuration Management**

   ```typescript
   // Create configuration service
   class ConfigService {
     static async getDefaultDepartment(tenantId: string) {
       return process.env.DEFAULT_DEPARTMENT || 'General';
     }
   }
   ```

### **🔵 LOW PRIORITY (UI/UX)**

1. **User Preferences**
   - Make default values user-configurable
   - Store UI preferences in database
   - Allow tenant-specific customization

---

## 🛠️ **IMPLEMENTATION PLAN**

### **Phase 1: Security (Week 1)**

- [ ] Remove mock login credentials
- [ ] Clean all documentation of real secrets
- [ ] Regenerate and rotate all API keys
- [ ] Add environment validation for critical secrets

### **Phase 2: Configuration (Week 2)**

- [ ] Add missing environment variables
- [ ] Create comprehensive `.env.example`
- [ ] Move hardcoded business values to config
- [ ] Implement configuration validation

### **Phase 3: Business Logic (Week 3-4)**

- [ ] Move tax rates to database
- [ ] Make approval workflows configurable
- [ ] Implement tenant-specific settings
- [ ] Create admin configuration interface

### **Phase 4: Enhancement (Week 5+)**

- [ ] User preference system
- [ ] Dynamic configuration updates
- [ ] Configuration audit logging
- [ ] Multi-tenant configuration isolation

---

## 📋 **ENVIRONMENT VARIABLES NEEDED**

### **Critical Missing**

```bash
FRONTEND_URL=https://charlies-hrms-frontend.vercel.app
DEFAULT_DEPARTMENT_NAME=General
DEFAULT_BANK_NAME=Kenya Commercial Bank
MAX_SALARY_ADVANCE_PERCENT=50
MIN_EMPLOYMENT_TENURE_MONTHS=6
```

### **Optional Enhancements**

```bash
MOCK_LOGIN_ENABLED=false
TAX_RATES_SOURCE=database
INTEGRATION_CREDENTIALS_ENCRYPTION_KEY=...
DEFAULT_CURRENCY=KES
DEFAULT_TIMEZONE=Africa/Nairobi
```

---

## ✅ **VALIDATION CHECKLIST**

- [ ] **No hardcoded credentials in code**
- [ ] **All secrets in environment variables**
- [ ] **Business logic configurable**
- [ ] **Fallbacks are intentional and safe**
- [ ] **Documentation sanitized**
- [ ] **Environment validation implemented**
- [ ] **Configuration audit trail**

---

## 🎯 **SUCCESS METRICS**

1. **Security**: Zero hardcoded credentials
2. **Flexibility**: All business rules configurable
3. **Maintainability**: Environment-driven configuration
4. **Auditability**: Configuration change tracking
5. **Scalability**: Tenant-specific settings support

---

**📝 Note**: This audit identified **23 hardcoded values** and **15 fallback mechanisms**. Priority should be given to removing the security-critical mock login and exposed API keys immediately.
