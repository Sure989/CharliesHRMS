import type { VercelRequest, VercelResponse } from '@vercel/node';
import { authenticate } from '../../src/middleware/auth.middleware';

// Helper to wrap Express-style middleware for Vercel
function runMiddleware(req: VercelRequest, res: VercelResponse, fn: any) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result: any) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Authenticate user
    await runMiddleware(req, res, authenticate);
    // If authentication passes, req.user is set
    const typedReq = req as VercelRequest & { user?: any };
    if (!typedReq.user) {
      return res.status(401).json({ status: 'error', message: 'Not authenticated' });
    }
    // Return user info (omit sensitive fields)
    const { id, email, role, tenantId } = typedReq.user;
    return res.status(200).json({
      status: 'success',
      user: { id, email, role, tenantId }
    });
  } catch (error) {
    return res.status(401).json({ status: 'error', message: 'Not authenticated' });
  }
}
