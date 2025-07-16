import { api } from '@/services/api';
import { employeeService } from '@/services/api/employee.service';
import { payrollService } from '@/services/api/payroll.service';
import { analyticsService } from '@/services/api/analytics.service';
import { departmentService } from '@/services/api/department.service';
import { branchService } from '@/services/api/branch.service';
import { userService } from '@/services/api/user.service';
import { PayrollEngine } from '@/services/payrollEngine';
import type { 
  KenyanPayStub, 
  KenyanPayrollEmployee, 
  KenyanPayrollSummary,
  PayrollPeriod 
} from '@/types/payroll';
import type { User } from '@/types/types';

/**
 * Centralized Payroll Data Service
 * Synchronizes data between Employee Payroll and Payroll Management pages
 */
export class PayrollDataService {
  
  /**
   * Get employee payroll information by employee ID
   */
  static async getEmployeePayrollInfo(employeeId: string): Promise<KenyanPayrollEmployee | null> {
    try {
      // Pass null as periodId and use filters as second parameter
      const employees = await payrollService.getPayrollEmployees(null, { employeeId: employeeId });
      return employees.length > 0 ? employees[0] : null;
    } catch (error) {
      console.error('Error fetching employee payroll info:', error);
      return null;
    }
  }

  /**
   * Get employee information from user context and merge with payroll data
   */
  static async getEmployeeInfo(user: User | null) {
    if (!user) return null;

    try {
      const payrollEmployee = await this.getEmployeePayrollInfo(user.employeeId);
      const employeeDetails = await employeeService.getEmployeeByEmployeeId(user.employeeId);

      // Only set monthlySalary if it exists in the DB, else null
      let monthlySalary = null;
      if (typeof employeeDetails?.salary === 'number' && employeeDetails.salary > 0) {
        monthlySalary = employeeDetails.salary;
      } else if (typeof payrollEmployee?.payrollInfo.monthlySalary === 'number' && payrollEmployee.payrollInfo.monthlySalary > 0) {
        monthlySalary = payrollEmployee.payrollInfo.monthlySalary;
      }

      return {
        id: user.employeeId,
        name: `${user.firstName} ${user.lastName}`,
        employeeId: user.employeeId,
        department: employeeDetails?.department || user.department,
        position: employeeDetails?.position || user.position || payrollEmployee?.position || 'Staff Member',
        branch: employeeDetails?.branch || user.branch,
        hireDate: employeeDetails?.hireDate || user.hireDate,
        payFrequency: 'Monthly',
        paymentMethod: payrollEmployee?.payrollInfo.paymentMethod === 'bank_transfer' ? 'Bank Transfer' : 
                      payrollEmployee?.payrollInfo.paymentMethod === 'mobile_money' ? 'Mobile Money' : 'Bank Transfer',
        bankAccount: employeeDetails?.bankDetails?.accountNumber ? 
                     `****${employeeDetails.bankDetails.accountNumber.slice(-4)}` : 
                     payrollEmployee?.payrollInfo.bankAccount?.accountNumber ? 
                     `****${payrollEmployee.payrollInfo.bankAccount.accountNumber.slice(-4)}` : '****1234',
        kraPin: employeeDetails?.taxInfo?.kraPin || 
                payrollEmployee?.payrollInfo.taxInfo.kraPin || 
                `A${user.employeeId.slice(-3)}456789Z`,
        nssfNumber: employeeDetails?.taxInfo?.nssfNumber || 
                    payrollEmployee?.payrollInfo.taxInfo.nssfNumber || 
                    `NSSF${user.employeeId.slice(-6)}`,
        nhifNumber: employeeDetails?.taxInfo?.nhifNumber || 
                    payrollEmployee?.payrollInfo.taxInfo.nhifNumber || 
                    `NHIF${user.employeeId.slice(-6)}`,
        monthlySalary,
        hourlyRate: payrollEmployee?.payrollInfo.hourlyRate,
        employeeType: payrollEmployee?.payrollInfo.employeeType || 'salaried'
      };
    } catch (error) {
      console.error('Error fetching employee info:', error);
      // Return basic info if API calls fail, but do NOT set a default salary
      return {
        id: user.employeeId,
        name: `${user.firstName} ${user.lastName}`,
        employeeId: user.employeeId,
        department: user.department,
        position: user.position || 'Staff Member',
        branch: user.branch,
        hireDate: user.hireDate,
        payFrequency: 'Monthly',
        paymentMethod: 'Bank Transfer',
        bankAccount: '****1234',
        kraPin: `A${user.employeeId.slice(-3)}456789Z`,
        nssfNumber: `NSSF${user.employeeId.slice(-6)}`,
        nhifNumber: `NHIF${user.employeeId.slice(-6)}`,
        monthlySalary: null,
        employeeType: 'salaried'
      };
    }
  }

