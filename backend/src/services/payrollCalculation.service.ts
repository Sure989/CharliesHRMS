import { prisma } from '../index';

export interface PayrollCalculationInput {
  employeeId: string;
  payrollPeriodId: string;
  basicSalary: number;
  allowances?: { name: string; amount: number }[];
  overtime?: { hours: number; rate: number };
  tenantId: string;
}

export interface PayrollCalculationResult {
  basicSalary: number;
  allowances: number;
  overtime: number;
  grossSalary: number;
  incomeTax: number;
  nhif: number;
  nssf: number;
  otherDeductions: number;
  totalDeductions: number;
  netSalary: number;
  payrollItems: {
    type: 'EARNING' | 'DEDUCTION';
    category: string;
    name: string;
    amount: number;
    isStatutory: boolean;
  }[];
}

/**
 * Calculate NHIF (National Hospital Insurance Fund) contribution
 * Based on Kenyan NHIF rates
 */
export function calculateNHIF(grossSalary: number): number {
  if (grossSalary <= 5999) return 150;
  if (grossSalary <= 7999) return 300;
  if (grossSalary <= 11999) return 400;
  if (grossSalary <= 14999) return 500;
  if (grossSalary <= 19999) return 600;
  if (grossSalary <= 24999) return 750;
  if (grossSalary <= 29999) return 850;
  if (grossSalary <= 34999) return 900;
  if (grossSalary <= 39999) return 950;
  if (grossSalary <= 44999) return 1000;
  if (grossSalary <= 49999) return 1100;
  if (grossSalary <= 59999) return 1200;
  if (grossSalary <= 69999) return 1300;
  if (grossSalary <= 79999) return 1400;
  if (grossSalary <= 89999) return 1500;
  if (grossSalary <= 99999) return 1600;
  return 1700; // For salaries above 100,000
}

/**
 * Calculate NSSF (National Social Security Fund) contribution
 * Based on Kenyan NSSF rates (6% of pensionable pay, max 1080)
 */
export function calculateNSSF(grossSalary: number): number {
  const pensionablePay = Math.min(grossSalary, 18000); // Max pensionable pay
  return Math.min(pensionablePay * 0.06, 1080); // 6% with max of 1080
}

/**
 * Calculate income tax using progressive tax brackets
 */
export async function calculateIncomeTax(
  taxableIncome: number,
  tenantId: string
): Promise<number> {
  // Get active tax brackets for the tenant
  const taxBrackets = await prisma.taxBracket.findMany({
    where: {
      tenantId,
      isActive: true,
    },
    orderBy: {
      minAmount: 'asc',
    },
  });

  if (taxBrackets.length === 0) {
    // Default Kenyan tax brackets if none configured
    return calculateDefaultKenyanIncomeTax(taxableIncome);
  }

  let totalTax = 0;
  let remainingIncome = taxableIncome;

  for (const bracket of taxBrackets) {
    if (remainingIncome <= 0) break;

    const bracketMin = bracket.minAmount;
    const bracketMax = bracket.maxAmount || Infinity;
    const bracketRate = bracket.rate / 100; // Convert percentage to decimal
    const fixedAmount = bracket.fixedAmount;

    if (taxableIncome > bracketMin) {
      const taxableInThisBracket = Math.min(
        remainingIncome,
        bracketMax - bracketMin
      );
      
      totalTax += fixedAmount + (taxableInThisBracket * bracketRate);
      remainingIncome -= taxableInThisBracket;
    }
  }

  return Math.round(totalTax);
}

/**
 * Default Kenyan income tax calculation (2024 rates)
 */
