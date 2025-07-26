import React, { ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

// API Error Boundary specifically for API-related errors
interface ApiErrorBoundaryProps {
  children: ReactNode;
  onRetry?: () => void;
}

export const ApiErrorBoundary: React.FC<ApiErrorBoundaryProps> = ({ 
  children, 
  onRetry 
}) => {
  return (
    <ErrorBoundary
      fallback={
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Connection Error
          </h3>
          <p className="text-gray-600 mb-4">
            Unable to connect to the server. Please check your internet connection and try again.
          </p>
          <div className="space-x-2">
            {onRetry && (
              <Button onClick={onRetry} variant="default">
                <RefreshCw className="mr-2 h-4 w-4" />
                Retry
              </Button>
            )}
            <Button 
              onClick={() => window.location.reload()} 
              variant="outline"
            >
              Refresh Page
            </Button>
          </div>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  );
};


// Import ErrorBoundary from the main file for use in ApiErrorBoundary
import ErrorBoundary from './ErrorBoundary';
