import { useState, useEffect } from 'react';
import { useWebSocket } from '@/hooks/useWebSocket';
import { getDashboardMetricsWebSocketUrl } from '@/services/api/websocket.utils';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  Link, 
  Clock, 
  AlertTriangle,
  RefreshCw,
  Eye,
  Download,
  Upload,
  Activity,
  CreditCard,
  Building,
  FileText,
  TrendingUp,
  Pause,
  Play,
  Zap
} from 'lucide-react';
import { useIntegrations } from '@/hooks/useIntegrations';
import { 
  getIntegrationStatusColor, 
  getIntegrationIcon,
  formatDate,
  formatTimestamp,
  getLogStatusColor,
  formatConfig,
  formatDuration
} from '@/utils/integrationUtils';

// Confirmation dialog state interface
interface ConfirmDialog {
  open: boolean;
  integrationId: string | null;
}



const IntegrationDashboard = () => {
  // All hooks must be inside the component
  const {
    integrations,
    integrationLogs,
    integrationSummary,
    isLoading,
    isTestingAll,
    rowLoading,
    error,
    loadDashboardData,
    testIntegration,
    toggleIntegration,
    testAllIntegrations,
    exportLogs,
  } = useIntegrations();
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialog>({ open: false, integrationId: null });
  const [selectedIntegration, setSelectedIntegration] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [wsData, wsConnected] = useWebSocket<any>(getDashboardMetricsWebSocketUrl('integration'));
  
  useEffect(() => {
    if (wsData) {
      loadDashboardData();
    }
  }, [wsData, loadDashboardData]);

  // Handle integration toggle with confirmation for disabling
  const handleToggleIntegration = (integrationId: string, enabled: boolean): void => {
    if (!enabled) {
      setConfirmDialog({ open: true, integrationId });
    } else {
      toggleIntegration(integrationId, enabled);
    }
  };

  // Confirm and execute integration toggle
  const confirmToggleIntegration = (): void => {
    if (confirmDialog.integrationId) {
      toggleIntegration(confirmDialog.integrationId, false);
    }
    setConfirmDialog({ open: false, integrationId: null });
  };

  // Import configuration placeholder
  const handleImportConfig = async (e: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsImporting(true);
    try {
      // TODO: Implement import logic when backend endpoint is available
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate async operation
      // await integrationApi.importConfig(file)
      
      // Reset file input
      e.target.value = '';
    } catch (error) {
      console.error('Import failed:', error);
    } finally {
      setIsImporting(false);
    }
  };

  // Export logs with loading state
  const handleExportLogs = async (): Promise<void> => {
    setIsExporting(true);
    try {
      await exportLogs();
    } finally {
      setIsExporting(false);
    }
  };

  // Utility functions
  const getIntegrationsByType = (type: string) => integrations.filter(i => i.type === type);

  // Computed values
  const selectedIntegrationObj = integrations.find(i => i.id === selectedIntegration) || null;

  return (
    <DashboardLayout title="Integration & Automation Dashboard">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-end">
          <Button onClick={loadDashboardData} disabled={isLoading} variant="outline" size="sm">
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Overview Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Integrations</CardTitle>
              <Link className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{integrationSummary.activeIntegrations}</div>
              <p className="text-xs text-muted-foreground">
                of {integrationSummary.totalIntegrations} total
              </p>
              <Progress 
                value={integrationSummary.totalIntegrations > 0 ? (integrationSummary.activeIntegrations / integrationSummary.totalIntegrations) * 100 : 0} 
                className="mt-2" 
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{integrationSummary.averageSuccessRate.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">
                Average across all integrations
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Error Integrations</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{integrationSummary.errorIntegrations}</div>
              <p className="text-xs text-muted-foreground">
                Require attention
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Last Sync</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {integrationSummary.lastSyncTime ? 
                  formatDate(integrationSummary.lastSyncTime) : 
                  'Never'
                }
              </div>
              <p className="text-xs text-muted-foreground">
                Most recent sync
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="integrations" className="space-y-6">
          <TabsList>
            <TabsTrigger value="integrations">Integrations</TabsTrigger>
            <TabsTrigger value="logs">Activity Logs</TabsTrigger>
          </TabsList>

          <TabsContent value="integrations" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>System Integrations</CardTitle>
                <CardDescription>
                  Manage connections to external systems and services
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Integration</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Success Rate</TableHead>
                      <TableHead>Last Sync</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {integrations.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                          {isLoading ? 'Loading integrations...' : 'No integrations found'}
                        </TableCell>
                      </TableRow>
                    ) : (
                      integrations.map((integration) => (
                        <TableRow key={integration.id}>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              {getIntegrationIcon(integration.type)}
                              <div>
                                <div className="font-medium">{integration.name}</div>
                                <div className="text-sm text-muted-foreground">
                                  {integration.features?.join(', ') || integration.type}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{integration.type}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={getIntegrationStatusColor(integration.status)}>
                              {integration.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <span>{integration.successRate?.toFixed(1) || '0.0'}%</span>
                              <Progress value={integration.successRate || 0} className="w-16" />
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {formatDate(integration.lastSyncTime)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => testIntegration(integration.id)}
                                disabled={!!rowLoading[integration.id]}
                                title="Test Integration"
                              >
                                {rowLoading[integration.id] === 'test' ? (
                                  <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />
                                ) : (
                                  <Activity className="h-4 w-4 text-blue-500" />
                                )}
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => setSelectedIntegration(integration.id)}
                                title="View Details"
                              >
                                <Eye className="h-4 w-4 text-emerald-500" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleToggleIntegration(
                                  integration.id, 
                                  integration.status !== 'ACTIVE'
                                )}
                                disabled={!!rowLoading[integration.id]}
                                title={integration.status === 'ACTIVE' ? 'Disable Integration' : 'Enable Integration'}
                              >
                                {rowLoading[integration.id] === 'toggle' ? (
                                  <RefreshCw className="h-4 w-4 animate-spin text-yellow-500" />
                                ) : integration.status === 'ACTIVE' ? (
                                  <Pause className="h-4 w-4 text-yellow-500" />
                                ) : (
                                  <Play className="h-4 w-4 text-green-600" />
                                )}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Integration Categories */}
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <CreditCard className="h-5 w-5 mr-2" />
                    API Integrations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {getIntegrationsByType('API').map(integration => (
                      <div key={integration.id} className="flex items-center justify-between">
                        <span className="text-sm">{integration.name}</span>
                        <Badge className={getIntegrationStatusColor(integration.status)}>
                          {integration.status}
                        </Badge>
                      </div>
                    ))}
                    {getIntegrationsByType('API').length === 0 && (
                      <div className="text-sm text-muted-foreground">No API integrations</div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <Building className="h-5 w-5 mr-2" />
                    Webhook Services
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {getIntegrationsByType('WEBHOOK').map(integration => (
                      <div key={integration.id} className="flex items-center justify-between">
                        <span className="text-sm">{integration.name}</span>
                        <Badge className={getIntegrationStatusColor(integration.status)}>
                          {integration.status}
                        </Badge>
                      </div>
                    ))}
                    {getIntegrationsByType('WEBHOOK').length === 0 && (
                      <div className="text-sm text-muted-foreground">No webhook integrations</div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <FileText className="h-5 w-5 mr-2" />
                    Email Systems
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {getIntegrationsByType('SMTP').map(integration => (
                      <div key={integration.id} className="flex items-center justify-between">
                        <span className="text-sm">{integration.name}</span>
                        <Badge className={getIntegrationStatusColor(integration.status)}>
                          {integration.status}
                        </Badge>
                      </div>
                    ))}
                    {getIntegrationsByType('SMTP').length === 0 && (
                      <div className="text-sm text-muted-foreground">No email integrations</div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="logs" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Integration Activity Logs</CardTitle>
                <CardDescription>
                  Recent integration and workflow activities
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Integration</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Message</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {integrationLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>
                          <div className="text-sm">
                            {formatTimestamp(log.timestamp)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {integrations.find(i => i.id === log.integrationId)?.name || log.integrationId}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{log.action}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getLogStatusColor(log.status)}>
                            {log.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {formatDuration(log.duration)}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm max-w-xs truncate" title={log.message || ''}>
                            {log.message || '-'}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {integrationLogs.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground">
                          No activity logs found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common integration and automation tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4 flex-wrap gap-2">
              <Button onClick={testAllIntegrations} disabled={isTestingAll || isLoading}>
                <Zap className={`h-4 w-4 mr-2 ${isTestingAll ? 'animate-spin' : ''}`} />
                {isTestingAll ? 'Testing...' : 'Test All Integrations'}
              </Button>
              <div className="relative">
                <Button variant="outline" disabled={isImporting || isLoading} asChild>
                  <label htmlFor="import-config" className="cursor-pointer">
                    <Upload className="h-4 w-4 mr-2" />
                    {isImporting ? 'Importing...' : 'Import Configuration'}
                  </label>
                </Button>
                <input
                  id="import-config"
                  type="file"
                  accept=".json,.csv"
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  onChange={handleImportConfig}
                  disabled={isImporting || isLoading}
                />
              </div>
              <Button variant="outline" onClick={handleExportLogs} disabled={isExporting || isLoading}>
                <Download className={`h-4 w-4 mr-2 ${isExporting ? 'animate-spin' : ''}`} />
                {isExporting ? 'Exporting...' : 'Export Logs'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Integration Details Modal */}
        <Dialog open={!!selectedIntegration} onOpenChange={() => setSelectedIntegration(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Integration Details</DialogTitle>
              <DialogDescription>
                {selectedIntegrationObj?.name || 'Integration details'}
              </DialogDescription>
            </DialogHeader>
            {selectedIntegrationObj ? (
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  {getIntegrationIcon(selectedIntegrationObj.type)}
                  <span className="font-medium">{selectedIntegrationObj.type}</span>
                  <Badge className={getIntegrationStatusColor(selectedIntegrationObj.status)}>
                    {selectedIntegrationObj.status}
                  </Badge>
                </div>
                <Separator />
                <div className="grid gap-3">
                  <div>
                    <span className="font-medium">Type:</span> {selectedIntegrationObj.type}
                  </div>
                  <div>
                    <span className="font-medium">Features:</span> {selectedIntegrationObj.features?.join(', ') || 'N/A'}
                  </div>
                  <div>
                    <span className="font-medium">Last Sync:</span> {formatTimestamp(selectedIntegrationObj.lastSyncTime)}
                  </div>
                  <div>
                    <span className="font-medium">Success Rate:</span> {
                      selectedIntegrationObj.successRate !== undefined 
                        ? `${selectedIntegrationObj.successRate.toFixed(1)}%` 
                        : '0.0%'
                    }
                  </div>
                  <div>
                    <span className="font-medium">Created:</span> {formatTimestamp(selectedIntegrationObj.createdAt)}
                  </div>
                  {selectedIntegrationObj.config && (
                    <div>
                      <span className="font-medium">Configuration:</span>
                      <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-auto max-h-32">
                        {formatConfig(selectedIntegrationObj.config)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-muted-foreground">Integration not found.</div>
            )}
          </DialogContent>
        </Dialog>

        {/* Confirmation Dialog for disabling integration */}
        <Dialog 
          open={confirmDialog.open} 
          onOpenChange={(open) => setConfirmDialog({ open, integrationId: open ? confirmDialog.integrationId : null })}
        >
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Disable Integration</DialogTitle>
              <DialogDescription>
                Are you sure you want to disable this integration? This may interrupt automated processes.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end space-x-2 mt-4">
              <Button 
                variant="outline" 
                onClick={() => setConfirmDialog({ open: false, integrationId: null })}
              >
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={confirmToggleIntegration}
                disabled={!confirmDialog.integrationId}
              >
                Disable
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default IntegrationDashboard;
