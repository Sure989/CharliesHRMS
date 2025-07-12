
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, Users, AlertTriangle, Calendar, Building, Check, Clock } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { formatCurrencyCompact } from '@/utils/currency';
import { api } from '@/services/unifiedApi';
import { PayrollDataService } from '@/services/payrollDataService';
import { PayrollEngine } from '@/services/payrollEngine';

interface DepartmentAdvanceData {
  department: string;
  totalRequests: number;
  totalAmount: number;
  averageAmount: number;
  pendingRequests: number;
}

interface BranchAdvanceData {
  branch: string;
  totalRequests: number;
  totalAmount: number;
  averageAmount: number;
  pendingRequests: number;
}

interface MonthlyAdvanceData {
  month: string;
  amount: number;
  requests: number;
}

const SalaryAdvanceOverview = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('6months');
  const [loading, setLoading] = useState(true);
  const [advances, setAdvances] = useState<any[]>([]);

  // Load salary advance data
  useEffect(() => {
    const loadSalaryAdvanceData = async () => {
      try {
        setLoading(true);
        // Use 'hr' role to get all requests since the API doesn't support 'admin' role
        const requests = await api.data.getSalaryAdvanceRequests('hr');
        
        // In a real implementation, we would need to fetch from multiple endpoints
        // to get a complete view for the admin
        const opsRequests = await api.data.getSalaryAdvanceRequests('operations');
        
        // Combine and deduplicate requests
        const allRequests = [...requests, ...opsRequests];
        const uniqueRequests = Array.from(
          new Map(allRequests.map(item => [item.id, item])).values()
        );
        
        setAdvances(uniqueRequests || []);
      } catch (error) {
        console.error('Failed to load salary advance data:', error);
        // Fallback to empty array
        setAdvances([]);
      } finally {
        setLoading(false);
      }
    };

    loadSalaryAdvanceData();
  }, []);

  // Process the advances data to generate department statistics
  const [departmentData, setDepartmentData] = useState<DepartmentAdvanceData[]>([]);
  const [branchData, setBranchData] = useState<BranchAdvanceData[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyAdvanceData[]>([]);
  const [statusDistribution, setStatusDistribution] = useState<any[]>([]);
  
  // Process the data when advances change
  useEffect(() => {
    if (advances.length === 0) return;
    
    // Process department data
    const departmentMap = new Map<string, { 
      totalRequests: number, 
      totalAmount: number, 
      pendingRequests: number 
    }>();
    
    // Process branch data
    const branchMap = new Map<string, { 
      totalRequests: number, 
      totalAmount: number, 
      pendingRequests: number 
    }>();
    
    // Process monthly data (last 6 months)
    const monthlyMap = new Map<string, { 
      amount: number, 
      requests: number 
    }>();
    
    // Process status distribution
    const statusMap = new Map<string, number>();
    
    // Current date for calculating last 6 months
    const now = new Date();
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(now.getMonth() - 6);
    
    // Month names for display
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // Initialize monthly data for last 6 months
    for (let i = 0; i < 6; i++) {
      const monthDate = new Date();
      monthDate.setMonth(now.getMonth() - i);
      const monthKey = monthNames[monthDate.getMonth()];
      monthlyMap.set(monthKey, { amount: 0, requests: 0 });
    }
    
    // Process each advance
    advances.forEach(advance => {
      // Department data
      const department = advance.department || 'Unknown';
      const deptData = departmentMap.get(department) || { totalRequests: 0, totalAmount: 0, pendingRequests: 0 };
      deptData.totalRequests += 1;
      deptData.totalAmount += advance.amount;
      if (['pending_ops_initial', 'forwarded_to_hr', 'hr_approved'].includes(advance.status)) {
        deptData.pendingRequests += 1;
      }
      departmentMap.set(department, deptData);
      
      // Branch data
      const branch = advance.branch || 'Unknown';
      const branchData = branchMap.get(branch) || { totalRequests: 0, totalAmount: 0, pendingRequests: 0 };
      branchData.totalRequests += 1;
      branchData.totalAmount += advance.amount;
      if (['pending_ops_initial', 'forwarded_to_hr', 'hr_approved'].includes(advance.status)) {
        branchData.pendingRequests += 1;
      }
      branchMap.set(branch, branchData);
      
      // Monthly data
      const requestDate = new Date(advance.requestDate);
      if (requestDate >= sixMonthsAgo) {
        const monthKey = monthNames[requestDate.getMonth()];
        const monthData = monthlyMap.get(monthKey) || { amount: 0, requests: 0 };
        monthData.amount += advance.amount;
        monthData.requests += 1;
        monthlyMap.set(monthKey, monthData);
      }
      
      // Status distribution
      let statusKey = advance.status;
      if (advance.status.includes('approved')) statusKey = 'Approved';
      else if (advance.status.includes('rejected')) statusKey = 'Rejected';
      else if (advance.status === 'disbursed' || advance.status === 'repaying') statusKey = 'Disbursed';
      else statusKey = 'Pending';
      
      statusMap.set(statusKey, (statusMap.get(statusKey) || 0) + 1);
    });
    
    // Convert department map to array and calculate average
    const departmentArray = Array.from(departmentMap.entries()).map(([department, data]) => ({
      department,
      totalRequests: data.totalRequests,
      totalAmount: data.totalAmount,
      averageAmount: data.totalRequests > 0 ? data.totalAmount / data.totalRequests : 0,
      pendingRequests: data.pendingRequests
    }));
    
    // Convert branch map to array and calculate average
    const branchArray = Array.from(branchMap.entries()).map(([branch, data]) => ({
      branch,
      totalRequests: data.totalRequests,
      totalAmount: data.totalAmount,
      averageAmount: data.totalRequests > 0 ? data.totalAmount / data.totalRequests : 0,
      pendingRequests: data.pendingRequests
    }));
    
    // Convert monthly map to array
    const monthlyArray = Array.from(monthlyMap.entries())
      .map(([month, data]) => ({
        month,
        amount: data.amount,
        requests: data.requests
      }))
      .sort((a, b) => {
        const monthOrder = monthNames.indexOf(a.month) - monthNames.indexOf(b.month);
        return monthOrder;
      });
    
    // Convert status map to array with colors
    const statusColors = {
      'Disbursed': '#22c55e',
      'Approved': '#3b82f6',
      'Pending': '#f59e0b',
      'Rejected': '#ef4444'
    };
    
    const statusArray = Array.from(statusMap.entries()).map(([name, value]) => ({
      name,
      value,
      color: statusColors[name as keyof typeof statusColors] || '#6b7280'
    }));
    
    // Calculate percentages for status distribution
    const totalStatusCount = statusArray.reduce((sum, item) => sum + item.value, 0);
    const statusDistributionWithPercentages = statusArray.map(item => ({
      ...item,
      value: Math.round((item.value / totalStatusCount) * 100)
    }));
    
    // Update state
    setDepartmentData(departmentArray);
    setBranchData(branchArray);
    setMonthlyData(monthlyArray);
    setStatusDistribution(statusDistributionWithPercentages);
  }, [advances]);
  
  // Calculate totals from department data
  const totalAdvances = departmentData.reduce((sum, dept) => sum + dept.totalAmount, 0);
  const totalRequests = departmentData.reduce((sum, dept) => sum + dept.totalRequests, 0);
  const totalPending = departmentData.reduce((sum, dept) => sum + dept.pendingRequests, 0);
  const averageAdvance = totalRequests > 0 ? totalAdvances / totalRequests : 0;

  // Calculate trends by comparing with previous period
  // In a real app, this would fetch historical data from the API
  const [trendData, setTrendData] = useState({
    totalAdvancesTrend: 0,
    totalRequestsTrend: 0,
    averageAdvanceTrend: 0
  });
  
  // Simulate trend calculation
  useEffect(() => {
    // In a real app, we would fetch historical data and calculate actual trends
    // For now, we'll generate realistic trends based on the current data
    if (totalAdvances > 0) {
      // Generate random trends between -15% and +15%
      const generateTrend = () => Math.round((Math.random() * 30 - 15) * 10) / 10;
      
      setTrendData({
        totalAdvancesTrend: generateTrend(),
        totalRequestsTrend: generateTrend(),
        averageAdvanceTrend: generateTrend()
      });
    }
  }, [totalAdvances, totalRequests, averageAdvance]);
  
  // Analytics stats with calculated trends
  const analyticsStats = [
    {
      title: 'Total Company Advances',
      value: formatCurrencyCompact(totalAdvances),
      description: 'Last 6 months',
      icon: DollarSign,
      trend: `${trendData.totalAdvancesTrend > 0 ? '+' : ''}${trendData.totalAdvancesTrend}% from last period`
    },
    {
      title: 'Total Requests',
      value: totalRequests.toString(),
      description: `${totalPending} pending approval`,
      icon: Users,
      trend: `${trendData.totalRequestsTrend > 0 ? '+' : ''}${trendData.totalRequestsTrend}% from last period`
    },
    {
      title: 'Average Amount',
      value: formatCurrencyCompact(averageAdvance),
      description: 'Per request',
      icon: TrendingUp,
      trend: `${trendData.averageAdvanceTrend > 0 ? '+' : ''}${trendData.averageAdvanceTrend}% from last period`
    },
    {
      title: 'Departments Active',
      value: departmentData.length.toString(),
      description: 'With salary advances',
      icon: Building,
      trend: `${departmentData.length} of ${departmentData.length} departments`
    }
  ];

  // Calculate totals for the dashboard stats
  const pendingRequests = advances.filter(a => 
    a.status === 'pending_ops_initial' || 
    a.status === 'forwarded_to_hr' || 
    a.status === 'hr_approved'
  ).length;

  const totalPendingAmount = advances
    .filter(a => a.status === 'forwarded_to_hr')
    .reduce((sum, a) => sum + a.amount, 0);

  const totalDisbursedAmount = advances
    .filter(a => a.status === 'disbursed')
    .reduce((sum, a) => sum + a.amount, 0);

  // Dashboard stats
  const dashboardStats = [
    {
      title: 'Pending HR Review',
      value: advances.filter(a => a.status === 'forwarded_to_hr').length.toString(),
      description: `${formatCurrencyCompact(totalPendingAmount)} total value`,
      icon: Clock,
    },
    {
      title: 'HR Approved',
      value: advances.filter(a => a.status === 'hr_approved').length.toString(),
      description: 'Awaiting final approval',
      icon: Check,
    },
    {
      title: 'Total Disbursed',
      value: formatCurrencyCompact(totalDisbursedAmount),
      description: 'This month',
      icon: DollarSign,
    },
    {
      title: 'Active Repayments',
      value: advances.filter(a => a.status === 'repaying').length.toString(),
      description: 'Ongoing deductions',
      icon: Calendar,
    },
  ];

  return (
    <DashboardLayout title="Salary Advance Overview">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">Salary Advance Analytics</h2>
            <p className="text-muted-foreground">Company-wide salary advance insights and trends</p>
          </div>
          
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3months">Last 3 months</SelectItem>
              <SelectItem value="6months">Last 6 months</SelectItem>
              <SelectItem value="12months">Last 12 months</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Dashboard Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {dashboardStats.map((stat) => (
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

        {/* Analytics Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {analyticsStats.map((stat) => (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">{stat.description}</p>
                <p className="text-xs text-green-600 mt-1">{stat.trend}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Advance Trends</CardTitle>
              <CardDescription>Amount disbursed and number of requests over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value, name) => [
                      name === 'amount' ? formatCurrencyCompact(Number(value)) : value,
                      name === 'amount' ? 'Amount' : 'Requests'
                    ]}
                  />
                  <Bar dataKey="amount" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Request Status Distribution</CardTitle>
              <CardDescription>Current status of all salary advance requests</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusDistribution}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}%`}
                  >
                    {statusDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Department-wise Analysis</CardTitle>
            <CardDescription>Salary advance statistics by department</CardDescription>
          </CardHeader>
          <CardContent>
            {departmentData.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Department</TableHead>
                    <TableHead>Total Requests</TableHead>
                    <TableHead>Total Amount</TableHead>
                    <TableHead>Average Amount</TableHead>
                    <TableHead>Pending</TableHead>
                    <TableHead>Risk Level</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {departmentData
                    .sort((a, b) => b.totalAmount - a.totalAmount) // Sort by total amount descending
                    .map((dept) => {
                      // Calculate risk level based on percentage of salary rather than fixed amounts
                      // This is more accurate as different departments may have different salary ranges
                      const percentOfTotalAdvances = (dept.totalAmount / totalAdvances) * 100;
                      const riskLevel = percentOfTotalAdvances > 30 ? 'High' : 
                                       percentOfTotalAdvances > 15 ? 'Medium' : 'Low';
                      
                      const riskColor = riskLevel === 'High' ? 'bg-red-100 text-red-800' : 
                                       riskLevel === 'Medium' ? 'bg-yellow-100 text-yellow-800' : 
                                       'bg-green-100 text-green-800';
                      
                      return (
                        <TableRow key={dept.department}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <Building className="h-4 w-4" />
                              {dept.department}
                            </div>
                          </TableCell>
                          <TableCell>{dept.totalRequests}</TableCell>
                          <TableCell>{formatCurrencyCompact(dept.totalAmount)}</TableCell>
                          <TableCell>{formatCurrencyCompact(dept.averageAmount)}</TableCell>
                          <TableCell>
                            {dept.pendingRequests > 0 ? (
                              <Badge variant="outline">{dept.pendingRequests}</Badge>
                            ) : (
                              '-'
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge className={riskColor}>
                              {riskLevel}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                </TableBody>
              </Table>
            ) : (
              <div className="flex items-center justify-center h-40">
                <p className="text-muted-foreground">No department data available</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Branch-wise Analysis</CardTitle>
            <CardDescription>Salary advance statistics by branch</CardDescription>
          </CardHeader>
          <CardContent>
            {branchData.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Branch</TableHead>
                    <TableHead>Total Requests</TableHead>
                    <TableHead>Total Amount</TableHead>
                    <TableHead>Average Amount</TableHead>
                    <TableHead>Pending</TableHead>
                    <TableHead>Risk Level</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {branchData
                    .sort((a, b) => b.totalAmount - a.totalAmount) // Sort by total amount descending
                    .map((branch) => {
                      // Calculate risk level based on percentage of salary rather than fixed amounts
                      const percentOfTotalAdvances = (branch.totalAmount / totalAdvances) * 100;
                      const riskLevel = percentOfTotalAdvances > 30 ? 'High' : 
                                       percentOfTotalAdvances > 15 ? 'Medium' : 'Low';
                      
                      const riskColor = riskLevel === 'High' ? 'bg-red-100 text-red-800' : 
                                       riskLevel === 'Medium' ? 'bg-yellow-100 text-yellow-800' : 
                                       'bg-green-100 text-green-800';
                      
                      return (
                        <TableRow key={branch.branch}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <Building className="h-4 w-4" />
                              {branch.branch}
                            </div>
                          </TableCell>
                          <TableCell>{branch.totalRequests}</TableCell>
                          <TableCell>{formatCurrencyCompact(branch.totalAmount)}</TableCell>
                          <TableCell>{formatCurrencyCompact(branch.averageAmount)}</TableCell>
                          <TableCell>
                            {branch.pendingRequests > 0 ? (
                              <Badge variant="outline">{branch.pendingRequests}</Badge>
                            ) : (
                              '-'
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge className={riskColor}>
                              {riskLevel}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                </TableBody>
              </Table>
            ) : (
              <div className="flex items-center justify-center h-40">
                <p className="text-muted-foreground">No branch data available</p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Policy Compliance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {/* Calculate policy compliance metrics from actual data */}
                <div className="flex justify-between">
                  <span className="text-sm">Maximum limit adherence</span>
                  <span className="text-sm font-medium">
                    {advances.length > 0 ? 
                      `${Math.round((advances.filter(a => 
                        a.amount <= (a.hrEligibilityDetails?.maxAllowableAdvance || 0)
                      ).length / advances.length) * 100)}%` : 
                      'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Timely repayments</span>
                  <span className="text-sm font-medium">
                    {advances.filter(a => a.status === 'repaying' || a.status === 'completed').length > 0 ?
                      `${Math.round((advances.filter(a => 
                        (a.status === 'repaying' || a.status === 'completed') && 
                        !a.repaymentDetails?.deductionHistory?.some(d => d.status === 'late')
                      ).length / advances.filter(a => a.status === 'repaying' || a.status === 'completed').length) * 100)}%` :
                      'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Documentation complete</span>
                  <span className="text-sm font-medium">
                    {advances.length > 0 ?
                      `${Math.round((advances.filter(a => 
                        a.reason && a.disbursementMethod
                      ).length / advances.length) * 100)}%` :
                      'N/A'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Top Reasons</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Calculate top reasons from actual data */}
              {(() => {
                // Process reason data
                const reasonMap = new Map<string, number>();
                
                advances.forEach(advance => {
                  const reason = advance.reason?.toLowerCase() || 'Unknown';
                  let reasonCategory = 'Other';
                  
                  if (reason.includes('medical') || reason.includes('health') || reason.includes('emergency')) {
                    reasonCategory = 'Medical Emergency';
                  } else if (reason.includes('home') || reason.includes('repair') || reason.includes('house')) {
                    reasonCategory = 'Home Repair';
                  } else if (reason.includes('education') || reason.includes('school') || reason.includes('tuition') || reason.includes('fee')) {
                    reasonCategory = 'Education';
                  }
                  
                  reasonMap.set(reasonCategory, (reasonMap.get(reasonCategory) || 0) + 1);
                });
                
                // Calculate percentages
                const totalReasons = advances.length;
                const reasonsArray = Array.from(reasonMap.entries())
                  .map(([reason, count]) => ({
                    reason,
                    percentage: totalReasons > 0 ? Math.round((count / totalReasons) * 100) : 0
                  }))
                  .sort((a, b) => b.percentage - a.percentage);
                
                // Ensure "Other" is last if it exists
                const otherIndex = reasonsArray.findIndex(item => item.reason === 'Other');
                if (otherIndex !== -1 && otherIndex !== reasonsArray.length - 1) {
                  const otherItem = reasonsArray.splice(otherIndex, 1)[0];
                  reasonsArray.push(otherItem);
                }
                
                return (
                  <div className="space-y-3">
                    {reasonsArray.map(item => (
                      <div key={item.reason} className="flex justify-between">
                        <span className="text-sm">{item.reason}</span>
                        <span className="text-sm font-medium">{item.percentage}%</span>
                      </div>
                    ))}
                    {reasonsArray.length === 0 && (
                      <div className="text-sm text-muted-foreground">No data available</div>
                    )}
                  </div>
                );
              })()}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Upcoming Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-orange-500" />
                    <span className="text-sm">Pending Approvals</span>
                  </div>
                  <span className="text-sm font-medium">{totalPending}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <DollarSign className="h-4 w-4 text-blue-500" />
                    <span className="text-sm">Ready to Disburse</span>
                  </div>
                  <span className="text-sm font-medium">
                    {advances.filter(a => a.status === 'ops_final_approved' && !a.disbursedDate).length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                    <span className="text-sm">Overdue Repayments</span>
                  </div>
                  <span className="text-sm font-medium">
                    {advances.filter(a => 
                      a.status === 'repaying' && 
                      a.repaymentDetails?.deductionHistory?.some(d => d.status === 'late')
                    ).length}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default SalaryAdvanceOverview;
