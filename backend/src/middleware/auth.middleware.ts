import { Request, Response, NextFunction } from 'express';
import { verifyToken, TokenPayload } from '../utils/jwt';
import { prisma } from '../index';

// Extend Express Request interface to include user property
declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
      tenantId?: string;
    }
  }
}

/**
 * Middleware to authenticate requests using JWT
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Log incoming request details
    console.log('Incoming request method:', req.method);
    console.log('Incoming request URL:', req.url);
    console.log('Incoming request headers:', req.headers);

    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.warn('Missing or invalid Authorization header');
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required. Please log in.',
      });
    }

    // Extract token
    const token = authHeader.split(' ')[1];
    if (!token) {
      console.warn('Authentication token is missing');
      return res.status(401).json({
        status: 'error',
        message: 'Authentication token is missing.',
      });
    }

    // Verify token
    const decoded = verifyToken(token);
    if (!decoded) {
      console.warn('Invalid or expired token');
      return res.status(401).json({
        status: 'error',
        message: 'Invalid or expired token. Please log in again.',
      });
    }

    // Attach user and tenantId to request
    req.user = decoded;
    req.tenantId = decoded.tenantId;

    if (!req.tenantId) {
      console.warn('Missing tenantId in token payload');
      return res.status(400).json({
        status: 'error',
        message: 'Missing tenantId in token.',
      });
    }

    console.log('Authenticated user:', req.user);
    console.log('TenantId:', req.tenantId);

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error during authentication.',
    });
  }
};

/**
 * Middleware to restrict access based on user roles
 * @param allowedRoles - Array of roles allowed to access the route
 */
export const restrictTo = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required. Please log in.',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        status: 'error',
        message: 'You do not have permission to perform this action.',
      });
    }

    next();
  };
};

/**
 * Middleware to check if user belongs to the specified tenant
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
export const checkTenant = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.user || !req.tenantId) {
    return res.status(401).json({
      status: 'error',
      message: 'Authentication required. Please log in.',
    });
  }

  // Check if the tenant ID in the token matches the tenant ID in the request
  const requestedTenantId = req.params.tenantId || req.query.tenantId;

  if (requestedTenantId && requestedTenantId !== req.tenantId) {
    return res.status(403).json({
      status: 'error',
      message: 'You do not have access to this tenant.',
    });
  }

  next();
};
