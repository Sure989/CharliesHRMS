
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Clock, BookOpen, Award } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const EmployeeDashboard = () => {
  const { user } = useAuth();

  const stats = [
    {
      title: 'Leave Balance',
      value: '18 days',
      description: 'Annual leave remaining',
      icon: Calendar,
    },
    {
      title: 'Hours This Week',
      value: '32/40',
      description: '8 hours remaining',
      icon: Clock,
    },
    {
      title: 'Training Progress',
      value: '3/5',
      description: 'Courses completed',
      icon: BookOpen,
    },
    {
      title: 'Performance Score',
      value: '4.2/5',
      description: 'Last review rating',
      icon: Award,
    },
  ];

  return (
    <DashboardLayout title="Employee Dashboard">
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-6">
          <h2 className="text-2xl font-bold mb-2">Welcome back, {user?.firstName}!</h2>
          <p className="text-muted-foreground">Here's what's happening with your account today.</p>
        </div>

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
              <CardTitle>Recent Activities</CardTitle>
              <CardDescription>Your recent actions and updates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm">Leave request approved</p>
                    <p className="text-xs text-muted-foreground">2 days ago</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm">Training course completed</p>
                    <p className="text-xs text-muted-foreground">1 week ago</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm">Profile updated</p>
                    <p className="text-xs text-muted-foreground">2 weeks ago</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Frequently used employee tools</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2">
                <button className="flex items-center justify-start space-x-2 p-2 hover:bg-muted rounded-md text-left">
                  <Calendar className="h-4 w-4 text-orange-600" />
                  <span className="text-sm">Request Leave</span>
                </button>
                <button className="flex items-center justify-start space-x-2 p-2 hover:bg-muted rounded-md text-left">
                  <BookOpen className="h-4 w-4 text-blue-600" />
                  <span className="text-sm">Browse Training</span>
                </button>
                <button className="flex items-center justify-start space-x-2 p-2 hover:bg-muted rounded-md text-left">
                  <Award className="h-4 w-4 text-purple-600" />
                  <span className="text-sm">View Performance</span>
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default EmployeeDashboard;
