import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import ErrorBoundary from "@/components/ErrorBoundary";
import { PERMISSIONS } from "@/types/types";
import Login from "@/pages/auth/Login";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import UserManagement from "@/pages/admin/UserManagement";
import SecurityManagement from "@/pages/admin/SecurityManagement";
import SalaryAdvanceOverview from "@/pages/admin/SalaryAdvanceOverview";
import WorkflowDashboard from "@/pages/admin/WorkflowDashboard";
import IntegrationDashboard from "@/pages/admin/IntegrationDashboard";
// AdvancedAnalytics import removed (feature deprecated)
// Testing components removed
import HRDashboard from "@/pages/hr/HRDashboard";
import OperationsDashboard from "@/pages/operations/OperationsDashboard";
import OperationsLeaveApprovals from "@/pages/operations/OperationsLeaveApprovals";
import OperationsSalaryAdvances from "@/pages/operations/OperationsSalaryAdvances";
import TeamsOverview from "@/pages/operations/TeamsOverview";
import EmployeeDashboard from "@/pages/employee/EmployeeDashboard";
import EmployeeProfile from "@/pages/employee/EmployeeProfile";
import LeaveRequests from "@/pages/employee/LeaveRequests";
import SalaryAdvanceRequest from "@/pages/employee/SalaryAdvanceRequest";
import EmployeeManagement from "@/pages/hr/EmployeeManagement";
import DepartmentManagement from "@/pages/hr/DepartmentManagement";
import BranchManagement from "@/pages/hr/BranchManagement";
import PerformanceManagement from "@/pages/hr/PerformanceManagement";
import TrainingManagement from "@/pages/hr/TrainingManagement";
import LeaveApprovals from "@/pages/hr/LeaveApprovals";
import SalaryAdvanceManagement from "@/pages/hr/SalaryAdvanceManagement";
import PayrollDashboard from "@/pages/payroll/PayrollDashboard";
import PayrollProcessing from "@/pages/payroll/PayrollProcessing";
import EmployeeCompensation from "@/pages/payroll/EmployeeCompensation";
import TaxManagement from "@/pages/payroll/TaxManagement";
import PayrollReports from "@/pages/payroll/PayrollReports";
import TimeAttendance from "@/pages/payroll/TimeAttendance";
import PayrollSettings from "@/pages/payroll/PayrollSettings";
import EmployeePayroll from "@/pages/employee/EmployeePayroll";
import NotFound from "@/pages/NotFound";
import OpsManagerLeaveRequestPage from "@/pages/operations/OpsManagerLeaveRequestPage";
import OpsManagerSalaryAdvancePage from "@/pages/operations/OpsManagerSalaryAdvancePage";

const queryClient = new QueryClient();

