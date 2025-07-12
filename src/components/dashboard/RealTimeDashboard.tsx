import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import {
  Users, DollarSign, Calendar, TrendingUp, AlertTriangle, Clock, RefreshCw, Bell
} from 'lucide-react';
import { useApi, useRealTimeData } from '@/hooks/useApi';
import { analyticsService } from '@/services/api/analytics.service';
import { useAuth } from '@/contexts/AuthContext';
import { config } from '@/config/environment';
import type { DashboardMetrics } from '@/services/api/analytics.service';

interface RealTimeDashboardProps {
  role?: string;
  refreshInterval?: number;
}

const RealTimeDashboard: React.FC<RealTimeDashboardProps> = ({
  role,
  refreshInterval = 120000 // Increased to 2 minutes to reduce load
}) => {
  const { user } = useAuth();
  const userRole = role || user?.role || 'employee';
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasInitialLoad, setHasInitialLoad] = useState(false);

  // Main dashboard metrics - fetch once and don't poll constantly
  const {
    data: metrics,
    loading,
    error,
    refetch
  } = useApi(
    () => analyticsService.getDashboardMetrics(userRole),
    {
      immediate: true,
      onSuccess: () => {
        setLastUpdated(new Date());
        setHasInitialLoad(true);
      }
    }
  );

  // Real-time metrics for live updates - only if not in mock mode and initial load is complete
  const { data: realTimeData } = useRealTimeData(
    () => analyticsService.getRealTimeMetrics(),
    {
      interval: refreshInterval,
      enabled: !config.enableMockData && hasInitialLoad && !loading, // Wait for initial load
      onUpdate: () => setLastUpdated(new Date())
    }
  );

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
    } finally {
      setIsRefreshing(false);
    }
  };

  const formatCurrency = (amount?: number) => {
    if (typeof amount !== 'number' || isNaN(amount)) return 'KES 0';
    return new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(amount);
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

  // Defensive helpers with types
  const employees: DashboardMetrics['employees'] = metrics?.employees ?? {
    total: 0,
    active: 0,
    inactive: 0,
    newHires: 0,
    recentHires: [],
    departmentDistribution: [],
    branchDistribution: [],
  };
  const payroll: DashboardMetrics['payroll'] = metrics?.payroll ?? {
    currentPeriod: {
      id: '',
      name: '',
      totalEmployees: 0,
      totalGrossPay: 0,
      totalNetPay: 0,
      totalDeductions: 0,
      status: '',
    },
    monthlyTrend: [],
    upcomingPayments: [],
    costBreakdown: {
      salaries: 0,
      statutory: 0,
      benefits: 0,
      overtime: 0,
    },
  };
  const leave: DashboardMetrics['leave'] = metrics?.leave ?? {
    pendingRequests: 0,
    approvedThisMonth: 0,
    rejectedThisMonth: 0,
    totalDaysRequested: 0,
    leaveTypeBreakdown: [],
    upcomingLeaves: [],
    departmentLeaveStats: [],
  };
  const salaryAdvances: DashboardMetrics['salaryAdvances'] = metrics?.salaryAdvances ?? {
    pendingRequests: 0,
    approvedThisMonth: 0,
    totalOutstanding: 0,
    averageAmount: 0,
    repaymentRate: 0,
    monthlyTrend: [],
    riskMetrics: {
      highRiskEmployees: 0,
      overduePayments: 0,
      defaultRate: 0,
    },
  };
  const alerts = Array.isArray(metrics?.alerts) ? metrics.alerts : [];

  if (loading && !metrics) {
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

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Failed to load dashboard data: {String(error)}
          <Button variant="outline" size="sm" onClick={handleRefresh} className="ml-2">
            <RefreshCw className="h-4 w-4 mr-1" />
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (!metrics) return (
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

  return (
    <div className="space-y-6">
      {/* Header with refresh controls */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {realTimeData && (
            <Badge variant="outline" className={getHealthColor(realTimeData.systemHealth)}>
              System {realTimeData.systemHealth}
            </Badge>
          )}
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={`h-4 w-4 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* System Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-lg font-semibold flex items-center">
            <Bell className="h-5 w-5 mr-2" />
            System Alerts ({alerts.length})
          </h3>
          <div className="grid gap-2">
            {alerts.slice(0, 3).map((alert) => (
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
        {payroll.currentPeriod && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Current Payroll</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(payroll.currentPeriod.totalNetPay)}</div>
              <p className="text-xs text-muted-foreground">{payroll.currentPeriod.name}</p>
              <div className="mt-2 space-y-1">
                <div className="flex justify-between text-xs">
                  <span>Gross Pay:</span>
                  <span>{formatCurrency(payroll.currentPeriod.totalGrossPay)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span>Deductions:</span>
                  <span>{formatCurrency(payroll.currentPeriod.totalDeductions)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        {/* Leave Metrics */}
        {leave && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Leave Requests</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(leave.pendingRequests)}</div>
              <p className="text-xs text-muted-foreground">Pending approval</p>
              <div className="mt-2 space-y-1">
                <div className="flex justify-between text-xs">
                  <span>Approved:</span>
                  <span className="text-green-600">{formatNumber(leave.approvedThisMonth)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span>Rejected:</span>
                  <span className="text-red-600">{formatNumber(leave.rejectedThisMonth)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        {/* Salary Advance Metrics */}
        {salaryAdvances && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Salary Advances</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(salaryAdvances.pendingRequests)}</div>
              <p className="text-xs text-muted-foreground">Pending requests</p>
              <div className="mt-2 space-y-1">
                <div className="flex justify-between text-xs">
                  <span>Outstanding:</span>
                  <span>{formatCurrency(salaryAdvances.totalOutstanding)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span>Repayment Rate:</span>
                  <span className="text-green-600">{formatNumber(salaryAdvances.repaymentRate)}%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Department Distribution */}
      {Array.isArray(employees.departmentDistribution) && employees.departmentDistribution.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Department Distribution</CardTitle>
            <CardDescription>Employee count by department</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {employees.departmentDistribution.map((dept) => (
                <div key={dept.department} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>{dept.department}</span>
                    <span>{formatNumber(dept.count)} ({dept.percentage}%)</span>
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
        {Array.isArray(employees.recentHires) && employees.recentHires.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Recent Hires</CardTitle>
              <CardDescription>New employees this month</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {employees.recentHires.slice(0, 5).map((hire) => (
                  <div key={hire.id} className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <Users className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{hire.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {hire.position} • {hire.department}
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
        {Array.isArray(leave.upcomingLeaves) && leave.upcomingLeaves.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Leaves</CardTitle>
              <CardDescription>Approved leaves starting soon</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {leave.upcomingLeaves.slice(0, 5).map((leaveItem, index) => (
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
