
import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Clock, BookOpen, Award } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { leaveService } from '@/services/api/leave.service';
import { trainingService } from '@/services/api/training.service';
import { performanceService } from '@/services/api/performance.service';
import { activityService } from '@/services/api/activity.service';

const EmployeeDashboard = () => {
  const { user } = useAuth();
  const [leaveBalance, setLeaveBalance] = useState<number | null>(null);
  const [hoursThisWeek, setHoursThisWeek] = useState<{ worked: number; total: number } | null>(null);
  const [trainingProgress, setTrainingProgress] = useState<{ completed: number; total: number } | null>(null);
  const [performanceScore, setPerformanceScore] = useState<number | null>(null);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user?.employeeId) return;
      setLoading(true);
      try {
        // Leave balance
        const leaveRes = await leaveService.getLeaveBalances(user.employeeId);
        setLeaveBalance(leaveRes?.[0]?.remainingDays ?? 0);

        // Hours this week (replace with your backend call)
        // Example: GET /dashboard/employee/{employeeId}
        // const dashboardRes = await dashboardService.getEmployeeDashboard(user.employeeId);
        // setHoursThisWeek(dashboardRes.hoursThisWeek);
        setHoursThisWeek({ worked: 32, total: 40 }); // Placeholder

        // Training progress
        const trainingRes = await trainingService.getTrainingProgress(user.employeeId);
        setTrainingProgress(
          (trainingRes?.data as { completed: number; total: number }) ?? { completed: 0, total: 0 }
        );

        // Performance score
        const perfRes = await performanceService.getPerformanceScore(user.employeeId);
        setPerformanceScore((perfRes?.data as { score?: number })?.score ?? 0);

        // Recent activities
        const activityRes = await activityService.getRecentActivities(user.employeeId);
        setRecentActivities((activityRes?.data as any[]) ?? []);
      } catch (err) {
        // Handle error (show toast, etc.)
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, [user?.employeeId]);

  return (
    <DashboardLayout title="Employee Dashboard">
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-6">
          <h2 className="text-2xl font-bold mb-2">Welcome back, {user?.firstName}!</h2>
          <p className="text-muted-foreground">Here's what's happening with your account today.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Leave Balance</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{leaveBalance !== null ? `${leaveBalance} days` : '0 days'}</div>
              <p className="text-xs text-muted-foreground">Annual leave remaining</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Hours This Week</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{hoursThisWeek ? `${hoursThisWeek.worked}/${hoursThisWeek.total}` : 'Loading...'}</div>
              <p className="text-xs text-muted-foreground">{hoursThisWeek ? `${hoursThisWeek.total - hoursThisWeek.worked} hours remaining` : ''}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Training Progress</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{trainingProgress ? `${trainingProgress.completed}/${trainingProgress.total}` : 'Loading...'}</div>
              <p className="text-xs text-muted-foreground">Courses completed</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Performance Score</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{performanceScore !== null ? `${performanceScore}/5` : '0/5'}</div>
              <p className="text-xs text-muted-foreground">Last review rating</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activities</CardTitle>
              <CardDescription>Your recent actions and updates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivities.length === 0 && <div className="text-muted-foreground">No recent activities found.</div>}
                {recentActivities.map((activity, idx) => (
                  <div key={idx} className="flex items-center space-x-4">
                    <div className={`w-2 h-2 rounded-full ${activity.color || 'bg-gray-400'}`}></div>
                    <div className="flex-1">
                      <p className="text-sm">{activity.title}</p>
                      <p className="text-xs text-muted-foreground">{activity.date}</p>
                    </div>
                  </div>
                ))}
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
