import {
  KenyanPayrollEmployee as PayrollEmployee,
  KenyanPayrollRecord as PayrollRecord,
  KenyanStatutoryDeductions as StatutoryDeductions,
  KenyanPayStub as PayStub,
  KenyanTaxBand as TaxBand,
  KenyanNHIFBand as NHIFBand,
  KenyanDeduction as PayrollDeduction,
  TimeEntry,
  ManualAdjustment,
  PayrollPeriod
} from '../types/payroll';

// Export types for easy access
export type {
  PayrollEmployee,
  PayrollRecord,
  StatutoryDeductions,
  PayStub,
  PayrollDeduction,
  TimeEntry,
  ManualAdjustment,
  PayrollPeriod,
  TaxBand,
  NHIFBand
};

/**
 * Kenyan Payroll Engine
 * Handles all payroll calculations according to Kenyan tax laws and regulations
 * 
 * NOTE: SHA (Social Health Authority) has officially replaced NHIF as of 2024, 
 * but detailed contribution rates and implementation guidelines are not yet publicly available.
 * This engine will need to be updated once SHA rates and structures are officially published.
 */
export class PayrollEngine {
  // 2024 Kenyan PAYE Tax Bands (Kenya Revenue Authority rates)
  private static readonly PAYE_BANDS: TaxBand[] = [
    { min: 0, max: 24000, rate: 0.10, baseAmount: 0 },           // 10% on first KSH 24,000
    { min: 24001, max: 32333, rate: 0.25, baseAmount: 2400 },    // 25% on next KSH 8,333
    { min: 32334, max: 500000, rate: 0.30, baseAmount: 4483 },   // 30% on next KSH 467,667
    { min: 500001, max: 800000, rate: 0.325, baseAmount: 144783 }, // 32.5% on next KSH 300,000
    { min: 800001, max: Infinity, rate: 0.35, baseAmount: 242283 } // 35% on excess
  ];

  // NSSF Contribution Limits (2024)
  private static readonly NSSF_TIER_1_LIMIT = 7000;   // KSH 7,000
  private static readonly NSSF_TIER_2_LIMIT = 36000;  // KSH 36,000
  private static readonly NSSF_RATE = 0.06;           // 6% employee contribution

  // NHIF Contribution Bands (2024)
  // TODO: Replace with SHA contribution structure when official rates are published
  private static readonly NHIF_BANDS: NHIFBand[] = [
    { min: 0, max: 5999, amount: 150 },
    { min: 6000, max: 7999, amount: 300 },
    { min: 8000, max: 11999, amount: 400 },
    { min: 12000, max: 14999, amount: 500 },
    { min: 15000, max: 19999, amount: 600 },
    { min: 20000, max: 24999, amount: 750 },
    { min: 25000, max: 29999, amount: 850 },
    { min: 30000, max: 34999, amount: 900 },
    { min: 35000, max: 39999, amount: 950 },
    { min: 40000, max: 44999, amount: 1000 },
    { min: 45000, max: 49999, amount: 1100 },
    { min: 50000, max: 59999, amount: 1200 },
    { min: 60000, max: 69999, amount: 1300 },
    { min: 70000, max: 79999, amount: 1400 },
    { min: 80000, max: 89999, amount: 1500 },
    { min: 90000, max: 99999, amount: 1600 },
    { min: 100000, max: Infinity, amount: 1700 }
  ];

  // Personal Relief (2024)
  private static readonly PERSONAL_RELIEF = 2400; // KSH 2,400 per month

