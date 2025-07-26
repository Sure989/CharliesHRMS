// Simple WebSocket test - run this in browser console
const testWebSocket = () => {
  const ws = new WebSocket('ws://localhost:5000/dashboard-metrics?role=admin');
  
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