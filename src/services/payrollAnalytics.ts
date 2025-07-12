import { KenyanPayrollRecord, KenyanPayrollSummary } from '../types/payroll';

export interface PayrollTrend {
  period: string;
  grossPay: number;
  netPay: number;
  statutoryDeductions: number;
  otherDeductions: number;
  employeeCount: number;
  averageGrossPay: number;
  averageNetPay: number;
  payrollCost: number;
}

export interface PayrollForecast {
  period: string;
  predictedGrossPay: number;
  predictedNetPay: number;
  predictedEmployeeCount: number;
  confidenceLevel: number;
  factors: string[];
}

export interface DepartmentAnalysis {
  department: string;
  employeeCount: number;
  totalGrossPay: number;
  totalNetPay: number;
  averageSalary: number;
  payrollPercentage: number;
  growthRate: number;
  costPerEmployee: number;
}

export interface PayrollMetrics {
  totalPayrollCost: number;
  payrollGrowthRate: number;
  averageSalaryGrowth: number;
  turnoverImpact: number;
  seasonalVariation: number;
  complianceCost: number;
  efficiencyRatio: number;
}

export interface CostAnalysis {
  category: string;
  amount: number;
  percentage: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  monthlyChange: number;
  yearlyChange: number;
}

export interface PayrollBenchmark {
  metric: string;
  currentValue: number;
  industryAverage: number;
  bestPractice: number;
  variance: number;
  recommendation: string;
}

export class PayrollAnalyticsService {
  private static payrollHistory: PayrollTrend[] = [];
  private static departmentData: DepartmentAnalysis[] = [];

  /**
   * Analyze payroll trends over time
   */
  static analyzePayrollTrends(
    payrollRecords: KenyanPayrollRecord[],
    periods: number = 12
  ): PayrollTrend[] {
    // Group records by period (month)
    const periodGroups = this.groupRecordsByPeriod(payrollRecords);
    
    const trends: PayrollTrend[] = [];
    
    Object.entries(periodGroups).forEach(([period, records]) => {
      const totalGrossPay = records.reduce((sum, record) => sum + record.grossPay, 0);
      const totalNetPay = records.reduce((sum, record) => sum + record.netPay, 0);
      const totalStatutoryDeductions = records.reduce((sum, record) => 
        sum + record.statutoryDeductions.total, 0);
      const totalOtherDeductions = records.reduce((sum, record) => 
        sum + record.otherDeductions, 0);
      const employeeCount = records.length;
      
      const trend: PayrollTrend = {
        period,
        grossPay: totalGrossPay,
        netPay: totalNetPay,
        statutoryDeductions: totalStatutoryDeductions,
        otherDeductions: totalOtherDeductions,
        employeeCount,
        averageGrossPay: employeeCount > 0 ? totalGrossPay / employeeCount : 0,
        averageNetPay: employeeCount > 0 ? totalNetPay / employeeCount : 0,
        payrollCost: totalGrossPay + (totalGrossPay * 0.12) // Including employer contributions
      };
      
      trends.push(trend);
    });
    
    // Sort by period and take last N periods
    const sortedTrends = trends
      .sort((a, b) => new Date(a.period).getTime() - new Date(b.period).getTime())
      .slice(-periods);
    
    this.payrollHistory = sortedTrends;
    return sortedTrends;
  }

