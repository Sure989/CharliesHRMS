import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Calendar, DollarSign, Clock, CheckCircle, AlertCircle, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';
import { api } from '@/services/unifiedApi';

const OperationsDashboard = () => {
  const { user } = useAuth();
  const [teamMembers, setTeamMembers] = useState([]);
  // Fetch leave and salary advance requests for stats
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [salaryAdvances, setSalaryAdvances] = useState([]);

  useEffect(() => {
    api.data.getUsers().then(fetchedUsers => {
      const branchTeam = fetchedUsers.filter(
        (member: any) => member.branch === user?.branch && member.role === 'employee'
      );
      setTeamMembers(branchTeam);
    });
    api.data.getLeaveRequests('operations').then(setLeaveRequests);
    api.data.getSalaryAdvanceRequests('operations').then(setSalaryAdvances);
  }, [user]);

  const stats = [
    {
      title: 'Team Members',
      value: teamMembers.length.toString(),
      description: `Under my supervision in ${user?.branch} branch`,
      icon: Users,
    },
    {
      title: 'Pending Leave Reviews',
      value: leaveRequests.filter(r => r.status === 'pending_ops_initial').length.toString(),
      description: 'Awaiting first approval',
      icon: Calendar,
    },
    {
      title: 'Salary Advance Reviews',
      value: salaryAdvances.filter(a => a.status === 'pending_ops_initial').length.toString(),
      description: 'Pending my approval',
      icon: DollarSign,
    },
    {
      title: 'Active Projects',
      value: '12',
      description: 'Currently ongoing',
      icon: TrendingUp,
    },
  ];

  const quickActions = [
    {
      title: 'Leave Approvals',
      description: 'Review and approve team leave requests',
      icon: Calendar,
      href: '/operations/leave',
      color: 'text-orange-600'
    },
    {
      title: 'Salary Advance Reviews',
      description: 'First-level approval for salary advances',
      icon: DollarSign,
      href: '/operations/salary-advances',
      color: 'text-emerald-600'
    },
    {
      title: 'Team Overview',
      description: 'Monitor team performance and activities',
      icon: Users,
      href: '/operations/team',
      color: 'text-blue-600'
    },
    {
      title: 'My Profile',
      description: 'Update personal information and settings',
      icon: Users,
      href: '/employee/profile',
      color: 'text-purple-600'
    },
    {
      title: 'Payroll Overview',
      description: 'View payroll dashboard and reports',
      icon: DollarSign,
      href: '/payroll/dashboard',
      color: 'text-indigo-600'
    }
  ];

  return (
    <DashboardLayout title="Operations Dashboard">
      <div className="space-y-6">
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
                <div className="flex items-center space-x-4">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm">Leave request approved - John Smith</p>
                    <p className="text-xs text-muted-foreground">2 hours ago</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm">Salary advance reviewed - Sarah Johnson</p>
                    <p className="text-xs text-muted-foreground">4 hours ago</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm">New team member assigned</p>
                    <p className="text-xs text-muted-foreground">6 hours ago</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm">Project milestone completed</p>
                    <p className="text-xs text-muted-foreground">1 day ago</p>
                  </div>
                </div>
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
                  <span className="text-sm font-medium">5</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <DollarSign className="h-4 w-4 text-emerald-500" />
                    <span className="text-sm">Salary Advances</span>
                  </div>
                  <span className="text-sm font-medium">3</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-blue-500" />
                    <span className="text-sm">Time Adjustments</span>
                  </div>
                  <span className="text-sm font-medium">2</span>
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
                  <span className="text-sm font-medium">24/28</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">On Leave</span>
                  <span className="text-sm font-medium">3</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Remote Work</span>
                  <span className="text-sm font-medium">1</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Available</span>
                  <span className="text-sm font-medium text-green-600">85%</span>
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
                  <span className="text-sm font-medium">92%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Team Satisfaction</span>
                  <span className="text-sm font-medium">88%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Project Completion</span>
                  <span className="text-sm font-medium">94%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Goal Achievement</span>
                  <span className="text-sm font-medium text-green-600">96%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default OperationsDashboard;
