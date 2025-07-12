// Kenyan Payroll System Type Definitions

// Re-export common types that are still needed
export interface TimeEntry {
  id: string;
  employeeId: string;
  date: string;
  regularHours: number;
  overtimeHours: number;
  sickHours: number;
  vacationHours: number;
  holidayHours: number;
  personalHours: number;
  approved: boolean;
  approvedBy?: string;
  approvedDate?: string;
}

export interface PayrollPeriod {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  payDate: string;
  status: 'draft' | 'calculating' | 'review' | 'approved' | 'processing' | 'paid' | 'closed';
  totalEmployees: number;
  totalGrossPay: number;
  totalNetPay: number;
  totalStatutoryDeductions: number;
  totalOtherDeductions: number;
  createdBy: string;
  createdDate: string;
  approvedBy?: string;
  approvedDate?: string;
  processedBy?: string;
  processedDate?: string;
}

export interface ManualAdjustment {
  id: string;
  type: 'bonus' | 'allowance' | 'overtime' | 'commission' | 'deduction' | 'loan_repayment';
  description: string;
  amount: number;
  isTaxable: boolean;
  addedBy: string;
  addedDate: string;
  reason: string;
}

// Kenyan-specific Bank Account Information
export interface KenyanBankAccount {
  accountNumber: string;
  bankName: string;
  branchCode: string;
  accountType: 'savings' | 'current';
  swiftCode?: string;
}

// Kenyan Tax Information
export interface KenyanTaxInfo {
  kraPin: string;                    // KRA PIN number (required)
  nssfNumber?: string;               // NSSF number
  nhifNumber?: string;               // NHIF number
  personalRelief?: number;           // Monthly personal relief (default KSH 2,400)
  insuranceRelief?: number;          // Insurance relief
  pensionContribution?: number;      // Additional pension contributions
}

// Kenyan Deduction Types
export interface KenyanDeduction {
  id: string;
  type: 'loan' | 'salary_advance' | 'welfare' | 'sacco' | 'insurance' | 'union_dues' | 'other';
  name: string;
  amount: number;
  isRecurring: boolean;
  startDate: string;
  endDate?: string;
  balance?: number;                  // For loans and advances
  monthlyInstallment?: number;       // For loans
}

// Kenyan Payroll Employee
export interface KenyanPayrollEmployee {
  id: string;
  firstName: string;
  lastName: string;
  employeeId: string;
  department: string;
  branch?: string;                   // Branch assignment (for operations employees)
  position: string;
  hireDate: string;
  status: 'active' | 'inactive' | 'suspended';
  
  payrollInfo: {
    employeeType: 'hourly' | 'salaried';
    monthlySalary?: number;          // For salaried employees
    hourlyRate?: number;             // For hourly employees
    overtimeRate?: number;           // Overtime rate (default 1.5x regular)
    bankAccount: KenyanBankAccount;
    taxInfo: KenyanTaxInfo;
    deductions?: KenyanDeduction[];
    paymentMethod: 'bank_transfer' | 'mobile_money' | 'cash' | 'cheque';
    mobileMoneyNumber?: string;      // For mobile money payments
    personalRelief: number;          // Personal relief amount (default KSH 2,400)
  };
}

// Kenyan Tax Bands
export interface KenyanTaxBand {
  min: number;
  max: number;
  rate: number;
  baseAmount: number;
}

// NHIF Contribution Bands
export interface KenyanNHIFBand {
  min: number;
  max: number;
  amount: number;
}

// Kenyan Statutory Deductions
// TODO: SHA (Social Health Authority) has replaced NHIF but official contribution rates 
// and implementation guidelines are not yet publicly available. Update when rates are published.
export interface KenyanStatutoryDeductions {
  paye: number;                      // Pay As You Earn (Income Tax)
  nssf: number;                      // National Social Security Fund
  nhif: number;                      // National Hospital Insurance Fund (being replaced by SHA)
  // sha: number;                    // Social Health Authority - TODO: Add when rates are available
  total: number;                     // Total statutory deductions
}

// Kenyan Pay Stub
export interface KenyanPayStub {
  id: string;
  employeeId: string;
  employeeName: string;
  payrollPeriodId: string;
  payPeriodStart: string;
  payPeriodEnd: string;
  payDate: string;
  
  // Employee Details
  kraPin: string;
  nssfNumber?: string;
  nhifNumber?: string;
  // shaNumber?: string;              // TODO: Add SHA number when system is fully implemented
  
  // Earnings
  basicSalary: number;
  allowances: number;
  overtime: number;
  grossPay: number;
  
