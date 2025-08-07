import { Employee, User, Department, Branch, Payroll, PayrollPeriod, LeaveRequest, SalaryAdvanceRequest, PerformanceReview, Training } from '@prisma/client';

// Comprehensive mock data for all modules

// Mock Users for User Management
export const getMockUsers = (tenantId: string) => [
  {
    id: 'demo-user-1',
    email: 'admin@charlieshrms.com',
    firstName: 'Demo',
    lastName: 'Admin',
    role: 'ADMIN',
    status: 'ACTIVE',
    tenantId,
    isDemo: true,
    lastLogin: new Date(),
    createdAt: new Date('2023-01-01'),
    employeeId: 'demo-emp-1'
  },
  {
    id: 'demo-user-2', 
    email: 'hr@charlieshrms.com',
    firstName: 'Demo',
    lastName: 'HR Manager',
    role: 'HR_MANAGER',
    status: 'ACTIVE',
    tenantId,
    isDemo: true,
    lastLogin: new Date(),
    createdAt: new Date('2023-01-15'),
    employeeId: 'demo-emp-2'
  },
  {
    id: 'demo-user-3',
    email: 'operations@charlieshrms.com', 
    firstName: 'Demo',
    lastName: 'Operations Manager',
    role: 'OPERATIONS_MANAGER',
    status: 'ACTIVE',
    tenantId,
    isDemo: true,
    lastLogin: new Date(),
    createdAt: new Date('2023-02-01'),
    employeeId: 'demo-emp-3'
  },
  {
    id: 'demo-user-4',
    email: 'employee@charlieshrms.com',
    firstName: 'Demo',
    lastName: 'Employee',
    role: 'EMPLOYEE', 
    status: 'ACTIVE',
    tenantId,
    isDemo: true,
    lastLogin: new Date(),
    createdAt: new Date('2023-03-01'),
    employeeId: 'demo-emp-4'
  }
];

// Mock Employees for Employee Management
export const getMockEmployeesDetailed = (tenantId: string) => [
  {
    id: 'demo-emp-1',
    employeeNumber: 'EMP001',
    firstName: 'Demo',
    lastName: 'Admin',
    email: 'admin@charlieshrms.com',
    phone: '+254700000001',
    position: 'System Administrator',
    departmentId: 'demo-dept-1',
    branchId: 'demo-branch-1',
    managerId: null,
    salary: 80000,
    hireDate: new Date('2023-01-01'),
    status: 'ACTIVE',
    tenantId,
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date()
  },
  {
    id: 'demo-emp-2',
    employeeNumber: 'EMP002', 
    firstName: 'Demo',
    lastName: 'HR Manager',
    email: 'hr@charlieshrms.com',
    phone: '+254700000002',
    position: 'HR Manager',
    departmentId: 'demo-dept-2',
    branchId: 'demo-branch-1',
    managerId: 'demo-emp-1',
    salary: 70000,
    hireDate: new Date('2023-01-15'),
    status: 'ACTIVE',
    tenantId,
    createdAt: new Date('2023-01-15'),
    updatedAt: new Date()
  },
  {
    id: 'demo-emp-3',
    employeeNumber: 'EMP003',
    firstName: 'Demo', 
    lastName: 'Operations Manager',
    email: 'operations@charlieshrms.com',
    phone: '+254700000003',
    position: 'Operations Manager',
    departmentId: 'demo-dept-3',
    branchId: 'demo-branch-2',
    managerId: 'demo-emp-1',
    salary: 65000,
    hireDate: new Date('2023-02-01'),
    status: 'ACTIVE',
    tenantId,
    createdAt: new Date('2023-02-01'),
    updatedAt: new Date()
  },
  {
    id: 'demo-emp-4',
    employeeNumber: 'EMP004',
    firstName: 'Demo',
    lastName: 'Employee',
    email: 'employee@charlieshrms.com',
    phone: '+254700000004',
    position: 'Software Developer',
    departmentId: 'demo-dept-1',
    branchId: 'demo-branch-1',
    managerId: 'demo-emp-2',
    salary: 50000,
    hireDate: new Date('2023-03-01'),
    status: 'ACTIVE',
    tenantId,
    createdAt: new Date('2023-03-01'),
    updatedAt: new Date()
  }
];

