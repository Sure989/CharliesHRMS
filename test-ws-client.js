// Simple Node.js WebSocket client to test backend connection
const WebSocket = require('ws');

const ws = new WebSocket('ws://localhost:5000/dashboard-metrics?role=admin');

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