function calculateDefaultKenyanIncomeTax(taxableIncome: number): number {
  let tax = 0;

  // Personal relief
  const personalRelief = 2400;
  
  // Tax brackets
  if (taxableIncome <= 24000) {
    tax = taxableIncome * 0.1; // 10%
  } else if (taxableIncome <= 32333) {
    tax = 24000 * 0.1 + (taxableIncome - 24000) * 0.25; // 25%
  } else if (taxableIncome <= 500000) {
    tax = 24000 * 0.1 + 8333 * 0.25 + (taxableIncome - 32333) * 0.3; // 30%
  } else if (taxableIncome <= 800000) {
    tax = 24000 * 0.1 + 8333 * 0.25 + 467667 * 0.3 + (taxableIncome - 500000) * 0.325; // 32.5%
  } else {
    tax = 24000 * 0.1 + 8333 * 0.25 + 467667 * 0.3 + 300000 * 0.325 + (taxableIncome - 800000) * 0.35; // 35%
  }

  // Apply personal relief
  tax = Math.max(0, tax - personalRelief);

  return Math.round(tax);
}

/**
 * Main payroll calculation function
 */
export async function calculatePayroll(
  input: PayrollCalculationInput
): Promise<PayrollCalculationResult> {
  const { basicSalary, allowances = [], overtime, tenantId } = input;

  // Calculate earnings
  const allowancesTotal = allowances.reduce((sum, allowance) => sum + allowance.amount, 0);
  const overtimeAmount = overtime ? overtime.hours * overtime.rate : 0;
  const grossSalary = basicSalary + allowancesTotal + overtimeAmount;

  // Calculate statutory deductions
  const nhif = calculateNHIF(grossSalary);
  const nssf = calculateNSSF(grossSalary);
  
  // Calculate taxable income (gross - NSSF)
  const taxableIncome = grossSalary - nssf;
  const incomeTax = await calculateIncomeTax(taxableIncome, tenantId);

  // Calculate totals
  const otherDeductions = 0; // Can be extended for other deductions
  const totalDeductions = incomeTax + nhif + nssf + otherDeductions;
  const netSalary = grossSalary - totalDeductions;

  // Build payroll items array
  const payrollItems: PayrollCalculationResult['payrollItems'] = [];

  // Add earnings
  payrollItems.push({
    type: 'EARNING',
    category: 'BASIC_SALARY',
    name: 'Basic Salary',
    amount: basicSalary,
    isStatutory: false,
  });

  allowances.forEach(allowance => {
    payrollItems.push({
      type: 'EARNING',
      category: 'ALLOWANCE',
      name: allowance.name,
      amount: allowance.amount,
      isStatutory: false,
    });
  });

  if (overtimeAmount > 0) {
    payrollItems.push({
      type: 'EARNING',
      category: 'OVERTIME',
      name: 'Overtime',
      amount: overtimeAmount,
      isStatutory: false,
    });
  }

  // Add deductions
  if (incomeTax > 0) {
    payrollItems.push({
      type: 'DEDUCTION',
      category: 'TAX',
      name: 'Income Tax (PAYE)',
      amount: incomeTax,
      isStatutory: true,
    });
  }

  if (nhif > 0) {
    payrollItems.push({
      type: 'DEDUCTION',
      category: 'INSURANCE',
      name: 'NHIF',
      amount: nhif,
      isStatutory: true,
    });
  }

  if (nssf > 0) {
    payrollItems.push({
      type: 'DEDUCTION',
      category: 'PENSION',
      name: 'NSSF',
      amount: nssf,
      isStatutory: true,
    });
  }

  return {
    basicSalary,
    allowances: allowancesTotal,
    overtime: overtimeAmount,
    grossSalary,
    incomeTax,
    nhif,
    nssf,
    otherDeductions,
    totalDeductions,
    netSalary,
    payrollItems,
  };
}

/**
 * Generate unique pay stub number
 */
export async function generatePayStubNumber(tenantId: string): Promise<string> {
  const year = new Date().getFullYear();
  const month = String(new Date().getMonth() + 1).padStart(2, '0');
  
  // Count existing pay stubs for this month
  const count = await prisma.payStub.count({
    where: {
      tenantId,
      stubNumber: {
        startsWith: `PS${year}${month}`,
      },
    },
  });

  const sequence = String(count + 1).padStart(4, '0');
  return `PS${year}${month}${sequence}`;
}
