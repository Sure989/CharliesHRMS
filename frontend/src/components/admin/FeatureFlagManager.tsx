import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Check, RefreshCw, AlertTriangle, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import * as featureFlags from '@/utils/featureFlags';

const FeatureFlagManager: React.FC = () => {
  const { toast } = useToast();
  const [flags, setFlags] = useState(featureFlags.getAllFlags());
  const [activeTab, setActiveTab] = useState('experimental');

  // Update flags when they change
  useEffect(() => {
    const updateFlags = () => {
      setFlags(featureFlags.getAllFlags());
    };

    // Check for changes every second
    const interval = setInterval(updateFlags, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleToggleFlag = (flag: keyof typeof flags) => {
    const newValue = featureFlags.toggleFlag(flag);
    setFlags({ ...flags, [flag]: newValue });
    
    toast({
      title: `Feature flag updated`,
      description: `${flag} is now ${newValue ? 'enabled' : 'disabled'}`,
      variant: newValue ? 'default' : 'destructive',
    });
  };

  const handleResetFlags = () => {
    featureFlags.resetFlags();
    setFlags(featureFlags.getAllFlags());
    
    toast({
      title: 'Feature flags reset',
      description: 'All feature flags have been reset to their default values',
      variant: 'default',
    });
  };

  const handleEnableAll = (category: string) => {
    const categoryFlags = getCategoryFlags(category);
    const updates: Record<string, boolean> = {};
    
    categoryFlags.forEach(flag => {
      updates[flag] = true;
    });
    
    featureFlags.setFlags(updates);
    setFlags(featureFlags.getAllFlags());
    
    toast({
      title: 'Feature flags updated',
      description: `All ${category.replace('-', ' ')} feature flags have been enabled`,
      variant: 'default',
    });
  };

  const handleDisableAll = (category: string) => {
    const categoryFlags = getCategoryFlags(category);
    const updates: Record<string, boolean> = {};
    
    categoryFlags.forEach(flag => {
      updates[flag] = false;
    });
    
    featureFlags.setFlags(updates);
    setFlags(featureFlags.getAllFlags());
    
    toast({
      title: 'Feature flags updated',
      description: `All ${category.replace('-', ' ')} feature flags have been disabled`,
      variant: 'destructive',
    });
  };

  const getCategoryFlags = (category: string): string[] => {
    switch (category) {
      case 'experimental':
        return ['enableAdvancedAnalytics', 'enableMultiCurrencySupport', 'enableKenyanPayrollRules', 
                'enableWorkflowAutomation', 'enableAuditTrails'];
      case 'ui':
        return ['enableDarkMode', 'enableDataExports', 'enableBulkOperations', 
                'enableNotifications', 'enableRealTimeUpdates'];
      case 'performance':
        return ['enableCaching', 'enableDataPrefetching', 'enableLazyLoading'];
      case 'compliance':
        return ['enableGDPRCompliance', 'enableDataRetentionPolicies', 'enableAuditLogging'];
      case 'admin':
        return ['enableUserImpersonation', 'enableBatchProcessing', 'enableScheduledReports', 
                'enableAdvancedPermissions'];
      case 'legacy':
        return ['useApiForUsers', 'useApiForEmployees', 'useApiForDepartments', 'useApiForBranches',
                'useApiForRoles', 'useApiForPermissions', 'useApiForPayroll', 'useApiForLeave',
                'useApiForSalaryAdvance', 'useApiForAnalytics', 'useApiInUserManagement', 
                'useApiInAdminDashboard', 'useApiInSecurityManagement', 'useApiInWorkflowDashboard',
                'useApiInPerformanceManagement', 'useApiInTrainingManagement', 
                'useApiInSalaryAdvanceManagement', 'useApiInOperationsDashboard', 'useApiInTeamsOverview',
                'useApiInPayrollDashboard', 'useApiInPayrollDataService'];
      default:
        return [];
    }
  };

  const renderFlagSwitch = (flag: keyof typeof flags, label: string) => (
    <div className="flex items-center justify-between py-2">
      <div className="flex flex-col">
        <Label htmlFor={flag} className="text-sm font-medium">
          {label}
        </Label>
        <span className="text-xs text-muted-foreground">{flag}</span>
      </div>
      <Switch
        id={flag}
        checked={flags[flag] as boolean}
        onCheckedChange={() => handleToggleFlag(flag)}
      />
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Feature Flag Manager</CardTitle>
        <CardDescription>
          Enable or disable experimental features and functionality
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Feature Management</AlertTitle>
          <AlertDescription>
            Use these toggles to enable or disable specific features. Some features may require a page reload to take effect.
          </AlertDescription>
        </Alert>
        
        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={handleResetFlags}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Reset to Defaults
          </Button>
        </div>

        <Tabs defaultValue="experimental" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="experimental">Experimental</TabsTrigger>
            <TabsTrigger value="ui">UI</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="compliance">Compliance</TabsTrigger>
            <TabsTrigger value="admin">Admin</TabsTrigger>
            <TabsTrigger value="legacy">Legacy</TabsTrigger>
          </TabsList>
          
          <TabsContent value="experimental" className="space-y-4">
            <div className="flex justify-end space-x-2 mb-2">
              <Button variant="outline" size="sm" onClick={() => handleEnableAll('experimental')}>
                Enable All
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleDisableAll('experimental')}>
                Disable All
              </Button>
            </div>
            
            <Alert className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Experimental Features</AlertTitle>
              <AlertDescription>
                These features are still under development and may not be fully stable.
              </AlertDescription>
            </Alert>
            
            <div className="space-y-1">
              {renderFlagSwitch('enableAdvancedAnalytics', 'Advanced Analytics')}
              {renderFlagSwitch('enableMultiCurrencySupport', 'Multi-Currency Support')}
              {renderFlagSwitch('enableKenyanPayrollRules', 'Kenyan Payroll Rules')}
              {renderFlagSwitch('enableWorkflowAutomation', 'Workflow Automation')}
              {renderFlagSwitch('enableAuditTrails', 'Audit Trails')}
            </div>
          </TabsContent>
          
          <TabsContent value="ui" className="space-y-4">
            <div className="flex justify-end space-x-2 mb-2">
              <Button variant="outline" size="sm" onClick={() => handleEnableAll('ui')}>
                Enable All
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleDisableAll('ui')}>
                Disable All
              </Button>
            </div>
            
            <div className="space-y-1">
              {renderFlagSwitch('enableDarkMode', 'Dark Mode')}
              {renderFlagSwitch('enableDataExports', 'Data Exports')}
              {renderFlagSwitch('enableBulkOperations', 'Bulk Operations')}
              {renderFlagSwitch('enableNotifications', 'Notifications')}
              {renderFlagSwitch('enableRealTimeUpdates', 'Real-Time Updates')}
            </div>
          </TabsContent>
          
          <TabsContent value="performance" className="space-y-4">
            <div className="flex justify-end space-x-2 mb-2">
              <Button variant="outline" size="sm" onClick={() => handleEnableAll('performance')}>
                Enable All
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleDisableAll('performance')}>
                Disable All
              </Button>
            </div>
            
            <div className="space-y-1">
              {renderFlagSwitch('enableCaching', 'API Response Caching')}
              {renderFlagSwitch('enableDataPrefetching', 'Data Prefetching')}
              {renderFlagSwitch('enableLazyLoading', 'Lazy Loading')}
            </div>
          </TabsContent>
          
          <TabsContent value="compliance" className="space-y-4">
            <div className="flex justify-end space-x-2 mb-2">
              <Button variant="outline" size="sm" onClick={() => handleEnableAll('compliance')}>
                Enable All
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleDisableAll('compliance')}>
                Disable All
              </Button>
            </div>
            
            <div className="space-y-1">
              {renderFlagSwitch('enableGDPRCompliance', 'GDPR Compliance')}
              {renderFlagSwitch('enableDataRetentionPolicies', 'Data Retention Policies')}
              {renderFlagSwitch('enableAuditLogging', 'Audit Logging')}
            </div>
          </TabsContent>
          
          <TabsContent value="admin" className="space-y-4">
            <div className="flex justify-end space-x-2 mb-2">
              <Button variant="outline" size="sm" onClick={() => handleEnableAll('admin')}>
                Enable All
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleDisableAll('admin')}>
                Disable All
              </Button>
            </div>
            
            <div className="space-y-1">
              {renderFlagSwitch('enableUserImpersonation', 'User Impersonation')}
              {renderFlagSwitch('enableBatchProcessing', 'Batch Processing')}
              {renderFlagSwitch('enableScheduledReports', 'Scheduled Reports')}
              {renderFlagSwitch('enableAdvancedPermissions', 'Advanced Permissions')}
            </div>
          </TabsContent>
          
          <TabsContent value="legacy" className="space-y-4">
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Legacy Flags</AlertTitle>
              <AlertDescription>
                These flags are from the previous API migration and should all remain enabled.
                Disabling them may cause the application to malfunction.
              </AlertDescription>
            </Alert>
            
            <div className="space-y-1">
              {renderFlagSwitch('useApiForUsers', 'API for Users')}
              {renderFlagSwitch('useApiForEmployees', 'API for Employees')}
              {renderFlagSwitch('useApiForDepartments', 'API for Departments')}
              {/* Add more legacy flags as needed */}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default FeatureFlagManager;