  // Statutory Deductions
  paye: number;
  nssf: number;
  nhif: number;
  
  // Other Deductions
  otherDeductions: KenyanDeduction[];
  totalOtherDeductions: number;
  
  // Totals
  totalDeductions: number;
  netPay: number;
}

// Kenyan Payroll Record
export interface KenyanPayrollRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  payrollPeriodId: string;
  timeEntries: TimeEntry[];
  
  // Calculated Hours
  regularHours: number;
  overtimeHours: number;
  totalHours: number;
  
  // Calculated Pay
  grossPay: number;
  statutoryDeductions: KenyanStatutoryDeductions;
  otherDeductions: number;
  totalDeductions: number;
  netPay: number;
  
  // Status
  status: 'draft' | 'calculated' | 'approved' | 'paid';
  calculatedDate: string;
  approvedBy?: string;
  approvedDate?: string;
  
  // Pay Stub
  payStub: KenyanPayStub;
  
  // Exceptions
  hasExceptions: boolean;
  exceptions: string[];
  manualAdjustments: ManualAdjustment[];
}

// Kenyan Compliance Reports
export interface KenyanComplianceReport {
  id: string;
  reportType: 'paye_return' | 'nssf_return' | 'nhif_return' | 'p9_form' | 'payroll_journal';
  period: string;
  year: number;
  month?: number;
  data: Record<string, string | number | boolean>;
  generatedDate: string;
  submittedDate?: string;
  status: 'draft' | 'ready' | 'submitted' | 'approved';
}

// Kenyan Payroll Settings
export interface KenyanPayrollSettings {
  companyInfo: {
    name: string;
    kraPin: string;
    nssfNumber: string;
    nhifNumber: string;
    address: string;
    postalCode: string;
    city: string;
  };
  payrollDefaults: {
    personalRelief: number;          // Default personal relief
    overtimeMultiplier: number;      // Default overtime multiplier (1.5)
    workingDaysPerMonth: number;     // Default working days (22)
    workingHoursPerDay: number;      // Default working hours (8)
  };
  statutoryRates: {
    nssfRate: number;                // NSSF contribution rate (6%)
    nssfTier1Limit: number;          // NSSF Tier 1 limit (KSH 7,000)
    nssfTier2Limit: number;          // NSSF Tier 2 limit (KSH 36,000)
    payeTaxBands: KenyanTaxBand[];   // PAYE tax bands
    nhifBands: KenyanNHIFBand[];     // NHIF contribution bands
  };
  approvalWorkflow: {
    requirePayrollApproval: boolean;
    approvalLevels: number;
    autoApproveThreshold?: number;
  };
}

// Kenyan Payroll Summary for Dashboard
export interface KenyanPayrollSummary {
  currentPeriod: string;
  totalEmployees: number;
  totalGrossPay: number;
  totalNetPay: number;
  totalPaye: number;
  totalNssf: number;
  totalNhif: number;
  totalOtherDeductions: number;
  averageGrossPay: number;
  averageNetPay: number;
  payrollCost: number;              // Total cost including employer contributions
}

// Mobile Money Payment Information
export interface MobileMoneyPayment {
  provider: 'MPESA' | 'AIRTEL_MONEY' | 'TKASH';
  phoneNumber: string;
  amount: number;
  reference: string;
  employeeId: string;
  status: 'pending' | 'completed' | 'failed';
  transactionId?: string;
  completedDate?: string;
}

// Kenyan Tax Table
export interface KenyanTaxTable {
  id: string;
  taxType: 'paye' | 'nssf' | 'nhif';
  jurisdiction: string;
  year: number;
  brackets: KenyanTaxBand[];
  standardDeduction?: number;
  personalExemption?: number;
  effectiveDate: string;
}

// Kenyan Payroll Report
export interface KenyanPayrollReport {
  id: string;
  name: string;
  type: 'payroll_summary' | 'statutory_returns' | 'employee_earnings' | 'deductions_report';
  parameters: Record<string, string | number | boolean | Date>;
  generatedDate: string;
  generatedBy: string;
  status: 'generating' | 'completed' | 'failed';
  data?: Record<string, any>;
  filePath?: string;
}

// Kenyan Audit Log
export interface KenyanPayrollAuditLog {
  id: string;
  action: string;
  entityType: 'payroll_period' | 'employee' | 'statutory_rates' | 'deduction' | 'payment';
  entityId: string;
  userId: string;
  userName: string;
  timestamp: string;
  changes: Record<string, { old: string | number | boolean; new: string | number | boolean }>;
  ipAddress: string;
  userAgent?: string;
}
