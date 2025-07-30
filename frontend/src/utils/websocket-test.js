// Simple WebSocket test - run this in browser console
const testWebSocket = () => {
  if (!import.meta.env || !import.meta.env.VITE_WS_BASE_URL) {
    throw new Error('WebSocket base URL is not set. Please configure VITE_WS_BASE_URL in your environment variables.');
  }
  const ws = new WebSocket(import.meta.env.VITE_WS_BASE_URL + '/dashboard-metrics?role=admin');
  
  ws.onopen = () => {
    // ...existing code...
  };
  
  ws.onmessage = (event) => {
    // ...existing code...
  };
  
  ws.onerror = (error) => {
    // ...existing code...
  };
  
  ws.onclose = (event) => {
    // ...existing code...
  };
  
  return ws;
};

// Run: testWebSocket()