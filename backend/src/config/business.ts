/**
 * Business configuration settings
 */

import { ConfigValidator } from './validation';

export interface BusinessConfig {
  // Department settings
  defaultDepartmentName: string;
  defaultDepartmentDescription: string;
  
  // HR and approval settings
  hrRole: string;
  hrManagerRole: string;
  fallbackApproverRole: string;
  
  // Banking and payroll settings
  defaultBankName: string;
  defaultAccountType: string;
  
  // Salary advance settings
  maxSalaryAdvancePercent: number;
  minEmploymentTenureMonths: number;
  defaultCurrentSalary: number;
  defaultExistingAdvances: number;
  defaultEmploymentTenure: number;
  defaultCreditworthiness: string;
  
  // Employee settings
  employeeNumberPrefix: string;
  employeeNumberPadding: number;
  defaultEmployeeStatus: string;
  
  // Leave settings
  defaultLeaveYear: number;
  maxLeaveDaysPerRequest: number;
  
  // Security settings
  mockLoginEnabled: boolean;
  demoModeEnabled: boolean;
}

/**
 * Load and validate business configuration from environment variables
 */
export function loadBusinessConfig(): BusinessConfig {
  return {
    // Department settings
    defaultDepartmentName: ConfigValidator.validateString(
      'DEFAULT_DEPARTMENT_NAME',
      process.env.DEFAULT_DEPARTMENT_NAME,
      'General',
      { required: false, min: 1, max: 100 }
    ),
    defaultDepartmentDescription: ConfigValidator.validateString(
      'DEFAULT_DEPARTMENT_DESCRIPTION',
      process.env.DEFAULT_DEPARTMENT_DESCRIPTION,
      'Default department for new employees',
      { required: false, max: 500 }
    ),
    
    // HR and approval settings
    hrRole: ConfigValidator.validateString(
      'HR_ROLE',
      process.env.HR_ROLE,
      'HR_MANAGER',
      { required: false, enum: ['HR', 'HR_MANAGER', 'HUMAN_RESOURCES'] }
    ),
    hrManagerRole: ConfigValidator.validateString(
      'HR_MANAGER_ROLE',
      process.env.HR_MANAGER_ROLE,
      'HR_MANAGER',
      { required: false, enum: ['HR_MANAGER', 'HR_DIRECTOR', 'HR_HEAD'] }
    ),
    fallbackApproverRole: ConfigValidator.validateString(
      'FALLBACK_APPROVER_ROLE',
      process.env.FALLBACK_APPROVER_ROLE,
      'HR',
      { required: false }
    ),
    
    // Banking and payroll settings
    defaultBankName: ConfigValidator.validateString(
      'DEFAULT_BANK_NAME',
      process.env.DEFAULT_BANK_NAME,
      'Kenya Commercial Bank',
      { required: false, min: 1, max: 100 }
    ),
    defaultAccountType: ConfigValidator.validateString(
      'DEFAULT_ACCOUNT_TYPE',
      process.env.DEFAULT_ACCOUNT_TYPE,
      'Checking',
      { required: false, enum: ['Checking', 'Savings', 'Current'] }
    ),
    
    // Salary advance settings
    maxSalaryAdvancePercent: ConfigValidator.validateNumber(
      'MAX_SALARY_ADVANCE_PERCENT',
      process.env.MAX_SALARY_ADVANCE_PERCENT,
      50,
      { required: false, min: 1, max: 100 }
    ),
    minEmploymentTenureMonths: ConfigValidator.validateNumber(
      'MIN_EMPLOYMENT_TENURE_MONTHS',
      process.env.MIN_EMPLOYMENT_TENURE_MONTHS,
      6,
      { required: false, min: 1, max: 60 }
    ),
    defaultCurrentSalary: ConfigValidator.validateNumber(
      'DEFAULT_CURRENT_SALARY',
      process.env.DEFAULT_CURRENT_SALARY,
      30000,
      { required: false, min: 1000, max: 10000000 }
    ),
    defaultExistingAdvances: ConfigValidator.validateNumber(
      'DEFAULT_EXISTING_ADVANCES',
      process.env.DEFAULT_EXISTING_ADVANCES,
      0,
      { required: false, min: 0 }
    ),
    defaultEmploymentTenure: ConfigValidator.validateNumber(
      'DEFAULT_EMPLOYMENT_TENURE',
      process.env.DEFAULT_EMPLOYMENT_TENURE,
      12,
      { required: false, min: 0, max: 600 }
    ),
    defaultCreditworthiness: ConfigValidator.validateString(
      'DEFAULT_CREDITWORTHINESS',
      process.env.DEFAULT_CREDITWORTHINESS,
      'good',
      { required: false, enum: ['excellent', 'good', 'fair', 'poor'] }
    ),
    
    // Employee settings
    employeeNumberPrefix: ConfigValidator.validateString(
      'EMPLOYEE_NUMBER_PREFIX',
      process.env.EMPLOYEE_NUMBER_PREFIX,
      'EMP',
      { required: false, min: 1, max: 10 }
    ),
    employeeNumberPadding: ConfigValidator.validateNumber(
      'EMPLOYEE_NUMBER_PADDING',
      process.env.EMPLOYEE_NUMBER_PADDING,
      3,
      { required: false, min: 1, max: 10 }
    ),
    defaultEmployeeStatus: ConfigValidator.validateString(
      'DEFAULT_EMPLOYEE_STATUS',
      process.env.DEFAULT_EMPLOYEE_STATUS,
      'ACTIVE',
      { required: false, enum: ['ACTIVE', 'INACTIVE', 'PENDING'] }
    ),
    
    // Leave settings
    defaultLeaveYear: ConfigValidator.validateNumber(
      'DEFAULT_LEAVE_YEAR',
      process.env.DEFAULT_LEAVE_YEAR,
      new Date().getFullYear(),
      { required: false, min: 2020, max: 2050 }
    ),
    maxLeaveDaysPerRequest: ConfigValidator.validateNumber(
      'MAX_LEAVE_DAYS_PER_REQUEST',
      process.env.MAX_LEAVE_DAYS_PER_REQUEST,
      30,
      { required: false, min: 1, max: 365 }
    ),
    
    // Security settings
    mockLoginEnabled: ConfigValidator.validateBoolean(
      'MOCK_LOGIN_ENABLED',
      process.env.MOCK_LOGIN_ENABLED,
      false
    ),
    demoModeEnabled: ConfigValidator.validateBoolean(
      'DEMO_MODE_ENABLED',
      process.env.DEMO_MODE_ENABLED,
      false
    ),
  };
}
