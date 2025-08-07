import { Request, Response } from 'express';
import {
  getDashboardMetrics,
  getEmployeeAnalytics,
  getPayrollAnalytics,
  getLeaveAnalytics,
  getPerformanceAnalytics,
  generateCustomAnalytics,
  getOvertimeAnalytics as getOvertimeAnalyticsService,
  getDiversityAnalytics as getDiversityAnalyticsService,
  getAttendanceTrends as getAttendanceTrendsService,
  getRealTimeMetrics as getRealTimeMetricsService,
  getAuditTrail as getAuditTrailService,
  getSalaryAdvanceAnalytics as getSalaryAdvanceAnalyticsService,
  getTrainingAnalytics as getTrainingAnalyticsService,
} from '../services/analytics.service';

/**
 * Get dashboard overview metrics
 * @route GET /api/analytics/dashboard
 */
export const getDashboard = async (req: Request, res: Response) => {
  try {
    if (!req.tenantId) {
      return res.status(401).json({
        status: 'error',
        message: 'Tenant ID is required',
      });
    }

    const metrics = await getDashboardMetrics(req.tenantId, undefined, req.user?.isDemo || false);

    return res.status(200).json({
      status: 'success',
      data: metrics,
    });
  } catch (error) {
    console.error('Get dashboard metrics error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error while fetching dashboard metrics',
    });
  }
};

/**
 * Get employee analytics
 * @route GET /api/analytics/employees
 */
export const getEmployees = async (req: Request, res: Response) => {
  try {
    if (!req.tenantId) {
      return res.status(401).json({
        status: 'error',
        message: 'Tenant ID is required',
      });
    }

    const analytics = await getEmployeeAnalytics(req.tenantId);

    return res.status(200).json({
      status: 'success',
      data: { analytics },
    });
  } catch (error) {
    console.error('Get employee analytics error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error while fetching employee analytics',
    });
  }
};

/**
 * Get payroll analytics
 * @route GET /api/analytics/payroll
 */
export const getPayroll = async (req: Request, res: Response) => {
  try {
    const { year } = req.query;

    if (!req.tenantId) {
      return res.status(401).json({
        status: 'error',
        message: 'Tenant ID is required',
      });
    }

    const targetYear = year ? parseInt(year as string) : undefined;
    const analytics = await getPayrollAnalytics(req.tenantId, targetYear);

    return res.status(200).json({
      status: 'success',
      data: { analytics, year: targetYear || new Date().getFullYear() },
    });
  } catch (error) {
    console.error('Get payroll analytics error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error while fetching payroll analytics',
    });
  }
};

/**
 * Get leave analytics
 * @route GET /api/analytics/leave
 */
export const getLeave = async (req: Request, res: Response) => {
  try {
    const { year } = req.query;

    if (!req.tenantId) {
      return res.status(401).json({
        status: 'error',
        message: 'Tenant ID is required',
      });
    }

    const targetYear = year ? parseInt(year as string) : undefined;
    const analytics = await getLeaveAnalytics(req.tenantId, targetYear);

    return res.status(200).json({
      status: 'success',
      data: { analytics, year: targetYear || new Date().getFullYear() },
    });
  } catch (error) {
    console.error('Get leave analytics error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error while fetching leave analytics',
    });
  }
};

/**
 * Get performance analytics
 * @route GET /api/analytics/performance
 */
export const getPerformance = async (req: Request, res: Response) => {
  try {
    const { cycleId } = req.query;

    if (!req.tenantId) {
      return res.status(401).json({
        status: 'error',
        message: 'Tenant ID is required',
      });
    }

    const analytics = await getPerformanceAnalytics(req.tenantId, cycleId as string);

    return res.status(200).json({
      status: 'success',
      data: { analytics, cycleId },
    });
  } catch (error) {
    console.error('Get performance analytics error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error while fetching performance analytics',
    });
  }
};

/**
 * Generate custom analytics
 * @route POST /api/analytics/custom
 */