  /**
   * Generate payroll forecasts using trend analysis
   */
  static generatePayrollForecast(
    historicalTrends: PayrollTrend[],
    forecastPeriods: number = 6
  ): PayrollForecast[] {
    if (historicalTrends.length < 3) {
      throw new Error('Insufficient historical data for forecasting');
    }

    const forecasts: PayrollForecast[] = [];
    
    // Calculate growth rates
    const grossPayGrowthRate = this.calculateGrowthRate(
      historicalTrends.map(t => t.grossPay)
    );
    const employeeGrowthRate = this.calculateGrowthRate(
      historicalTrends.map(t => t.employeeCount)
    );
    
    // Get last period data
    const lastPeriod = historicalTrends[historicalTrends.length - 1];
    const lastPeriodDate = new Date(lastPeriod.period);
    
    for (let i = 1; i <= forecastPeriods; i++) {
      const forecastDate = new Date(lastPeriodDate);
      forecastDate.setMonth(forecastDate.getMonth() + i);
      
      // Apply growth rates with seasonal adjustments
      const seasonalFactor = this.getSeasonalFactor(forecastDate.getMonth());
      const predictedGrossPay = lastPeriod.grossPay * 
        Math.pow(1 + grossPayGrowthRate, i) * seasonalFactor;
      const predictedEmployeeCount = Math.round(lastPeriod.employeeCount * 
        Math.pow(1 + employeeGrowthRate, i));
      const predictedNetPay = predictedGrossPay * 0.75; // Approximate net pay ratio
      
      // Calculate confidence level (decreases with distance)
      const confidenceLevel = Math.max(0.5, 0.95 - (i * 0.1));
      
      const forecast: PayrollForecast = {
        period: forecastDate.toISOString().substring(0, 7), // YYYY-MM format
        predictedGrossPay,
        predictedNetPay,
        predictedEmployeeCount,
        confidenceLevel,
        factors: this.getForecastFactors(i, seasonalFactor)
      };
      
      forecasts.push(forecast);
    }
    
    return forecasts;
  }

  /**
   * Analyze payroll by department
   */
  static analyzeDepartmentPayroll(
    payrollRecords: KenyanPayrollRecord[]
  ): DepartmentAnalysis[] {
    // Group records by department (assuming department info is available)
    const departmentGroups = this.groupRecordsByDepartment(payrollRecords);
    const totalPayroll = payrollRecords.reduce((sum, record) => sum + record.grossPay, 0);
    
    const analyses: DepartmentAnalysis[] = [];
    
    Object.entries(departmentGroups).forEach(([department, records]) => {
      const totalGrossPay = records.reduce((sum, record) => sum + record.grossPay, 0);
      const totalNetPay = records.reduce((sum, record) => sum + record.netPay, 0);
      const employeeCount = records.length;
      
      const analysis: DepartmentAnalysis = {
        department,
        employeeCount,
        totalGrossPay,
        totalNetPay,
        averageSalary: employeeCount > 0 ? totalGrossPay / employeeCount : 0,
        payrollPercentage: totalPayroll > 0 ? (totalGrossPay / totalPayroll) * 100 : 0,
        growthRate: this.calculateDepartmentGrowthRate(department),
        costPerEmployee: employeeCount > 0 ? totalGrossPay / employeeCount : 0
      };
      
      analyses.push(analysis);
    });
    
    this.departmentData = analyses;
    return analyses.sort((a, b) => b.totalGrossPay - a.totalGrossPay);
  }

  /**
   * Calculate key payroll metrics
   */
  static calculatePayrollMetrics(
    currentPeriod: PayrollTrend[],
    previousPeriod: PayrollTrend[]
  ): PayrollMetrics {
    const currentTotal = currentPeriod.reduce((sum, trend) => sum + trend.payrollCost, 0);
    const previousTotal = previousPeriod.reduce((sum, trend) => sum + trend.payrollCost, 0);
    
    const payrollGrowthRate = previousTotal > 0 
      ? ((currentTotal - previousTotal) / previousTotal) * 100 
      : 0;
    
    const currentAvgSalary = this.calculateAverageSalary(currentPeriod);
    const previousAvgSalary = this.calculateAverageSalary(previousPeriod);
    const averageSalaryGrowth = previousAvgSalary > 0 
      ? ((currentAvgSalary - previousAvgSalary) / previousAvgSalary) * 100 
      : 0;
    
    return {
      totalPayrollCost: currentTotal,
      payrollGrowthRate,
      averageSalaryGrowth,
      turnoverImpact: this.calculateTurnoverImpact(currentPeriod, previousPeriod),
      seasonalVariation: this.calculateSeasonalVariation(currentPeriod),
      complianceCost: this.calculateComplianceCost(currentPeriod),
      efficiencyRatio: this.calculateEfficiencyRatio(currentPeriod)
    };
  }

