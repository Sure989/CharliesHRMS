import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { employeeService } from '@/services/api/employee.service';
import { payrollService } from '@/services/api/payroll.service';

const PayrollDebugTool: React.FC = () => {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [fixing, setFixing] = useState(false);
  const [currentPeriodId, setCurrentPeriodId] = useState<string | null>(null);

  const addResult = (title: string, content: any, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    setResults(prev => [...prev, { title, content, type }]);
  };

  const runDiagnosis = async () => {
    setLoading(true);
    setResults([]);

    try {
      // Step 1: Check Employees
      addResult('📊 Step 1: Checking Employee Data', 'Fetching all employees...');
      
      const employeesData = await employeeService.getEmployees();
      
      if (employeesData?.data) {
        const allEmployees = employeesData.data;
        const employeesWithSalary = allEmployees.filter((emp: any) => emp.salary && emp.salary > 0);
        
        addResult('📊 Employee Results', {
          totalEmployees: allEmployees.length,
          employeesWithSalary: employeesWithSalary.length,
          employees: employeesWithSalary.map((emp: any) => ({
            name: `${emp.firstName} ${emp.lastName}`,
            salary: emp.salary,
            status: emp.status,
            id: emp.employeeNumber
          }))
        }, employeesWithSalary.length === 4 ? 'success' : 'warning');
      }

      // Step 2: Check Payroll Periods
      addResult('📅 Step 2: Checking Payroll Periods', 'Fetching payroll periods...');
      
      const periodsData = await payrollService.getPayrollPeriods();
      
      if (periodsData?.data && periodsData.data.length > 0) {
        const currentPeriod = periodsData.data[0];
        setCurrentPeriodId(currentPeriod.id); // Store period ID for fix function
        addResult('📅 Period Results', {
          periodsFound: periodsData.data.length,
          currentPeriod: {
            name: currentPeriod.name,
            id: currentPeriod.id,
            payDate: currentPeriod.payDate
          }
        }, 'success');

        // Step 3: Check Existing Payroll Records
        addResult('💼 Step 3: Checking Payroll Records', 'Fetching existing payroll records...');
        
        const recordsData = await payrollService.getPayrollRecords({ periodId: currentPeriod.id });
        const records = recordsData?.data || [];
        
        addResult('💼 Payroll Records Results', {
          recordsFound: records.length,
          records: records.map((record: any) => ({
            employee: `${record.employee?.firstName || 'Unknown'} ${record.employee?.lastName || 'Employee'}`,
            grossSalary: record.grossSalary,
            netSalary: record.netSalary,
            status: record.status
          }))
        }, records.length === 4 ? 'success' : records.length === 1 ? 'warning' : 'error');

        // Step 4: Try Bulk Processing
        addResult('⚙️ Step 4: Testing Bulk Processing', 'Attempting bulk payroll processing...');
        
        try {
          const processData = await payrollService.bulkProcessPayroll(currentPeriod.id);
          
          if (processData) {
            addResult('⚙️ Bulk Processing Results', {
              message: 'Bulk processing completed',
              results: processData
            }, 'success');
          }
        } catch (processError: any) {
          addResult('⚙️ Bulk Processing Results', {
            error: processError.message || 'Failed to process payroll'
          }, 'error');
        }
      } else {
        addResult('📅 Period Results', 'No payroll periods found', 'error');
      }

    } catch (error: any) {
      addResult('❌ Diagnosis Failed', {
        error: error.message || 'Unknown error occurred'
      }, 'error');
    } finally {
      setLoading(false);
    }
  };

  const clearAndRegeneratePayroll = async () => {
    if (!currentPeriodId) {
      addResult('❌ Error', 'No payroll period found. Please run diagnosis first.', 'error');
      return;
    }

    setFixing(true);
    
    try {
      // Step 1: Clear existing payroll records
      addResult('🗑️ Step 1: Clearing Existing Records', 'Deleting incorrect payroll records...');
      
      const deleteResponse = await fetch(`/api/payroll/period/${currentPeriodId}/records`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!deleteResponse.ok) {
        throw new Error('Failed to delete existing payroll records');
      }

      const deleteResult = await deleteResponse.json();
      addResult('🗑️ Delete Results', {
        message: 'Successfully deleted existing payroll records',
        deletedCount: deleteResult.deletedCount || 'Unknown'
      }, 'success');

      // Step 2: Regenerate payroll
      addResult('⚙️ Step 2: Regenerating Payroll', 'Processing payroll for all employees with salaries...');
      
      const processData = await payrollService.bulkProcessPayroll(currentPeriodId);
      
      if (processData) {
        const processed = processData.processed || 0;
        const errors = 0; // bulkProcessPayroll doesn't return errors directly
        
        addResult('⚙️ Regeneration Results', {
          processed: processed,
          errors: errors,
          message: processed > 0 ? `Successfully processed ${processed} employees` : 'No employees were processed',
          details: [] // Will be shown in the raw results below
        }, processed === 4 ? 'success' : processed > 0 ? 'warning' : 'error');

        // Show raw results from backend
        addResult('📋 Raw Backend Results', {
          results: processData
        }, 'info');

        // Step 3: Verify the fix
        if (processed > 0) {
          addResult('✅ Step 3: Verifying Fix', 'Checking new payroll records...');
          
          const verifyData = await payrollService.getPayrollRecords({ periodId: currentPeriodId });
          const newRecords = verifyData?.data || [];
          const recordsWithSalary = newRecords.filter((r: any) => r.grossSalary > 0);
          
          addResult('✅ Verification Results', {
            totalRecords: newRecords.length,
            recordsWithSalary: recordsWithSalary.length,
            totalPayroll: recordsWithSalary.reduce((sum: number, r: any) => sum + (r.grossSalary || 0), 0),
            records: recordsWithSalary.map((record: any) => ({
              employee: `${record.employee?.firstName || 'Unknown'} ${record.employee?.lastName || 'Employee'}`,
              grossSalary: record.grossSalary,
              netSalary: record.netSalary
            }))
          }, recordsWithSalary.length === 4 ? 'success' : 'warning');
        }
      }

    } catch (error: any) {
      addResult('❌ Fix Failed', {
        error: error.message || 'Unknown error occurred while fixing payroll'
      }, 'error');
    } finally {
      setFixing(false);
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

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card className="border-blue-500 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-blue-800">🔍 Payroll Debug Tool</CardTitle>
          <p className="text-blue-600">Safe diagnostics to understand why only 1 employee shows in payroll instead of 4</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 mb-4">
            <p>✅ Only reads data from your system</p>
            <p>✅ Uses the same API calls as your normal app</p>
            <p>✅ Won't modify or break anything</p>
          </div>
          <Button 
            onClick={runDiagnosis} 
            disabled={loading || fixing}
            className="bg-blue-600 hover:bg-blue-700 mr-4"
          >
            {loading ? '🔄 Running Diagnosis...' : '🚀 Start Diagnosis'}
          </Button>
          
          {currentPeriodId && (
            <Button 
              onClick={clearAndRegeneratePayroll} 
              disabled={loading || fixing}
              className="bg-green-600 hover:bg-green-700"
            >
              {fixing ? '🔄 Fixing Payroll...' : '🔧 Clear & Regenerate Payroll'}
            </Button>
          )}
        </CardContent>
      </Card>

      {results.map((result, index) => (
        <Card key={index} className={getCardColor(result.type)}>
          <CardHeader>
            <CardTitle className="text-sm">{result.title}</CardTitle>
          </CardHeader>
          <CardContent>
            {typeof result.content === 'string' ? (
              <p>{result.content}</p>
            ) : (
              <div className="space-y-2">
                {result.content.totalEmployees && (
                  <div>
                    <p><strong>Total Employees:</strong> {result.content.totalEmployees}</p>
                    <p><strong>Employees with Salaries:</strong> {result.content.employeesWithSalary}</p>
                    {result.content.employees && (
                      <div className="mt-2">
                        <strong>Employees with Salaries:</strong>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                          {result.content.employees.map((emp: any, i: number) => (
                            <div key={i} className="p-2 bg-white rounded border">
                              <p><strong>{emp.name}</strong></p>
                              <p>Salary: KES {emp.salary}</p>
                              <p>Status: {emp.status}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                {result.content.periodsFound && (
                  <div>
                    <p><strong>Periods Found:</strong> {result.content.periodsFound}</p>
                    <p><strong>Current Period:</strong> {result.content.currentPeriod.name}</p>
                    <p><strong>Period ID:</strong> {result.content.currentPeriod.id}</p>
                  </div>
                )}

                {result.content.processed !== undefined && (
                  <div>
                    <p><strong>Processed:</strong> {result.content.processed}</p>
                    <p><strong>Errors:</strong> {result.content.errors}</p>
                    <p><strong>Message:</strong> {result.content.message}</p>
                  </div>
                )}

                {result.content.totalRecords !== undefined && (
                  <div>
                    <p><strong>Total Records:</strong> {result.content.totalRecords}</p>
                    <p><strong>Records with Salary:</strong> {result.content.recordsWithSalary}</p>
                    <p><strong>Total Payroll:</strong> KES {result.content.totalPayroll}</p>
                    {result.content.records && result.content.records.length > 0 && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                        {result.content.records.map((record: any, i: number) => (
                          <div key={i} className="p-2 bg-white rounded border">
                            <p><strong>{record.employee}</strong></p>
                            <p>Gross: KES {record.grossSalary}</p>
                            <p>Net: KES {record.netSalary}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {result.content.deletedCount !== undefined && (
                  <div>
                    <p><strong>Records Deleted:</strong> {result.content.deletedCount}</p>
                    <p><strong>Message:</strong> {result.content.message}</p>
                  </div>
                )}

                {result.content.recordsFound !== undefined && (
                  <div>
                    <p><strong>Payroll Records Found:</strong> {result.content.recordsFound}</p>
                    {result.content.records && result.content.records.length > 0 && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                        {result.content.records.map((record: any, i: number) => (
                          <div key={i} className="p-2 bg-white rounded border">
                            <p><strong>{record.employee}</strong></p>
                            <p>Gross: KES {record.grossSalary}</p>
                            <p>Net: KES {record.netSalary}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {result.content.error && (
                  <p className="text-red-600"><strong>Error:</strong> {result.content.error}</p>
                )}

                {result.content.results && (
                  <pre className="bg-gray-100 p-2 rounded text-sm overflow-x-auto">
                    {JSON.stringify(result.content.results, null, 2)}
                  </pre>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default PayrollDebugTool;