export const getCustomAnalytics = async (req: Request, res: Response) => {
  try {
    const { query, parameters } = req.body;

    if (!req.tenantId) {
      return res.status(401).json({
        status: 'error',
        message: 'Tenant ID is required',
      });
    }

    if (!query) {
      return res.status(400).json({
        status: 'error',
        message: 'Query is required',
      });
    }

    // Basic security check - prevent dangerous operations
    const dangerousKeywords = ['DROP', 'DELETE', 'UPDATE', 'INSERT', 'ALTER', 'CREATE', 'TRUNCATE'];
    const upperQuery = query.toUpperCase();
    
    for (const keyword of dangerousKeywords) {
      if (upperQuery.includes(keyword)) {
        return res.status(403).json({
          status: 'error',
          message: 'Query contains forbidden operations',
        });
      }
    }

    const result = await generateCustomAnalytics(req.tenantId, query, parameters);

    return res.status(200).json({
      status: 'success',
      data: { result },
    });
  } catch (error) {
    console.error('Custom analytics error:', error);
    return res.status(500).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Internal server error while generating custom analytics',
    });
  }
};

/**
 * Get analytics summary for all modules
 * @route GET /api/analytics/summary
 */
export const getSummary = async (req: Request, res: Response) => {
  try {
    if (!req.tenantId) {
      return res.status(401).json({
        status: 'error',
        message: 'Tenant ID is required',
      });
    }

    // Get summary data from all analytics modules
    const [dashboard, employees, payroll, leave, performance] = await Promise.all([
      getDashboardMetrics(req.tenantId, undefined, req.user?.isDemo || false),
      getEmployeeAnalytics(req.tenantId),
      getPayrollAnalytics(req.tenantId),
      getLeaveAnalytics(req.tenantId),
      getPerformanceAnalytics(req.tenantId),
    ]);

    const summary = {
      dashboard: {
        totalEmployees: dashboard.totalEmployees,
        activeEmployees: dashboard.activeEmployees,
        pendingLeaveRequests: dashboard.pendingLeaveRequests,
        upcomingReviews: dashboard.upcomingReviews,
      },
      employees: {
        totalCount: employees.headcount.total,
        averageTenure: employees.demographics.averageTenure,
        turnoverRate: employees.demographics.turnoverRate,
        newHires: employees.demographics.newHires,
      },
      payroll: {
        totalGrossPay: payroll.summary.totalGrossPay,
        averageSalary: payroll.summary.averageSalary,
        totalDeductions: payroll.summary.totalDeductions,
      },
      leave: {
        totalRequests: leave.summary.totalRequests,
        approvalRate: leave.summary.approvalRate,
        utilizationRate: dashboard.leaveUtilization.utilizationRate,
      },
      performance: {
        totalReviews: performance.summary.totalReviews,
        completionRate: performance.summary.completionRate,
        averageRating: performance.summary.averageRating,
        goalCompletionRate: performance.goalProgress.completionRate,
      },
    };

    return res.status(200).json({
      status: 'success',
      data: { summary },
    });
  } catch (error) {
    console.error('Get analytics summary error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error while fetching analytics summary',
    });
  }
};

/**
 * Export analytics data
 * @route POST /api/analytics/export
 */
export const exportAnalytics = async (req: Request, res: Response) => {
  try {
    const { type, format, filters } = req.body;

    if (!req.tenantId) {
      return res.status(401).json({
        status: 'error',
        message: 'Tenant ID is required',
      });
    }

    if (!type) {
      return res.status(400).json({
        status: 'error',
        message: 'Analytics type is required',
      });
    }

    let data;
    switch (type) {
      case 'dashboard':
        data = await getDashboardMetrics(req.tenantId);
        break;
      case 'employees':
        data = await getEmployeeAnalytics(req.tenantId);
        break;
      case 'payroll':
        data = await getPayrollAnalytics(req.tenantId, filters?.year);
        break;
      case 'leave':
        data = await getLeaveAnalytics(req.tenantId, filters?.year);
        break;
      case 'performance':
        data = await getPerformanceAnalytics(req.tenantId, filters?.cycleId);
        break;
      default:
        return res.status(400).json({
          status: 'error',
          message: 'Invalid analytics type',
        });
    }

    // In a production system, you would:
    // 1. Generate the file in the requested format (CSV, PDF, Excel)
    // 2. Store it temporarily or stream it directly
    // 3. Return a download link or stream the file

    const exportData = {
      type,
      format: format || 'json',
      generatedAt: new Date().toISOString(),
      data,
    };

    return res.status(200).json({
      status: 'success',
      message: 'Analytics data exported successfully',
      data: exportData,
    });
  } catch (error) {
    console.error('Export analytics error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error while exporting analytics',
    });
  }
};

