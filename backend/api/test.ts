import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { Client } = require('pg');
    const client = new Client({
      connectionString: process.env.DATABASE_URL,
    });
    
    await client.connect();
    
    const tenants = await client.query('SELECT COUNT(*) FROM "Tenant"');
    const users = await client.query('SELECT COUNT(*) FROM "User"');
    const employees = await client.query('SELECT COUNT(*) FROM "Employee"');
    
    await client.end();
    
    res.json({
      status: 'success',
      message: 'Database test successful',
      data: {
        tenants: parseInt(tenants.rows[0].count),
        users: parseInt(users.rows[0].count),
        employees: parseInt(employees.rows[0].count),
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Database test failed',
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString(),
    });
  }
}