  /**
   * Perform cost analysis breakdown
   */
  static performCostAnalysis(payrollTrends: PayrollTrend[]): CostAnalysis[] {
    const latestTrend = payrollTrends[payrollTrends.length - 1];
    const previousTrend = payrollTrends[payrollTrends.length - 2];
    const yearAgoTrend = payrollTrends[payrollTrends.length - 13] || previousTrend;
    
    const totalCost = latestTrend.payrollCost;
    
    const categories = [
      {
        category: 'Gross Salaries',
        amount: latestTrend.grossPay,
        previousAmount: previousTrend?.grossPay || 0,
        yearAgoAmount: yearAgoTrend?.grossPay || 0
      },
      {
        category: 'Statutory Deductions',
        amount: latestTrend.statutoryDeductions,
        previousAmount: previousTrend?.statutoryDeductions || 0,
        yearAgoAmount: yearAgoTrend?.statutoryDeductions || 0
      },
      {
        category: 'Other Deductions',
        amount: latestTrend.otherDeductions,
        previousAmount: previousTrend?.otherDeductions || 0,
        yearAgoAmount: yearAgoTrend?.otherDeductions || 0
      },
      {
        category: 'Employer Contributions',
        amount: latestTrend.grossPay * 0.12, // Approximate employer contributions
        previousAmount: (previousTrend?.grossPay || 0) * 0.12,
        yearAgoAmount: (yearAgoTrend?.grossPay || 0) * 0.12
      }
    ];
    
    return categories.map(cat => {
      const monthlyChange = cat.previousAmount > 0 
        ? ((cat.amount - cat.previousAmount) / cat.previousAmount) * 100 
        : 0;
      const yearlyChange = cat.yearAgoAmount > 0 
        ? ((cat.amount - cat.yearAgoAmount) / cat.yearAgoAmount) * 100 
        : 0;
      
      let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
      if (Math.abs(monthlyChange) > 2) {
        trend = monthlyChange > 0 ? 'increasing' : 'decreasing';
      }
      
      return {
        category: cat.category,
        amount: cat.amount,
        percentage: totalCost > 0 ? (cat.amount / totalCost) * 100 : 0,
        trend,
        monthlyChange,
        yearlyChange
      };
    });
  }

  /**
   * Generate payroll benchmarks
   */
  static generatePayrollBenchmarks(
    currentMetrics: PayrollMetrics,
    departmentAnalyses: DepartmentAnalysis[]
  ): PayrollBenchmark[] {
    // Industry benchmarks (these would typically come from external data sources)
    const industryBenchmarks = {
      payrollGrowthRate: 5.5,
      averageSalaryGrowth: 4.2,
      turnoverImpact: 8.0,
      efficiencyRatio: 0.85,
      complianceCostRatio: 2.5
    };
    
    const bestPractices = {
      payrollGrowthRate: 4.0,
      averageSalaryGrowth: 3.5,
      turnoverImpact: 5.0,
      efficiencyRatio: 0.90,
      complianceCostRatio: 2.0
    };
    
    return [
      {
        metric: 'Payroll Growth Rate (%)',
        currentValue: currentMetrics.payrollGrowthRate,
        industryAverage: industryBenchmarks.payrollGrowthRate,
        bestPractice: bestPractices.payrollGrowthRate,
        variance: currentMetrics.payrollGrowthRate - industryBenchmarks.payrollGrowthRate,
        recommendation: this.getGrowthRateRecommendation(currentMetrics.payrollGrowthRate)
      },
      {
        metric: 'Average Salary Growth (%)',
        currentValue: currentMetrics.averageSalaryGrowth,
        industryAverage: industryBenchmarks.averageSalaryGrowth,
        bestPractice: bestPractices.averageSalaryGrowth,
        variance: currentMetrics.averageSalaryGrowth - industryBenchmarks.averageSalaryGrowth,
        recommendation: this.getSalaryGrowthRecommendation(currentMetrics.averageSalaryGrowth)
      },
      {
        metric: 'Turnover Impact (%)',
        currentValue: currentMetrics.turnoverImpact,
        industryAverage: industryBenchmarks.turnoverImpact,
        bestPractice: bestPractices.turnoverImpact,
        variance: currentMetrics.turnoverImpact - industryBenchmarks.turnoverImpact,
        recommendation: this.getTurnoverRecommendation(currentMetrics.turnoverImpact)
      },
      {
        metric: 'Efficiency Ratio',
        currentValue: currentMetrics.efficiencyRatio,
        industryAverage: industryBenchmarks.efficiencyRatio,
        bestPractice: bestPractices.efficiencyRatio,
        variance: currentMetrics.efficiencyRatio - industryBenchmarks.efficiencyRatio,
        recommendation: this.getEfficiencyRecommendation(currentMetrics.efficiencyRatio)
      }
    ];
  }