/**
 * Get overtime analytics
 * @route GET /api/analytics/overtime
 */
export const getOvertimeAnalytics = async (req: Request, res: Response) => {
  try {
    if (!req.tenantId) {
      return res.status(401).json({
        status: 'error',
        message: 'Tenant ID is required',
      });
    }
    const analytics = await getOvertimeAnalyticsService(req.tenantId);
    return res.status(200).json({
      status: 'success',
      data: analytics,
    });
  } catch (error) {
    console.error('Get overtime analytics error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error while fetching overtime analytics',
    });
  }
};

/**
 * Get diversity analytics (not supported)
 * @route GET /api/analytics/diversity
 */
export const getDiversityAnalytics = async (req: Request, res: Response) => {
  const result = await getDiversityAnalyticsService();
  return res.status(200).json({ status: 'success', data: result });
};

/**
 * Get attendance trends (not supported)
 * @route GET /api/analytics/attendance
 */
export const getAttendanceTrends = async (req: Request, res: Response) => {
  const result = await getAttendanceTrendsService();
  return res.status(200).json({ status: 'success', data: result });
};

/**
 * Get real-time metrics
 * @route GET /api/analytics/realtime
 */
export const getRealTimeMetrics = async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId;
    if (!tenantId) {
      return res.status(401).json({ status: 'error', message: 'Tenant ID is required' });
    }
    const data = await getRealTimeMetricsService(tenantId);
    return res.status(200).json({ status: 'success', data });
  } catch (error) {
    console.error('Get real-time metrics error:', error);
    return res.status(500).json({ status: 'error', message: 'Internal server error while fetching real-time metrics' });
  }
};

/**
 * Get recent HR activities (audit trail)
 * @route GET /api/analytics/audit-trail
 */
export const getAuditTrail = async (req: Request, res: Response) => {
  try {
    if (!req.tenantId) {
      return res.status(401).json({
        status: 'error',
        message: 'Tenant ID is required',
      });
    }
    // Limit to last 10 activities for dashboard
    const result = await getAuditTrailService({ tenantId: req.tenantId, limit: 10 });
    return res.status(200).json({
      status: 'success',
      data: result.data,
    });
  } catch (error) {
    console.error('Get audit trail error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error while fetching audit trail',
    });
  }
};

/**
 * Get salary advance analytics
 * @route GET /api/analytics/salary-advances
 */
export const getSalaryAdvanceAnalytics = async (req: Request, res: Response) => {
  try {
    if (!req.tenantId) {
      return res.status(401).json({
        status: 'error',
        message: 'Tenant ID is required',
      });
    }

    const analytics = await getSalaryAdvanceAnalyticsService(req.tenantId);

    return res.status(200).json({
      status: 'success',
      data: analytics,
    });
  } catch (error) {
    console.error('Get salary advance analytics error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error while fetching salary advance analytics',
    });
  }
};

/**
 * Get training analytics
 * @route GET /api/analytics/training
 */
export const getTraining = async (req: Request, res: Response) => {
  try {
    if (!req.tenantId) {
      return res.status(401).json({
        status: 'error',
        message: 'Tenant ID is required',
      });
    }

    const analytics = await getTrainingAnalyticsService(req.tenantId);

    return res.status(200).json({
      status: 'success',
      data: analytics,
    });
  } catch (error) {
    console.error('Get training analytics error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error while fetching training analytics',
    });
  }
};

/**
 * Get custom reports
 * @route GET /api/analytics/reports
 */
export const getCustomReports = async (req: Request, res: Response) => {
  res.status(501).json({ message: 'Not implemented' });
};

/**
 * Schedule a report
 * @route POST /api/analytics/reports/:reportId/schedule
 */
export const scheduleReport = async (req: Request, res: Response) => {
  res.status(501).json({ message: 'Not implemented' });
};

/**
 * Get system alerts
 * @route GET /api/analytics/alerts
 */
export const getSystemAlerts = async (req: Request, res: Response) => {
  res.status(501).json({ message: 'Not implemented' });
};

/**
 * Mark an alert as read
 * @route PATCH /api/analytics/alerts/:alertId/read
 */
export const markAlertAsRead = async (req: Request, res: Response) => {
  res.status(501).json({ message: 'Not implemented' });
};