  /**
   * Calculate gross pay for an employee based on time entries
   */
  static calculateGrossPay(
    employee: PayrollEmployee,
    timeEntries: TimeEntry[],
    manualAdjustments: ManualAdjustment[] = []
  ): number {
    let grossPay = 0;

    // Calculate pay based on employee type
    if (employee.payrollInfo.employeeType === 'hourly') {
      const totalRegularHours = timeEntries.reduce((sum, entry) => sum + entry.regularHours, 0);
      const totalOvertimeHours = timeEntries.reduce((sum, entry) => sum + entry.overtimeHours, 0);

      const regularRate = employee.payrollInfo.hourlyRate || 0;
      const overtimeRate = employee.payrollInfo.overtimeRate || (regularRate * 1.5);

      grossPay += totalRegularHours * regularRate;
      grossPay += totalOvertimeHours * overtimeRate;

      // Add paid time off hours
      const paidTimeOffHours = timeEntries.reduce((sum, entry) => 
        sum + entry.sickHours + entry.vacationHours + entry.holidayHours + entry.personalHours, 0
      );
      grossPay += paidTimeOffHours * regularRate;

    } else if (employee.payrollInfo.employeeType === 'salaried') {
      // Monthly salary
      grossPay = employee.payrollInfo.monthlySalary || 0;
    }

    // Add manual adjustments (bonuses, allowances, etc.)
    const taxableAdjustments = manualAdjustments
      .filter(adj => adj.isTaxable && ['bonus', 'allowance', 'overtime', 'commission'].includes(adj.type))
      .reduce((sum, adj) => sum + adj.amount, 0);

    grossPay += taxableAdjustments;

    return Math.round(grossPay * 100) / 100;
  }

  /**
   * Calculate PAYE (Pay As You Earn) - Kenyan Income Tax
   */
  static calculatePAYE(monthlyGross: number, personalRelief: number = this.PERSONAL_RELIEF): number {
    let tax = 0;

    for (const band of this.PAYE_BANDS) {
      if (monthlyGross > band.min) {
        const taxableInBand = Math.min(monthlyGross, band.max) - band.min;
        tax += taxableInBand * band.rate;
      } else {
        break; // No more tax bands apply
      }
    }

    // Apply personal relief
    tax = Math.max(0, tax - personalRelief);
    
    return Math.round(tax * 100) / 100;
  }

  /**
   * Calculate NSSF (National Social Security Fund) Contribution
   */
  static calculateNSSF(monthlyGross: number): number {
    // Tier 1: 6% of first KSH 7,000
    const tier1Contribution = Math.min(monthlyGross, this.NSSF_TIER_1_LIMIT) * this.NSSF_RATE;
    
    // Tier 2: 6% of amount between KSH 7,001 and KSH 36,000
    let tier2Contribution = 0;
    if (monthlyGross > this.NSSF_TIER_1_LIMIT) {
      const tier2Salary = Math.min(monthlyGross - this.NSSF_TIER_1_LIMIT, 
                                   this.NSSF_TIER_2_LIMIT - this.NSSF_TIER_1_LIMIT);
      tier2Contribution = tier2Salary * this.NSSF_RATE;
    }

    return Math.round((tier1Contribution + tier2Contribution) * 100) / 100;
  }

  /**
   * Calculate NHIF (National Hospital Insurance Fund) Contribution
   */
  static calculateNHIF(monthlyGross: number): number {
    for (const band of this.NHIF_BANDS) {
      if (monthlyGross >= band.min && monthlyGross <= band.max) {
        return band.amount;
      }
    }
    return this.NHIF_BANDS[this.NHIF_BANDS.length - 1].amount; // Return highest band if above all ranges
  }

  /**
   * Calculate all statutory deductions for an employee
   */
  static calculateStatutoryDeductions(
    employee: PayrollEmployee,
    monthlyGross: number
  ): StatutoryDeductions {
    const paye = this.calculatePAYE(monthlyGross, employee.payrollInfo.personalRelief);
    const nssf = this.calculateNSSF(monthlyGross);
    const nhif = this.calculateNHIF(monthlyGross);

    return {
      paye,
      nssf,
      nhif,
      total: paye + nssf + nhif
    };
  }

  /**
   * Calculate other deductions (loans, advances, etc.)
   */
  static calculateOtherDeductions(
    employee: PayrollEmployee, 
    salaryAdvanceDeductions: number = 0
  ): number {
    const regularDeductions = employee.payrollInfo.deductions?.reduce((sum, deduction) => 
      sum + deduction.amount, 0) || 0;
    
    return regularDeductions + salaryAdvanceDeductions;
  }