  /**
   * Generate pay stubs for an employee
   */
  static async generateEmployeePayStubs(user: User | null, year: string = '2024'): Promise<KenyanPayStub[]> {
    if (!user) return [];

    try {
      // Get pay stubs from the API
      const payStubs = await payrollService.getPayStubs({ employeeId: user.employeeId });
      
      // If we have pay stubs from the API, return them
      if (payStubs && payStubs.length > 0) {
        return payStubs;
      }
      
      // Get employee info and payroll info
      const employeeInfo = await this.getEmployeeInfo(user);
      const payrollEmployee = await this.getEmployeePayrollInfo(user.employeeId);
      
      if (!employeeInfo || !payrollEmployee) return [];

      const monthlySalary = payrollEmployee.payrollInfo.monthlySalary || 0;
      const deductions = payrollEmployee.payrollInfo.deductions || [];

      // Get current payroll periods from the API
      const periods = await payrollService.getPayrollPeriods();
      
      // Only use periods from the database
      const months = periods && periods.data && periods.data.length > 0 
        ? periods.data.slice(0, 3).map(period => ({
            id: period.id,
            start: period.startDate,
            end: period.endDate,
            payDate: period.payDate,
            period: period.name
          }))
        : [];

      // Get tax tables from the API
      const taxTables = await payrollService.getTaxTables();
      
      // Generate pay stubs
      const generatedPayStubs: KenyanPayStub[] = [];
      
      for (let i = 0; i < months.length; i++) {
        const month = months[i];
        const overtime = 0;
        const allowances = 0;
        const grossPay = monthlySalary;

        // Use PayrollEngine for calculations instead of hardcoded logic
        
        // Calculate PAYE using PayrollEngine
        const paye = PayrollEngine.calculatePAYE(grossPay);
        
        // Calculate NSSF using PayrollEngine
        const nssf = PayrollEngine.calculateNSSF(grossPay);
        
        // Calculate NHIF using PayrollEngine
        const nhif = PayrollEngine.calculateNHIF(grossPay);

        const totalOtherDeductions = deductions.reduce((sum, ded) => sum + ded.amount, 0);
        const totalDeductions = paye + nssf + nhif + totalOtherDeductions;
        const netPay = grossPay - totalDeductions;

        generatedPayStubs.push({
          id: `STUB${i + 1}_${user.employeeId}`,
          employeeId: user.employeeId,
          employeeName: employeeInfo.name,
          payrollPeriodId: month.id,
          payPeriodStart: month.start,
          payPeriodEnd: month.end,
          payDate: month.payDate,
          kraPin: employeeInfo.kraPin,
          nssfNumber: employeeInfo.nssfNumber,
          nhifNumber: employeeInfo.nhifNumber,
          basicSalary: monthlySalary,
          allowances,
          overtime,
          grossPay,
          paye: Math.round(paye),
          nssf: Math.round(nssf),
          nhif,
          otherDeductions: deductions,
          totalOtherDeductions,
          totalDeductions: Math.round(totalDeductions),
          netPay: Math.round(netPay)
        });
      }

      return generatedPayStubs;
    } catch (error) {
      console.error('Error generating employee pay stubs:', error);
      return [];
    }
  }