  /**
   * Predict payroll impact of policy changes
   */
  static predictPolicyImpact(
    currentTrends: PayrollTrend[],
    policyChange: {
      type: 'salary_increase' | 'tax_rate_change' | 'new_deduction' | 'headcount_change';
      value: number;
      effectiveDate: string;
    }
  ): {
    impactAmount: number;
    impactPercentage: number;
    affectedEmployees: number;
    monthlyImpact: number;
    annualImpact: number;
  } {
    const latestTrend = currentTrends[currentTrends.length - 1];
    let impactAmount = 0;
    let affectedEmployees = latestTrend.employeeCount;
    
    switch (policyChange.type) {
      case 'salary_increase':
        impactAmount = latestTrend.grossPay * (policyChange.value / 100);
        break;
      case 'tax_rate_change':
        impactAmount = latestTrend.statutoryDeductions * (policyChange.value / 100);
        break;
      case 'new_deduction':
        impactAmount = latestTrend.employeeCount * policyChange.value;
        break;
      case 'headcount_change':
        const avgSalary = latestTrend.averageGrossPay;
        impactAmount = policyChange.value * avgSalary;
        affectedEmployees = Math.abs(policyChange.value);
        break;
    }
    
    const impactPercentage = latestTrend.payrollCost > 0 
      ? (impactAmount / latestTrend.payrollCost) * 100 
      : 0;
    
    return {
      impactAmount,
      impactPercentage,
      affectedEmployees,
      monthlyImpact: impactAmount,
      annualImpact: impactAmount * 12
    };
  }

  // Helper methods
  private static groupRecordsByPeriod(records: KenyanPayrollRecord[]): Record<string, KenyanPayrollRecord[]> {
    return records.reduce((groups, record) => {
      // Extract period from payroll period ID or use current month
      const period = record.payrollPeriodId.substring(0, 7) || new Date().toISOString().substring(0, 7);
      if (!groups[period]) {
        groups[period] = [];
      }
      groups[period].push(record);
      return groups;
    }, {} as Record<string, KenyanPayrollRecord[]>);
  }

  private static groupRecordsByDepartment(records: KenyanPayrollRecord[]): Record<string, KenyanPayrollRecord[]> {
    return records.reduce((groups, record) => {
      // For demo purposes, extract department from employee name or use default
      const department = this.extractDepartmentFromRecord(record);
      if (!groups[department]) {
        groups[department] = [];
      }
      groups[department].push(record);
      return groups;
    }, {} as Record<string, KenyanPayrollRecord[]>);
  }

  private static extractDepartmentFromRecord(record: KenyanPayrollRecord): string {
    // In a real implementation, this would come from employee data
    // For demo, we'll assign departments based on employee name patterns to match organizational structure
    const name = record.employeeName.toLowerCase();
    if (name.includes('charlie') || name.includes('admin')) return 'Administration';
    if (name.includes('phillip') || name.includes('wasonga')) return 'Human Resource';
    if (name.includes('sharon') || name.includes('venza') || name.includes('francis') || name.includes('anthony') ||
        name.includes('james') || name.includes('kevin') || name.includes('alice') || name.includes('grace') ||
        name.includes('mary') || name.includes('michael') || name.includes('peter') || name.includes('robert') ||
        name.includes('daniel') || name.includes('catherine')) return 'Operations';
    return 'Operations'; // Default to Operations since most employees are in branches
  }

