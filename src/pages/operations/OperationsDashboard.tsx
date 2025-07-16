import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Calendar, DollarSign, Clock, CheckCircle, AlertCircle, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';
import api from '@/services/api';

const OperationsDashboard = () => {
  const { user } = useAuth();
  const [teamMembers, setTeamMembers] = useState([]);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [salaryAdvances, setSalaryAdvances] = useState([]);
  const [teamStatus, setTeamStatus] = useState({ present: 0, total: 0, onLeave: 0, remote: 0 });
  const [performance, setPerformance] = useState({ productivity: 0, satisfaction: 0, completion: 0, goals: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {

      if (!user?.branch) {
        setLoading(false);
        setError("User branch is not defined. Cannot fetch data.");
        return;
      }

      setLoading(true);
      setError("");

      try {
        const userBranch = user && user.branch != null ? (typeof user.branch === 'object' ? (user.branch as any).name : user.branch) : '';
        const branchTeamData = await api.employees.getEmployeesByBranch(userBranch);
        const branchTeam = branchTeamData.map(member => ({ ...member, role: 'EMPLOYEE' }));

        const [leaveResp, advanceResp] = await Promise.all([
          api.leave.getLeaveRequests({ department: userBranch }),
          api.salaryAdvances.getSalaryAdvanceRequests({ department: userBranch })
        ]);


        // Defensive: handle both { data: [] } and { requests: [] }
        const leavesArray = Array.isArray(leaveResp?.data)
          ? leaveResp.data
          : Array.isArray((leaveResp as any)?.requests)
            ? (leaveResp as any).requests
            : [];

        const advancesArray = Array.isArray(advanceResp?.data)
          ? advanceResp.data
          : Array.isArray((advanceResp as any)?.requests)
            ? (advanceResp as any).requests
            : [];

        const fetchedLeaves = leavesArray.map((req) => ({
          ...req,
          employeeName: req.employee?.firstName && req.employee?.lastName ? `${req.employee.firstName} ${req.employee.lastName}` : 'N/A',
          branch: req.employee?.department || 'N/A',
          days: req.totalDays || 0,
          submissionDate: req.appliedDate || req.createdAt,
        }));

        const fetchedAdvances = advancesArray.map((adv) => ({
          ...adv,
          employeeName: adv.employee?.firstName && adv.employee?.lastName ? `${adv.employee.firstName} ${adv.employee.lastName}` : 'N/A',
          branch: adv.employee?.department || 'N/A',
          amount: adv.requestedAmount,
          requestDate: adv.requestDate || adv.createdAt,
        }));

        // Filter by branch
        const branchName = userBranch;
        const filteredTeam = branchTeam.filter(m => m.branch === branchName);
        const filteredLeaves = fetchedLeaves.filter(l => l.branch === branchName);
        const filteredAdvances = fetchedAdvances.filter(a => a.branch === branchName);

        setTeamMembers(filteredTeam);
        setLeaveRequests(filteredLeaves);
        setSalaryAdvances(filteredAdvances);

        setTeamStatus({
          present: filteredTeam.filter(m => m.status === 'active').length,
          total: filteredTeam.length,
          onLeave: filteredLeaves.filter(l => l.status === 'approved').length,
          remote: 0
        });

        // If you have real performance data, fetch and set it here. Otherwise, set to 0 or N/A.
        setPerformance({
          productivity: 0,
          satisfaction: 0,
          completion: 0,
          goals: 0
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
      value: Array.isArray(teamMembers) ? teamMembers.filter(m => m.branch === (user && user.branch != null ? (typeof user.branch === 'object' ? (user.branch as any).name : user.branch) : '')).length.toString() : '0',
      description: `Under my supervision in ${user && user.branch != null ? (typeof user.branch === 'object' ? (user.branch as any).name || 'Unknown' : user.branch || 'Unknown') : 'Unknown'} branch`,
      icon: Users,
    },
    {
      title: 'Present Today',
      value: Array.isArray(teamMembers) ? teamMembers.filter(m => m.branch === (user && user.branch != null ? (typeof user.branch === 'object' ? (user.branch as any).name : user.branch) : '') && m.status === 'active').length.toString() : '0',
      description: '', // Removed 'present in office'
      icon: CheckCircle,
    },
    {
      title: 'On Leave',
      value: Array.isArray(leaveRequests) ? leaveRequests.filter(l => l.branch === (user && user.branch != null ? (typeof user.branch === 'object' ? (user.branch as any).name : user.branch) : '') && l.status === 'approved').length.toString() : '0',
      description: 'Approved leave requests',
      icon: Calendar,
    },
    {
      title: 'Salary Advances',
      value: Array.isArray(salaryAdvances) ? salaryAdvances.filter(a => a.branch === (user && user.branch != null ? (typeof user.branch === 'object' ? (user.branch as any).name : user.branch) : '')).length.toString() : '0',
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