  /**
   * Calculate salary advance deductions for an employee
   */
  static calculateSalaryAdvanceDeductions(employeeId: string, activeAdvances: any[]): number {
    const employeeAdvances = activeAdvances.filter(advance => 
      advance.employeeId === employeeId && advance.isActive
    );
    
    return employeeAdvances.reduce((sum, advance) => 
      sum + advance.monthlyDeductionAmount, 0
    );
  }

  /**
   * Calculate maximum salary advance limit for an employee
   * @param monthlySalary The employee's monthly salary
   * @returns The maximum advance limit (25% of monthly salary)
   */
  static calculateMaxAdvanceLimit(monthlySalary: number): number {
    // Maximum advance is 25% of monthly salary (quarter of salary)
    return monthlySalary * 0.25;
  }

  /**
   * Calculate available salary advance credit for an employee
   * @param monthlySalary The employee's monthly salary
   * @param outstandingAdvances Total outstanding advances for the employee
   * @returns The available credit (max limit minus outstanding advances)
   */
  static calculateAvailableCredit(monthlySalary: number, outstandingAdvances: number): number {
    const maxLimit = this.calculateMaxAdvanceLimit(monthlySalary);
    return Math.max(0, maxLimit - outstandingAdvances);
  }

  /**
   * Calculate complete payroll for an employee
   */
  static calculatePayroll(
    employee: PayrollEmployee,
    timeEntries: TimeEntry[],
    payPeriod: PayrollPeriod,
    manualAdjustments: ManualAdjustment[] = []
  ): PayrollRecord {
    // Calculate gross pay
    const grossPay = this.calculateGrossPay(employee, timeEntries, manualAdjustments);

    // Calculate statutory deductions
    const statutoryDeductions = this.calculateStatutoryDeductions(employee, grossPay);

    // Calculate other deductions
    const otherDeductions = this.calculateOtherDeductions(employee);

    // Calculate totals
    const totalDeductions = statutoryDeductions.total + otherDeductions;
    const netPay = grossPay - totalDeductions;

    // Calculate hours
    const regularHours = timeEntries.reduce((sum, entry) => sum + entry.regularHours, 0);
    const overtimeHours = timeEntries.reduce((sum, entry) => sum + entry.overtimeHours, 0);
    const totalHours = regularHours + overtimeHours;

    // Create pay stub
    const payStub = this.generatePayStub(
      employee,
      payPeriod,
      grossPay,
      statutoryDeductions,
      otherDeductions,
      netPay,
      regularHours,
      overtimeHours
    );

    // Create payroll record
    const payrollRecord: PayrollRecord = {
      id: `payroll_${employee.id}_${payPeriod.id}`,
      employeeId: employee.id,
      employeeName: `${employee.firstName} ${employee.lastName}`,
      payrollPeriodId: payPeriod.id,
      timeEntries,
      regularHours,
      overtimeHours,
      totalHours,
      grossPay,
      statutoryDeductions,
      otherDeductions,
      totalDeductions,
      netPay,
      status: 'calculated',
      calculatedDate: new Date().toISOString(),
      payStub,
      hasExceptions: this.checkForExceptions(employee, timeEntries, grossPay),
      exceptions: this.getExceptions(employee, timeEntries, grossPay),
      manualAdjustments
    };

    return payrollRecord;
  }

