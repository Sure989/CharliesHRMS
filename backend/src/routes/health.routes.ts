import { Router } from 'express';
import { Request, Response } from 'express';
import prisma from '../lib/prisma';

const router = Router();

// Health check endpoint
router.get('/health', async (req: Request, res: Response) => {
  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;
    
    const healthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'connected',
        api: 'operational'
      },
      version: process.env.npm_package_version || '1.0.0',
      uptime: Math.floor(process.uptime()),
      environment: process.env.NODE_ENV || 'development'
    };

    res.status(200).json(healthStatus);
  } catch (error) {
    const healthStatus = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'disconnected',
        api: 'operational'
      },
      error: 'Database connection failed'
    };

    res.status(503).json(healthStatus);
  }
});

export default router;
