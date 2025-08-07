import { Employee, Payroll, PayrollPeriod, LeaveRequest, SalaryAdvanceRequest, PerformanceReview } from '@prisma/client';
import { DashboardMetrics } from '../services/analytics.service';

// Mock Users (minimal, since auth uses real users but data is mocked)
const mockUsers = [
  { id: 'demo-admin', email: 'admin@charlieshrms.com', role: 'ADMIN', tenantId: 'demo-tenant', isDemo: true },
  { id: 'demo-hr', email: 'hr@charlieshrms.com', role: 'HR_MANAGER', tenantId: 'demo-tenant', isDemo: true },
  { id: 'demo-ops', email: 'operations@charlieshrms.com', role: 'OPERATIONS_MANAGER', tenantId: 'demo-tenant', isDemo: true },
  { id: 'demo-employee', email: 'employee@charlieshrms.com', role: 'EMPLOYEE', tenantId: 'demo-tenant', isDemo: true },
];

// Mock Employees
const mockEmployees: Partial<Employee>[] = [
  {
    id: 'emp1',
    employeeNumber: 'EMP001',
    firstName: 'Demo',
    lastName: 'Employee1',
    email: 'demo1@example.com',
    position: 'Developer',
    departmentId: 'dept1',
    branchId: 'branch1',
    salary: 50000,
    hireDate: new Date('2023-01-01'),
    status: 'ACTIVE',
    tenantId: 'demo-tenant',
  },
  {
    id: 'emp2',
    employeeNumber: 'EMP002',
    firstName: 'Demo',
    lastName: 'Employee2',
    email: 'demo2@example.com',
    position: 'Manager',
    departmentId: 'dept2',
    branchId: 'branch2',
    salary: 70000,
    hireDate: new Date('2023-02-01'),
    status: 'ACTIVE',
    tenantId: 'demo-tenant',
  },
];

// Mock Payroll Periods
const mockPayrollPeriods: Partial<PayrollPeriod>[] = [
  {
    id: 'period1',
    name: 'July 2025',
    startDate: new Date('2025-07-01'),
    endDate: new Date('2025-07-31'),
    payDate: new Date('2025-07-31'),
    status: 'DRAFT',
    tenantId: 'demo-tenant',
  },
];

// Mock Payrolls
const mockPayrolls: Partial<Payroll>[] = [
  {
    id: 'pay1',
    employeeId: 'emp1',
    payrollPeriodId: 'period1',
    basicSalary: 50000,
    grossSalary: 55000,
    totalDeductions: 5000,
    netSalary: 50000,
    status: 'DRAFT',
    tenantId: 'demo-tenant',
  },
  {
    id: 'pay2',
    employeeId: 'emp2',
    payrollPeriodId: 'period1',
    basicSalary: 70000,
    grossSalary: 77000,
    totalDeductions: 7000,
    netSalary: 70000,
    status: 'DRAFT',
    tenantId: 'demo-tenant',
  },
];

// Mock Leave Requests
const mockLeaveRequests: Partial<LeaveRequest>[] = [
  {
    id: 'leave1',
    employeeId: 'emp1',
    leaveTypeId: 'annual',
    startDate: new Date('2025-08-01'),
    endDate: new Date('2025-08-05'),
    totalDays: 5,
    status: 'PENDING',
    tenantId: 'demo-tenant',
  },
];

// Mock Salary Advance Requests
const mockSalaryAdvances: Partial<SalaryAdvanceRequest>[] = [
  {
    id: 'advance1',
    employeeId: 'emp1',
    requestedAmount: 10000,
    status: 'PENDING',
    requestDate: new Date(),
    tenantId: 'demo-tenant',
  },
];

// Mock Performance Reviews
const mockPerformanceReviews: Partial<PerformanceReview>[] = [
  {
    id: 'review1',
    employeeId: 'emp1',
    reviewCycleId: 'cycle1',
    status: 'DRAFT',
    overallRating: 4.5,
    tenantId: 'demo-tenant',
  },
];

const mockDashboardMetrics: DashboardMetrics = {
  employees: {
    total: 2,
    active: 2,
    inactive: 0,
    newHires: 1,
    branchDistribution: [
      { branch: 'Demo Branch', count: 2, percentage: 100 }
    ]
  },
  leave: {
    pendingRequests: 1,
    approvedThisMonth: 0,
    rejectedThisMonth: 0,
    totalDaysRequested: 5,
    leaveTypeBreakdown: [
      { leaveType: 'Annual', totalRequests: 1, totalDays: 5, averageDuration: 5 }
    ],
    upcomingLeaves: [],
    departmentLeaveStats: []
  },
  salaryAdvances: {
    pendingRequests: 1,
    approvedThisMonth: 0,
    totalOutstanding: 0,
    averageAmount: 10000,
    repaymentRate: 0,
    monthlyTrend: [],
    riskMetrics: { highRiskEmployees: 0, overduePayments: 0, defaultRate: 0 }
  },
  performance: {
    overallScore: 4.5,
    completedReviews: 1,
    pendingReviews: 0,
    improvementPlans: 0,
    topPerformers: [],
    departmentScores: []
  },
  totalEmployees: 2,
  activeEmployees: 2,
  totalDepartments: 1,
  totalBranches: 1,
  pendingLeaveRequests: 1,
  upcomingReviews: 0,
  payrollCosts: { currentMonth: 120000, previousMonth: 110000, percentageChange: 9 },
  leaveUtilization: { totalDaysAllocated: 20, totalDaysUsed: 5, utilizationRate: 25 }
};

// Functions to get mock data
export const getMockEmployees = (tenantId: string) => mockEmployees.filter(e => e.tenantId === tenantId);
export const getMockPayrolls = (tenantId: string) => mockPayrolls.filter(p => p.tenantId === tenantId);
export const getMockPayrollPeriods = (tenantId: string) => mockPayrollPeriods.filter(pp => pp.tenantId === tenantId);
export const getMockLeaveRequests = (tenantId: string) => mockLeaveRequests.filter(lr => lr.tenantId === tenantId);
export const getMockSalaryAdvances = (tenantId: string) => mockSalaryAdvances.filter(sa => sa.tenantId === tenantId);
export const getMockPerformanceReviews = (tenantId: string) => mockPerformanceReviews.filter(pr => pr.tenantId === tenantId);
export const getMockDashboardMetrics = (tenantId: string): DashboardMetrics => ({ ...mockDashboardMetrics, tenantId });

// Add more getters for other models as needed
