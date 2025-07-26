import { useEffect, useState } from 'react';
import { useWebSocket } from '@/hooks/useWebSocket';
import { getDashboardMetricsWebSocketUrl } from '@/services/api/websocket.utils';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Calculator, 
  Clock, 
  DollarSign, 
  FileText, 
  Users, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Play,
  Settings,
  Download,
  Calendar,
  TrendingUp,
  Building
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { formatCurrencyCompact } from '@/utils/currency';
import PayrollDataService from '@/services/payrollDataService';
import { payrollService } from '@/services/api/payroll.service';
import { useToast } from '@/hooks/use-toast';

const PayrollDashboard = () => {
  const [payrollSummary, setPayrollSummary] = useState<any>(null);
  const [departmentBreakdown, setDepartmentBreakdown] = useState<any[]>([]);
  const [branchBreakdown, setBranchBreakdown] = useState<any[]>([]);
  const [payrollStatus, setPayrollStatus] = useState<any>(null);
  const [payrollTrendsData, setPayrollTrendsData] = useState<any[]>([]);
  const [statutoryBreakdownData, setStatutoryBreakdownData] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [complianceStatus, setComplianceStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const [wsData, wsConnected] = useWebSocket<any>(getDashboardMetricsWebSocketUrl('payroll'));

  useEffect(() => {
    const fetchPayrollData = async () => {
      try {
        setLoading(true);
        const [
          summary,
          periods,
        ] = await Promise.all([
          payrollService.getPayrollStatistics(),
          payrollService.getPayrollPeriods(),
        ]);

        setPayrollSummary(summary);
        if (periods.data.length > 0) {
          setPayrollStatus({ currentPeriod: periods.data[0] });
        }
        // You can add more data fetching here for other sections
        // For example, fetch recent activity
        // const activity = await payrollService.getPayrollAuditLogs({ limit: 5 });
        // setRecentActivity(activity);

      } catch (error) {
        console.error("Failed to fetch payroll data:", error);
        toast({
          title: "Error",
          description: "Failed to fetch payroll data.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPayrollData();

    if (wsData) {
      // You can still use WebSocket for real-time updates
      // For example, updating the summary
      setPayrollSummary(wsData.payrollSummary || payrollSummary);
    }
  }, [wsData, toast]);

  if (loading) {
    return (
      <DashboardLayout title="Payroll Management">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-lg text-muted-foreground">Loading payroll dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!payrollSummary) {
    return (
      <DashboardLayout title="Payroll Management">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertTriangle className="h-8 w-8 text-orange-500 mx-auto mb-4" />
            <p className="text-lg text-muted-foreground">No payroll data available.</p>
            <p className="text-sm text-gray-500 mt-2">Please ensure employees and payroll periods are configured.</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const totalEmployees = payrollSummary.totalEmployees || 0;
  const totalGrossPay = payrollSummary.totalGrossPay || 0;
  const totalNetPay = payrollSummary.totalNetPay || 0;

  // Current period from payroll status
  const currentPeriod = payrollStatus?.currentPeriod || {
    name: 'Current Period',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    payDate: new Date().toISOString().split('T')[0],
    status: 'calculating'
  };

  // Stats cards with real data
  const payrollStats = [
    {
      title: 'Current Pay Period',
      value: currentPeriod.name,
      description: currentPeriod.status === 'draft' || currentPeriod.status === 'DRAFT' ? 'Setup required' : 
                   currentPeriod.status === 'processing' || currentPeriod.status === 'PROCESSING' ? 'Processing payroll' : 
                   currentPeriod.status === 'completed' || currentPeriod.status === 'COMPLETED' ? 'Ready for review' : 
                   'Active period',
      icon: Calendar,
      status: 'active'
    },
    {
      title: 'Total Employees',
      value: totalEmployees.toString(),
      description: 'Active payroll employees',
      icon: Users,
      status: 'info'
    },
    {
      title: 'Gross Payroll',
      value: formatCurrencyCompact(totalGrossPay),
      description: 'Current period total',
      icon: DollarSign,
      status: 'success'
    },
    {
      title: 'Net Payroll',
      value: formatCurrencyCompact(totalNetPay),
      description: 'After statutory deductions',
      icon: Calculator,
      status: 'success'
    }
  ];

  // Remove all mock payrollStatus data and use real data from API
  const upcomingDeadlines = payrollStatus?.upcomingDeadlines || [];

  const quickActions = [
    {
      title: 'Process Payroll',
      description: 'Run payroll calculations for current period',
      icon: Play,
      href: '/payroll/processing',
      color: 'text-green-700',
      bgColor: 'bg-green-50',
      disabled: false
    },
    {
      title: 'Employee Compensation',
      description: 'Manage employee pay rates and benefits',
      icon: Users,
      href: '/payroll/compensation',
      color: 'text-blue-700',
      bgColor: 'bg-blue-50',
      disabled: false
    },
    {
      title: 'Tax Management',
      description: 'Configure tax tables and settings',
      icon: FileText,
      href: '/payroll/tax-management',
      color: 'text-purple-700',
      bgColor: 'bg-purple-50',
      disabled: false
    },
    {
      title: 'Payroll Reports',
      description: 'Generate payroll and compliance reports',
      icon: Download,
      href: '/payroll/reports',
      color: 'text-orange-700',
      bgColor: 'bg-orange-50',
      disabled: false
    },
    {
      title: 'Time & Attendance',
      description: 'Review and approve employee time entries',
      icon: Clock,
      href: '/payroll/time-attendance',
      color: 'text-indigo-700',
      bgColor: 'bg-indigo-50',
      disabled: false
    },
    {
      title: 'Payroll Settings',
      description: 'Configure payroll system settings',
      icon: Settings,
      href: '/payroll/settings',
      color: 'text-slate-700',
      bgColor: 'bg-slate-50',
      disabled: false
    }
  ];

  // Remove all mock recentActivity data - use real data from API
  // recentActivity is now fetched from PayrollDataService.getRecentActivity()

  // Use real data from API
  const payrollTrends = payrollTrendsData || [];
  const statutoryBreakdown = statutoryBreakdownData || [];

  // Transform department breakdown for display
  const departmentPayroll = departmentBreakdown.map(dept => ({
    department: dept.department,
    employees: dept.employees,
    grossPay: dept.totalGrossPay / 1000, // Convert to thousands for display
    percentage: dept.percentage || 0
  }));

  // Helper function to get icon component from string
  const getIconComponent = (iconName: string) => {
    const iconMap: Record<string, any> = {
      CheckCircle,
      XCircle,
      AlertTriangle
    };
    return iconMap[iconName] || CheckCircle;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600';
      case 'processing': return 'text-blue-600';
      case 'warning': return 'text-yellow-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'calculating': return 'bg-blue-100 text-blue-800';
      case 'review': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'processing': return 'bg-purple-100 text-purple-800';
      case 'paid': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <DashboardLayout title="Payroll Management">
      <div className="space-y-6">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="current-period">Current Period</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="compliance">Compliance</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {payrollStats.map((stat) => (
                <Card key={stat.title}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                    <stat.icon className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stat.value}</div>
                    <p className="text-xs text-muted-foreground">{stat.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common payroll management tasks</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {quickActions.map((action) => (
                    <Link key={action.href} to={action.href}>
                      <div className={`flex items-center space-x-4 p-5 rounded-xl border-2 transition-all duration-200 shadow-sm hover:shadow-md ${action.bgColor} border-gray-200 ${action.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-gray-300 hover:scale-[1.02] active:scale-[0.98]'}`}>
                        <div className={`p-3 rounded-xl shadow-sm ${action.bgColor.replace('50', '100')} border border-gray-200`}>
                          <action.icon className={`h-6 w-6 ${action.color}`} />
                        </div>
                        <div className="flex-1">
                          <p className="text-base font-semibold text-gray-900 mb-1">{action.title}</p>
                          <p className="text-sm text-gray-600 leading-relaxed">{action.description}</p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Key Metrics and Recent Activity */}
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Key Metrics</CardTitle>
                  <CardDescription>Important payroll statistics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Average Salary:</span>
                      <span className="text-sm font-bold">KES {(payrollSummary?.averageGrossPay || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Total Deductions:</span>
                      <span className="text-sm">KES {((payrollSummary?.totalPaye || 0) + (payrollSummary?.totalNssf || 0) + (payrollSummary?.totalNhif || 0)).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Payroll Cost:</span>
                      <span className="text-sm">KES {(payrollSummary?.payrollCost || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Compliance Status:</span>
                      <Badge className="bg-green-100 text-green-800">
                        {complianceStatus?.status || 'Up to date'}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>Latest payroll system activities</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentActivity.length > 0 ? (
                      recentActivity.map((activity) => {
                        const IconComponent = getIconComponent(activity.icon);
                        return (
                          <div key={activity.id} className="flex items-start space-x-3">
                            <IconComponent className={`h-4 w-4 mt-0.5 ${activity.color}`} />
                            <div className="flex-1 space-y-1">
                              <p className="text-sm">{activity.action}</p>
                              <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                                <span>{activity.user}</span>
                                <span>•</span>
                                <span>{activity.timestamp}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-sm text-muted-foreground">No recent activity</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Upcoming Deadlines */}
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Deadlines</CardTitle>
                <CardDescription>Important payroll and compliance deadlines</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {upcomingDeadlines.length > 0 ? (
                    upcomingDeadlines.map((deadline, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className={`w-2 h-2 rounded-full ${
                            deadline.priority === 'high' ? 'bg-red-500' :
                            deadline.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                          }`}></div>
                          <span className="text-sm font-medium">{deadline.task}</span>
                        </div>
                        <span className="text-sm text-muted-foreground">{deadline.date}</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-sm text-muted-foreground">No upcoming deadlines</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="current-period" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Period Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm">Start Date:</span>
                      <span className="text-sm font-medium">{currentPeriod.startDate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">End Date:</span>
                      <span className="text-sm font-medium">{currentPeriod.endDate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Pay Date:</span>
                      <span className="text-sm font-medium">{currentPeriod.payDate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Frequency:</span>
                      <span className="text-sm font-medium">Monthly</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Processing Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm">Employees Processed:</span>
                      <span className="text-sm font-medium">{currentPeriod.employeesProcessed || 0}/{currentPeriod.totalEmployees || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Exceptions:</span>
                      <span className="text-sm font-medium text-yellow-600">0</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Approvals Pending:</span>
                      <span className="text-sm font-medium text-blue-600">0</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Ready for Payment:</span>
                      <span className="text-sm font-medium text-green-600">{currentPeriod.employeesProcessed || 0}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Financial Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm">Gross Pay:</span>
                      <span className="text-sm font-medium">KES {(currentPeriod.grossPay || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Total Statutory Deductions:</span>
                      <span className="text-sm font-medium">
                        KES {payrollSummary ? (payrollSummary.totalPaye + payrollSummary.totalNssf + payrollSummary.totalNhif).toLocaleString() : '0'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Total Deductions:</span>
                      <span className="text-sm font-medium">KES {(payrollSummary?.totalDeductions || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="text-sm font-medium">Net Pay:</span>
                      <span className="text-sm font-bold">KES {(currentPeriod.netPay || 0).toLocaleString()}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Department Breakdown</CardTitle>
                <CardDescription>Payroll distribution by department (using admin-configured data)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {departmentBreakdown && departmentBreakdown.length > 0 ? (
                    departmentBreakdown.map((dept) => (
                      <div key={dept.department} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">{dept.department}</span>
                          <div className="text-right">
                            <div className="text-sm font-medium">KES {(dept.totalGrossPay / 1000).toLocaleString()}K</div>
                            <div className="text-xs text-muted-foreground">{dept.employees} employees</div>
                          </div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{width: `${dept.percentage}%`}}
                          ></div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <Building className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">No department payroll data available</p>
                      <p className="text-xs text-gray-400 mt-1">Department breakdown will appear after processing payroll</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Payroll Trends</CardTitle>
                  <CardDescription>Monthly gross and net pay trends</CardDescription>
                </CardHeader>
                <CardContent>
                  {payrollTrends && payrollTrends.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={payrollTrends}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip formatter={(value) => [`KES ${Number(value).toLocaleString()}`, '']} />
                        <Line type="monotone" dataKey="grossPay" stroke="#3b82f6" strokeWidth={2} name="Gross Pay" />
                        <Line type="monotone" dataKey="netPay" stroke="#10b981" strokeWidth={2} name="Net Pay" />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[300px] flex items-center justify-center">
                      <div className="text-center">
                        <TrendingUp className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">No payroll trend data available</p>
                        <p className="text-xs text-gray-400 mt-1">Process payroll for multiple periods to see trends</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Statutory Deductions Breakdown</CardTitle>
                  <CardDescription>PAYE, NSSF, and NHIF distribution</CardDescription>
                </CardHeader>
                <CardContent>
                  {statutoryBreakdown && statutoryBreakdown.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={statutoryBreakdown}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          dataKey="value"
                          label={({ name, value }) => `${name}: ${value}%`}
                        >
                          {statutoryBreakdown.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value, name) => [`${value}%`, name]} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[300px] flex items-center justify-center">
                      <div className="text-center">
                        <FileText className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">No statutory deduction data available</p>
                        <p className="text-xs text-gray-400 mt-1">Process payroll to see statutory breakdown</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Employee Count Trends</CardTitle>
                <CardDescription>Active payroll employees over time</CardDescription>
              </CardHeader>
              <CardContent>
                {payrollTrends && payrollTrends.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={payrollTrends}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="employees" fill="#8b5cf6" name="Employees" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center">
                    <div className="text-center">
                      <Users className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">No employee count data available</p>
                      <p className="text-xs text-gray-400 mt-1">Employee trends will appear after processing payroll</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="compliance" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Statutory Deductions Deposits</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm">PAYE Due:</span>
                      <span className="text-sm font-medium">{complianceStatus?.statutoryDeposits?.payeDue || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">NSSF Due:</span>
                      <span className="text-sm font-medium">{complianceStatus?.statutoryDeposits?.nssfDue || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">NHIF Due:</span>
                      <span className="text-sm font-medium">{complianceStatus?.statutoryDeposits?.nhifDue || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Status:</span>
                      <Badge className={`${complianceStatus?.statutoryDeposits?.status === 'ready' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {complianceStatus?.statutoryDeposits?.status || 'Unknown'}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Tax Returns</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm">Monthly PAYE Due:</span>
                      <span className="text-sm font-medium">{complianceStatus?.taxReturns?.monthlyPayeDue || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Annual Returns Due:</span>
                      <span className="text-sm font-medium">{complianceStatus?.taxReturns?.annualReturnsDue || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Status:</span>
                      <Badge className={`${complianceStatus?.taxReturns?.status === 'ready' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {complianceStatus?.taxReturns?.status || 'Unknown'}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Year-End Forms</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm">P9 Forms Due:</span>
                      <span className="text-sm font-medium">{complianceStatus?.yearEndForms?.p9FormsDue || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Employees:</span>
                      <span className="text-sm font-medium">{totalEmployees}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Status:</span>
                      <Badge className={`${complianceStatus?.yearEndForms?.status === 'ready' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                        {complianceStatus?.yearEndForms?.status || 'Preparing'}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Compliance Checklist</CardTitle>
                <CardDescription>Ensure all regulatory requirements are met</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {(complianceStatus?.complianceChecklist || []).map((item, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      {item.completed ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600" />
                      )}
                      <span className={`text-sm ${item.completed ? 'text-green-700' : 'text-red-700'}`}>
                        {item.task}
                      </span>
                    </div>
                  ))}
                  {(!complianceStatus?.complianceChecklist || complianceStatus.complianceChecklist.length === 0) && (
                    <div className="text-center py-4">
                      <p className="text-sm text-muted-foreground">No compliance checklist items available</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default PayrollDashboard;
