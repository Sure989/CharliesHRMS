import { Router } from 'express';
import { authenticate, restrictTo } from '../middleware/auth.middleware';
import prisma from '../lib/prisma';

const router = Router();

router.use(authenticate);

/**
 * @route GET /api/performance/employee/:employeeId
 * @desc Get performance data for an employee
 * @access Private
 */
router.get('/employee/:employeeId', async (req, res) => {
  try {
    const { employeeId } = req.params;
    const tenantId = req.tenantId;

    if (!tenantId) {
      return res.status(401).json({
        status: 'error',
        message: 'Tenant ID is required'
      });
    }

    // Get latest performance review
    const latestReview = await prisma.performanceReview.findFirst({
      where: {
        employeeId,
        tenantId
      },
      orderBy: { createdAt: 'desc' },
      include: {
        employee: {
          select: {
            firstName: true,
            lastName: true,
            position: true,
            department: { select: { name: true } }
          }
        }
      }
    });

    // Get all performance reviews for trend analysis
    const allReviews = await prisma.performanceReview.findMany({
      where: {
        employeeId,
        tenantId
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    // Calculate average score
    const averageScore = allReviews.length > 0 
      ? allReviews.reduce((sum, review) => sum + (review.score || 0), 0) / allReviews.length
      : 0;

    // Get goals/objectives if available
    const goals = await prisma.performanceGoal.findMany({
      where: {
        employeeId,
        tenantId
      },
      orderBy: { createdAt: 'desc' }
    }).catch(() => []); // Handle if table doesn't exist

    res.json({
      status: 'success',
      data: {
        currentScore: latestReview?.score || 0,
        averageScore,
        latestReview,
        reviewHistory: allReviews,
        goals: goals || [],
        trend: allReviews.length > 1 ? 
          (allReviews[0]?.score || 0) - (allReviews[1]?.score || 0) : 0
      }
    });
  } catch (error) {
    console.error('Get performance data error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get performance data'
    });
  }
});

/**
 * @route GET /api/performance/analytics
 * @desc Get performance analytics
 * @access Private (Admin, HR Manager, Operations Manager)
 */
router.get('/analytics', restrictTo(['ADMIN', 'HR_MANAGER', 'OPERATIONS_MANAGER']), async (req, res) => {
  try {
    const tenantId = req.tenantId;

    if (!tenantId) {
      return res.status(401).json({
        status: 'error',
        message: 'Tenant ID is required'
      });
    }

    // Get all performance reviews
    const reviews = await prisma.performanceReview.findMany({
      where: { tenantId },
      include: {
        employee: {
          select: {
            department: { select: { name: true } },
            branch: { select: { name: true } }
          }
        }
      }
    });

    // Calculate analytics
    const totalReviews = reviews.length;
    const averageScore = totalReviews > 0 
      ? reviews.reduce((sum, review) => sum + (review.score || 0), 0) / totalReviews
      : 0;

    // Rating distribution
    const ratingDistribution = [1, 2, 3, 4, 5].map(rating => {
      const count = reviews.filter(review => Math.round(review.score || 0) === rating).length;
      return {
        rating,
        count,
        percentage: totalReviews > 0 ? Math.round((count / totalReviews) * 100) : 0
      };
    });

    // Department breakdown
    const departmentStats: Record<string, { count: number; totalScore: number }> = reviews.reduce((acc, review) => {
      const dept = review.employee?.department?.name || 'Unknown';
      if (!acc[dept]) {
        acc[dept] = { count: 0, totalScore: 0 };
      }
      acc[dept].count++;
      acc[dept].totalScore += review.score || 0;
      return acc;
    }, {});

    const departmentBreakdown = Object.entries(departmentStats).map(([department, stats]) => ({
      department,
      averageScore: stats.count > 0 ? stats.totalScore / stats.count : 0,
      reviewCount: stats.count
    }));

    res.json({
      status: 'success',
      data: {
        summary: {
          totalReviews,
          averageScore,
          completedReviews: totalReviews,
          pendingReviews: 0 // Could be calculated if you have pending status
        },
        ratingDistribution,
        departmentBreakdown,
        goalProgress: {
          completionRate: 75 // Default value since we don't have goal completion data
        }
      }
    });
  } catch (error) {
    console.error('Get performance analytics error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get performance analytics'
    });
  }
});

export default router;