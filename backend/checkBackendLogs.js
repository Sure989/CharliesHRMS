// checkBackendLogs.js
const fs = require('fs');
const path = require('path');

// Adjust this path if your log file is elsewhere
const logFilePath = path.join(__dirname, 'logs', 'app.log');

const linesToShow = 50; // Number of log lines to display

fs.readFile(logFilePath, 'utf8', (err, data) => {
  if (err) {
    console.error('Could not read log file:', err.message);
    return;
  }
  const lines = data.trim().split('\n');
  const lastLines = lines.slice(-linesToShow);
  console.log(`--- Last ${linesToShow} lines of backend log ---`);
  lastLines.forEach(line => console.log(line));
});
