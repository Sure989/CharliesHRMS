// Centralized utility to get the WebSocket URL for dashboard metrics
export function getDashboardMetricsWebSocketUrl(role?: string) {
  // Use environment variable or fallback to localhost
  const base = import.meta.env.VITE_WS_BASE_URL || 'wss://chalies-hrms-backend.vercel.app';
  // Get auth token for WebSocket authentication
  const token = localStorage.getItem('token');
  // Optionally pass role and token as query params
  const params = new URLSearchParams();
  if (role) params.append('role', role);
  if (token) params.append('token', token);
  const queryString = params.toString();
  return `${base}/dashboard-metrics${queryString ? `?${queryString}` : ''}`;
}
