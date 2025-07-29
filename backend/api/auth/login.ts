import { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers for frontend only
  res.setHeader('Access-Control-Allow-Origin', 'https://charlies-hrms-frontend.vercel.app');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Email and password required'
      });
    }

    // Simple test response
    if (email === 'admin@charlieshrms.com' && password === 'password123') {
      return res.status(200).json({
        status: 'success',
        data: {
          user: { id: '1', email, role: 'ADMIN' },
          accessToken: 'test-token',
          refreshToken: 'test-refresh'
        }
      });
    }

    return res.status(401).json({
      status: 'error',
      message: 'Invalid credentials'
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: 'Server error'
    });
  }
}