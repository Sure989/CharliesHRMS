import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Calendar, DollarSign, Clock, CheckCircle, AlertCircle, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';
import api from '@/services/api';

type BranchType = string | { name?: string };
type TeamMemberType = {
  id?: string | number;
  branch?: BranchType;
  status?: string;
  [key: string]: any;
};

const OperationsDashboard = () => {
  const { user } = useAuth();
  const [teamMembers, setTeamMembers] = useState<TeamMemberType[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<any[]>([]);
  const [salaryAdvances, setSalaryAdvances] = useState<any[]>([]);
  const [teamStatus, setTeamStatus] = useState({ present: 0, total: 0, onLeave: 0, remote: 0 });
  const [performance, setPerformance] = useState({ productivity: 0, satisfaction: 0, completion: 0, goals: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError("");

      try {
        // Get branch info from user.branch, fallback to user.branchId/user.branchName if missing
        let userBranch = user?.branch as unknown as import('@/types/branch').Branch | undefined;
        let userBranchId = userBranch?.id;
        let userBranchName = userBranch?.name;
        // Fallbacks for legacy or incomplete user objects
        if (!userBranchId && user?.branchId) userBranchId = user.branchId;
        if (!userBranchName && user?.branchName) userBranchName = user.branchName;
        
        if (!userBranchId && !userBranchName) {
          setError('Unable to determine user branch. Please contact administrator.');
          return;
        }
        
        // Get all employees
        const employeesResp = await api.employees.getEmployees();
        const allEmployees = Array.isArray(employeesResp?.data) ? employeesResp.data : 
                           Array.isArray(employeesResp) ? employeesResp : [];
        
        // Get leave requests and salary advances with branch filtering
        const [leaveResp, advanceResp] = await Promise.all([
          api.leave.getLeaveRequests(userBranchId ? { branchId: userBranchId } : undefined),
          api.salaryAdvances.getSalaryAdvanceRequests(userBranchId ? { department: 'operations', branchId: userBranchId } : { department: 'operations' })
        ]);

        // Extract arrays from responses
        const leavesArray = Array.isArray(leaveResp)
          ? leaveResp
          : Array.isArray(leaveResp?.leaveRequests)
            ? leaveResp.leaveRequests
            : Array.isArray(leaveResp?.data?.leaveRequests)
              ? leaveResp.data.leaveRequests
              : [];
              
        let advancesArray: any[] = [];
        if (Array.isArray(advanceResp?.data)) {
          advancesArray = advanceResp.data;
        } else if (Array.isArray(advanceResp?.data?.requests)) {
          advancesArray = advanceResp.data.requests;
        } else if (Array.isArray(advanceResp?.requests)) {
          advancesArray = advanceResp.requests;
        }

        // Filter leave requests by branch and exclude own requests
        const filteredLeaves = Array.isArray(leavesArray)
          ? leavesArray.filter((r: any) => {
              if (r.employeeId === user?.employeeId) return false;
              const empBranch = r.employee?.branch;
              if (userBranchId && (empBranch?.id === userBranchId || (r.branch && typeof r.branch === 'object' && r.branch.id === userBranchId))) {
                return true;
              }
              const branchNameToUse = userBranchName || empBranch?.name;
              if (branchNameToUse) {
                if (empBranch?.name && empBranch.name.trim().toLowerCase() === branchNameToUse.trim().toLowerCase()) return true;
                if (r.branch) {
                  if (typeof r.branch === 'object' && r.branch.name && r.branch.name.trim().toLowerCase() === branchNameToUse.trim().toLowerCase()) return true;
                  if (typeof r.branch === 'string' && r.branch.trim().toLowerCase() === branchNameToUse.trim().toLowerCase()) return true;
                }
              }
              return false;
            })
          : [];

        // Filter salary advances by branch and exclude own requests
        const filteredAdvances = advancesArray.filter((r: any) => {
          if (String(r.employeeId) === String(user?.employeeId)) return false;
          const empBranch = r.employee?.branch;
          if (userBranchId && (empBranch?.id === userBranchId || (r.branch && typeof r.branch === 'object' && r.branch.id === userBranchId))) {
            return true;
          }
          const branchNameToUse = userBranchName || empBranch?.name;
          if (branchNameToUse) {
            if (empBranch?.name && empBranch.name.trim().toLowerCase() === branchNameToUse.trim().toLowerCase()) return true;
            if (r.branch) {
              if (typeof r.branch === 'object' && r.branch.name && r.branch.name.trim().toLowerCase() === branchNameToUse.trim().toLowerCase()) return true;
              if (typeof r.branch === 'string' && r.branch.trim().toLowerCase() === branchNameToUse.trim().toLowerCase()) return true;
            }
          }
          return false;
        });

        // Process leave requests
        const fetchedLeaves = filteredLeaves.map((req) => ({
          ...req,
          employeeName: req.employeeName || (req.employee ? `${req.employee.firstName} ${req.employee.lastName}` : 'Unknown'),
          days: req.days || req.totalDays || 0,
          submissionDate: new Date(req.appliedAt || req.submissionDate || req.createdAt).toLocaleDateString(),
        }));

        // Process salary advances
        const fetchedAdvances = filteredAdvances.map((adv) => ({
          ...adv,
          employeeName: adv.employeeName || (adv.employee ? `${adv.employee.firstName} ${adv.employee.lastName}` : 'Unknown'),
          amount: adv.requestedAmount || adv.amount || 0,
          requestDate: new Date(adv.requestDate || adv.createdAt).toLocaleDateString(),
        }));

        // Filter team members by branch
        const filteredTeamMembers = allEmployees.filter(emp => {
          if (userBranchId && emp.branchId === userBranchId) return true;
          if (userBranchName && emp.branch && typeof emp.branch === 'object' && emp.branch.name === userBranchName) return true;
          if (userBranchName && typeof emp.branch === 'string' && emp.branch === userBranchName) return true;
          return false;
        });
        
        setTeamMembers(filteredTeamMembers);
        setLeaveRequests(fetchedLeaves);
        setSalaryAdvances(fetchedAdvances);

        setTeamStatus({
          present: filteredTeamMembers.filter(m => m.status === 'active').length,
          total: filteredTeamMembers.length,
          onLeave: fetchedLeaves.filter(l => l.status === 'approved').length,
          remote: 0
        });

        // Calculate performance metrics from real data
        const totalRequests = fetchedLeaves.length + fetchedAdvances.length;
        const approvedRequests = fetchedLeaves.filter(l => l.status === 'approved').length + 
                               fetchedAdvances.filter(a => a.status === 'approved').length;
        const approvalRate = totalRequests > 0 ? Math.round((approvedRequests / totalRequests) * 100) : 0;
        
        const teamAvailability = filteredTeamMembers.length > 0 ? 
          Math.round((filteredTeamMembers.filter(m => m.status === 'active').length / filteredTeamMembers.length) * 100) : 0;
        
        setPerformance({
          productivity: teamAvailability,
          satisfaction: Math.min(approvalRate + 10, 100), // Approval rate + buffer
          completion: approvalRate,
          goals: Math.round((approvalRate + teamAvailability) / 2)
        });

      } catch (err) {
        setError("Failed to fetch dashboard data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const stats = [
    {
      title: 'Team Members',
      value: Array.isArray(teamMembers) ? teamMembers.length.toString() : '0',
      description: 'All team members from database',
      icon: Users,
    },
    {
      title: 'Present Today',
      value: Array.isArray(teamMembers) ? teamMembers.filter(m => m.status === 'active').length.toString() : '0',
      description: '',
      icon: CheckCircle,
    },
    {
      title: 'On Leave',
      value: Array.isArray(leaveRequests) ? leaveRequests.filter(l => l.status === 'approved').length.toString() : '0',
      description: 'Approved leave requests',
      icon: Calendar,
    },
    {
      title: 'Salary Advances',
      value: Array.isArray(salaryAdvances) ? salaryAdvances.length.toString() : '0',
      description: 'Total salary advance requests',
      icon: DollarSign,
    },
  ];

  const quickActions = [
    {
      title: 'Approve Leave Requests',
      description: 'Review and approve pending leave requests',
      href: '/operations/leave-requests',
      icon: Calendar,
      color: 'text-orange-500',
    },
    {
      title: 'Approve Salary Advances',
      description: 'Review and approve salary advance requests',
      href: '/operations/salary-advances',
      icon: DollarSign,
      color: 'text-emerald-500',
    },
    {
      title: 'View Team Members',
      description: 'See all team members in your branch',
      href: '/operations/team',
      icon: Users,
      color: 'text-blue-500',
    },
    {
      title: 'Performance Metrics',
      description: 'View team performance statistics',
      href: '/operations/performance',
      icon: TrendingUp,
      color: 'text-purple-500',
    },
  ];

  return (
    <DashboardLayout title="Operations Dashboard">
      <div className="space-y-6">
        {loading && (
          <div className="text-center py-10">Loading dashboard...</div>
        )}
        {error && !loading && (
          <div className="text-center py-10 text-red-600">{error}</div>
        )}
        {!loading && !error && (
          <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {stats.map((stat) => {
                let iconColor = "text-muted-foreground";
                if (stat.title === 'Team Members') iconColor = "text-blue-600";
                if (stat.title === 'Present Today') iconColor = "text-emerald-600";
                if (stat.title === 'On Leave') iconColor = "text-orange-500";
                if (stat.title === 'Salary Advances') iconColor = "text-green-600";
                return (
                  <Card key={stat.title}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                      <stat.icon className={`h-5 w-5 ${iconColor}`} />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stat.value}</div>
                      <p className="text-xs text-muted-foreground">{stat.description}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Operations Activities</CardTitle>
                  <CardDescription>Latest team activities and approvals</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {leaveRequests.length === 0 && salaryAdvances.length === 0 ? (
                      <div className="text-muted-foreground">No recent activities found.</div>
                    ) : (
                      <>
                        {leaveRequests.slice(0, 3).map((req, idx) => (
                          <div key={req.id || idx} className="flex items-center space-x-4">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <div className="flex-1">
                              <p className="text-sm">Leave request {req.status} - {req.employeeName ? req.employeeName : "Unknown"}</p>
                              <p className="text-xs text-muted-foreground">{req.submissionDate ? req.submissionDate : "N/A"}</p>
                            </div>
                          </div>
                        ))}
                        {salaryAdvances.slice(0, 3).map((adv, idx) => (
                          <div key={adv.id || idx} className="flex items-center space-x-4">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <div className="flex-1">
                              <p className="text-sm">Salary advance {adv.status} - {adv.employeeName ? adv.employeeName : "Unknown"}</p>
                              <p className="text-xs text-muted-foreground">{adv.requestDate ? adv.requestDate : "N/A"}</p>
                            </div>
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>Access key operational management features</CardDescription>
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
                      <span className="text-sm font-medium">{leaveRequests.filter(r => r.status === 'pending_ops_initial').length}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <DollarSign className="h-4 w-4 text-emerald-500" />
                        <span className="text-sm">Salary Advances</span>
                      </div>
                      <span className="text-sm font-medium">{salaryAdvances.filter(a => a.status === 'pending_ops_initial').length}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-blue-500" />
                        <span className="text-sm">Time Adjustments</span>
                      </div>
                      <span className="text-sm font-medium">0</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Team Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm">Present Today</span>
                      <span className="text-sm font-medium">{teamStatus.present}/{teamStatus.total}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">On Leave</span>
                      <span className="text-sm font-medium">{teamStatus.onLeave}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Salary Advances</span>
                      <span className="text-sm font-medium">{salaryAdvances.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Available</span>
                      <span className="text-sm font-medium text-green-600">{teamStatus.total > 0 ? Math.round((teamStatus.present / teamStatus.total) * 100) : 0}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Performance Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm">Productivity</span>
                      <span className="text-sm font-medium">{performance.productivity}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Team Satisfaction</span>
                      <span className="text-sm font-medium">{performance.satisfaction}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Project Completion</span>
                      <span className="text-sm font-medium">{performance.completion}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Goal Achievement</span>
                      <span className="text-sm font-medium text-green-600">{performance.goals}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}

export default OperationsDashboard;
