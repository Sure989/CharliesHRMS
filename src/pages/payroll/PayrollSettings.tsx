import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Settings, 
  Save,
  RefreshCw,
  Building,
  Calendar,
  Clock,
  DollarSign,
  FileText,
  Users,
  Info,
  CheckCircle,
  AlertTriangle,
  Shield
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/services/unifiedApi';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

const PayrollSettings = () => {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [originalSettings, setOriginalSettings] = useState<any>(null);
  
  const [settings, setSettings] = useState({
    companyInfo: {
      name: "",
      kraPin: "",
      nssfNumber: "",
      nhifNumber: "",
      address: "",
      postalCode: "",
      city: ""
    },
    payrollDefaults: {
      personalRelief: 0,
      overtimeMultiplier: 0,
      workingDaysPerMonth: 0,
      workingHoursPerDay: 0,
      payFrequency: "",
      payDay: 0,
      cutoffDay: 0
    },
    approvalWorkflow: {
      requirePayrollApproval: false,
      approvalLevels: 0,
      autoApproveThreshold: 0,
      notifyEmployeesOnPayment: false,
      sendPayslipsByEmail: false
    },
    bankingInfo: {
      bankName: "",
      accountNumber: "",
      branchCode: "",
      swiftCode: ""
    }
  });

  // Load settings on component mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      const loadedSettings = await api.payroll.getPayrollSettings();
      
      // Use only real data from API, no hardcoded fallbacks
      const settingsData = loadedSettings as any || {};
      
      // Map API data directly without hardcoded defaults
      const completeSettings = {
        companyInfo: {
          name: settingsData?.companyInfo?.name || "",
          kraPin: settingsData?.companyInfo?.kraPin || "",
          nssfNumber: settingsData?.companyInfo?.nssfNumber || "",
          nhifNumber: settingsData?.companyInfo?.nhifNumber || "",
          address: settingsData?.companyInfo?.address || "",
          postalCode: settingsData?.companyInfo?.postalCode || "",
          city: settingsData?.companyInfo?.city || ""
        },
        payrollDefaults: {
          personalRelief: settingsData?.payrollDefaults?.personalRelief || 0,
          overtimeMultiplier: settingsData?.payrollDefaults?.overtimeMultiplier || 0,
          workingDaysPerMonth: settingsData?.payrollDefaults?.workingDaysPerMonth || 0,
          workingHoursPerDay: settingsData?.payrollDefaults?.workingHoursPerDay || 0,
          payFrequency: settingsData?.payrollDefaults?.payFrequency || "",
          payDay: settingsData?.payrollDefaults?.payDay || 0,
          cutoffDay: settingsData?.payrollDefaults?.cutoffDay || 0
        },
        approvalWorkflow: {
          requirePayrollApproval: settingsData?.approvalWorkflow?.requirePayrollApproval ?? false,
          approvalLevels: settingsData?.approvalWorkflow?.approvalLevels || 0,
          autoApproveThreshold: settingsData?.approvalWorkflow?.autoApproveThreshold || 0,
          notifyEmployeesOnPayment: settingsData?.approvalWorkflow?.notifyEmployeesOnPayment ?? false,
          sendPayslipsByEmail: settingsData?.approvalWorkflow?.sendPayslipsByEmail ?? false
        },
        bankingInfo: {
          bankName: settingsData?.bankingInfo?.bankName || "",
          accountNumber: settingsData?.bankingInfo?.accountNumber || "",
          branchCode: settingsData?.bankingInfo?.branchCode || "",
          swiftCode: settingsData?.bankingInfo?.swiftCode || ""
        }
      };
      
      setSettings(completeSettings);
      setOriginalSettings(JSON.parse(JSON.stringify(completeSettings)));
      setHasUnsavedChanges(false);
      
      toast({
        title: "Settings Loaded",
        description: "Payroll settings loaded successfully from database.",
        variant: "default"
      });
    } catch (error) {
      console.error('Failed to load settings:', error);
      toast({
        title: "Error Loading Settings",
        description: "Failed to load payroll settings from database. Please try again.",
        variant: "destructive"
      });
      
      // Use empty settings structure if loading fails - no hardcoded data
      const emptySettings = {
        companyInfo: {
          name: "",
          kraPin: "",
          nssfNumber: "",
          nhifNumber: "",
          address: "",
          postalCode: "",
          city: ""
        },
        payrollDefaults: {
          personalRelief: 0,
          overtimeMultiplier: 0,
          workingDaysPerMonth: 0,
          workingHoursPerDay: 0,
          payFrequency: "",
          payDay: 0,
          cutoffDay: 0
        },
        approvalWorkflow: {
          requirePayrollApproval: false,
          approvalLevels: 0,
          autoApproveThreshold: 0,
          notifyEmployeesOnPayment: false,
          sendPayslipsByEmail: false
        },
        bankingInfo: {
          bankName: "",
          accountNumber: "",
          branchCode: "",
          swiftCode: ""
        }
      };
      setSettings(emptySettings);
      setOriginalSettings(JSON.parse(JSON.stringify(emptySettings)));
    } finally {
      setIsLoading(false);
    }
  };

  // Validation functions
  const validateKRAPin = (pin: string): boolean => {
    // KRA PIN format: P051234567A (P + 9 digits + letter)
    const kraRegex = /^P\d{9}[A-Z]$/;
    return kraRegex.test(pin);
  };

  const validateNSSFNumber = (number: string): boolean => {
    // NSSF format: NSSF + 6 digits
    const nssfRegex = /^NSSF\d{6}$/;
    return nssfRegex.test(number);
  };

  const validateNHIFNumber = (number: string): boolean => {
    // NHIF format: NHIF + 6 digits
    const nhifRegex = /^NHIF\d{6}$/;
    return nhifRegex.test(number);
  };

  const validateBankAccount = (account: string): boolean => {
    // Bank account: 10-16 digits
    const accountRegex = /^\d{10,16}$/;
    return accountRegex.test(account);
  };

  const validateSwiftCode = (swift: string): boolean => {
    // SWIFT code: 8 or 11 characters
    const swiftRegex = /^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/;
    return swiftRegex.test(swift);
  };

  const validateSettings = (): boolean => {
    const errors: Record<string, string> = {};

    // Company Info Validation
    if (!settings.companyInfo.name.trim()) {
      errors.name = "Company name is required";
    }

    if (settings.companyInfo.kraPin && !validateKRAPin(settings.companyInfo.kraPin)) {
      errors.kraPin = "Invalid KRA PIN format (e.g., P051234567A)";
    }

    if (settings.companyInfo.nssfNumber && !validateNSSFNumber(settings.companyInfo.nssfNumber)) {
      errors.nssfNumber = "Invalid NSSF number format (e.g., NSSF001234)";
    }

    if (settings.companyInfo.nhifNumber && !validateNHIFNumber(settings.companyInfo.nhifNumber)) {
      errors.nhifNumber = "Invalid NHIF number format (e.g., NHIF001234)";
    }

    if (!settings.companyInfo.address.trim()) {
      errors.address = "Address is required";
    }

    if (!settings.companyInfo.city.trim()) {
      errors.city = "City is required";
    }

    // Payroll Defaults Validation
    if (settings.payrollDefaults.personalRelief < 0) {
      errors.personalRelief = "Personal relief cannot be negative";
    }

    if (settings.payrollDefaults.overtimeMultiplier < 1) {
      errors.overtimeMultiplier = "Overtime multiplier must be at least 1.0";
    }

    if (settings.payrollDefaults.workingDaysPerMonth < 1 || settings.payrollDefaults.workingDaysPerMonth > 31) {
      errors.workingDaysPerMonth = "Working days must be between 1 and 31";
    }

    if (settings.payrollDefaults.workingHoursPerDay < 1 || settings.payrollDefaults.workingHoursPerDay > 24) {
      errors.workingHoursPerDay = "Working hours must be between 1 and 24";
    }

    if (!settings.payrollDefaults.payFrequency) {
      errors.payFrequency = "Pay frequency is required";
    }

    if (settings.payrollDefaults.payDay < 1 || settings.payrollDefaults.payDay > 31) {
      errors.payDay = "Pay day must be between 1 and 31";
    }

    // Banking Info Validation (only if provided)
    if (settings.bankingInfo.bankName && !settings.bankingInfo.bankName.trim()) {
      errors.bankName = "Bank name cannot be empty if provided";
    }

    if (settings.bankingInfo.accountNumber && !validateBankAccount(settings.bankingInfo.accountNumber)) {
      errors.accountNumber = "Invalid account number (10-16 digits)";
    }

    if (settings.bankingInfo.swiftCode && !validateSwiftCode(settings.bankingInfo.swiftCode)) {
      errors.swiftCode = "Invalid SWIFT code format";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveSettings = async () => {
    if (!validateSettings()) {
      toast({
        title: "Validation Error",
        description: "Please fix the validation errors before saving.",
        variant: "destructive"
      });
      return;
    }

    setIsSaving(true);
    
    try {
      // Real API call to save settings
      await api.payroll.updatePayrollSettings(settings);
      
      setOriginalSettings(JSON.parse(JSON.stringify(settings)));
      setHasUnsavedChanges(false);
      setShowConfirmDialog(false);
      
      toast({
        title: "Settings Saved",
        description: "Payroll settings have been updated successfully.",
        variant: "default"
      });
    } catch (error: any) {
      console.error('Failed to save settings:', error);
      
      let errorMessage = "Failed to save settings. Please try again.";
      
      // Handle specific error types
      if (error.message?.includes('network')) {
        errorMessage = "Network error. Please check your connection and try again.";
      } else if (error.message?.includes('unauthorized')) {
        errorMessage = "You don't have permission to update these settings.";
      } else if (error.message?.includes('validation')) {
        errorMessage = "Server validation failed. Please check your inputs.";
      }
      
      toast({
        title: "Error Saving Settings",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (section: string, field: string, value: any) => {
    setSettings(prev => {
      // Validate and sanitize numeric values to prevent NaN
      let sanitizedValue = value;
      
      // Handle number inputs specifically
      if (section === 'payrollDefaults') {
        if (field === 'personalRelief' || field === 'overtimeMultiplier' || field === 'autoApproveThreshold') {
          const numValue = parseFloat(value);
          sanitizedValue = isNaN(numValue) || value === '' ? 0 : numValue;
        } else if (field === 'workingDaysPerMonth' || field === 'workingHoursPerDay' || field === 'payDay' || field === 'cutoffDay' || field === 'approvalLevels') {
          const intValue = parseInt(value);
          sanitizedValue = isNaN(intValue) || value === '' ? 0 : intValue;
        }
      }
      
      const newSettings = {
        ...prev,
        [section]: {
          ...prev[section as keyof typeof prev],
          [field]: sanitizedValue
        }
      };
      
      // Check if settings have changed
      const hasChanges = JSON.stringify(newSettings) !== JSON.stringify(originalSettings);
      setHasUnsavedChanges(hasChanges);
      
      // Clear validation error for this field
      if (validationErrors[field]) {
        setValidationErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[field];
          return newErrors;
        });
      }
      
      return newSettings;
    });
  };

  const handleConfirmSave = () => {
    setShowConfirmDialog(true);
  };

  const getChangedFields = () => {
    if (!originalSettings) return [];
    
    const changes: string[] = [];
    const checkSection = (sectionName: string, original: any, current: any) => {
      Object.keys(current).forEach(key => {
        if (original[key] !== current[key]) {
          changes.push(`${sectionName}.${key}`);
        }
      });
    };
    
    checkSection('Company Info', originalSettings.companyInfo, settings.companyInfo);
    checkSection('Payroll Defaults', originalSettings.payrollDefaults, settings.payrollDefaults);
    checkSection('Approval Workflow', originalSettings.approvalWorkflow, settings.approvalWorkflow);
    checkSection('Banking Info', originalSettings.bankingInfo, settings.bankingInfo);
    
    return changes;
  };

  if (isLoading) {
    return (
      <DashboardLayout title="Payroll Settings">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
          <span className="ml-2">Loading settings...</span>
        </div>
      </DashboardLayout>
    );
  }

  // Safety check for settings object
  if (!settings || !settings.companyInfo || !settings.payrollDefaults || !settings.approvalWorkflow || !settings.bankingInfo) {
    return (
      <DashboardLayout title="Payroll Settings">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertTriangle className="h-8 w-8 text-yellow-500 mx-auto mb-4" />
            <p className="text-lg">Settings not available</p>
            <p className="text-sm text-gray-500 mt-2">Please refresh the page or contact support.</p>
            <Button onClick={loadSettings} className="mt-4">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry Loading
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Payroll Settings">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Payroll System Settings</CardTitle>
                <CardDescription>
                  Configure payroll calculation parameters and company information
                </CardDescription>
              </div>
              <Button onClick={handleSaveSettings} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Settings
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
        </Card>

        {hasUnsavedChanges && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              You have unsaved changes. Don't forget to save your settings.
            </AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="company" className="space-y-6">
          <TabsList>
            <TabsTrigger value="company">Company Information</TabsTrigger>
            <TabsTrigger value="payroll">Payroll Defaults</TabsTrigger>
            <TabsTrigger value="workflow">Approval Workflow</TabsTrigger>
            <TabsTrigger value="banking">Banking Information</TabsTrigger>
          </TabsList>

          <TabsContent value="company" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Building className="h-5 w-5 mr-2" />
                  Company Information
                </CardTitle>
                <CardDescription>
                  Company details used in payroll reports and statutory filings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="company-name">Company Name</Label>
                    <Input 
                      id="company-name" 
                      value={settings.companyInfo.name}
                      onChange={(e) => handleInputChange('companyInfo', 'name', e.target.value)}
                      className={validationErrors.name ? 'border-red-500' : ''}
                      placeholder="Enter your company name"
                    />
                    {validationErrors.name && (
                      <p className="text-sm text-red-500">{validationErrors.name}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="kra-pin">KRA PIN</Label>
                    <Input 
                      id="kra-pin" 
                      value={settings.companyInfo.kraPin}
                      onChange={(e) => handleInputChange('companyInfo', 'kraPin', e.target.value)}
                      className={validationErrors.kraPin ? 'border-red-500' : ''}
                      placeholder="e.g., P051234567A"
                    />
                    {validationErrors.kraPin && (
                      <p className="text-sm text-red-500">{validationErrors.kraPin}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="nssf-number">NSSF Number</Label>
                    <Input 
                      id="nssf-number" 
                      value={settings.companyInfo.nssfNumber}
                      onChange={(e) => handleInputChange('companyInfo', 'nssfNumber', e.target.value)}
                      className={validationErrors.nssfNumber ? 'border-red-500' : ''}
                      placeholder="e.g., NSSF001234"
                    />
                    {validationErrors.nssfNumber && (
                      <p className="text-sm text-red-500">{validationErrors.nssfNumber}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="nhif-number">NHIF Number</Label>
                    <Input 
                      id="nhif-number" 
                      value={settings.companyInfo.nhifNumber}
                      onChange={(e) => handleInputChange('companyInfo', 'nhifNumber', e.target.value)}
                      className={validationErrors.nhifNumber ? 'border-red-500' : ''}
                      placeholder="e.g., NHIF001234"
                    />
                    {validationErrors.nhifNumber && (
                      <p className="text-sm text-red-500">{validationErrors.nhifNumber}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Input 
                      id="address" 
                      value={settings.companyInfo.address}
                      onChange={(e) => handleInputChange('companyInfo', 'address', e.target.value)}
                      className={validationErrors.address ? 'border-red-500' : ''}
                      placeholder="Enter company physical address"
                    />
                    {validationErrors.address && (
                      <p className="text-sm text-red-500">{validationErrors.address}</p>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="postal-code">Postal Code</Label>
                      <Input 
                        id="postal-code" 
                        value={settings.companyInfo.postalCode}
                        onChange={(e) => handleInputChange('companyInfo', 'postalCode', e.target.value)}
                        placeholder="e.g., 00100"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="city">City</Label>
                      <Input 
                        id="city" 
                        value={settings.companyInfo.city}
                        onChange={(e) => handleInputChange('companyInfo', 'city', e.target.value)}
                        className={validationErrors.city ? 'border-red-500' : ''}
                        placeholder="e.g., Nairobi"
                      />
                      {validationErrors.city && (
                        <p className="text-sm text-red-500">{validationErrors.city}</p>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payroll" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2" />
                  Payroll Calculation Defaults
                </CardTitle>
                <CardDescription>
                  Default values used in payroll calculations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="personal-relief">Personal Relief (KES)</Label>
                    <Input 
                      id="personal-relief" 
                      type="number"
                      min="0"
                      step="0.01"
                      value={settings.payrollDefaults.personalRelief || ''}
                      onChange={(e) => handleInputChange('payrollDefaults', 'personalRelief', e.target.value)}
                      className={validationErrors.personalRelief ? 'border-red-500' : ''}
                      placeholder="e.g., 2400"
                    />
                    {validationErrors.personalRelief && (
                      <p className="text-sm text-red-500">{validationErrors.personalRelief}</p>
                    )}
                    <p className="text-sm text-muted-foreground">
                      Standard personal relief applied to all employees
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="overtime-multiplier">Overtime Multiplier</Label>
                    <Input 
                      id="overtime-multiplier" 
                      type="number"
                      min="0"
                      step="0.1"
                      value={settings.payrollDefaults.overtimeMultiplier || ''}
                      onChange={(e) => handleInputChange('payrollDefaults', 'overtimeMultiplier', e.target.value)}
                      className={validationErrors.overtimeMultiplier ? 'border-red-500' : ''}
                      placeholder="e.g., 1.5"
                    />
                    {validationErrors.overtimeMultiplier && (
                      <p className="text-sm text-red-500">{validationErrors.overtimeMultiplier}</p>
                    )}
                    <p className="text-sm text-muted-foreground">
                      Multiplier for overtime hours (e.g., 1.5 = time and a half)
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="working-days">Working Days per Month</Label>
                    <Input 
                      id="working-days" 
                      type="number"
                      min="1"
                      max="31"
                      value={settings.payrollDefaults.workingDaysPerMonth || ''}
                      onChange={(e) => handleInputChange('payrollDefaults', 'workingDaysPerMonth', e.target.value)}
                      className={validationErrors.workingDaysPerMonth ? 'border-red-500' : ''}
                      placeholder="e.g., 22"
                    />
                    {validationErrors.workingDaysPerMonth && (
                      <p className="text-sm text-red-500">{validationErrors.workingDaysPerMonth}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="working-hours">Working Hours per Day</Label>
                    <Input 
                      id="working-hours" 
                      type="number"
                      min="1"
                      max="24"
                      value={settings.payrollDefaults.workingHoursPerDay || ''}
                      onChange={(e) => handleInputChange('payrollDefaults', 'workingHoursPerDay', e.target.value)}
                      className={validationErrors.workingHoursPerDay ? 'border-red-500' : ''}
                      placeholder="e.g., 8"
                    />
                    {validationErrors.workingHoursPerDay && (
                      <p className="text-sm text-red-500">{validationErrors.workingHoursPerDay}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="pay-frequency">Pay Frequency</Label>
                    <Select 
                      value={settings.payrollDefaults.payFrequency}
                      onValueChange={(value) => handleInputChange('payrollDefaults', 'payFrequency', value)}
                    >
                      <SelectTrigger id="pay-frequency">
                        <SelectValue placeholder="Select pay frequency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="biweekly">Bi-weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="pay-day">Pay Day</Label>
                    <Input 
                      id="pay-day" 
                      type="number"
                      min="1"
                      max="31"
                      value={settings.payrollDefaults.payDay || ''}
                      onChange={(e) => handleInputChange('payrollDefaults', 'payDay', e.target.value)}
                      className={validationErrors.payDay ? 'border-red-500' : ''}
                      placeholder="e.g., 25"
                    />
                    {validationErrors.payDay && (
                      <p className="text-sm text-red-500">{validationErrors.payDay}</p>
                    )}
                    <p className="text-sm text-muted-foreground">
                      Day of month when employees are paid
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="workflow" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  Approval Workflow
                </CardTitle>
                <CardDescription>
                  Configure payroll approval process and notifications
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="require-approval">Require Payroll Approval</Label>
                      <p className="text-sm text-muted-foreground">
                        Require manager approval before processing payroll
                      </p>
                    </div>
                    <Switch 
                      id="require-approval"
                      checked={settings.approvalWorkflow.requirePayrollApproval}
                      onCheckedChange={(checked) => handleInputChange('approvalWorkflow', 'requirePayrollApproval', checked)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="approval-levels">Approval Levels</Label>
                    <Select 
                      value={settings.approvalWorkflow.approvalLevels.toString()}
                      onValueChange={(value) => handleInputChange('approvalWorkflow', 'approvalLevels', parseInt(value))}
                      disabled={!settings.approvalWorkflow.requirePayrollApproval}
                    >
                      <SelectTrigger id="approval-levels">
                        <SelectValue placeholder="Select approval levels" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 Level</SelectItem>
                        <SelectItem value="2">2 Levels</SelectItem>
                        <SelectItem value="3">3 Levels</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-muted-foreground">
                      Number of approval levels required
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="auto-approve-threshold">Auto-Approve Threshold (KES)</Label>
                    <Input 
                      id="auto-approve-threshold" 
                      type="number"
                      value={settings.approvalWorkflow.autoApproveThreshold}
                      onChange={(e) => handleInputChange('approvalWorkflow', 'autoApproveThreshold', parseInt(e.target.value))}
                      disabled={!settings.approvalWorkflow.requirePayrollApproval}
                    />
                    <p className="text-sm text-muted-foreground">
                      Automatically approve changes below this amount
                    </p>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="notify-employees">Notify Employees on Payment</Label>
                      <p className="text-sm text-muted-foreground">
                        Send email notification when payment is processed
                      </p>
                    </div>
                    <Switch 
                      id="notify-employees"
                      checked={settings.approvalWorkflow.notifyEmployeesOnPayment}
                      onCheckedChange={(checked) => handleInputChange('approvalWorkflow', 'notifyEmployeesOnPayment', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="send-payslips">Send Payslips by Email</Label>
                      <p className="text-sm text-muted-foreground">
                        Automatically email payslips to employees
                      </p>
                    </div>
                    <Switch 
                      id="send-payslips"
                      checked={settings.approvalWorkflow.sendPayslipsByEmail}
                      onCheckedChange={(checked) => handleInputChange('approvalWorkflow', 'sendPayslipsByEmail', checked)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="banking" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <DollarSign className="h-5 w-5 mr-2" />
                  Banking Information
                </CardTitle>
                <CardDescription>
                  Company banking details for payroll processing
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="bank-name">Bank Name</Label>
                    <Input 
                      id="bank-name" 
                      value={settings.bankingInfo.bankName}
                      onChange={(e) => handleInputChange('bankingInfo', 'bankName', e.target.value)}
                      className={validationErrors.bankName ? 'border-red-500' : ''}
                      placeholder="e.g., Kenya Commercial Bank"
                    />
                    {validationErrors.bankName && (
                      <p className="text-sm text-red-500">{validationErrors.bankName}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="account-number">Account Number</Label>
                    <Input 
                      id="account-number" 
                      value={settings.bankingInfo.accountNumber}
                      onChange={(e) => handleInputChange('bankingInfo', 'accountNumber', e.target.value)}
                      className={validationErrors.accountNumber ? 'border-red-500' : ''}
                      placeholder="e.g., 1234567890"
                    />
                    {validationErrors.accountNumber && (
                      <p className="text-sm text-red-500">{validationErrors.accountNumber}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="branch-code">Branch Code</Label>
                    <Input 
                      id="branch-code" 
                      value={settings.bankingInfo.branchCode}
                      onChange={(e) => handleInputChange('bankingInfo', 'branchCode', e.target.value)}
                      className={validationErrors.branchCode ? 'border-red-500' : ''}
                    />
                    {validationErrors.branchCode && (
                      <p className="text-sm text-red-500">{validationErrors.branchCode}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="swift-code">SWIFT Code</Label>
                    <Input 
                      id="swift-code" 
                      value={settings.bankingInfo.swiftCode}
                      onChange={(e) => handleInputChange('bankingInfo', 'swiftCode', e.target.value)}
                      className={validationErrors.swiftCode ? 'border-red-500' : ''}
                    />
                    {validationErrors.swiftCode && (
                      <p className="text-sm text-red-500">{validationErrors.swiftCode}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Banking information is used for payroll processing and will appear on bank transfer files.
              </AlertDescription>
            </Alert>
          </TabsContent>
        </Tabs>

        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div className="flex items-center text-sm text-muted-foreground">
                <Clock className="h-4 w-4 mr-2" />
                <span>Last updated: July 1, 2025 at 10:23 AM</span>
              </div>
              <Button onClick={handleSaveSettings} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Settings
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default PayrollSettings;