// Mock Departments for Department Management
export const getMockDepartments = (tenantId: string) => [
  {
    id: 'demo-dept-1',
    name: 'Information Technology',
    description: 'IT and Software Development',
    managerId: 'demo-emp-1',
    status: 'ACTIVE',
    tenantId,
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date()
  },
  {
    id: 'demo-dept-2',
    name: 'Human Resources',
    description: 'HR and People Management',
    managerId: 'demo-emp-2',
    status: 'ACTIVE',
    tenantId,
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date()
  },
  {
    id: 'demo-dept-3',
    name: 'Operations',
    description: 'Business Operations',
    managerId: 'demo-emp-3',
    status: 'ACTIVE',
    tenantId,
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date()
  }
];

// Mock Branches for Branch Management
export const getMockBranches = (tenantId: string) => [
  {
    id: 'demo-branch-1',
    name: 'Head Office',
    location: 'Nairobi',
    address: '123 Demo Street, Nairobi',
    managerId: 'demo-emp-1',
    departmentId: 'demo-dept-1',
    status: 'ACTIVE',
    tenantId,
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date()
  },
  {
    id: 'demo-branch-2',
    name: 'Branch Office',
    location: 'Mombasa',
    address: '456 Demo Avenue, Mombasa',
    managerId: 'demo-emp-3',
    departmentId: 'demo-dept-3',
    status: 'ACTIVE',
    tenantId,
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date()
  }
];

// Mock Payroll Periods for Payroll Management
export const getMockPayrollPeriodsDetailed = (tenantId: string) => [
  {
    id: 'demo-period-1',
    name: 'January 2025',
    startDate: new Date('2025-01-01'),
    endDate: new Date('2025-01-31'),
    payDate: new Date('2025-01-31'),
    status: 'COMPLETED',
    tenantId,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date()
  },
  {
    id: 'demo-period-2',
    name: 'February 2025',
    startDate: new Date('2025-02-01'),
    endDate: new Date('2025-02-28'),
    payDate: new Date('2025-02-28'),
    status: 'DRAFT',
    tenantId,
    createdAt: new Date('2025-02-01'),
    updatedAt: new Date()
  }
];

// Mock Payroll Records
export const getMockPayrollRecords = (tenantId: string) => [
  {
    id: 'demo-payroll-1',
    employeeId: 'demo-emp-1',
    payrollPeriodId: 'demo-period-1',
    basicSalary: 80000,
    grossSalary: 85000,
    totalDeductions: 15000,
    netSalary: 70000,
    status: 'APPROVED',
    tenantId,
    createdAt: new Date('2025-01-31'),
    updatedAt: new Date()
  },
  {
    id: 'demo-payroll-2',
    employeeId: 'demo-emp-2',
    payrollPeriodId: 'demo-period-1',
    basicSalary: 70000,
    grossSalary: 75000,
    totalDeductions: 13000,
    netSalary: 62000,
    status: 'APPROVED',
    tenantId,
    createdAt: new Date('2025-01-31'),
    updatedAt: new Date()
  }
];

// Mock Leave Requests
export const getMockLeaveRequestsDetailed = (tenantId: string) => [
  {
    id: 'demo-leave-1',
    employeeId: 'demo-emp-4',
    leaveTypeId: 'demo-leave-type-1',
    startDate: new Date('2025-02-15'),
    endDate: new Date('2025-02-20'),
    totalDays: 5,
    reason: 'Annual vacation',
    status: 'PENDING',
    appliedAt: new Date(),
    tenantId,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'demo-leave-2',
    employeeId: 'demo-emp-3',
    leaveTypeId: 'demo-leave-type-2',
    startDate: new Date('2025-01-10'),
    endDate: new Date('2025-01-12'),
    totalDays: 3,
    reason: 'Medical appointment',
    status: 'APPROVED',
    appliedAt: new Date('2025-01-05'),
    tenantId,
    createdAt: new Date('2025-01-05'),
    updatedAt: new Date()
  }
];

