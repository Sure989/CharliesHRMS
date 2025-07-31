
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { hasPermission } from '@/utils/permissions';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { PermissionKey } from '../../types/types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
  requiredPermissions?: string[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  allowedRoles,
  requiredPermissions
}) => {
  const { isAuthenticated, user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Check for role-based access
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return (
      <div className="p-8">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>
            You do not have permission to access this page. This area is restricted to {allowedRoles.join(', ')} roles.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Check for permission-based access
  if (requiredPermissions && requiredPermissions.length > 0 && user) {
    const hasAllPermissions = requiredPermissions.every(permission =>
      hasPermission(user, permission as PermissionKey)
    );

    if (!hasAllPermissions) {
      return (
        <div className="p-8">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Insufficient Permissions</AlertTitle>
            <AlertDescription>
              You do not have the required permissions to access this page.
            </AlertDescription>
          </Alert>
        </div>
      );
    }
  }

  return <>{children}</>;
};