  /**
   * Generate pay stub
   */
  private static generatePayStub(
    employee: PayrollEmployee,
    payPeriod: PayrollPeriod,
    grossPay: number,
    statutoryDeductions: StatutoryDeductions,
    otherDeductions: number,
    netPay: number,
    regularHours: number,
    overtimeHours: number
  ): PayStub {
    const regularRate = employee.payrollInfo.hourlyRate || 0;
    const overtimeRate = employee.payrollInfo.overtimeRate || (regularRate * 1.5);

    return {
      id: `paystub_${employee.id}_${payPeriod.id}`,
      employeeId: employee.id,
      employeeName: `${employee.firstName} ${employee.lastName}`,
      payrollPeriodId: payPeriod.id,
      payPeriodStart: payPeriod.startDate,
      payPeriodEnd: payPeriod.endDate,
      payDate: payPeriod.payDate,
      
      // Employee Details
      kraPin: employee.payrollInfo.taxInfo.kraPin,
      nssfNumber: employee.payrollInfo.taxInfo.nssfNumber,
      nhifNumber: employee.payrollInfo.taxInfo.nhifNumber,
      
      // Earnings
      basicSalary: employee.payrollInfo.monthlySalary || (regularHours * regularRate),
      allowances: 0, // Would be calculated from manual adjustments
      overtime: overtimeHours * overtimeRate,
      grossPay,
      
      // Statutory Deductions
      paye: statutoryDeductions.paye,
      nssf: statutoryDeductions.nssf,
      nhif: statutoryDeductions.nhif,
      
      // Other Deductions
      otherDeductions: employee.payrollInfo.deductions || [],
      totalOtherDeductions: otherDeductions,
      
      // Totals
      totalDeductions: statutoryDeductions.total + otherDeductions,
      netPay
    };
  }

  /**
   * Check for payroll exceptions
   */
  private static checkForExceptions(
    employee: PayrollEmployee,
    timeEntries: TimeEntry[],
    grossPay: number
  ): boolean {
    const exceptions = this.getExceptions(employee, timeEntries, grossPay);
    return exceptions.length > 0;
  }

  /**
   * Get list of payroll exceptions
   */
  private static getExceptions(
    employee: PayrollEmployee,
    timeEntries: TimeEntry[],
    grossPay: number
  ): string[] {
    const exceptions: string[] = [];

    // Check for missing time entries
    if (timeEntries.length === 0 && employee.payrollInfo.employeeType === 'hourly') {
      exceptions.push('No time entries found for hourly employee');
    }

    // Check for missing KRA PIN
    if (!employee.payrollInfo.taxInfo.kraPin) {
      exceptions.push('Missing KRA PIN number');
    }

    // Check for missing bank account info
    if (!employee.payrollInfo.bankAccount.accountNumber || !employee.payrollInfo.bankAccount.bankName) {
      exceptions.push('Missing bank account information');
    }

    // Check for zero pay
    if (grossPay <= 0) {
      exceptions.push('Zero or negative gross pay');
    }

    // Check for excessive hours
    const totalHours = timeEntries.reduce((sum, entry) => 
      sum + entry.regularHours + entry.overtimeHours, 0
    );
    if (totalHours > 200) { // More than 200 hours in a month
      exceptions.push('Excessive hours worked');
    }

    return exceptions;
  }

  /**
   * Get tax breakdown for reporting
   */
  static getTaxBreakdown(records: PayrollRecord[]) {
    const totalPaye = records.reduce((sum, record) => sum + record.statutoryDeductions.paye, 0);
    const totalNssf = records.reduce((sum, record) => sum + record.statutoryDeductions.nssf, 0);
    const totalNhif = records.reduce((sum, record) => sum + record.statutoryDeductions.nhif, 0);
    const totalStatutory = totalPaye + totalNssf + totalNhif;

    return {
      paye: { amount: totalPaye, percentage: (totalPaye / totalStatutory) * 100 },
      nssf: { amount: totalNssf, percentage: (totalNssf / totalStatutory) * 100 },
      nhif: { amount: totalNhif, percentage: (totalNhif / totalStatutory) * 100 },
      total: totalStatutory
    };
  }

  /**
   * Get current tax rates and limits for display
   */
  static getCurrentRates() {
    return {
      payeBands: this.PAYE_BANDS,
      nhifBands: this.NHIF_BANDS,
      nssfTier1Limit: this.NSSF_TIER_1_LIMIT,
      nssfTier2Limit: this.NSSF_TIER_2_LIMIT,
      nssfRate: this.NSSF_RATE,
      personalRelief: this.PERSONAL_RELIEF
    };
  }
}