// Mock Leave Types
export const getMockLeaveTypes = (tenantId: string) => [
  {
    id: 'demo-leave-type-1',
    name: 'Annual Leave',
    code: 'AL',
    color: '#4caf50',
    tenantId,
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date()
  },
  {
    id: 'demo-leave-type-2',
    name: 'Sick Leave',
    code: 'SL',
    color: '#f44336',
    tenantId,
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date()
  }
];

// Mock Salary Advance Requests
export const getMockSalaryAdvanceRequestsDetailed = (tenantId: string) => [
  {
    id: 'demo-advance-1',
    employeeId: 'demo-emp-4',
    requestedAmount: 15000,
    approvedAmount: 15000,
    reason: 'Emergency medical expenses',
    status: 'PENDING',
    requestDate: new Date(),
    tenantId,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'demo-advance-2',
    employeeId: 'demo-emp-3',
    requestedAmount: 20000,
    approvedAmount: 18000,
    reason: 'School fees',
    status: 'APPROVED',
    requestDate: new Date('2025-01-15'),
    tenantId,
    createdAt: new Date('2025-01-15'),
    updatedAt: new Date()
  }
];

// Mock Performance Reviews
export const getMockPerformanceReviewsDetailed = (tenantId: string) => [
  {
    id: 'demo-review-1',
    employeeId: 'demo-emp-4',
    reviewCycleId: 'demo-cycle-1',
    reviewerId: 'demo-emp-2',
    status: 'COMPLETED',
    overallRating: 4.2,
    overallComments: 'Excellent performance with room for growth',
    tenantId,
    createdAt: new Date('2024-12-01'),
    updatedAt: new Date()
  },
  {
    id: 'demo-review-2',
    employeeId: 'demo-emp-3',
    reviewCycleId: 'demo-cycle-1',
    reviewerId: 'demo-emp-1',
    status: 'IN_PROGRESS',
    overallRating: null,
    overallComments: null,
    tenantId,
    createdAt: new Date('2024-12-15'),
    updatedAt: new Date()
  }
];

// Mock Training Programs
export const getMockTrainingPrograms = (tenantId: string) => [
  {
    id: 'demo-training-1',
    title: 'Leadership Development',
    description: 'Advanced leadership skills for managers',
    startDate: new Date('2025-03-01'),
    endDate: new Date('2025-03-03'),
    status: 'PLANNED',
    capacity: 20,
    cost: 50000,
    tenantId,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'demo-training-2',
    title: 'Technical Skills Workshop',
    description: 'Latest technology trends and tools',
    startDate: new Date('2025-02-15'),
    endDate: new Date('2025-02-16'),
    status: 'ACTIVE',
    capacity: 15,
    cost: 30000,
    tenantId,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

// Mock Security Settings
export const getMockSecuritySettings = () => ({
  passwordPolicy: {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    maxAge: 90
  },
  sessionSettings: {
    timeout: 30,
    maxConcurrentSessions: 3
  },
  twoFactorAuth: {
    enabled: false,
    required: false
  }
});

// Mock System Status
export const getMockSystemStatus = () => ({
  status: 'healthy',
  uptime: '99.9%',
  lastBackup: new Date(),
  activeUsers: 4,
  systemLoad: 'low',
  databaseStatus: 'connected',
  storageUsed: '45%'
});

// Export functions to get mock data by tenant
export const getMockDataByTenant = {
  users: getMockUsers,
  employees: getMockEmployeesDetailed,
  departments: getMockDepartments,
  branches: getMockBranches,
  payrollPeriods: getMockPayrollPeriodsDetailed,
  payrollRecords: getMockPayrollRecords,
  leaveRequests: getMockLeaveRequestsDetailed,
  leaveTypes: getMockLeaveTypes,
  salaryAdvances: getMockSalaryAdvanceRequestsDetailed,
  performanceReviews: getMockPerformanceReviewsDetailed,
  trainings: getMockTrainingPrograms,
  securitySettings: getMockSecuritySettings,
  systemStatus: getMockSystemStatus
};