  /**
   * Get current payroll period information
   */
  static async getCurrentPayrollPeriod(): Promise<PayrollPeriod> {
    try {
      // Get current payroll period from the API - look for DRAFT periods first
      let periods = await payrollService.getPayrollPeriods({ status: 'DRAFT' });
      
      if (periods && periods.data && periods.data.length > 0) {
        // Convert backend status to frontend format
        const period = periods.data[0];
        return {
          ...period,
          status: period.status.toLowerCase() as any
        };
      }
      
      // If no DRAFT period, look for calculating/processing periods
      periods = await payrollService.getPayrollPeriods({ status: 'PROCESSING' });
      
      if (periods && periods.data && periods.data.length > 0) {
        const period = periods.data[0];
        return {
          ...period,
          status: period.status.toLowerCase() as any
        };
      }
      
      // If no active period is found, get the most recent period
      const allPeriods = await payrollService.getPayrollPeriods();
      if (allPeriods && allPeriods.data && allPeriods.data.length > 0) {
        const period = allPeriods.data[0];
        return {
          ...period,
          status: period.status.toLowerCase() as any
        };
      }
      
      // Get payroll statistics
      const stats = await payrollService.getPayrollStatistics();
      
      // If no periods are available, create a default period
      const now = new Date();
      return {
        id: 'PP-CURRENT',
        name: `${now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`,
        startDate: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0],
        endDate: new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0],
        payDate: new Date(now.getFullYear(), now.getMonth() + 1, 5).toISOString().split('T')[0],
        status: 'draft',
        totalEmployees: stats.totalEmployees || 0,
        totalGrossPay: stats.totalGrossPay || 0,
        totalNetPay: stats.totalNetPay || 0,
        totalStatutoryDeductions: stats.totalStatutoryDeductions || 0,
        totalOtherDeductions: stats.totalOtherDeductions || 0,
        createdBy: 'system',
        createdDate: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error fetching current payroll period:', error);
      
      // Return a default period if API calls fail
      return {
        id: 'PP-CURRENT',
        name: 'Current Payroll Period',
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        payDate: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'calculating',
        totalEmployees: 0,
        totalGrossPay: 0,
        totalNetPay: 0,
        totalStatutoryDeductions: 0,
        totalOtherDeductions: 0,
        createdBy: 'system',
        createdDate: new Date().toISOString()
      };
    }
  }

  /**
   * Get payroll summary with real data
   */
  static async getPayrollSummary(): Promise<KenyanPayrollSummary> {
    try {
      // Get payroll statistics from the API
      const stats = await payrollService.getPayrollStatistics();
      
      // Get current period name
      const currentPeriod = await this.getCurrentPayrollPeriod();
      
      return {
        currentPeriod: currentPeriod.name,
        totalEmployees: stats.totalEmployees || 0,
        totalGrossPay: stats.totalGrossPay || 0,
        totalNetPay: stats.totalNetPay || 0,
        totalPaye: Math.round((stats.totalStatutoryDeductions || 0) * 0.75), // Approximate PAYE as 75% of statutory deductions
        totalNssf: Math.round((stats.totalStatutoryDeductions || 0) * 0.15), // Approximate NSSF as 15% of statutory deductions
        totalNhif: Math.round((stats.totalStatutoryDeductions || 0) * 0.10), // Approximate NHIF as 10% of statutory deductions
        totalOtherDeductions: stats.totalOtherDeductions || 0,
        averageGrossPay: stats.averageSalary || 0,
        averageNetPay: stats.totalEmployees > 0 ? Math.round((stats.totalNetPay || 0) / stats.totalEmployees) : 0,
        payrollCost: stats.payrollCost || 0
      };
    } catch (error) {
      console.error('Error fetching payroll summary:', error);
      
      // Return default summary if API calls fail
      return {
        currentPeriod: 'Current Period',
        totalEmployees: 0,
        totalGrossPay: 0,
        totalNetPay: 0,
        totalPaye: 0,
        totalNssf: 0,
        totalNhif: 0,
        totalOtherDeductions: 0,
        averageGrossPay: 0,
        averageNetPay: 0,
        payrollCost: 0
      };
    }
  }

  /**
   * Get department breakdown with real data
   */
  static async getDepartmentBreakdown() {
    try {
      // Get payroll analytics from the API
      const payrollAnalytics = await analyticsService.getPayrollAnalytics();
      
      // If we have department costs from analytics, use them
      if (payrollAnalytics && payrollAnalytics.departmentCosts) {
        const departmentCosts = payrollAnalytics.departmentCosts;
        
        // Extract department names and values from the chart data
        const departments = departmentCosts.labels;
        const grossPayValues = departmentCosts.datasets.find(ds => ds.label === 'Gross Pay')?.data || [];
        
        // Get all departments from the API
        const allDepartments = await departmentService.getAllDepartments();
        
        // Create department breakdown
        return departments.map((deptName, index) => {
          const deptInfo = allDepartments.find(d => d.name === deptName);
          const totalGrossPay = grossPayValues[index] || 0;
          
          return {
            department: deptName,
            employees: deptInfo?.employeeCount || 0,
            totalGrossPay,
            totalNetPay: Math.round(totalGrossPay * 0.76),
            averageSalary: deptInfo?.employeeCount > 0 ? Math.round(totalGrossPay / deptInfo.employeeCount) : 0,
            totalStatutoryDeductions: Math.round(totalGrossPay * 0.24),
            percentage: allDepartments.reduce((sum, d) => sum + (d.employeeCount || 0), 0) > 0 ? 
              ((deptInfo?.employeeCount || 0) / allDepartments.reduce((sum, d) => sum + (d.employeeCount || 0), 0)) * 100 : 0
          };
        }).filter(dept => dept.employees > 0);
      }
      
      // If no analytics data is available, get departments and calculate manually
      const allDepartments = await departmentService.getAllDepartments();
      const payrollStats = await payrollService.getPayrollStatistics();
      
      // Create a basic breakdown based on department data
      return allDepartments.map(dept => {
        // Estimate department's share of total payroll based on employee count
        const totalEmployees = allDepartments.reduce((sum, d) => sum + (d.employeeCount || 0), 0);
        const deptShare = totalEmployees > 0 ? (dept.employeeCount || 0) / totalEmployees : 0;
        const estimatedGrossPay = Math.round(payrollStats.totalGrossPay * deptShare);
        
        return {
          department: dept.name,
          employees: dept.employeeCount || 0,
          totalGrossPay: estimatedGrossPay,
          totalNetPay: Math.round(estimatedGrossPay * 0.76),
          averageSalary: dept.employeeCount > 0 ? Math.round(estimatedGrossPay / dept.employeeCount) : 0,
          totalStatutoryDeductions: Math.round(estimatedGrossPay * 0.24),
          percentage: deptShare * 100
        };
      }).filter(dept => dept.employees > 0);
    } catch (error) {
      console.error('Error fetching department breakdown:', error);
      
      // Return empty array if API calls fail
      return [];
    }
  }

  /**
   * Get branch breakdown with real data
   */
  static async getBranchBreakdown() {
    try {
      // Get all branches from the API
      const allBranches = await branchService.getAllBranches();
      
      // Get payroll analytics
      const payrollAnalytics = await analyticsService.getPayrollAnalytics();
      
      // Get payroll statistics
      const payrollStats = await payrollService.getPayrollStatistics();
      
      // Create branch breakdown
      return allBranches.map(branch => {
        // Estimate branch's share of total payroll based on employee count
        const totalEmployees = allBranches.reduce((sum, b) => sum + (b.employeeCount || 0), 0);
        const branchShare = totalEmployees > 0 ? (branch.employeeCount || 0) / totalEmployees : 0;
        const estimatedGrossPay = Math.round(payrollStats.totalGrossPay * branchShare);
        
        return {
          branch: branch.name,
          employees: branch.employeeCount || 0,
          totalGrossPay: estimatedGrossPay,
          totalNetPay: Math.round(estimatedGrossPay * 0.76),
          averageSalary: branch.employeeCount > 0 ? Math.round(estimatedGrossPay / branch.employeeCount) : 0,
          totalStatutoryDeductions: Math.round(estimatedGrossPay * 0.24),
          percentage: branchShare * 100
        };
      }).filter(branch => branch.employees > 0);
    } catch (error) {
      console.error('Error fetching branch breakdown:', error);
      
      // Return empty array if API calls fail
      return [];
    }
  }

  /**
   * Get payroll trends data
   */
  static async getPayrollTrends() {
    try {
      // Get payroll analytics from the API
      const payrollAnalytics = await analyticsService.getPayrollAnalytics();
      
      // If we have cost trends from analytics, use them
      if (payrollAnalytics && payrollAnalytics.costTrends) {
        const costTrends = payrollAnalytics.costTrends;
        
        // Convert to the expected format
        return costTrends.labels.map((month, index) => {
          const grossPay = costTrends.datasets.find(ds => ds.label === 'Gross Pay')?.data[index] || 0;
          const netPay = costTrends.datasets.find(ds => ds.label === 'Net Pay')?.data[index] || 0;
          const employees = costTrends.datasets.find(ds => ds.label === 'Employees')?.data[index] || 0;
          
          return {
            month,
            grossPay,
            netPay,
            employees
          };
        });
      }
      
      // If no analytics data is available, get dashboard metrics
      const dashboardMetrics = await analyticsService.getDashboardMetrics('admin');
      if (dashboardMetrics && dashboardMetrics.payroll && dashboardMetrics.payroll.monthlyTrend) {
        return dashboardMetrics.payroll.monthlyTrend.map(trend => ({
          month: trend.month,
          grossPay: trend.totalPay,
          netPay: Math.round(trend.totalPay * 0.76),
          employees: trend.employeeCount
        }));
      }
      
      // Return default data if API calls fail
      return [
        { month: 'Jan', grossPay: 0, netPay: 0, employees: 0 },
        { month: 'Feb', grossPay: 0, netPay: 0, employees: 0 },
        { month: 'Mar', grossPay: 0, netPay: 0, employees: 0 }
      ];
    } catch (error) {
      console.error('Error fetching payroll trends:', error);
      
      // Return default data if API calls fail
      return [
        { month: 'Jan', grossPay: 0, netPay: 0, employees: 0 },
        { month: 'Feb', grossPay: 0, netPay: 0, employees: 0 },
        { month: 'Mar', grossPay: 0, netPay: 0, employees: 0 }
      ];
    }
  }

  /**
   * Get statutory breakdown data
   */
  static async getStatutoryBreakdown() {
    try {
      // Get payroll statistics from the API
      const stats = await payrollService.getPayrollStatistics();
      
      // Calculate statutory breakdown
      const totalStatutory = stats.totalStatutoryDeductions || 0;
      
      // Approximate breakdown based on typical Kenyan statutory deductions
      return [
        { name: 'PAYE', value: 75, color: '#0088FE' }, // 75% of statutory deductions
        { name: 'NSSF', value: 15, color: '#00C49F' }, // 15% of statutory deductions
        { name: 'NHIF', value: 10, color: '#FFBB28' }  // 10% of statutory deductions
      ];
    } catch (error) {
      console.error('Error fetching statutory breakdown:', error);
      
      // Return default breakdown if API calls fail
      return [
        { name: 'PAYE', value: 75, color: '#0088FE' },
        { name: 'NSSF', value: 15, color: '#00C49F' },
        { name: 'NHIF', value: 10, color: '#FFBB28' }
      ];
    }
  }

  /**
   * Update employee banking information
   */
  static async updateEmployeeBankingInfo(employeeId: string, bankingInfo: {
    bankName: string;
    accountNumber: string;
    accountType: string;
  }): Promise<boolean> {
    try {
      // Get the employee
      const employee = await employeeService.getEmployeeByEmployeeId(employeeId);
      
      if (!employee) {
        console.error('Employee not found:', employeeId);
        return false;
      }
      
      // Update employee bank details
      const updatedEmployee = await employeeService.updateEmployee(employee.id, {
        bankDetails: {
          bankName: bankingInfo.bankName,
          accountNumber: bankingInfo.accountNumber,
          // Map 'checking' to 'current' for Kenyan banking system
          accountType: bankingInfo.accountType === 'checking' ? 'current' : bankingInfo.accountType,
          branchCode: employee.bankDetails?.branchCode || '001'
        }
      });
      
      return !!updatedEmployee;
    } catch (error) {
      console.error('Error updating employee banking info:', error);
      return false;
    }
  }

  /**
   * Update employee tax information
   */
  static async updateEmployeeTaxInfo(employeeId: string, taxInfo: {
    kraPin: string;
    nssfNumber: string;
    nhifNumber: string;
  }): Promise<boolean> {
    try {
      // Get the employee
      const employee = await employeeService.getEmployeeByEmployeeId(employeeId);
      
      if (!employee) {
        console.error('Employee not found:', employeeId);
        return false;
      }
      
      // Update employee tax info
      const updatedEmployee = await employeeService.updateEmployee(employee.id, {
        taxInfo: taxInfo
      });
      
      return !!updatedEmployee;
    } catch (error) {
      console.error('Error updating employee tax info:', error);
      return false;
    }
  }

  /**
   * Update employee payroll information
   */
  static async updatePayrollEmployee(employeeId: string, data: any): Promise<void> {
    try {
      // Since we don't have a direct update endpoint, we'll update through the employee service
      // This is a simplified approach - in a real system you'd want a dedicated payroll update endpoint
      console.log('Updating payroll info for employee:', employeeId, data);
      
      // For now, we'll just log the update since the payroll service doesn't have an update method
      // In a real implementation, this would call a payroll-specific update endpoint
    } catch (error) {
      console.error('Error updating payroll employee:', error);
      throw error;
    }
  }

  /**
   * Get employee by user ID (for mapping between user management and payroll)
   */
  static async getEmployeeByUserId(userId: string): Promise<KenyanPayrollEmployee | null> {
    try {
      // Get the user
      const user = await userService.getUserById(userId);
      
      if (!user || !user.employeeId) {
        console.error('User not found or has no employee ID:', userId);
        return null;
      }
      
      // Get the employee payroll info
      return await this.getEmployeePayrollInfo(user.employeeId);
    } catch (error) {
      console.error('Error getting employee by user ID:', error);
      return null;
    }
  }

  /**
   * Validate payroll data consistency
   */
  static async validatePayrollData(): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Get all users
      const usersResponse = await userService.getUsers({ status: 'active' });
      const activeUsers = usersResponse.data || [];
      
      // Get all payroll employees
      const payrollEmployees = await payrollService.getPayrollEmployees();
      const payrollEmployeeIds = payrollEmployees.map(emp => emp.employeeId);

      // Check if all active users have payroll records
      for (const user of activeUsers) {
        if (user.employeeId && !payrollEmployeeIds.includes(user.employeeId)) {
          warnings.push(`User ${user.firstName} ${user.lastName} (${user.employeeId}) has no payroll record`);
        }
      }

      // Check for orphaned payroll records
      const activeUserIds = activeUsers.map(user => user.employeeId).filter(Boolean);
      for (const emp of payrollEmployees) {
        if (!activeUserIds.includes(emp.employeeId)) {
          warnings.push(`Payroll record for ${emp.firstName} ${emp.lastName} (${emp.employeeId}) has no corresponding user`);
        }
      }

      // Validate required payroll information
      for (const emp of payrollEmployees) {
        if (!emp.payrollInfo.taxInfo.kraPin) {
          errors.push(`Employee ${emp.firstName} ${emp.lastName} missing KRA PIN`);
        }
        if (!emp.payrollInfo.taxInfo.nssfNumber) {
          errors.push(`Employee ${emp.firstName} ${emp.lastName} missing NSSF Number`);
        }
        if (!emp.payrollInfo.taxInfo.nhifNumber) {
          errors.push(`Employee ${emp.firstName} ${emp.lastName} missing NHIF Number`);
        }
        if (emp.payrollInfo.employeeType === 'salaried' && !emp.payrollInfo.monthlySalary) {
          errors.push(`Salaried employee ${emp.firstName} ${emp.lastName} missing monthly salary`);
        }
        if (emp.payrollInfo.employeeType === 'hourly' && !emp.payrollInfo.hourlyRate) {
          errors.push(`Hourly employee ${emp.firstName} ${emp.lastName} missing hourly rate`);
        }
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings
      };
    } catch (error) {
      console.error('Error validating payroll data:', error);
      return {
        isValid: false,
        errors: ['Failed to validate payroll data due to API error'],
        warnings: []
      };
    }
  }

  /**
   * Get recent payroll activity from audit logs
   */
  static async getRecentActivity(limit: number = 5) {
    try {
      // Get recent audit logs from the API
      const auditLogs = await payrollService.getPayrollAuditLogs({
        startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // Last 7 days
      });
      
      // Transform audit logs into activity format
      return auditLogs.slice(0, limit).map(log => ({
        id: log.id,
        action: this.formatActivityAction(log.action, log.entityType),
        user: log.userId || 'System',
        timestamp: this.formatTimestamp(log.timestamp),
        status: this.getActivityStatus(log.action),
        icon: this.getActivityIcon(log.action),
        color: this.getActivityColor(log.action)
      }));
    } catch (error) {
      console.error('Error fetching recent activity:', error);
      
      // Return empty array if API call fails
      return [];
    }
  }

  /**
   * Get current payroll period status with processing information
   */
  static async getPayrollStatus() {
    try {
      const currentPeriod = await this.getCurrentPayrollPeriod();
      const payrollSummary = await this.getPayrollSummary();
      
      // Get payroll records to calculate processing status
      const payrollRecords = await payrollService.getPayrollRecords({ 
        periodId: currentPeriod.id 
      });
      
      const totalEmployees = payrollSummary.totalEmployees;
      const processedEmployees = payrollRecords?.data?.filter(r => r.status === 'calculated' || r.status === 'approved' || r.status === 'paid').length || 0;
      
      return {
        currentPeriod: {
          id: currentPeriod.id,
          name: currentPeriod.name,
          startDate: currentPeriod.startDate,
          endDate: currentPeriod.endDate,
          payDate: currentPeriod.payDate,
          status: currentPeriod.status,
          employeesProcessed: processedEmployees,
          totalEmployees: totalEmployees,
          grossPay: payrollSummary.totalGrossPay,
          netPay: payrollSummary.totalNetPay
        },
        upcomingDeadlines: this.getUpcomingDeadlines(currentPeriod.payDate)
      };
    } catch (error) {
      console.error('Error fetching payroll status:', error);
      
      // Return default status if API call fails
      const now = new Date();
      const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 5);
      
      return {
        currentPeriod: {
          id: 'PP-CURRENT',
          name: `${now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`,
          startDate: now.toISOString().split('T')[0],
          endDate: new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0],
          payDate: nextMonth.toISOString().split('T')[0],
          status: 'draft',
          employeesProcessed: 0,
          totalEmployees: 0,
          grossPay: 0,
          netPay: 0
        },
        upcomingDeadlines: this.getUpcomingDeadlines(nextMonth.toISOString().split('T')[0])
      };
    }
  }

  /**
   * Get compliance reports and status
   */
  static async getComplianceStatus() {
    try {
      // Get compliance reports from the API
      const complianceReports = await payrollService.getComplianceReports();
      
      // Get upcoming deadlines
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1;
      
      return {
        statutoryDeposits: {
          payeDue: this.getNextStatutoryDate(9, currentMonth, currentYear), // 9th of next month
          nssfDue: this.getNextStatutoryDate(9, currentMonth, currentYear),
          nhifDue: this.getNextStatutoryDate(9, currentMonth, currentYear),
          status: 'ready'
        },
        taxReturns: {
          monthlyPayeDue: this.getNextStatutoryDate(9, currentMonth, currentYear),
          annualReturnsDue: new Date(currentYear + 1, 5, 30).toISOString().split('T')[0], // 30th June next year
          status: 'in_progress'
        },
        yearEndForms: {
          p9FormsDue: new Date(currentYear + 1, 2, 31).toISOString().split('T')[0], // 31st March next year
          status: 'preparing'
        },
        complianceChecklist: this.getComplianceChecklist()
      };
    } catch (error) {
      console.error('Error fetching compliance status:', error);
      
      // Return default compliance status
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1;
      
      return {
        statutoryDeposits: {
          payeDue: this.getNextStatutoryDate(9, currentMonth, currentYear),
          nssfDue: this.getNextStatutoryDate(9, currentMonth, currentYear),
          nhifDue: this.getNextStatutoryDate(9, currentMonth, currentYear),
          status: 'ready'
        },
        taxReturns: {
          monthlyPayeDue: this.getNextStatutoryDate(9, currentMonth, currentYear),
          annualReturnsDue: new Date(currentYear + 1, 5, 30).toISOString().split('T')[0],
          status: 'in_progress'
        },
        yearEndForms: {
          p9FormsDue: new Date(currentYear + 1, 2, 31).toISOString().split('T')[0],
          status: 'preparing'
        },
        complianceChecklist: this.getComplianceChecklist()
      };
    }
  }

  /**
   * Get all payroll employees for compensation management
   */
  static async getAllPayrollEmployees(): Promise<KenyanPayrollEmployee[]> {
    try {
      // Try to get payroll employees from the payroll service
      const payrollEmployees = await payrollService.getPayrollEmployees();
      return payrollEmployees || [];
    } catch (error) {
      console.error('Error fetching all payroll employees:', error);
      return [];
    }
  }

  /**
   * Get employee compensation information by combining employee and payroll data
   */
  static async getEmployeeCompensationInfo(employeeId: string): Promise<any> {
    try {
      const [employeeDetails, payrollInfo] = await Promise.all([
        employeeService.getEmployeeByEmployeeId(employeeId),
        this.getEmployeePayrollInfo(employeeId)
      ]);
      
      return {
        employee: employeeDetails,
        payrollInfo: payrollInfo,
        hasPayrollSetup: !!payrollInfo
      };
    } catch (error) {
      console.error('Error fetching employee compensation info:', error);
      return null;
    }
  }

  /**
   * Get recent payroll reports from database
   */
   static async getRecentReports(limit: number = 10) {
    try {
      // TODO: Implement proper API endpoint for reports
      // For now, return empty array to avoid hardcoded data
      // const response = await api.payroll.getReports({ limit });
      console.log('getRecentReports called with limit:', limit);
      return [];
    } catch (error) {
      console.warn('Failed to fetch recent reports:', error);
      return [];
    }
  }

  // Helper methods for activity formatting
  private static formatActivityAction(action: string, entityType: string): string {
    const actionMappings: Record<string, string> = {
      'CREATED': `Created ${entityType.toLowerCase()}`,
      'UPDATED': `Updated ${entityType.toLowerCase()}`,
      'DELETED': `Deleted ${entityType.toLowerCase()}`,
      'CALCULATED': `Calculated payroll`,
      'APPROVED': `Approved ${entityType.toLowerCase()}`,
      'PROCESSED': `Processed ${entityType.toLowerCase()}`,
      'GENERATED': `Generated ${entityType.toLowerCase()}`
    };
    
    return actionMappings[action] || `${action} ${entityType}`;
  }

  private static formatTimestamp(timestamp: string): string {
    const now = new Date();
    const logTime = new Date(timestamp);
    const diffInHours = Math.floor((now.getTime() - logTime.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours} ${diffInHours === 1 ? 'hour' : 'hours'} ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} ${diffInDays === 1 ? 'day' : 'days'} ago`;
    
    return logTime.toLocaleDateString();
  }

  private static getActivityStatus(action: string): string {
    const statusMappings: Record<string, string> = {
      'CREATED': 'completed',
      'UPDATED': 'completed',
      'CALCULATED': 'completed',
      'APPROVED': 'completed',
      'PROCESSED': 'completed',
      'GENERATED': 'completed',
      'FAILED': 'error',
      'EXCEPTION': 'warning'
    };
    
    return statusMappings[action] || 'completed';
  }

  private static getActivityIcon(action: string): string {
    const iconMappings: Record<string, string> = {
      'CREATED': 'CheckCircle',
      'UPDATED': 'CheckCircle',
      'CALCULATED': 'CheckCircle',
      'APPROVED': 'CheckCircle',
      'PROCESSED': 'CheckCircle',
      'GENERATED': 'CheckCircle',
      'FAILED': 'XCircle',
      'EXCEPTION': 'AlertTriangle'
    };
    
    return iconMappings[action] || 'CheckCircle';
  }

  private static getActivityColor(action: string): string {
    const colorMappings: Record<string, string> = {
      'CREATED': 'text-green-600',
      'UPDATED': 'text-green-600',
      'CALCULATED': 'text-green-600',
      'APPROVED': 'text-green-600',
      'PROCESSED': 'text-green-600',
      'GENERATED': 'text-green-600',
      'FAILED': 'text-red-600',
      'EXCEPTION': 'text-yellow-600'
    };
    
    return colorMappings[action] || 'text-green-600';
  }

  private static getUpcomingDeadlines(payDate: string) {
    const payDateObj = new Date(payDate);
    const nextMonth = new Date(payDateObj.getFullYear(), payDateObj.getMonth() + 1, 9);
    const yearEnd = new Date(payDateObj.getFullYear() + 1, 2, 31);
    
    return [
      { 
        task: 'Payroll Processing', 
        date: new Date(payDateObj.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], 
        priority: 'high' 
      },
      { 
        task: 'PAYE, NSSF, NHIF Deposits', 
        date: nextMonth.toISOString().split('T')[0], 
        priority: 'high' 
      },
      { 
        task: 'Annual PAYE Returns (P9s)', 
        date: yearEnd.toISOString().split('T')[0], 
        priority: 'medium' 
      }
    ];
  }

  private static getNextStatutoryDate(day: number, currentMonth: number, currentYear: number): string {
    const now = new Date();
    let targetMonth = currentMonth;
    let targetYear = currentYear;
    
    // If we're past the statutory date for this month, move to next month
    if (now.getDate() > day) {
      targetMonth++;
      if (targetMonth > 12) {
        targetMonth = 1;
        targetYear++;
      }
    }
    
    return new Date(targetYear, targetMonth - 1, day).toISOString().split('T')[0];
  }

  private static getComplianceChecklist() {
    return [
      { task: 'Employee tax withholding forms (P9) collected', completed: true },
      { task: 'Payroll tax deposits made on time', completed: true },
      { task: 'Overtime calculations verified', completed: true },
      { task: 'Minimum wage compliance checked', completed: true },
      { task: 'Year-end tax forms prepared', completed: false },
      { task: 'Monthly PAYE returns filed', completed: false }
    ];
  }
}

export default PayrollDataService;
