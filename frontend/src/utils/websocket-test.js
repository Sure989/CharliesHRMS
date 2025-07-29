// Simple WebSocket test - run this in browser console
const testWebSocket = () => {
  const ws = new WebSocket((import.meta.env ? import.meta.env.VITE_WS_BASE_URL : 'wss://charlies-hrms-backend.vercel.app') + '/dashboard-metrics?role=admin');
  
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