  private static calculateGrowthRate(values: number[]): number {
    if (values.length < 2) return 0;
    
    const firstValue = values[0];
    const lastValue = values[values.length - 1];
    const periods = values.length - 1;
    
    if (firstValue <= 0) return 0;
    
    return Math.pow(lastValue / firstValue, 1 / periods) - 1;
  }

  private static getSeasonalFactor(month: number): number {
    // Seasonal factors for Kenya (higher in December due to bonuses)
    const factors = [1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.15];
    return factors[month] || 1.0;
  }

  private static getForecastFactors(period: number, seasonalFactor: number): string[] {
    const factors = ['Historical trend analysis'];
    
    if (seasonalFactor > 1.05) {
      factors.push('Seasonal bonus period');
    }
    
    if (period > 3) {
      factors.push('Long-term projection uncertainty');
    }
    
    factors.push('Economic growth assumptions');
    return factors;
  }

  private static calculateDepartmentGrowthRate(department: string): number {
    // Cleaned up: removed legacy mock growth rates comment
    const growthRates: Record<string, number> = {
      'Administration': 2.5,      // Stable administrative growth
      'Human Resource': 3.2,     // Moderate HR growth
      'Operations': 6.8,         // Higher growth in operations (branch expansion)
      'Finance': 4.0,            // Steady financial department growth
      'Marketing': 7.5,          // High growth in marketing for brand expansion
      'Tech': 8.2               // Technology growth for digital transformation
    };
    
    return growthRates[department] || 5.0;
  }

  private static calculateAverageSalary(trends: PayrollTrend[]): number {
    const totalSalary = trends.reduce((sum, trend) => sum + trend.grossPay, 0);
    const totalEmployees = trends.reduce((sum, trend) => sum + trend.employeeCount, 0);
    return totalEmployees > 0 ? totalSalary / totalEmployees : 0;
  }

  private static calculateTurnoverImpact(current: PayrollTrend[], previous: PayrollTrend[]): number {
    // Simplified turnover impact calculation
    const currentAvgEmployees = current.reduce((sum, t) => sum + t.employeeCount, 0) / current.length;
    const previousAvgEmployees = previous.reduce((sum, t) => sum + t.employeeCount, 0) / previous.length;
    
    const employeeChange = Math.abs(currentAvgEmployees - previousAvgEmployees);
    return previousAvgEmployees > 0 ? (employeeChange / previousAvgEmployees) * 100 : 0;
  }

  private static calculateSeasonalVariation(trends: PayrollTrend[]): number {
    if (trends.length < 12) return 0;
    
    const values = trends.map(t => t.grossPay);
    const average = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - average, 2), 0) / values.length;
    
    return Math.sqrt(variance) / average * 100;
  }

  private static calculateComplianceCost(trends: PayrollTrend[]): number {
    const latestTrend = trends[trends.length - 1];
    // Estimate compliance cost as percentage of total payroll
    return latestTrend.payrollCost * 0.025; // 2.5% of payroll cost
  }

  private static calculateEfficiencyRatio(trends: PayrollTrend[]): number {
    const latestTrend = trends[trends.length - 1];
    // Efficiency ratio: net pay / gross pay
    return latestTrend.grossPay > 0 ? latestTrend.netPay / latestTrend.grossPay : 0;
  }

  private static getGrowthRateRecommendation(rate: number): string {
    if (rate > 8) return 'Consider cost control measures';
    if (rate < 2) return 'Review compensation competitiveness';
    return 'Growth rate within acceptable range';
  }

  private static getSalaryGrowthRecommendation(rate: number): string {
    if (rate > 6) return 'Monitor salary inflation impact';
    if (rate < 2) return 'Consider market adjustment';
    return 'Salary growth aligned with market';
  }

  private static getTurnoverRecommendation(rate: number): string {
    if (rate > 10) return 'High turnover - review retention strategies';
    if (rate < 3) return 'Low turnover - good retention';
    return 'Turnover within normal range';
  }

  private static getEfficiencyRecommendation(ratio: number): string {
    if (ratio < 0.7) return 'High deduction ratio - review benefit structure';
    if (ratio > 0.85) return 'Efficient payroll structure';
    return 'Payroll efficiency within normal range';
  }
}
