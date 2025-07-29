/**
 * Configured service instances that use the application configuration
 * This implements dependency injection for configuration
 */

import { BusinessConfig, getBusinessConfig } from '../config';

/**
 * Employee service with configuration injection
 */
export class ConfiguredEmployeeService {
  constructor(private config: BusinessConfig) {}

  /**
   * Get default department name
   */
  getDefaultDepartmentName(): string {
    return this.config.defaultDepartmentName;
  }

  /**
   * Get default department description
   */
  getDefaultDepartmentDescription(): string {
    return this.config.defaultDepartmentDescription;
  }

  /**
   * Generate next employee number
   */
  generateEmployeeNumber(lastNumber: number): string {
    const nextNumber = lastNumber + 1;
    const paddedNumber = String(nextNumber).padStart(this.config.employeeNumberPadding, '0');
    return `${this.config.employeeNumberPrefix}${paddedNumber}`;
  }

  /**
   * Get default employee status
   */
  getDefaultEmployeeStatus(): string {
    return this.config.defaultEmployeeStatus;
  }

  /**
   * Get default bank information
   */
  getDefaultBankInfo() {
    return {
      bankName: this.config.defaultBankName,
      accountType: this.config.defaultAccountType,
    };
  }
}

/**
 * Leave approval service with configuration injection
 */
export class ConfiguredLeaveService {
  constructor(private config: BusinessConfig) {}

  /**
   * Get HR role for leave approvals
   */
  getHRRole(): string {
    return this.config.hrRole;
  }

  /**
   * Get HR Manager role for leave approvals
   */
  getHRManagerRole(): string {
    return this.config.hrManagerRole;
  }

  /**
   * Get fallback approver role
   */
  getFallbackApproverRole(): string {
    return this.config.fallbackApproverRole;
  }

  /**
   * Get maximum leave days per request
   */
  getMaxLeaveDaysPerRequest(): number {
    return this.config.maxLeaveDaysPerRequest;
  }

  /**
   * Get default leave year
   */
  getDefaultLeaveYear(): number {
    return this.config.defaultLeaveYear;
  }

  /**
   * Determine approver role based on employee and business rules
   */
  determineApproverRole(employee: any): { role: string; fallbackRole: string } {
    // Operations managers always go to HR
    if (employee?.user?.role === 'OPS_MANAGER' || employee?.position === 'Operations Manager') {
      return {
        role: this.getHRRole(),
        fallbackRole: this.getFallbackApproverRole(),
      };
    }

    // Regular employees go to branch manager first, then HR
    return {
      role: 'BRANCH_MANAGER',
      fallbackRole: this.getHRRole(),
    };
  }
}

/**
 * Salary advance service with configuration injection
 */
export class ConfiguredSalaryAdvanceService {
  constructor(private config: BusinessConfig) {}

  /**
   * Get maximum salary advance percentage
   */
  getMaxAdvancePercent(): number {
    return this.config.maxSalaryAdvancePercent;
  }

  /**
   * Get minimum employment tenure in months
   */
  getMinEmploymentTenure(): number {
    return this.config.minEmploymentTenureMonths;
  }

  /**
   * Get default salary advance values
   */
  getDefaultValues() {
    return {
      currentSalary: this.config.defaultCurrentSalary,
      existingAdvances: this.config.defaultExistingAdvances,
      employmentTenure: this.config.defaultEmploymentTenure,
      creditworthiness: this.config.defaultCreditworthiness,
    };
  }

  /**
   * Calculate maximum allowable advance
   */
  calculateMaxAllowableAdvance(salary: number, existingAdvances: number = 0): number {
    const maxAdvance = Math.floor(salary * (this.config.maxSalaryAdvancePercent / 100));
    return Math.max(0, maxAdvance - existingAdvances);
  }

  /**
   * Check employee eligibility for salary advance
   */
  checkEligibility(employmentMonths: number, existingAdvances: number): {
    isEligible: boolean;
    reason: string;
  } {
    if (employmentMonths < this.config.minEmploymentTenureMonths) {
      return {
        isEligible: false,
        reason: `Minimum ${this.config.minEmploymentTenureMonths} months employment required`,
      };
    }

    if (existingAdvances > 0) {
      return {
        isEligible: false,
        reason: 'Outstanding advance must be cleared first',
      };
    }

    return {
      isEligible: true,
      reason: 'Employee meets eligibility criteria',
    };
  }

  /**
   * Generate HR eligibility details for workflow
   */
  generateHREligibilityDetails(
    employeeSalary?: number,
    employmentMonths?: number,
    existingAdvances?: number,
    creditScore?: string
  ) {
    const defaults = this.getDefaultValues();
    const currentSalary = employeeSalary || defaults.currentSalary;
    const tenure = employmentMonths || defaults.employmentTenure;
    const existing = existingAdvances || defaults.existingAdvances;
    const creditworthiness = creditScore || defaults.creditworthiness;

    const maxAllowableAdvance = this.calculateMaxAllowableAdvance(currentSalary, existing);
    const eligibility = this.checkEligibility(tenure, existing);

    return {
      currentSalary,
      existingAdvances: existing,
      maxAllowableAdvance,
      employmentTenure: tenure,
      creditworthiness,
      isEligible: eligibility.isEligible,
      eligibilityReason: eligibility.reason,
    };
  }
}

/**
 * Security service with configuration injection
 */
export class ConfiguredSecurityService {
  constructor(private config: BusinessConfig) {}

  /**
   * Check if mock login is enabled
   */
  isMockLoginEnabled(): boolean {
    return this.config.mockLoginEnabled;
  }

  /**
   * Check if demo mode is enabled
   */
  isDemoModeEnabled(): boolean {
    return this.config.demoModeEnabled;
  }

  /**
   * Get mock login credentials (only if enabled)
   */
  getMockLoginCredentials(): { email: string; password: string } | null {
    if (!this.config.mockLoginEnabled) {
      return null;
    }

    return {
      email: 'admin@charlieshrms.com',
      password: 'password123',
    };
  }
}

// Create singleton instances with current configuration
const businessConfig = getBusinessConfig();

export const employeeService = new ConfiguredEmployeeService(businessConfig);
export const leaveService = new ConfiguredLeaveService(businessConfig);
export const salaryAdvanceService = new ConfiguredSalaryAdvanceService(businessConfig);
export const securityService = new ConfiguredSecurityService(businessConfig);

// Export factory functions for testing with different configurations
export const createEmployeeService = (config: BusinessConfig) => new ConfiguredEmployeeService(config);
export const createLeaveService = (config: BusinessConfig) => new ConfiguredLeaveService(config);
export const createSalaryAdvanceService = (config: BusinessConfig) => new ConfiguredSalaryAdvanceService(config);
export const createSecurityService = (config: BusinessConfig) => new ConfiguredSecurityService(config);