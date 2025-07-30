// Simple Node.js WebSocket client to test backend connection
const WebSocket = require('ws');

const wsBaseUrl = process.env.WS_BASE_URL;
if (!wsBaseUrl) {
  throw new Error('WebSocket base URL is not set. Please configure WS_BASE_URL in your environment variables.');
}
const ws = new WebSocket(wsBaseUrl + '/dashboard-metrics?role=admin');

ws.on('open', function open() {
  // ...existing code...
  ws.close();
});

ws.on('message', function message(data) {
  // ...existing code...
});

ws.on('error', function error(err) {
  // ...existing code...
});

ws.on('close', function close() {
  // ...existing code...
});
