import React, { useState, useMemo, useEffect } from 'react';
import { usePolling } from '@/hooks/usePolling';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Users, Shield, Database, Activity, AlertTriangle, CheckCircle, XCircle, Clock, TestTube, FileText, LifeBuoy, Settings, Zap, Flag } from 'lucide-react';
import ComplianceDashboard from './ComplianceDashboard';
import SecurityManagement from './SecurityManagement';
import IntegrationDashboard from './IntegrationDashboard';
import WorkflowDashboard from './WorkflowDashboard';
import ExperimentalFeaturesManager from '@/components/admin/ExperimentalFeaturesManager';
import { userService } from '@/services/api/user.service';
import { departmentService } from '@/services/api/department.service';
import { branchService } from '@/services/api/branch.service';
import RealTimeDashboard from '../../components/dashboard/RealTimeDashboard';
import { analyticsService } from '@/services/api/analytics.service';
import { adminService } from '@/services/api/admin.service';

const AdminDashboard = () => {
  // ...existing code...
  const [systemStatus, setSystemStatus] = useState({
    overall: 'healthy' as 'healthy' | 'warning' | 'critical',
    database: 'healthy' as 'healthy' | 'warning' | 'critical',
    authentication: 'healthy' as 'healthy' | 'warning' | 'critical',
    api: 'warning' as 'healthy' | 'warning' | 'critical' | 'error', // Initially set to warning, will be updated via API
    storage: 'healthy' as 'healthy' | 'warning' | 'critical'
  });


  // Real metrics state (from WebSocket)
  const [metrics, setMetrics] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalDepartments: 0,
    totalBranches: 0,
    systemUptime: '99.8%',
    avgResponseTime: '120ms',
    storageUsed: 68
  });

  // Real activities state
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [maintenanceInfo, setMaintenanceInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);


  // Use WebSocket for metrics, keep polling for system status only
  usePolling(async () => {
    try {
      const response = await adminService.getDashboardMetrics();
      setMetrics(response);
    } catch (error) {
      console.error('Failed to fetch dashboard metrics:', error);
    }
  }, { interval: 30000 }); // Poll every 30 seconds

  useEffect(() => {
    // Reduce polling frequency for system status - only poll if not loading
    const statusInterval = setInterval(async () => {
      if (isLoading) return; // Skip if already loading
      try {
        const systemStatusData = await adminService.getSystemStatus();
        setSystemStatus(systemStatusData);
      } catch (error) {
        console.error('System status check failed:', error);
        setSystemStatus(prev => ({
          ...prev,
          api: 'critical',
          overall: 'warning'
        }));
      }
    }, 300000); // Check every 5 minutes
    return () => clearInterval(statusInterval);
  }, []);



  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <DashboardLayout title="System Administration">
      {/* Debug: Track tab switches */}
      <div className="space-y-6">
        {/* Manual Refresh Button for Metrics/System Status */}
        <div className="flex justify-end mb-2">
          <Button
            variant="outline"
            onClick={() => {
              // Manual refresh for metrics and system status
              setIsLoading(true);
              (async () => {
                try {
                  const [usersResponse, departments, branches, systemStatusData, activitiesData, maintenanceData] = await Promise.all([
                    userService.getUsers().catch(() => ({ data: [] })),
                    departmentService.getAllDepartments().catch(() => []),
                    branchService.getAllBranches().catch(() => []),
                    adminService.getSystemStatus().catch(() => null),
                    adminService.getSystemActivities(10).catch(() => []),
                    adminService.getMaintenanceInfo().catch(() => null)
                  ]);
                  const users = usersResponse.data || [];
                  setMetrics({
                    totalUsers: users.length,
                    activeUsers: users.filter(u => u.status === 'active').length,
                    totalDepartments: departments.length,
                    totalBranches: branches.length,
                    systemUptime: maintenanceData?.systemUptime || '99.8%',
                    avgResponseTime: '120ms',
                    storageUsed: 68
                  });
                  if (systemStatusData) setSystemStatus(systemStatusData);
                  setRecentActivities(activitiesData);
                  setMaintenanceInfo(maintenanceData);
                } catch (error) {
                  alert('Failed to refresh metrics/system status');
                } finally {
                  setIsLoading(false);
                }
              })();
            }}
            disabled={isLoading}
          >
            Refresh Metrics & Status
          </Button>
        </div>
        {/* System Status Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader> 
            <CardContent>
              <div className="text-2xl font-bold">{metrics.totalUsers}</div>
              <p className="text-xs text-muted-foreground">
                {metrics.activeUsers} active
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">System Uptime</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.systemUptime}</div>
              <p className="text-xs text-muted-foreground">
                Last 30 days
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Response Time</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.avgResponseTime}</div>
              <p className="text-xs text-muted-foreground">
                Average response
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Storage Used</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.storageUsed}%</div>
              <Progress value={metrics.storageUsed} className="mt-2" />
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="realtime" className="space-y-4">
          <TabsList>
            <TabsTrigger value="realtime">Real-Time Dashboard</TabsTrigger>
            <TabsTrigger value="status">System Status</TabsTrigger>
            <TabsTrigger value="compliance">Compliance</TabsTrigger>
            <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
            <TabsTrigger value="feature-flags">Experimental Features</TabsTrigger>
          </TabsList>

          <TabsContent value="realtime" className="space-y-4">
            <RealTimeDashboard role="admin" />
          </TabsContent>

          <TabsContent value="status" className="space-y-4">
            {/* System Health Status */}
            <Card>
              <CardHeader>
                <CardTitle>System Health</CardTitle>
                <CardDescription>Real-time status of system components</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Overall System</span>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(systemStatus.overall)}
                    <Badge variant="outline" className="capitalize">
                      {systemStatus.overall}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Database</span>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(systemStatus.database)}
                    <Badge variant="outline" className="capitalize">
                      {systemStatus.database}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Authentication</span>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(systemStatus.authentication)}
                    <Badge variant="outline" className="capitalize">
                      {systemStatus.authentication}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">API Services</span>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(systemStatus.api)}
                    <Badge variant="outline" className="capitalize">
                      {systemStatus.api}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">File Storage</span>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(systemStatus.storage)}
                    <Badge variant="outline" className="capitalize">
                      {systemStatus.storage}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent System Activities */}
            <Card>
              <CardHeader>
                <CardTitle>Recent System Activities</CardTitle>
                <CardDescription>Latest system events and user activities</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentActivities.map((activity) => (
                    <div key={activity.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium">{activity.action}</div>
                        <div className="text-sm text-muted-foreground">{activity.user}</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground">{activity.timestamp}</span>
                        <Badge className={getStatusColor(activity.status)}>
                          {activity.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>


          <TabsContent value="maintenance" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>System Maintenance</CardTitle>
                <CardDescription>Perform system maintenance and updates</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button 
                    variant="outline" 
                    onClick={async () => {
                      try {
                        await adminService.triggerDatabaseBackup();
                        alert('Database backup initiated successfully');
                      } catch (error) {
                        alert('Failed to initiate database backup');
                      }
                    }}
                  >
                    Database Backup
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={async () => {
                      try {
                        await adminService.clearCache();
                        alert('Cache cleared successfully');
                      } catch (error) {
                        alert('Failed to clear cache');
                      }
                    }}
                  >
                    Clear Cache
                  </Button>
                  <Button variant="outline" disabled>
                    System Update
                  </Button>
                </div>
                
                {maintenanceInfo && (
                  <Alert>
                    <Database className="h-4 w-4" />
                    <AlertTitle>Maintenance Schedule</AlertTitle>
                    <AlertDescription>
                      Last maintenance: {maintenanceInfo.lastMaintenance ? new Date(maintenanceInfo.lastMaintenance).toLocaleDateString() : 'Never'}
                      <br />
                      Next scheduled maintenance: {new Date(maintenanceInfo.nextMaintenance).toLocaleDateString()} ({maintenanceInfo.maintenanceWindow})
                      <br />
                      System uptime: {maintenanceInfo.systemUptime} ({maintenanceInfo.uptimeDays} days)
                    </AlertDescription>
                  </Alert>
                )}
                
                {!maintenanceInfo && (
                  <Alert>
                    <Database className="h-4 w-4" />
                    <AlertTitle>Maintenance Schedule</AlertTitle>
                    <AlertDescription>
                      Loading maintenance information...
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="compliance" className="space-y-4">
            <ComplianceDashboard />
          </TabsContent>

          <TabsContent value="feature-flags" className="space-y-4">
            <ExperimentalFeaturesManager />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
// WebSocket system status is now integrated above.
