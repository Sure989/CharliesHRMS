import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { employeeService } from '@/services/api/employee.service';
import { payrollService } from '@/services/api/payroll.service';
import { authService } from '@/services/api/auth.service';
import { apiClient } from '@/services/apiClient';

interface DebugResult {
  title: string;
  content: any;
  type: 'success' | 'error' | 'warning' | 'info';
  timestamp: Date;
  category: string;
}

const SystemDebugTool: React.FC = () => {
  const [results, setResults] = useState<DebugResult[]>([]);
  const [loading, setLoading] = useState<{ [key: string]: boolean }>({});
  const [activeTab, setActiveTab] = useState('overview');

  const addResult = (
    title: string, 
    content: any, 
    type: 'success' | 'error' | 'warning' | 'info' = 'info',
    category: string = 'general'
  ) => {
    setResults(prev => [...prev, { 
      title, 
      content, 
      type, 
      timestamp: new Date(),
      category 
    }]);
  };

  const setLoadingState = (key: string, state: boolean) => {
    setLoading(prev => ({ ...prev, [key]: state }));
  };

  const clearResults = () => {
    setResults([]);
  };

  // System Overview Diagnostics
  const runSystemOverview = async () => {
    setLoadingState('overview', true);
    setResults([]);

    try {
      addResult('🔍 System Health Check', 'Starting comprehensive system diagnostics...', 'info', 'overview');

      // Check API connectivity
      addResult('🌐 API Connectivity', 'Testing backend connection...', 'info', 'overview');
      try {
        const healthResponse = await apiClient.get('/health');
        addResult('🌐 API Health', {
          status: healthResponse ? 'Connected' : 'Failed',
          response: healthResponse
        }, healthResponse ? 'success' : 'error', 'overview');
      } catch (error) {
        console.error('API Health check failed:', error);
        addResult('🌐 API Health', { 
          error: 'Backend unreachable',
          details: error instanceof Error ? error.message : 'Unknown error'
        }, 'error', 'overview');
      }

      // Check authentication
      addResult('🔐 Authentication', 'Verifying user session...', 'info', 'overview');
      try {
        const user = await authService.getCurrentUser();
        addResult('🔐 User Session', {
          authenticated: !!user,
          user: user ? {
            role: user.role,
            email: user.email,
            permissions: user.permissions || []
          } : null
        }, user ? 'success' : 'error', 'overview');
      } catch (error) {
        addResult('🔐 User Session', {
          authenticated: false,
          error: 'Failed to get user session'
        }, 'error', 'overview');
      }

      // Database connectivity
      addResult('🗄️ Database Status', 'Checking database operations...', 'info', 'overview');
      try {
        const employeesData = await employeeService.getEmployees({ page: 1, limit: 1 });
        addResult('🗄️ Database Operations', {
          status: 'Connected',
          sampleQuery: 'Employees table accessible'
        }, 'success', 'overview');
      } catch (error) {
        addResult('🗄️ Database Operations', { error: 'Database query failed' }, 'error', 'overview');
      }

    } catch (error: any) {
      addResult('❌ System Overview Failed', { error: error.message }, 'error', 'overview');
    } finally {
      setLoadingState('overview', false);
    }
  };

  // Employee Management Diagnostics
  const runEmployeeDiagnostics = async () => {
    setLoadingState('employees', true);

    try {
      addResult('👥 Employee System Check', 'Analyzing employee data integrity...', 'info', 'employees');

      const employeesData = await employeeService.getEmployees();
      if (employeesData?.data) {
        const employees = employeesData.data;
        const activeEmployees = employees.filter((emp: any) => emp.status === 'active');
        const employeesWithSalary = employees.filter((emp: any) => emp.salary && emp.salary > 0);
        const employeesWithoutEmail = employees.filter((emp: any) => !emp.email);
        const employeesWithoutPhone = employees.filter((emp: any) => !emp.phone);

        addResult('👥 Employee Statistics', {
          total: employees.length,
          active: activeEmployees.length,
          withSalary: employeesWithSalary.length,
          dataIssues: {
            missingEmail: employeesWithoutEmail.length,
            missingPhone: employeesWithoutPhone.length
          }
        }, 'success', 'employees');

        // Check for duplicate employee numbers
        const employeeNumbers = employees.map((emp: any) => emp.employeeNumber);
        const duplicates = employeeNumbers.filter((num: string, index: number) => 
          employeeNumbers.indexOf(num) !== index
        );

        if (duplicates.length > 0) {
          addResult('⚠️ Data Integrity Issues', {
            duplicateEmployeeNumbers: duplicates
          }, 'warning', 'employees');
        }

        // Check salary configurations
        addResult('💰 Salary Configuration', {
          employeesWithSalary: employeesWithSalary.map((emp: any) => ({
            name: `${emp.firstName} ${emp.lastName}`,
            employeeNumber: emp.employeeNumber,
            salary: emp.salary,
            status: emp.status
          }))
        }, employeesWithSalary.length > 0 ? 'success' : 'warning', 'employees');
      }

    } catch (error: any) {
      addResult('❌ Employee Diagnostics Failed', { error: error.message }, 'error', 'employees');
    } finally {
      setLoadingState('employees', false);
    }
  };

  // Payroll System Diagnostics
  const runPayrollDiagnostics = async () => {
    setLoadingState('payroll', true);

    try {
      addResult('💼 Payroll System Check', 'Analyzing payroll configuration...', 'info', 'payroll');

      // Check payroll periods
      const periodsData = await payrollService.getPayrollPeriods();
      if (periodsData?.data) {
        const periods = periodsData.data;
        const currentPeriod = periods[0];

        addResult('📅 Payroll Periods', {
          totalPeriods: periods.length,
          currentPeriod: currentPeriod ? {
            name: currentPeriod.name,
            status: currentPeriod.status,
            startDate: currentPeriod.startDate,
            endDate: currentPeriod.endDate
          } : null
        }, currentPeriod ? 'success' : 'warning', 'payroll');

        if (currentPeriod) {
          // Check payroll records for current period
          const recordsData = await payrollService.getPayrollRecords({ 
            periodId: currentPeriod.id 
          });
          const records = recordsData?.data || [];
          const recordsWithSalary = records.filter((r: any) => r.grossSalary > 0);
          const totalPayroll = recordsWithSalary.reduce((sum: number, r: any) => 
            sum + (r.grossSalary || 0), 0
          );

          addResult('💰 Payroll Records', {
            totalRecords: records.length,
            recordsWithSalary: recordsWithSalary.length,
            totalPayrollAmount: totalPayroll,
            averageSalary: recordsWithSalary.length > 0 ? 
              Math.round(totalPayroll / recordsWithSalary.length) : 0
          }, recordsWithSalary.length > 0 ? 'success' : 'warning', 'payroll');

          // Check for payroll calculation issues
          const issueRecords = records.filter((r: any) => 
            r.grossSalary > 0 && r.netSalary <= 0
          );
          
          if (issueRecords.length > 0) {
            addResult('⚠️ Payroll Calculation Issues', {
              recordsWithIssues: issueRecords.length,
              issues: issueRecords.map((r: any) => ({
                employee: `${r.employee?.firstName} ${r.employee?.lastName}`,
                grossSalary: r.grossSalary,
                netSalary: r.netSalary,
                issue: 'Net salary is zero or negative'
              }))
            }, 'warning', 'payroll');
          }
        }
      }

    } catch (error: any) {
      addResult('❌ Payroll Diagnostics Failed', { error: error.message }, 'error', 'payroll');
    } finally {
      setLoadingState('payroll', false);
    }
  };

  // Performance & Usage Analytics
  const runPerformanceDiagnostics = async () => {
    setLoadingState('performance', true);

    try {
      addResult('⚡ Performance Analysis', 'Analyzing system performance...', 'info', 'performance');

      // Browser performance
      const performance = window.performance;
      const navigationTiming = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      
      addResult('🌐 Browser Performance', {
        pageLoadTime: Math.round(navigationTiming.loadEventEnd - navigationTiming.fetchStart),
        domContentLoaded: Math.round(navigationTiming.domContentLoadedEventEnd - navigationTiming.fetchStart),
        timeToFirstByte: Math.round(navigationTiming.responseStart - navigationTiming.requestStart),
        memoryUsage: (performance as any).memory ? {
          used: Math.round((performance as any).memory.usedJSHeapSize / 1024 / 1024),
          total: Math.round((performance as any).memory.totalJSHeapSize / 1024 / 1024),
          limit: Math.round((performance as any).memory.jsHeapSizeLimit / 1024 / 1024)
        } : 'Not available'
      }, 'info', 'performance');

      // Local storage usage
      const localStorageSize = new Blob(Object.values(localStorage)).size;
      addResult('💾 Storage Usage', {
        localStorage: Math.round(localStorageSize / 1024),
        sessionStorage: new Blob(Object.values(sessionStorage)).size / 1024,
        storedItems: Object.keys(localStorage).length
      }, 'info', 'performance');

      // API response time test
      const apiStart = Date.now();
      await employeeService.getEmployees({ page: 1, limit: 1 });
      const apiTime = Date.now() - apiStart;

      addResult('🔗 API Response Time', {
        responseTime: apiTime,
        status: apiTime < 1000 ? 'Good' : apiTime < 3000 ? 'Moderate' : 'Slow'
      }, apiTime < 1000 ? 'success' : apiTime < 3000 ? 'warning' : 'error', 'performance');

    } catch (error: any) {
      addResult('❌ Performance Diagnostics Failed', { error: error.message }, 'error', 'performance');
    } finally {
      setLoadingState('performance', false);
    }
  };

  // Data Integrity Checks
  const runDataIntegrityChecks = async () => {
    setLoadingState('integrity', true);

    try {
      addResult('🔍 Data Integrity Check', 'Analyzing data consistency...', 'info', 'integrity');

      // Check employee-payroll relationship integrity
      const employeesData = await employeeService.getEmployees();
      const periodsData = await payrollService.getPayrollPeriods();

      if (employeesData?.data && periodsData?.data) {
        const employees = employeesData.data;
        const currentPeriod = periodsData.data[0];

        if (currentPeriod) {
          const recordsData = await payrollService.getPayrollRecords({ 
            periodId: currentPeriod.id 
          });
          const records = recordsData?.data || [];

          // Find employees with salaries but no payroll records
          const employeesWithSalary = employees.filter((emp: any) => 
            emp.salary && emp.salary > 0 && emp.status === 'active'
          );
          const employeesWithPayroll = records.map((r: any) => r.employeeId);
          const missingPayroll = employeesWithSalary.filter((emp: any) => 
            !employeesWithPayroll.includes(emp.id)
          );

          // Find payroll records without corresponding employees
          const orphanedRecords = records.filter((r: any) => 
            !employees.find((emp: any) => emp.id === r.employeeId)
          );

          addResult('🔗 Employee-Payroll Integrity', {
            employeesWithSalary: employeesWithSalary.length,
            payrollRecords: records.length,
            missingPayrollRecords: missingPayroll.length,
            orphanedRecords: orphanedRecords.length,
            issues: [
              ...missingPayroll.map((emp: any) => ({
                type: 'Missing payroll',
                employee: `${emp.firstName} ${emp.lastName}`,
                salary: emp.salary
              })),
              ...orphanedRecords.map((record: any) => ({
                type: 'Orphaned record',
                recordId: record.id,
                grossSalary: record.grossSalary
              }))
            ]
          }, (missingPayroll.length === 0 && orphanedRecords.length === 0) ? 'success' : 'warning', 'integrity');
        }
      }

    } catch (error: any) {
      addResult('❌ Data Integrity Check Failed', { error: error.message }, 'error', 'integrity');
    } finally {
      setLoadingState('integrity', false);
    }
  };

  const getCardColor = (type: string) => {
    switch (type) {
      case 'success': return 'border-green-500 bg-green-50';
      case 'error': return 'border-red-500 bg-red-50';
      case 'warning': return 'border-yellow-500 bg-yellow-50';
      default: return 'border-blue-500 bg-blue-50';
    }
  };

  const getBadgeColor = (type: string) => {
    switch (type) {
      case 'success': return 'bg-green-100 text-green-800';
      case 'error': return 'bg-red-100 text-red-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  const filteredResults = results.filter(result => 
    activeTab === 'all' || result.category === activeTab
  );

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <Card className="border-purple-500 bg-purple-50">
        <CardHeader>
          <CardTitle className="text-purple-800">🔧 HRMS System Debug Dashboard</CardTitle>
          <p className="text-purple-600">
            Comprehensive diagnostics and monitoring for your HRMS application
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Button 
              onClick={runSystemOverview}
              disabled={loading.overview}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading.overview ? '🔄 Checking...' : '🔍 System Overview'}
            </Button>
            
            <Button 
              onClick={runEmployeeDiagnostics}
              disabled={loading.employees}
              className="bg-green-600 hover:bg-green-700"
            >
              {loading.employees ? '🔄 Analyzing...' : '👥 Employee System'}
            </Button>
            
            <Button 
              onClick={runPayrollDiagnostics}
              disabled={loading.payroll}
              className="bg-yellow-600 hover:bg-yellow-700"
            >
              {loading.payroll ? '🔄 Checking...' : '💼 Payroll System'}
            </Button>
            
            <Button 
              onClick={runPerformanceDiagnostics}
              disabled={loading.performance}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {loading.performance ? '🔄 Testing...' : '⚡ Performance'}
            </Button>
            
            <Button 
              onClick={runDataIntegrityChecks}
              disabled={loading.integrity}
              className="bg-red-600 hover:bg-red-700"
            >
              {loading.integrity ? '🔄 Verifying...' : '🔍 Data Integrity'}
            </Button>
            
            <Button 
              onClick={clearResults}
              variant="outline"
              className="border-gray-400 text-gray-600"
            >
              🗑️ Clear Results
            </Button>
          </div>
        </CardContent>
      </Card>

      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>📊 Diagnostic Results</CardTitle>
            <p className="text-gray-600">Total results: {results.length}</p>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-6 w-full mb-4">
                <TabsTrigger value="all">All Results</TabsTrigger>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="employees">Employees</TabsTrigger>
                <TabsTrigger value="payroll">Payroll</TabsTrigger>
                <TabsTrigger value="performance">Performance</TabsTrigger>
                <TabsTrigger value="integrity">Integrity</TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab} className="space-y-4">
                {filteredResults.map((result, index) => (
                  <Card key={index} className={getCardColor(result.type)}>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-sm">{result.title}</CardTitle>
                        <div className="flex gap-2">
                          <Badge className={getBadgeColor(result.type)}>
                            {result.type}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {result.timestamp.toLocaleTimeString()}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      {typeof result.content === 'string' ? (
                        <p>{result.content}</p>
                      ) : (
                        <div className="space-y-2">
                          {/* Render complex content based on structure */}
                          {Object.entries(result.content).map(([key, value]) => (
                            <div key={key}>
                              {typeof value === 'object' && value !== null ? (
                                <div>
                                  <strong className="capitalize">{key.replace(/([A-Z])/g, ' $1')}:</strong>
                                  <pre className="bg-gray-100 p-2 rounded text-sm mt-1 overflow-x-auto">
                                    {JSON.stringify(value, null, 2)}
                                  </pre>
                                </div>
                              ) : (
                                <p>
                                  <strong className="capitalize">{key.replace(/([A-Z])/g, ' $1')}:</strong> {String(value)}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SystemDebugTool;
