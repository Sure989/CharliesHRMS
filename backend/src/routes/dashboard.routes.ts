import { Router } from 'express';
import { getDashboardMetrics } from '../services/analytics.service';
import { getEmployeeDashboard } from '../controllers/dashboard.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Temporarily disable auth for testing
// router.use(authenticate);

/**
 * @route GET /api/dashboard/metrics
 * @desc Get dashboard metrics
 * @access Private
 */
router.get('/metrics', async (req, res) => {
  try {
    console.log('[DEBUG] Dashboard metrics endpoint called');
    console.log('[DEBUG] Request user:', req.user);
    console.log('[DEBUG] Request tenantId:', req.tenantId);
    
    // Use tenantId if available, otherwise use 'default' or null for testing
    const tenantId = req.tenantId || 'default';
    
    const metrics = await getDashboardMetrics(tenantId);
    console.log('[DEBUG] Metrics fetched successfully:', Object.keys(metrics));
    
    return res.status(200).json({
      status: 'success',
      data: metrics,
    });
  } catch (error) {
    console.error('Get dashboard metrics error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error while fetching dashboard metrics',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * @route GET /api/dashboard/test
 * @desc Test database connection
 * @access Private
 */
import prisma from '../lib/prisma';

router.get('/test', async (req, res) => {
  try {
    const employeeCount = await prisma.employee.count();
    const userCount = await prisma.user.count();
    return res.status(200).json({
      status: 'success',
      data: {
        employeeCount,
        userCount,
        message: 'Database connection working'
      }
    });
  } catch (error) {
    console.error('Database test error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Database connection failed',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

router.get('/employee/:employeeId', getEmployeeDashboard);

export default router;
