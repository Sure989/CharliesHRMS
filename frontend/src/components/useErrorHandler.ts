// Hook for handling API errors in components
export const useErrorHandler = () => {
  const handleError = (error: any) => {
    console.error('API Error:', error);
    // You can customize error handling based on error type
    if (error.response?.status === 401) {
      window.location.href = '/login';
    } else if (error.response?.status === 403) {
      // Forbidden - show access denied message
    } else if (error.response?.status >= 500) {
      // Server error - show server error message
    }
    if (error.response?.data?.message) {
      // Custom error message handling
    }
  };
  return handleError;
};
