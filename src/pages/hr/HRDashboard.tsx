import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Calendar, TrendingUp, UserCheck, BookOpen, Building, Award, Clock, DollarSign } from 'lucide-react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { useState, useEffect } from 'react';
import { analyticsService } from '@/services/api/analytics.service';

const HRDashboard = () => {
  const [dashboardMetrics, setDashboardMetrics] = useState(null);
  const [employeeAnalytics, setEmployeeAnalytics] = useState(null);
  const [leaveAnalytics, setLeaveAnalytics] = useState(null);
  const [performanceAnalytics, setPerformanceAnalytics] = useState(null);
  const [trainingAnalytics, setTrainingAnalytics] = useState(null);
  const [salaryAdvanceAnalytics, setSalaryAdvanceAnalytics] = useState(null);
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [metrics, emp, leave, perf, train, advance, activities] = await Promise.all([
          analyticsService.getDashboardMetrics('hr'),
          analyticsService.getEmployeeAnalytics(),
          analyticsService.getLeaveAnalytics(),
          analyticsService.getPerformanceAnalytics(),
          analyticsService.getTrainingAnalytics(),
          analyticsService.getSalaryAdvanceAnalytics(),
          analyticsService.getRecentActivities(10),
        ]);
        
        setDashboardMetrics(metrics);
        setEmployeeAnalytics(emp);
        setLeaveAnalytics(leave);
        setPerformanceAnalytics(perf);
        setTrainingAnalytics(train);
        setSalaryAdvanceAnalytics(advance);
        setRecentActivities(Array.isArray(activities) ? activities : []);
      } catch (e) {
        // Log the error for debugging
        console.error('Dashboard fetch error:', e);
        setDashboardMetrics(null);
        setEmployeeAnalytics(null);
        setLeaveAnalytics(null);
        setPerformanceAnalytics(null);
        setTrainingAnalytics(null);
        setSalaryAdvanceAnalytics(null);
        setRecentActivities([]);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  if (loading) {
    return (
      <DashboardLayout title="HR Dashboard">
        <div className="flex items-center justify-center h-96">
          <span className="text-lg text-muted-foreground">Loading dashboard...</span>
        </div>
      </DashboardLayout>
    );
  }

  if (!dashboardMetrics) {
    return (
      <DashboardLayout title="HR Dashboard">
        <div className="flex items-center justify-center h-96">
          <span className="text-lg text-red-500">Failed to load dashboard data.</span>
        </div>
      </DashboardLayout>
    );
  }

  // Example: Overview stats
  const stats = [
    {
      title: 'Active Employees',
      value: dashboardMetrics?.employees?.active || 0,
      description: `+${dashboardMetrics?.employees?.newHires || 0} new hires this month`,
      icon: Users,
    },
    {
      title: 'Pending Leave Requests',
      value: dashboardMetrics?.leave?.pendingRequests || 0,
      description: 'Awaiting approval',
      icon: Calendar,
    },
    {
      title: 'Salary Advances',
      value: dashboardMetrics?.salaryAdvances?.pendingRequests || 0,
      description: 'Pending approval',
      icon: DollarSign,
    },
    {
      title: 'Performance Reviews',
      value: dashboardMetrics?.performance?.pendingReviews || 0,
      description: 'Due this month',
      icon: UserCheck,
    },
  ];

  // Example: Quick Actions (static, but you can make dynamic if needed)
  const quickActions = [
    {
      title: 'Employee Management',
      description: 'Add, edit, and manage employee records',
      icon: Users,
      href: '/hr/employees',
      color: 'text-blue-600'
    },
    {
      title: 'Branch Management',
      description: 'Organize and manage company branches',
      icon: Building,
      href: '/hr/branches',
      color: 'text-green-600'
    },
    {
      title: 'Leave Approvals',
      description: 'Review and approve employee leave requests',
      icon: Calendar,
      href: '/hr/leave',
      color: 'text-orange-600'
    },
    {
      title: 'Salary Advances',  
      description: 'Manage salary advance requests and analytics',
      icon: DollarSign,
      href: '/hr/salary-advances',
      color: 'text-emerald-600'
    },
    {
      title: 'Payroll Management',
      description: 'Access payroll processing and compensation tools',
      icon: TrendingUp,
      href: '/payroll/dashboard',
      color: 'text-cyan-600'
    },
    {
      title: 'Performance Reviews',
      description: 'Manage employee performance evaluations',
      icon: Award,
      href: '/hr/performance',
      color: 'text-purple-600'
    },
    {
      title: 'Training Programs',
      description: 'Create and manage training programs',
      icon: BookOpen,
      href: '/hr/training',
      color: 'text-indigo-600'
    }
  ];

  // Example: Employee Analytics - safely transform data
  const employeeGrowthData = employeeAnalytics?.headcount?.labels?.map((month, idx) => ({
    month,
    employees: employeeAnalytics?.headcount?.datasets?.[0]?.data?.[idx] || 0,
    hires: employeeAnalytics?.hireVsTermination?.datasets?.[0]?.data?.[idx] || 0,
    departures: employeeAnalytics?.hireVsTermination?.datasets?.[1]?.data?.[idx] || 0,
  })) || [];

  // Example: Leave Analytics - safely transform data
  const leaveAnalyticsData = leaveAnalytics?.leaveTypeUsage?.map(type => ({
    type: type.type,
    approved: type.days || 0,
    pending: type.pending || 0,
    rejected: type.rejected || 0
  })) || [];

  // Example: Performance Analytics - safely transform data
  const performanceDistribution = performanceAnalytics?.departmentPerformance?.map(dep => ({
    name: dep.department,
    value: dep.score,
    color: '#3b82f6'
  })) || [];

  // Example: Training Analytics - safely transform data
  const trainingProgress = trainingAnalytics?.programs?.map(program => ({
    program: program.program || 'Unknown Program',
    completed: program.completed || 0,
    total: program.total || 0,
    percentage: program.percentage || 0
  })) || [];

  // Example: Salary Advance Analytics - safely transform data
  const salaryAdvanceStats = salaryAdvanceAnalytics?.requestTrends?.labels?.map((month, idx) => ({
    month,
    amount: salaryAdvanceAnalytics?.requestTrends?.datasets?.[0]?.data?.[idx] || 0,
    requests: salaryAdvanceAnalytics?.requestTrends?.datasets?.[1]?.data?.[idx] || 0,
    avgAmount: 0
  })) || [];

  return (
    <DashboardLayout title="HR Dashboard">
      <div className="space-y-6">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="employees">Employee Analytics</TabsTrigger>
            <TabsTrigger value="leave">Leave Analytics</TabsTrigger>
            <TabsTrigger value="performance">Performance Analytics</TabsTrigger>
            <TabsTrigger value="training">Training Analytics</TabsTrigger>
            <TabsTrigger value="advances">Salary Advance Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {stats.map((stat) => (
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

            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Recent HR Activities</CardTitle>
                  <CardDescription>Latest HR processes and employee updates</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentActivities.length === 0 ? (
                      <div className="text-sm text-muted-foreground">No recent activities.</div>
                    ) : (
                      recentActivities.map((activity) => (
                        <div className="flex items-center space-x-4" key={activity.id}>
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <div className="flex-1">
                            <p className="text-sm">{activity.action} - {activity.userName}</p>
                            <p className="text-xs text-muted-foreground">{new Date(activity.timestamp).toLocaleString()}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>HR Quick Actions</CardTitle>
                  <CardDescription>Access key HR management features</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3">
                    {quickActions.map((action) => (
                      <Link key={action.href} to={action.href}>
                        <div className="flex items-center justify-start space-x-3 p-3 hover:bg-muted rounded-md transition-colors cursor-pointer border border-transparent hover:border-border">
                          <action.icon className={`h-5 w-5 ${action.color}`} />
                          <div className="flex-1">
                            <p className="text-sm font-medium">{action.title}</p>
                            <p className="text-xs text-muted-foreground">{action.description}</p>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* ... keep existing code (department overview and other cards) */}
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Pending Approvals</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-orange-500" />
                        <span className="text-sm">Leave Requests</span>
                      </div>
                      <span className="text-sm font-medium">{dashboardMetrics?.leave?.pendingRequests || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <DollarSign className="h-4 w-4 text-emerald-500" />
                        <span className="text-sm">Salary Advances</span>
                      </div>
                      <span className="text-sm font-medium">{dashboardMetrics?.salaryAdvances?.pendingRequests || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-blue-500" />
                        <span className="text-sm">Time Off Adjustments</span>
                      </div>
                      <span className="text-sm font-medium">{dashboardMetrics?.leave?.approvedThisMonth || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Award className="h-4 w-4 text-purple-500" />
                        <span className="text-sm">Performance Reviews</span>
                      </div>
                      <span className="text-sm font-medium">{dashboardMetrics?.performance?.pendingReviews || 0}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Branch Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {(!dashboardMetrics?.employees?.branchDistribution || dashboardMetrics.employees.branchDistribution.length === 0) ? (
                      <span className="text-sm text-muted-foreground">No branch data.</span>
                    ) : (
                      dashboardMetrics.employees.branchDistribution.map((branch) => (
                        <div className="flex justify-between" key={branch.branch}>
                          <span className="text-sm">{branch.branch}</span>
                          <span className="text-sm font-medium">{branch.count} employees</span>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Training Progress</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {(!trainingAnalytics?.programs || trainingAnalytics.programs.length === 0) ? (
                      <span className="text-sm text-muted-foreground">No training data.</span>
                    ) : (
                      trainingAnalytics.programs.map((program) => (
                        <div className="flex justify-between" key={program.program}>
                          <span className="text-sm">{program.program}</span>
                          <span className="text-sm font-medium">{program.percentage || 0}%</span>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="employees" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Employee Growth Trends</CardTitle>
                  <CardDescription>Monthly employee count, hires, and departures</CardDescription>
                </CardHeader>
                <CardContent>
                  {(!employeeGrowthData || employeeGrowthData.length === 0) ? (
                    <div className="flex items-center justify-center h-[300px]">
                      <span className="text-sm text-muted-foreground">No employee data available</span>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={employeeGrowthData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Line type="monotone" dataKey="employees" stroke="#3b82f6" strokeWidth={2} />
                        <Line type="monotone" dataKey="hires" stroke="#22c55e" strokeWidth={2} />
                        <Line type="monotone" dataKey="departures" stroke="#ef4444" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Branch Distribution</CardTitle>
                  <CardDescription>Employee count by branch</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {(!dashboardMetrics?.employees?.branchDistribution || dashboardMetrics.employees.branchDistribution.length === 0) ? (
                      <span className="text-sm text-muted-foreground">No branch data available.</span>
                    ) : (
                      dashboardMetrics.employees.branchDistribution.map((branch, idx) => {
                        const colors = ['bg-blue-600', 'bg-green-600', 'bg-purple-600', 'bg-orange-600', 'bg-cyan-600', 'bg-pink-600'];
                        const color = colors[idx % colors.length];
                        return (
                          <div className="flex justify-between items-center" key={branch.branch}>
                            <span className="text-sm">{branch.branch}</span>
                            <div className="flex items-center space-x-2">
                              <div className="w-20 bg-gray-200 rounded-full h-2">
                                <div className={`${color} h-2 rounded-full`} style={{width: `${branch.percentage || 0}%`}}></div>
                              </div>
                              <span className="text-sm font-medium">{branch.count}</span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="leave" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Leave Request Analytics</CardTitle>
                <CardDescription>Analysis of leave requests by type and status</CardDescription>
              </CardHeader>                <CardContent>
                  {(!leaveAnalyticsData || leaveAnalyticsData.length === 0) ? (
                    <div className="flex items-center justify-center h-[300px]">
                      <span className="text-sm text-muted-foreground">No leave data available</span>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={leaveAnalyticsData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="type" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="approved" fill="#22c55e" name="Approved" />
                        <Bar dataKey="pending" fill="#f59e0b" name="Pending" />
                        <Bar dataKey="rejected" fill="#ef4444" name="Rejected" />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Performance Distribution</CardTitle>
                  <CardDescription>Employee performance ratings breakdown</CardDescription>
                </CardHeader>
                <CardContent>
                  {(!performanceAnalytics?.distribution || performanceAnalytics.distribution.length === 0) ? (
                    <div className="flex items-center justify-center h-[300px]">
                      <span className="text-sm text-muted-foreground">No performance data available</span>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={performanceAnalytics.distribution}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          dataKey="value"
                          label={({ name, value }) => `${name}: ${value}%`}
                        >
                          {performanceAnalytics.distribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Performance Summary</CardTitle>
                  <CardDescription>Key performance metrics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-sm">Average Rating</span>
                      <span className="text-sm font-medium">{performanceAnalytics?.overallScore ? `${performanceAnalytics.overallScore}/5` : 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Reviews Completed</span>
                      <span className="text-sm font-medium">{performanceAnalytics?.completedReviews || 0}/{(performanceAnalytics?.completedReviews || 0) + (performanceAnalytics?.pendingReviews || 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Reviews Pending</span>
                      <span className="text-sm font-medium">{performanceAnalytics?.pendingReviews || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Goal Achievement</span>
                      <span className="text-sm font-medium text-green-600">{performanceAnalytics?.goalAchievement ? `${performanceAnalytics.goalAchievement}%` : '0%'}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="training" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Training Program Progress</CardTitle>
                <CardDescription>Completion rates for all training programs</CardDescription>
              </CardHeader>                <CardContent>
                  <div className="space-y-4">
                    {(!trainingProgress || trainingProgress.length === 0) ? (
                      <span className="text-sm text-muted-foreground">No training programs available.</span>
                    ) : (
                      trainingProgress.map((program) => (
                        <div key={program.program} className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm font-medium">{program.program}</span>
                            <span className="text-sm">{program.completed}/{program.total} ({program.percentage}%)</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{width: `${program.percentage}%`}}
                            ></div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="advances" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Salary Advance Trends</CardTitle>
                <CardDescription>Monthly salary advance amounts and request counts</CardDescription>
              </CardHeader>                <CardContent>
                  {(!salaryAdvanceStats || salaryAdvanceStats.length === 0) ? (
                    <div className="flex items-center justify-center h-[300px]">
                      <span className="text-sm text-muted-foreground">No salary advance data available</span>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={salaryAdvanceStats}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip 
                          formatter={(value, name) => [
                            name === 'amount' ? `$${value.toLocaleString()}` : value,
                            name === 'amount' ? 'Amount' : name === 'requests' ? 'Requests' : 'Avg Amount'
                          ]}
                        />
                        <Bar dataKey="amount" fill="#3b82f6" name="amount" />
                        <Bar dataKey="requests" fill="#22c55e" name="requests" />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default HRDashboard;
