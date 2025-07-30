import React, { useState, useMemo, useCallback, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import {
  Users, DollarSign, Calendar, TrendingUp, AlertTriangle, Clock, RefreshCw, Bell
} from 'lucide-react';
import { usePolling } from '@/hooks/usePolling';
import { useAuth } from '@/contexts/AuthContext';
import { config } from '@/config/environment';
import { apiClient } from '@/services/apiClient';

// --- Inferred Types ---
interface Employee {
  id: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  department: string;
  hireDate: string; // ISO string
}

interface DepartmentDistribution {
  department: string;
  count: number;
  percentage: number;
}

interface EmployeeMetrics {
  total: number;
  active: number; // Assuming all are active for now, as no status is provided
  inactive: number; // Assuming all are active for now
  newHires: number;
  recentHires: Employee[];
  departmentDistribution: DepartmentDistribution[];
  branchDistribution: Array<{ branch: string; count: number; percentage: number }>; // Not directly derivable from employee array alone
}

interface PayrollMetrics {
  currentPeriod: {
    id: string;
    name: string;
    totalEmployees: number;
    totalGrossPay: number;
    totalNetPay: number;
    totalDeductions: number;
    status: string;
  };
  monthlyTrend: any[];
  upcomingPayments: any[];
  costBreakdown: {
    salaries: number;
    statutory: number;
    benefits: number;
    overtime: number;
  };
}

interface LeaveMetrics {
  pendingRequests: number;
  approvedThisMonth: number;
  rejectedThisMonth: number;
  totalDaysRequested: number;
  leaveTypeBreakdown: any[];
  upcomingLeaves: Array<{ employeeName: string; leaveType: string; days: number; startDate: string }>;
  departmentLeaveStats: any[];
}

interface SalaryAdvanceMetrics {
  pendingRequests: number;
  approvedThisMonth: number;
  totalOutstanding: number;
  averageAmount: number;
  repaymentRate: number;
  monthlyTrend: any[];
  riskMetrics: {
    highRiskEmployees: number;
    overduePayments: number;
    defaultRate: number;
  };
}

interface SystemStatus {
  systemHealth: string;
  activeUsers: number;
  pendingApprovals: number;
}

interface Alert {
  id: string;
  type: 'error' | 'warning' | 'info';
  title: string;
  message: string;
  module: string;
}

interface DashboardMetrics {
  employees: EmployeeMetrics;
  payroll: PayrollMetrics;
  leave: LeaveMetrics;
  salaryAdvances: SalaryAdvanceMetrics;
  alerts: Alert[];
  systemStatus?: SystemStatus;
}
// --- End Inferred Types ---


interface RealTimeDashboardProps {
  role?: string;
}

const RealTimeDashboard: React.FC<RealTimeDashboardProps> = ({ role }) => {
  // ...existing code...
  const { user } = useAuth();
  const userRole = role || user?.role || 'employee';
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [metricsData, setMetricsData] = useState<any>(null);
  const [apiLoading, setApiLoading] = useState(false);

  usePolling(async () => {
    setApiLoading(true);
    try {
      const response = await apiClient.get('/dashboard/metrics');
      console.log('API Response (RealTimeDashboard):', response);
      const data = response.data as { status?: string; data?: any };
      if (data?.status === 'success' && data.data) {
        setMetricsData(data.data);
      } else {
        // Fallback: try to set the whole response if structure is unexpected
        setMetricsData(data.data ?? response.data ?? null);
      }
    } catch (error) {
      // ...existing code...
    } finally {
      setApiLoading(false);
    }
  }, { interval: 30000 });

  // Process WebSocket data to derive metrics
  const processedData = useMemo(() => {
    // Defensive mapping: handle both expected and unexpected backend structures
    let dataSource = metricsData;
    // If metricsData is wrapped in a 'data' field, unwrap it
    if (dataSource && typeof dataSource === 'object' && 'data' in dataSource && Object.keys(dataSource).length === 1) {
      dataSource = dataSource.data;
    }
    if (!dataSource) {
      return {
        metrics: null,
        realTimeData: null,
        wsError: null,
        employees: {
          total: 0, active: 0, inactive: 0, newHires: 0, recentHires: [], departmentDistribution: [], branchDistribution: [],
        },
      };
    }

    // Map the actual backend data structure to expected format
    const metrics: DashboardMetrics = {
      employees: {
        total: dataSource.totalEmployees || 0,
        active: dataSource.activeEmployees || 0,
        inactive: 0,
        newHires: 0,
        recentHires: [],
        departmentDistribution: [],
        branchDistribution: [],
      },
      payroll: dataSource.payroll || {
        currentPeriod: { id: '', name: 'No current period', totalEmployees: 0, totalGrossPay: 0, totalNetPay: 0, totalDeductions: 0, status: '' },
        monthlyTrend: [], upcomingPayments: [], costBreakdown: { salaries: 0, statutory: 0, benefits: 0, overtime: 0 },
      },
      leave: {
        pendingRequests: dataSource.pendingLeaveRequests || 0,
        approvedThisMonth: dataSource.leave?.approvedThisMonth || 0,
        rejectedThisMonth: dataSource.leave?.rejectedThisMonth || 0,
        totalDaysRequested: dataSource.leave?.totalDaysRequested || 0,
        leaveTypeBreakdown: dataSource.leave?.leaveTypeBreakdown || [],
        upcomingLeaves: dataSource.leave?.upcomingLeaves || [],
        departmentLeaveStats: dataSource.leave?.departmentLeaveStats || [],
      },
      salaryAdvances: {
        pendingRequests: dataSource.salaryAdvances?.pendingRequests || 0,
        approvedThisMonth: dataSource.salaryAdvances?.approvedThisMonth || 0,
        totalOutstanding: dataSource.salaryAdvances?.totalOutstanding || 0,
        averageAmount: dataSource.salaryAdvances?.averageAmount || 0,
        repaymentRate: dataSource.salaryAdvances?.repaymentRate || 0,
        monthlyTrend: dataSource.salaryAdvances?.monthlyTrend || [],
        riskMetrics: dataSource.salaryAdvances?.riskMetrics || { highRiskEmployees: 0, overduePayments: 0, defaultRate: 0 },
      },
      alerts: Array.isArray(dataSource.alerts) ? dataSource.alerts : [],
      systemStatus: dataSource.systemStatus,
    };

    const realTimeData = dataSource?.systemStatus || dataSource?.systemHealth ? dataSource : null;
    const wsError = dataSource?.error || null;

    // Process employee data if it's an array
    if (metrics?.employees && Array.isArray(metrics.employees)) {
      const employeesArray: Employee[] = metrics.employees;
      const totalEmployees = employeesArray.length;
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth();
      const currentYear = currentDate.getFullYear();

      let newHiresCount = 0;
      const departmentCounts: Record<string, number> = {};
      const recentHiresList = employeesArray.slice(0, 5);

      employeesArray.forEach(employee => {
        if (employee.hireDate) {
          try {
            const hireDate = new Date(employee.hireDate);
            if (hireDate.getMonth() === currentMonth && hireDate.getFullYear() === currentYear) {
              newHiresCount++;
            }
          } catch (e) {
            console.error("Error parsing hireDate:", employee.hireDate, e);
          }
        }
        if (employee.department) {
          departmentCounts[employee.department] = (departmentCounts[employee.department] || 0) + 1;
        }
      });

      const departmentDistributionArray = Object.entries(departmentCounts).map(([department, count]) => ({
        department,
        count,
        percentage: totalEmployees ? (count / totalEmployees) * 100 : 0,
      }));
      departmentDistributionArray.sort((a, b) => b.count - a.count);
      metrics.employees = {
        total: totalEmployees,
        active: totalEmployees,
        inactive: 0,
        newHires: newHiresCount,
        recentHires: recentHiresList,
        departmentDistribution: departmentDistributionArray,
        branchDistribution: [],
      };
    } else {
      metrics.employees = dataSource.employees ?? {
        total: 0, active: 0, inactive: 0, newHires: 0, recentHires: [], departmentDistribution: [], branchDistribution: [],
      };
    }

    return {
      metrics: metrics,
      realTimeData: realTimeData,
      wsError: wsError,
    };
  }, [metricsData]);

  const { metrics, realTimeData, wsError } = processedData;
  // Use the processed employees data, with a fallback for safety
  const employees = metrics?.employees ?? { total: 0, active: 0, inactive: 0, newHires: 0, recentHires: [], departmentDistribution: [], branchDistribution: [] };

  React.useEffect(() => {
    if (metricsData) setLastUpdated(new Date());
  }, [metricsData]); // Depend on metricsData to update lastUpdated

  // Manual refresh: reconnect WebSocket
  const handleRefresh = () => {
    window.location.reload();
  };

  const formatCurrency = (amount?: number) => {
    return new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', minimumFractionDigits: 0 }).format(amount || 0);
  };
  const formatNumber = (num?: number) => (typeof num === 'number' ? new Intl.NumberFormat().format(num) : '0');
  const getHealthColor = (health?: string) => {
    switch (health) {
      case 'healthy': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  if (apiLoading && !metricsData) { // Check loading state and if data is still null
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </CardHeader>
          </Card>
        ))}
      </div>
    );
  }

  // ...existing code...

  if (!metricsData) { // If no data is available after loading, show no data message
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          No dashboard data available.
          <Button variant="outline" size="sm" onClick={handleRefresh} className="ml-2">
            <RefreshCw className="h-4 w-4 mr-1" />
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  // Now use the destructured processedData values
  return (
    <div className="space-y-6">
      {/* Header with polling status */}
      <div className="flex justify-between items-center">
        <div>
          <p className="text-muted-foreground">
            Last updated: {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {realTimeData && (
            <Badge variant="outline" className={getHealthColor(realTimeData.systemHealth)}>
              System {realTimeData.systemHealth}
            </Badge>
          )}
        </div>
      </div>

      {/* System Alerts */}
      {Array.isArray(metrics?.alerts) && metrics.alerts.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-lg font-semibold flex items-center">
            <Bell className="h-5 w-5 mr-2" />
            System Alerts ({metrics.alerts.length})
          </h3>
          <div className="grid gap-2">
            {metrics.alerts.slice(0, 3).map((alert) => (
              <Alert key={alert.id} variant={alert.type === 'error' ? 'destructive' : 'default'}>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>{alert.title}</strong> - {alert.message}
                  <Badge variant="outline" className="ml-2">{alert.module}</Badge>
                </AlertDescription>
              </Alert>
            ))}
          </div>
        </div>
      )}

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Employee Metrics */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(employees.total)}</div>
            <p className="text-xs text-muted-foreground">
              {formatNumber(employees.newHires)} new hires this month
            </p>
            <div className="mt-2">
              <div className="flex justify-between text-xs">
                <span>Active: {formatNumber(employees.active)}</span>
                <span>Inactive: {formatNumber(employees.inactive)}</span>
              </div>
              <Progress value={employees.total ? ((employees.active ?? 0) / employees.total) * 100 : 0} className="mt-1" />
            </div>
          </CardContent>
        </Card>
        {/* Payroll Metrics */}
        {metrics?.payroll?.currentPeriod && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Current Payroll</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(metrics.payroll.currentPeriod.totalNetPay)}</div>
              <p className="text-xs text-muted-foreground">{metrics.payroll.currentPeriod.name}</p>
              <div className="mt-2 space-y-1">
                <div className="flex justify-between text-xs">
                  <span>Gross Pay:</span>
                  <span>{formatCurrency(metrics.payroll.currentPeriod.totalGrossPay)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span>Deductions:</span>
                  <span>{formatCurrency(metrics.payroll.currentPeriod.totalDeductions)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        {/* Leave Metrics */}
        {metrics?.leave && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Leave Requests</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(metrics.leave.pendingRequests)}</div>
              <p className="text-xs text-muted-foreground">Pending approval</p>
              <div className="mt-2 space-y-1">
                <div className="flex justify-between text-xs">
                  <span>Approved:</span>
                  <span className="text-green-600">{formatNumber(metrics.leave.approvedThisMonth)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span>Rejected:</span>
                  <span className="text-red-600">{formatNumber(metrics.leave.rejectedThisMonth)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        {/* Salary Advance Metrics */}
        {metrics?.salaryAdvances && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Salary Advances</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(metrics.salaryAdvances.pendingRequests)}</div>
              <p className="text-xs text-muted-foreground">Pending requests</p>
              <div className="mt-2 space-y-1">
                <div className="flex justify-between text-xs">
                  <span>Outstanding:</span>
                  <span>{formatCurrency(metrics.salaryAdvances.totalOutstanding)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span>Repayment Rate:</span>
                  <span className="text-green-600">{formatNumber(metrics.salaryAdvances.repaymentRate)}%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Department Distribution */}
      {employees?.departmentDistribution && Array.isArray(employees.departmentDistribution) && employees.departmentDistribution.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Department Distribution</CardTitle>
            <CardDescription>Employee count by department</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {employees.departmentDistribution?.map((dept) => (
                <div key={dept.department} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>{dept.department}</span>
                    <span>{formatNumber(dept.count)} ({dept.percentage.toFixed(1)}%)</span>
                  </div>
                  <Progress value={dept.percentage} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Hires */}
        {employees?.recentHires && employees.recentHires.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Recent Hires</CardTitle>
              <CardDescription>New employees this month</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {employees.recentHires?.slice(0, 5).map((hire) => (
                  <div key={hire.id} className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <Users className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{hire.firstName} {hire.lastName}</p>
                      <p className="text-xs text-muted-foreground">
                        {hire.department}
                      </p>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {hire.hireDate ? new Date(hire.hireDate).toLocaleDateString() : ''}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
        {/* Upcoming Leaves */}
        {metrics?.leave?.upcomingLeaves && metrics.leave.upcomingLeaves.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Leaves</CardTitle>
              <CardDescription>Approved leaves starting soon</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {metrics.leave.upcomingLeaves.slice(0, 5).map((leaveItem, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <Calendar className="h-4 w-4 text-green-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{leaveItem.employeeName}</p>
                      <p className="text-xs text-muted-foreground">
                        {leaveItem.leaveType} • {leaveItem.days} days
                      </p>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {leaveItem.startDate ? new Date(leaveItem.startDate).toLocaleDateString() : ''}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Real-time Status */}
      {realTimeData && (
        <Card>
          <CardHeader>
            <CardTitle>System Status</CardTitle>
            <CardDescription>Real-time system information</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${
                  realTimeData.systemHealth === 'healthy' ? 'bg-green-500' :
                  realTimeData.systemHealth === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                }`}></div>
                <span className="text-sm">System Health: {realTimeData.systemHealth}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Active Users: {formatNumber(realTimeData.activeUsers)}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  Pending Approvals: {formatNumber(realTimeData.pendingApprovals)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default RealTimeDashboard;
