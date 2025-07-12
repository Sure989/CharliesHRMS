// Script to generate a new valid JWT for testing
// Usage: node scripts/generateTestJwt.js
const jwt = require('jsonwebtoken');

const payload = {
  userId: 'test-user',
  role: 'ADMIN',
  tenantId: '00000000-0000-0000-0000-000000000000', // Charlie's HRMS
};

const secret = 'your_jwt_secret_key_change_in_production';
const token = jwt.sign(payload, secret, { expiresIn: '2h' });

console.log('New valid JWT for Authorization header:');
console.log(token);