const App = () => {
  // Force dark mode
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <AuthProvider>
            <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              
              {/* Admin Routes */}
              <Route path="/admin/*" element={
                <ProtectedRoute 
                  allowedRoles={['ADMIN']} 
                  requiredPermissions={[PERMISSIONS.ADMIN_FULL_ACCESS]}
                >
                  <Routes>
                    <Route path="dashboard" element={<AdminDashboard />} />
                    <Route path="users" element={
                      <ProtectedRoute requiredPermissions={[PERMISSIONS.ADMIN_FULL_ACCESS]}>
                        <UserManagement />
                      </ProtectedRoute>
                    } />
                    <Route path="security" element={
                      <ProtectedRoute requiredPermissions={[PERMISSIONS.ADMIN_FULL_ACCESS]}>
                        <SecurityManagement />
                      </ProtectedRoute>
                    } />
                    <Route path="salary-advances" element={
                      <ProtectedRoute requiredPermissions={[PERMISSIONS.HR_VIEW_SALARY_ADVANCES]}>
                        <SalaryAdvanceOverview />
                      </ProtectedRoute>
                    } />
                    <Route path="workflows" element={
                      <ProtectedRoute requiredPermissions={[PERMISSIONS.ADMIN_FULL_ACCESS]}>
                        <WorkflowDashboard />
                      </ProtectedRoute>
                    } />
                    <Route path="integrations" element={
                      <ProtectedRoute requiredPermissions={[PERMISSIONS.ADMIN_FULL_ACCESS]}>
                        <IntegrationDashboard />
                      </ProtectedRoute>
                    } />
                    <Route path="departments" element={
                      <ProtectedRoute requiredPermissions={[PERMISSIONS.ADMIN_FULL_ACCESS]}>
                        <DepartmentManagement />
                      </ProtectedRoute>
                    } />
                    <Route path="branches" element={
                      <ProtectedRoute requiredPermissions={[PERMISSIONS.HR_MANAGE_BRANCHES]}>
                        <BranchManagement />
                      </ProtectedRoute>
                    } />
                    <Route path="employees" element={
                      <ProtectedRoute requiredPermissions={[PERMISSIONS.HR_MANAGE_EMPLOYEES]}>
                        <EmployeeManagement />
                      </ProtectedRoute>
                    } />
                    {/* Testing routes removed */}
                  </Routes>
                </ProtectedRoute>
              } />
              
              {/* HR Manager Routes */}
              <Route path="/hr/*" element={
                <ProtectedRoute allowedRoles={['ADMIN', 'HR_MANAGER']}>
                  <Routes>
                    <Route path="dashboard" element={<HRDashboard />} />
                    <Route path="employees" element={
                      <ProtectedRoute requiredPermissions={[PERMISSIONS.HR_MANAGE_EMPLOYEES]}>
                        <EmployeeManagement />
                      </ProtectedRoute>
                    } />
                    <Route path="branches" element={
                      <ProtectedRoute requiredPermissions={[PERMISSIONS.HR_VIEW_BRANCHES]}>
                        <BranchManagement />
                      </ProtectedRoute>
                    } />
                    <Route path="performance" element={
                      <ProtectedRoute requiredPermissions={[PERMISSIONS.HR_MANAGE_PERFORMANCE]}>
                        <PerformanceManagement />
                      </ProtectedRoute>
                    } />
                    <Route path="training" element={
                      <ProtectedRoute requiredPermissions={[PERMISSIONS.HR_MANAGE_TRAINING]}>
                        <TrainingManagement />
                      </ProtectedRoute>
                    } />
                    <Route path="leave" element={
                      <ProtectedRoute requiredPermissions={[PERMISSIONS.HR_MANAGE_LEAVE]}>
                        <LeaveApprovals />
                      </ProtectedRoute>
                    } />
                    <Route path="salary-advances" element={
                      <ProtectedRoute requiredPermissions={[PERMISSIONS.HR_MANAGE_SALARY_ADVANCES]}>
                        <SalaryAdvanceManagement />
                      </ProtectedRoute>
                    } />
                  </Routes>
                </ProtectedRoute>
              } />
              
              {/* Admin-only HR Routes */}
              <Route path="/hr/*" element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <Routes>
                    <Route path="departments" element={<DepartmentManagement />} />
                  </Routes>
                </ProtectedRoute>
              } />
              
              {/* Operations Manager Routes */}
              <Route path="/operations/*" element={
                <ProtectedRoute allowedRoles={['ADMIN', 'HR_MANAGER', 'OPERATIONS_MANAGER']}>
                  <Routes>
                    <Route path="dashboard" element={<OperationsDashboard />} />
<Route path="leave" element={
  <ProtectedRoute requiredPermissions={[PERMISSIONS.OPS_APPROVE_LEAVE]}>
    <OperationsLeaveApprovals />
  </ProtectedRoute>
} />
<Route path="salary-advances" element={
  <ProtectedRoute requiredPermissions={[PERMISSIONS.OPS_APPROVE_SALARY_ADVANCES]}>
    <OperationsSalaryAdvances />
  </ProtectedRoute>
} />
                    <Route path="team" element={
                      <ProtectedRoute requiredPermissions={[PERMISSIONS.OPS_MANAGE_EMPLOYEES]}>
                        <TeamsOverview />
                      </ProtectedRoute>
                    } />
                    <Route path="leave-request" element={
                      <ProtectedRoute requiredPermissions={[PERMISSIONS.OPS_APPROVE_LEAVE]}>
                        <OpsManagerLeaveRequestPage />
                      </ProtectedRoute>
                    } />
                    <Route path="salary-advance-request" element={
                      <ProtectedRoute requiredPermissions={[PERMISSIONS.OPS_APPROVE_SALARY_ADVANCES]}>
                        <OpsManagerSalaryAdvancePage />
                      </ProtectedRoute>
                    } />
                    <Route path="my-leave-requests" element={<OpsManagerLeaveRequestPage />} />
                    <Route path="my-salary-advance" element={<OpsManagerSalaryAdvancePage />} />
                  </Routes>
                </ProtectedRoute>
              } />
              
              {/* Employee Routes */}
              <Route path="/employee/*" element={
                <ProtectedRoute allowedRoles={['ADMIN', 'HR_MANAGER', 'OPERATIONS_MANAGER', 'EMPLOYEE']}>
                  <Routes>
                    <Route path="dashboard" element={<EmployeeDashboard />} />
                    <Route path="profile" element={<EmployeeProfile />} />
                    <Route path="leave" element={<LeaveRequests />} />
                    <Route path="salary-advance" element={<SalaryAdvanceRequest />} />
                    <Route path="payroll" element={<EmployeePayroll />} />
                  </Routes>
                </ProtectedRoute>
              } />
              
              {/* Payroll Routes */}
              <Route path="/payroll/*" element={
                <ProtectedRoute allowedRoles={['ADMIN', 'HR_MANAGER']}>
                  <Routes>
                    <Route path="dashboard" element={<PayrollDashboard />} />
                    <Route path="processing" element={<PayrollProcessing />} />
                    <Route path="compensation" element={<EmployeeCompensation />} />
                    <Route path="tax-management" element={<TaxManagement />} />
                    <Route path="reports" element={<PayrollReports />} />
                    <Route path="time-attendance" element={<TimeAttendance />} />
                    <Route path="settings" element={<PayrollSettings />} />
                  </Routes>
                </ProtectedRoute>
              } />
              
              {/* Dashboard redirect based on role */}
              <Route path="/dashboard" element={<ProtectedRoute><DashboardRedirect /></ProtectedRoute>} />
              
              <Route path="*" element={<NotFound />} />
            </Routes>
            </BrowserRouter>
          </AuthProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

// Component to redirect to appropriate dashboard based on role
const DashboardRedirect = () => {
  const { user } = useAuth();
  
  if (user?.role === 'ADMIN') {
    return <Navigate to="/admin/dashboard" replace />;
  } else if (user?.role === 'HR_MANAGER') {
    return <Navigate to="/hr/dashboard" replace />;
  } else if (user?.role === 'OPERATIONS_MANAGER') {
    return <Navigate to="/operations/dashboard" replace />;
  } else {
    return <Navigate to="/employee/dashboard" replace />;
  }
};

export default App;
