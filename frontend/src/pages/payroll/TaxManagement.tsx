import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Settings, 
  Calculator, 
  FileText, 
  Download,
  Edit,
  Save,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Info
} from 'lucide-react';


const TaxManagement = () => {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Initialize state with empty arrays, to be loaded from API
  const [payeTaxBands, setPayeTaxBands] = useState<any[]>([]);
  const [nssfRates, setNssfRates] = useState<any>({});
  const [nhifBands, setNhifBands] = useState<any[]>([]);
  const [personalRelief, setPersonalRelief] = useState(0);
  const [taxSettings, setTaxSettings] = useState<any>({});

  // Load tax configuration from API
  useEffect(() => {
    const loadTaxConfiguration = async () => {
      try {
        setLoading(true);
        
        // TODO: Implement proper API endpoints for tax configuration
        // For now, load from regulatory service or use minimal defaults
        
        // Load default Kenyan tax bands (to be replaced with API call)
        const defaultPayeBands = [
          { min: 0, max: 24000, rate: 10, baseAmount: 0, description: '10% on first KSH 24,000' },
          { min: 24001, max: 32333, rate: 25, baseAmount: 2400, description: '25% on next KSH 8,333' },
          { min: 32334, max: 500000, rate: 30, baseAmount: 4483, description: '30% on next KSH 467,667' },
          { min: 500001, max: 800000, rate: 32.5, baseAmount: 144783, description: '32.5% on next KSH 300,000' },
          { min: 800001, max: Infinity, rate: 35, baseAmount: 242283, description: '35% on excess' }
        ];

        const defaultNssfRates = {
          tier1Limit: 7000,
          tier2Limit: 36000,
          employeeRate: 6,
          employerRate: 6,
          description: 'NSSF contribution rates for 2024'
        };

        const defaultNhifBands = [
          { min: 0, max: 5999, amount: 150 },
          { min: 6000, max: 7999, amount: 300 },
          { min: 8000, max: 11999, amount: 400 },
          { min: 12000, max: 14999, amount: 500 },
          { min: 15000, max: 19999, amount: 600 },
          { min: 20000, max: 24999, amount: 750 },
          { min: 25000, max: 29999, amount: 850 },
          { min: 30000, max: 34999, amount: 900 },
          { min: 35000, max: 39999, amount: 950 },
          { min: 40000, max: 44999, amount: 1000 },
          { min: 45000, max: 49999, amount: 1100 },
          { min: 50000, max: 59999, amount: 1200 },
          { min: 60000, max: 69999, amount: 1300 },
          { min: 70000, max: 79999, amount: 1400 },
          { min: 80000, max: 89999, amount: 1500 },
          { min: 90000, max: 99999, amount: 1600 },
          { min: 100000, max: Infinity, amount: 1700 }
        ];

        const defaultTaxSettings = {
          lastUpdated: new Date().toISOString().split('T')[0],
          effectiveDate: '2024-01-01',
          version: '2024.1',
          status: 'active'
        };

        // In future, replace with actual API calls:
        // const taxConfig = await api.payroll.getTaxConfiguration();
        
        setPayeTaxBands(defaultPayeBands);
        setNssfRates(defaultNssfRates);
        setNhifBands(defaultNhifBands);
        setPersonalRelief(2400); // Kenyan personal relief
        setTaxSettings(defaultTaxSettings);
        
      } catch (error) {
        console.error('Failed to load tax configuration:', error);
        toast({
          title: "Error",
          description: "Failed to load tax configuration. Using defaults.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    loadTaxConfiguration();
  }, [toast]);

  const handleSaveChanges = () => {
    setIsEditing(false);
    // Here you would save the changes to the backend
    console.log('Saving tax configuration changes...');
    toast({
      title: "Configuration Saved",
      description: "Tax configuration has been updated successfully."
    });
  };

  const handleExportConfiguration = async () => {
    setIsExporting(true);
    try {
      // Create configuration data
      const configData = {
        payeTaxBands,
        nssfRates,
        nhifBands,
        personalRelief,
        taxSettings,
        exportDate: new Date().toISOString(),
        version: taxSettings.version
      };

      // Convert to JSON and create downloadable file
      const jsonContent = JSON.stringify(configData, null, 2);
      const blob = new Blob([jsonContent], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `kenyan-tax-configuration-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Export Successful",
        description: "Tax configuration has been exported successfully."
      });
    } catch (error) {
      console.error('Failed to export configuration:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export configuration. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleResetToDefaults = async () => {
    setIsResetting(true);
    try {
      // Reset to default values
      setPayeTaxBands([
        { min: 0, max: 24000, rate: 10, baseAmount: 0, description: '10% on first KSH 24,000' },
        { min: 24001, max: 32333, rate: 25, baseAmount: 2400, description: '25% on next KSH 8,333' },
        { min: 32334, max: 500000, rate: 30, baseAmount: 4483, description: '30% on next KSH 467,667' },
        { min: 500001, max: 800000, rate: 32.5, baseAmount: 144783, description: '32.5% on next KSH 300,000' },
        { min: 800001, max: Infinity, rate: 35, baseAmount: 242283, description: '35% on excess' }
      ]);

      setNssfRates({
        tier1Limit: 7000,
        tier2Limit: 36000,
        employeeRate: 6,
        employerRate: 6,
        description: 'NSSF contribution rates for 2024'
      });

      setNhifBands([
        { min: 0, max: 5999, amount: 150 },
        { min: 6000, max: 7999, amount: 300 },
        { min: 8000, max: 11999, amount: 400 },
        { min: 12000, max: 14999, amount: 500 },
        { min: 15000, max: 19999, amount: 600 },
        { min: 20000, max: 24999, amount: 750 },
        { min: 25000, max: 29999, amount: 850 },
        { min: 30000, max: 34999, amount: 900 },
        { min: 35000, max: 39999, amount: 950 },
        { min: 40000, max: 44999, amount: 1000 },
        { min: 45000, max: 49999, amount: 1100 },
        { min: 50000, max: 59999, amount: 1200 },
        { min: 60000, max: 69999, amount: 1300 },
        { min: 70000, max: 79999, amount: 1400 },
        { min: 80000, max: 89999, amount: 1500 },
        { min: 90000, max: 99999, amount: 1600 },
        { min: 100000, max: Infinity, amount: 1700 }
      ]);

      setPersonalRelief(2400);

      toast({
        title: "Reset Successful",
        description: "Tax configuration has been reset to default values."
      });
    } catch (error) {
      console.error('Failed to reset configuration:', error);
      toast({
        title: "Reset Failed",
        description: "Failed to reset configuration. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsResetting(false);
    }
  };

  const handleGenerateTaxReport = async () => {
    setIsGeneratingReport(true);
    try {
      // Generate tax report data
      const reportData = [
        'Kenyan Tax Configuration Report',
        `Generated on: ${new Date().toLocaleDateString()}`,
        `Version: ${taxSettings.version}`,
        '',
        'PAYE Tax Bands:',
        ...payeTaxBands.map(band => 
          `${band.max === Infinity ? `${band.min.toLocaleString()} and above` : `${band.min.toLocaleString()} - ${band.max.toLocaleString()}`}: ${band.rate}% (Base: ${formatCurrency(band.baseAmount)})`
        ),
        '',
        'NSSF Rates:',
        `Tier 1 Limit: ${formatCurrency(nssfRates.tier1Limit)}`,
        `Tier 2 Limit: ${formatCurrency(nssfRates.tier2Limit)}`,
        `Employee Rate: ${nssfRates.employeeRate}%`,
        `Employer Rate: ${nssfRates.employerRate}%`,
        '',
        'NHIF Bands:',
        ...nhifBands.map(band => 
          `${band.max === Infinity ? `${band.min.toLocaleString()} and above` : `${band.min.toLocaleString()} - ${band.max.toLocaleString()}`}: ${formatCurrency(band.amount)}`
        ),
        '',
        `Personal Relief: ${formatCurrency(personalRelief)} per month (${formatCurrency(personalRelief * 12)} annually)`
      ].join('\n');

      // Create and download report
      const blob = new Blob([reportData], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `kenyan-tax-report-${new Date().toISOString().split('T')[0]}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Report Generated",
        description: "Tax configuration report has been generated and downloaded."
      });
    } catch (error) {
      console.error('Failed to generate tax report:', error);
      toast({
        title: "Report Generation Failed",
        description: "Failed to generate tax report. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return (
      <DashboardLayout title="Tax Management">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p>Loading tax configuration...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Tax Management">
      <div className="space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Kenyan Tax Configuration</CardTitle>
                <CardDescription>
                  Manage PAYE, NSSF, and NHIF rates and bands for payroll calculations
                </CardDescription>
              </div>
              <div className="flex items-center space-x-2">
                <Badge className="bg-green-100 text-green-800">
                  {taxSettings.status}
                </Badge>
                {isEditing ? (
                  <div className="flex space-x-2">
                    <Button onClick={handleSaveChanges} size="sm">
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </Button>
                    <Button variant="outline" onClick={() => setIsEditing(false)} size="sm">
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <Button onClick={() => setIsEditing(true)} size="sm">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Configuration
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <Label className="text-sm font-medium">Last Updated</Label>
                <div className="text-sm text-muted-foreground">{taxSettings.lastUpdated}</div>
              </div>
              <div>
                <Label className="text-sm font-medium">Effective Date</Label>
                <div className="text-sm text-muted-foreground">{taxSettings.effectiveDate}</div>
              </div>
              <div>
                <Label className="text-sm font-medium">Version</Label>
                <div className="text-sm text-muted-foreground">{taxSettings.version}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="paye" className="space-y-6">
          <TabsList>
            <TabsTrigger value="paye">PAYE Tax Bands</TabsTrigger>
            <TabsTrigger value="nssf">NSSF Rates</TabsTrigger>
            <TabsTrigger value="nhif">NHIF Bands</TabsTrigger>
            <TabsTrigger value="relief">Personal Relief</TabsTrigger>
          </TabsList>

          <TabsContent value="paye" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>PAYE Tax Bands (2024)</CardTitle>
                <CardDescription>
                  Pay As You Earn tax bands as per Kenya Revenue Authority guidelines
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Alert className="mb-4">
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    These tax bands are set by KRA and should only be updated when official changes are announced.
                  </AlertDescription>
                </Alert>
                
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Income Range (KSH)</TableHead>
                      <TableHead>Tax Rate (%)</TableHead>
                      <TableHead>Base Amount (KSH)</TableHead>
                      <TableHead>Description</TableHead>
                      {isEditing && <TableHead>Actions</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payeTaxBands.map((band, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          {band.max === Infinity 
                            ? `${band.min.toLocaleString()} and above`
                            : `${band.min.toLocaleString()} - ${band.max.toLocaleString()}`
                          }
                        </TableCell>
                        <TableCell>
                          {isEditing ? (
                            <Input 
                              type="number" 
                              value={band.rate} 
                              onChange={(e) => {
                                const newBands = [...payeTaxBands];
                                newBands[index].rate = parseFloat(e.target.value);
                                setPayeTaxBands(newBands);
                              }}
                              className="w-20"
                            />
                          ) : (
                            `${band.rate}%`
                          )}
                        </TableCell>
                        <TableCell>{formatCurrency(band.baseAmount)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {band.description}
                        </TableCell>
                        {isEditing && (
                          <TableCell>
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="nssf" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>NSSF Contribution Rates</CardTitle>
                <CardDescription>
                  National Social Security Fund contribution rates and limits
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="tier1-limit">Tier 1 Limit (KSH)</Label>
                      <Input
                        id="tier1-limit"
                        type="number"
                        value={nssfRates.tier1Limit}
                        disabled={!isEditing}
                        onChange={(e) => setNssfRates({
                          ...nssfRates,
                          tier1Limit: parseInt(e.target.value)
                        })}
                      />
                      <div className="text-sm text-muted-foreground mt-1">
                        Maximum salary for Tier 1 contributions
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="tier2-limit">Tier 2 Limit (KSH)</Label>
                      <Input
                        id="tier2-limit"
                        type="number"
                        value={nssfRates.tier2Limit}
                        disabled={!isEditing}
                        onChange={(e) => setNssfRates({
                          ...nssfRates,
                          tier2Limit: parseInt(e.target.value)
                        })}
                      />
                      <div className="text-sm text-muted-foreground mt-1">
                        Maximum salary for Tier 2 contributions
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="employee-rate">Employee Rate (%)</Label>
                      <Input
                        id="employee-rate"
                        type="number"
                        value={nssfRates.employeeRate}
                        disabled={!isEditing}
                        onChange={(e) => setNssfRates({
                          ...nssfRates,
                          employeeRate: parseFloat(e.target.value)
                        })}
                      />
                      <div className="text-sm text-muted-foreground mt-1">
                        Employee contribution percentage
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="employer-rate">Employer Rate (%)</Label>
                      <Input
                        id="employer-rate"
                        type="number"
                        value={nssfRates.employerRate}
                        disabled={!isEditing}
                        onChange={(e) => setNssfRates({
                          ...nssfRates,
                          employerRate: parseFloat(e.target.value)
                        })}
                      />
                      <div className="text-sm text-muted-foreground mt-1">
                        Employer contribution percentage
                      </div>
                    </div>
                  </div>
                </div>

                <Alert className="mt-6">
                  <Calculator className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Calculation Example:</strong> For a salary of KSH 50,000:
                    <br />
                    • Tier 1: KSH 7,000 × 6% = KSH 420
                    <br />
                    • Tier 2: KSH 14,000 × 6% = KSH 840
                    <br />
                    • Total Employee Contribution: KSH 1,260
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="nhif" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>NHIF Contribution Bands</CardTitle>
                <CardDescription>
                  National Hospital Insurance Fund contribution amounts by salary band
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Salary Range (KSH)</TableHead>
                      <TableHead>Monthly Contribution (KSH)</TableHead>
                      {isEditing && <TableHead>Actions</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {nhifBands.map((band, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          {band.max === Infinity 
                            ? `${band.min.toLocaleString()} and above`
                            : `${band.min.toLocaleString()} - ${band.max.toLocaleString()}`
                          }
                        </TableCell>
                        <TableCell>
                          {isEditing ? (
                            <Input 
                              type="number" 
                              value={band.amount} 
                              onChange={(e) => {
                                const newBands = [...nhifBands];
                                newBands[index].amount = parseInt(e.target.value);
                                setNhifBands(newBands);
                              }}
                              className="w-24"
                            />
                          ) : (
                            formatCurrency(band.amount)
                          )}
                        </TableCell>
                        {isEditing && (
                          <TableCell>
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="relief" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Personal Relief</CardTitle>
                <CardDescription>
                  Monthly personal relief amount as per KRA guidelines
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="max-w-md space-y-4">
                  <div>
                    <Label htmlFor="personal-relief">Monthly Personal Relief (KSH)</Label>
                    <Input
                      id="personal-relief"
                      type="number"
                      value={personalRelief}
                      disabled={!isEditing}
                      onChange={(e) => setPersonalRelief(parseInt(e.target.value))}
                    />
                    <div className="text-sm text-muted-foreground mt-1">
                      Standard personal relief applied to all employees
                    </div>
                  </div>

                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      Personal relief is deducted from the calculated PAYE tax amount. 
                      The current rate is KSH 2,400 per month as per KRA guidelines.
                    </AlertDescription>
                  </Alert>

                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium mb-2">Annual Personal Relief</h4>
                    <div className="text-2xl font-bold text-green-600">
                      {formatCurrency(personalRelief * 12)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Total annual personal relief per employee
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Action Buttons */}
        <Card>
          <CardHeader>
            <CardTitle>Configuration Actions</CardTitle>
            <CardDescription>
              Additional actions for tax configuration management
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              <Button variant="outline" onClick={handleExportConfiguration} disabled={isExporting}>
                {isExporting ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Export Configuration
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={handleResetToDefaults} disabled={isResetting}>
                {isResetting ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Resetting...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Reset to Defaults
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={handleGenerateTaxReport} disabled={isGeneratingReport}>
                {isGeneratingReport ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4 mr-2" />
                    Generate Tax Report
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

export default TaxManagement;
