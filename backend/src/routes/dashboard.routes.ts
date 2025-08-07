import { Router } from 'express';
import { getDashboardMetrics } from '../services/analytics.service';
import { getEmployeeDashboard } from '../controllers/dashboard.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Enable authentication middleware for all dashboard routes
router.use(authenticate);

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
    console.log('[DEBUG] User isDemo flag:', req.user?.isDemo);
    console.log('[DEBUG] Will use demo mode:', req.user?.isDemo || false);
    
    // Use tenantId if available, otherwise use 'default' or null for testing
    const tenantId = req.tenantId || 'default';
    const branchId = req.query.branchId as string | undefined;
    
    const isDemo = req.user?.isDemo || false;
    console.log('[DEBUG] Calling getDashboardMetrics with isDemo:', isDemo);
    
    const metrics = await getDashboardMetrics(tenantId, branchId, isDemo);
    console.log('[DEBUG] Metrics fetched successfully:', Object.keys(metrics));
    console.log('[DEBUG] Sample metric values:', {
      totalEmployees: metrics.totalEmployees,
      activeEmployees: metrics.activeEmployees,
      pendingLeaveRequests: metrics.pendingLeaveRequests
    });
    
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

// Debug route to check demo user status
router.get('/debug/user', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Get full user details from database
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isDemo: true,
        tenantId: true
      }
    });

    return res.status(200).json({
      status: 'success',
      data: {
        tokenUser: req.user,
        databaseUser: user,
        isDemoFromToken: req.user?.isDemo,
        isDemoFromDB: user?.isDemo,
        shouldUseMockData: req.user?.isDemo || false
      }
    });
  } catch (error) {
    console.error('Debug user error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Fix demo users endpoint
router.post('/debug/fix-demo-users', async (req, res) => {
  try {
    const demoEmails = [
      'admin@charlieshrms.com',
      'hr@charlieshrms.com',
      'operations@charlieshrms.com',
      'employee@charlieshrms.com'
    ];

    // Update demo users
    const updateResult = await prisma.user.updateMany({
      where: {
        email: { in: demoEmails }
      },
      data: {
        isDemo: true
      }
    });

    // Get updated users
    const updatedUsers = await prisma.user.findMany({
      where: {
        email: { in: demoEmails }
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isDemo: true
      }
    });

    return res.status(200).json({
      status: 'success',
      message: `Updated ${updateResult.count} demo users`,
      data: {
        updatedCount: updateResult.count,
        users: updatedUsers
      }
    });
  } catch (error) {
    console.error('Fix demo users error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
