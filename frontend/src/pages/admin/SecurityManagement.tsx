import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Shield, AlertTriangle, Lock, Eye, Settings, Bell, Activity, Plus, Check, X, Clock, Info } from 'lucide-react';
import { payrollService } from '@/services/api/payroll.service';
import { apiClient } from '@/services/apiClient';

// Interface for Security Alert
interface SecurityAlert {
  id: string;
  type: string;
  title: string;
  description: string;
  timestamp: string;
}

// Interface for Security Settings
interface SecuritySettings {
  id: string;
  tenantId: string;
  twoFactorAuth: boolean;
  passwordExpiry: boolean;
  sessionTimeout: boolean;
  ipWhitelist: boolean;
  auditLogging: boolean;
  encryptionAtRest: boolean;
}

const SecurityManagement = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('settings'); // Default to 'settings' tab on load

  // Audit logs state
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [logError, setLogError] = useState<string | null>(null);

  // Security metrics state
  const [metrics, setMetrics] = useState({
    securityScore: null as number | null,
    activeThreats: null as number | null,
    failedLogins: null as number | null,
  });
  const [loadingMetrics, setLoadingMetrics] = useState(false);
  const [metricsError, setMetricsError] = useState<string | null>(null);

  // Security alerts state
  const [securityAlerts, setSecurityAlerts] = useState<SecurityAlert[]>([]);
  const [loadingAlerts, setLoadingAlerts] = useState(false);
  const [alertError, setAlertError] = useState<string | null>(null);

  // Security settings state
  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>({
    id: '',
    tenantId: '',
    twoFactorAuth: false,
    passwordExpiry: false,
    sessionTimeout: false,
    ipWhitelist: false,
    auditLogging: false,
    encryptionAtRest: false
  });
  const [loadingSettings, setLoadingSettings] = useState(false);
  const [settingsError, setSettingsError] = useState<string | null>(null);

  // Fetch audit logs from backend
  useEffect(() => {
    setLoadingLogs(true);
    payrollService.getPayrollAuditLogs()
      .then((logs) => setAuditLogs(logs))
      .catch((error) => {
        console.error('Error fetching audit logs:', error);
        setLogError('Failed to load audit logs');
      })
      .finally(() => setLoadingLogs(false));
  }, []);

  // Fetch metrics from backend
  useEffect(() => {
    setLoadingMetrics(true);
    apiClient.get('/security/metrics')
      .then((response) => {
        if (response.status === 'success' && response.data) {
          setMetrics(response.data as { securityScore: number; activeThreats: number; failedLogins: number });
          console.log('Security metrics loaded:', response.data);
        } else {
          console.error('Failed metrics response:', response);
          setMetricsError('Failed to load metrics');
        }
      })
      .catch((error) => {
        console.error('Error fetching security metrics:', error);
        setMetricsError('Failed to load metrics');
      })
      .finally(() => setLoadingMetrics(false));
  }, []);

  // Fetch security alerts from backend
  useEffect(() => {
    setLoadingAlerts(true);
    apiClient.get('/security/alerts')
      .then((response) => {
        if (response.status === 'success' && response.data) {
          setSecurityAlerts(response.data as SecurityAlert[]);
          console.log('Security alerts loaded:', response.data);
        } else {
          console.error('Failed alerts response:', response);
          setAlertError('Failed to load alerts');
        }
      })
      .catch((error) => {
        console.error('Error fetching security alerts:', error);
        setAlertError('Failed to load alerts');
      })
      .finally(() => setLoadingAlerts(false));
  }, []);

  // Fetch security settings from backend
  useEffect(() => {
    setLoadingSettings(true);
    apiClient.get('/security/settings')
      .then((response) => {
        if (response.status === 'success' && response.data) {
          setSecuritySettings(response.data as SecuritySettings);
          console.log('Security settings loaded:', response.data);
        } else {
          console.error('Failed settings response:', response);
          setSettingsError('Failed to load security settings');
        }
      })
      .catch((error) => {
        console.error('Error fetching security settings:', error);
        setSettingsError('Failed to load security settings');
      })
      .finally(() => setLoadingSettings(false));
  }, []);

  // Handle updating security settings
  const handleUpdateSettings = async () => {
    try {
      const response = await apiClient.put('/security/settings', securitySettings);
      const data = response.data as { status: string; data: SecuritySettings };
      if (data && data.status === 'success') {
        setSecuritySettings(data.data);
        toast({
          title: 'Success',
          description: 'Security settings have been updated',
        });
      }
    } catch (error) {
      console.error('Error updating security settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to update security settings',
        variant: 'destructive'
      });
    }
  };

  // Helper function to get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'INFO':
        return <Info className="h-4 w-4 text-blue-500" />;
      case 'WARNING':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'CRITICAL':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <DashboardLayout title="Security Management">
      <div className="space-y-6">
        {/* Security Overview Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Security Score</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loadingMetrics ? (
                <div>Loading...</div>
              ) : metricsError ? (
                <div className="text-red-600">{metricsError}</div>
              ) : (
                <div className="text-2xl font-bold text-green-600">{metrics.securityScore}%</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Threats</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loadingMetrics ? (
                <div>Loading...</div>
              ) : metricsError ? (
                <div className="text-red-600">{metricsError}</div>
              ) : (
                <div className="text-2xl font-bold text-yellow-600">{metrics.activeThreats}</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Failed Logins</CardTitle>
              <Lock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loadingMetrics ? (
                <div>Loading...</div>
              ) : metricsError ? (
                <div className="text-red-600">{metricsError}</div>
              ) : (
                <div className="text-2xl font-bold">{metrics.failedLogins}</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList>
            <TabsTrigger value="alerts">Security Alerts</TabsTrigger>
            <TabsTrigger value="settings">Security Settings</TabsTrigger>
            <TabsTrigger value="audit">Audit Logs</TabsTrigger>
          </TabsList>

          {/* Security Alerts Tab */}
          <TabsContent value="alerts" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Security Alerts</CardTitle>
                <CardDescription>Recent security alerts and notifications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium mb-3">Recent Alerts</h3>
                  {loadingAlerts ? (
                    <div>Loading alerts...</div>
                  ) : alertError ? (
                    <div className="text-red-600">{alertError}</div>
                  ) : securityAlerts.length === 0 ? (
                    <div className="text-center p-4 text-muted-foreground">No security alerts found</div>
                  ) : (
                    <div className="space-y-3">
                      {securityAlerts.map((alert) => (
                        <div key={alert.id} className="p-3 border rounded-md">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {alert.type === 'WARNING' ? (
                                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                              ) : alert.type === 'CRITICAL' ? (
                                <AlertTriangle className="h-5 w-5 text-red-500" />
                              ) : (
                                <Bell className="h-5 w-5 text-blue-500" />
                              )}
                              <span className="font-medium">{alert.title}</span>
                            </div>
                            <span className="text-sm text-muted-foreground">
                              {new Date(alert.timestamp).toLocaleString()}
                            </span>
                          </div>
                          <p className="mt-2 text-sm">{alert.description}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Settings Tab */}
          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>Configure system-wide security settings</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingSettings ? (
                  <div>Loading settings...</div>
                ) : settingsError ? (
                  <div className="text-red-600">{settingsError}</div>
                ) : (
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="two-factor">Two-Factor Authentication</Label>
                          <p className="text-sm text-muted-foreground">Require 2FA for all admin accounts</p>
                        </div>
                        <Switch 
                          id="two-factor" 
                          checked={securitySettings.twoFactorAuth}
                          onCheckedChange={(checked) => 
                            setSecuritySettings({ ...securitySettings, twoFactorAuth: checked })
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="password-expiry">Password Expiration</Label>
                          <p className="text-sm text-muted-foreground">Force password reset every 90 days</p>
                        </div>
                        <Switch 
                          id="password-expiry" 
                          checked={securitySettings.passwordExpiry}
                          onCheckedChange={(checked) => 
                            setSecuritySettings({ ...securitySettings, passwordExpiry: checked })
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="session-timeout">Session Timeout</Label>
                          <p className="text-sm text-muted-foreground">Auto-logout after 30 minutes of inactivity</p>
                        </div>
                        <Switch 
                          id="session-timeout" 
                          checked={securitySettings.sessionTimeout}
                          onCheckedChange={(checked) => 
                            setSecuritySettings({ ...securitySettings, sessionTimeout: checked })
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="ip-whitelist">IP Whitelisting</Label>
                          <p className="text-sm text-muted-foreground">Restrict access to approved IP addresses</p>
                        </div>
                        <Switch 
                          id="ip-whitelist" 
                          checked={securitySettings.ipWhitelist}
                          onCheckedChange={(checked) => 
                            setSecuritySettings({ ...securitySettings, ipWhitelist: checked })
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="audit-logging">Audit Logging</Label>
                          <p className="text-sm text-muted-foreground">Record all system activities for compliance</p>
                        </div>
                        <Switch 
                          id="audit-logging" 
                          checked={securitySettings.auditLogging}
                          onCheckedChange={(checked) => 
                            setSecuritySettings({ ...securitySettings, auditLogging: checked })
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="encryption">Data Encryption</Label>
                          <p className="text-sm text-muted-foreground">Enable encryption for sensitive data at rest</p>
                        </div>
                        <Switch 
                          id="encryption" 
                          checked={securitySettings.encryptionAtRest}
                          onCheckedChange={(checked) => 
                            setSecuritySettings({ ...securitySettings, encryptionAtRest: checked })
                          }
                        />
                      </div>
                    </div>

                    <Button onClick={() => {
                      toast({
                        title: 'Saving...',
                        description: 'Saving your security settings...',
                        duration: 1500
                      });
                      handleUpdateSettings();
                    }} className="w-full">
                      Save Security Settings
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Audit Logs Tab */}
          <TabsContent value="audit" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Audit Logs</CardTitle>
                <CardDescription>System activity and security event logs</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingLogs ? (
                  <div>Loading audit logs...</div>
                ) : logError ? (
                  <div className="text-red-600">{logError}</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Timestamp</TableHead>
                        <TableHead>User</TableHead>
                        <TableHead>Action</TableHead>
                        <TableHead>Entity</TableHead>
                        <TableHead>Details</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {auditLogs.map((log: any) => (
                        <TableRow key={log.id}>
                          <TableCell className="text-sm">{new Date(log.timestamp).toLocaleString()}</TableCell>
                          <TableCell>{log.userName || log.userId || '-'}</TableCell>
                          <TableCell>{log.action}</TableCell>
                          <TableCell>{log.entityType || '-'}</TableCell>
                          <TableCell className="text-sm">{log.changes ? JSON.stringify(log.changes) : '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default SecurityManagement;
