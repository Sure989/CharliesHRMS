import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Calendar, TrendingUp, UserCheck, BookOpen, Building, Award, Clock, DollarSign } from 'lucide-react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { useState, useEffect } from 'react';
import { usePolling } from '@/hooks/usePolling';
import { analyticsService } from '@/services/api/analytics.service';

const HRDashboard = () => {
  const [dashboardMetrics, setDashboardMetrics] = useState<any>(null);
  const [employeeAnalytics, setEmployeeAnalytics] = useState(null);
  const [leaveAnalytics, setLeaveAnalytics] = useState(null);
  const [performanceAnalytics, setPerformanceAnalytics] = useState(null);
  const [trainingAnalytics, setTrainingAnalytics] = useState(null);
  const [salaryAdvanceAnalytics, setSalaryAdvanceAnalytics] = useState(null);
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  // Use WebSocket for dashboard metrics and fetch other analytics data
  usePolling(async () => {
    try {
      setLoading(true);
      const [
        dashboardData,
        employeeData,
        leaveData,
        performanceData,
        trainingData,
        salaryAdvanceData,
        activities,
      ] = await Promise.all([
        analyticsService.getDashboardMetrics('hr'),
        analyticsService.getEmployeeAnalytics(),
        analyticsService.getLeaveAnalytics(),
        analyticsService.getPerformanceAnalytics(),
        analyticsService.getTrainingAnalytics(),
        analyticsService.getSalaryAdvanceAnalytics(),
        analyticsService.getRecentActivities(),
      ]);
      setDashboardMetrics(dashboardData);
      setEmployeeAnalytics(employeeData);
      setLeaveAnalytics(leaveData);
      setPerformanceAnalytics(performanceData);
      setTrainingAnalytics(trainingData);
      setSalaryAdvanceAnalytics(salaryAdvanceData);
      setRecentActivities(activities.data || []);
    } catch (error) {
      console.error("Failed to fetch analytics data:", error);
    } finally {
      setLoading(false);
    }
  }, { interval: 30000 });

  // ...existing code...

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
      value: dashboardMetrics?.activeEmployees || 0,
      description: `Total employees: ${dashboardMetrics?.totalEmployees || 0}`,
      icon: Users,
    },
    {
      title: 'Pending Leave Requests',
      value: dashboardMetrics?.pendingLeaveRequests || 0,
      description: 'Awaiting approval',
      icon: Calendar,
    },
    {
      title: 'Upcoming Reviews',
      value: dashboardMetrics?.upcomingReviews || 0,
      description: 'Due this month',
      icon: UserCheck,
    },
    {
      title: 'Payroll Costs',
      value: `$${(dashboardMetrics?.payrollCosts?.currentMonth || 0).toLocaleString()}`,
      description: 'Current month',
      icon: DollarSign,
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

  // Employee Analytics - handle actual API response structure
  const employeeGrowthData = employeeAnalytics?.analytics?.growth?.map(item => ({
    month: item.month,
    employees: item.netGrowth,
    hires: item.hires,
    departures: item.terminations,
  })) || [];

  const branchDistributionData = dashboardMetrics?.employees?.branchDistribution || [];

  // Leave Analytics - handle actual API response structure
  const leaveAnalyticsData = leaveAnalytics?.analytics?.byLeaveType?.map(type => ({
    type: type.leaveType,
    approved: type.totalDays || 0,
    pending: 0,
    rejected: 0
  })) || [];

  // Performance Analytics - handle backend response structure
  const performanceDistribution = performanceAnalytics?.ratingDistribution?.map((rating, index) => ({
    name: `Rating ${rating.rating}`,
    value: rating.percentage,
    color: ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6'][index % 5]
  })) || [];

  // Training Analytics - handle backend response structure
  const trainingProgress = trainingAnalytics?.upcomingTrainings?.map(training => ({
    program: training.title || 'Unknown Program',
    completed: training.enrolled || 0,
    total: training.capacity || 0,
    percentage: training.capacity > 0 ? Math.round((training.enrolled / training.capacity) * 100) : 0
  })) || [];

  // Salary Advance Analytics - handle both nested and direct data structures
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
                      <span className="text-sm font-medium">{dashboardMetrics?.pendingLeaveRequests || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Award className="h-4 w-4 text-purple-500" />
                        <span className="text-sm">Performance Reviews</span>
                      </div>
                      <span className="text-sm font-medium">{dashboardMetrics?.upcomingReviews || 0}</span>
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
                    {(!trainingAnalytics?.upcomingTrainings || trainingAnalytics.upcomingTrainings.length === 0) ? (
                      <span className="text-sm text-muted-foreground">No training data.</span>
                    ) : (
                      trainingAnalytics.upcomingTrainings.slice(0, 3).map((training) => {
                        const percentage = training.capacity > 0 ? Math.round((training.enrolled / training.capacity) * 100) : 0;
                        return (
                          <div className="flex justify-between" key={training.id}>
                            <span className="text-sm">{training.title}</span>
                            <span className="text-sm font-medium">{percentage}%</span>
                          </div>
                        );
                      })
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
                    {(!branchDistributionData || branchDistributionData.length === 0) ? (
                      <span className="text-sm text-muted-foreground">No branch data available.</span>
                    ) : (
                      branchDistributionData.map((branch, idx) => {
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
                  {(!performanceDistribution || performanceDistribution.length === 0) ? (
                    <div className="flex items-center justify-center h-[300px]">
                      <span className="text-sm text-muted-foreground">No performance data available</span>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={performanceDistribution}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          dataKey="value"
                          label={({ name, value }) => `${name}: ${value}%`}
                        >
                          {performanceDistribution.map((entry, index) => (
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
                      <span className="text-sm font-medium">{performanceAnalytics?.summary?.averageRating ? `${performanceAnalytics.summary.averageRating.toFixed(1)}/5` : 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Reviews Completed</span>
                      <span className="text-sm font-medium">{performanceAnalytics?.summary?.completedReviews || 0}/{performanceAnalytics?.summary?.totalReviews || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Reviews Pending</span>
                      <span className="text-sm font-medium">{(performanceAnalytics?.summary?.totalReviews || 0) - (performanceAnalytics?.summary?.completedReviews || 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Goal Achievement</span>
                      <span className="text-sm font-medium text-green-600">{performanceAnalytics?.goalProgress?.completionRate ? `${performanceAnalytics.goalProgress.completionRate.toFixed(1)}%` : '0%'}</span>
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
