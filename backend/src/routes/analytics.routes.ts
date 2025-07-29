import { Router } from 'express';
import {
  getDashboard,
  getEmployees,
  getPayroll,
  getLeave,
  getPerformance,
  getTraining,
  getCustomAnalytics,
  getCustomReports,
  getSummary,
  exportAnalytics,
  getOvertimeAnalytics,
  getDiversityAnalytics,
  getAttendanceTrends,
  getRealTimeMetrics,
  getAuditTrail,
  getSalaryAdvanceAnalytics,
  scheduleReport,
  getSystemAlerts,
  markAlertAsRead,
} from '../controllers/analytics.controller';
import { authenticate, restrictTo } from '../middleware/auth.middleware';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

/**
 * @route GET /api/analytics/dashboard
 * @desc Get dashboard overview metrics
 * @access Private (All authenticated users)
 */
router.get('/dashboard', getDashboard);

/**
 * @route GET /api/analytics/summary
 * @desc Get analytics summary for all modules
 * @access Private (Admin, HR Manager, Operations Manager)
 */
router.get('/summary', restrictTo(['ADMIN', 'HR_MANAGER', 'OPERATIONS_MANAGER']), getSummary);

/**
 * @route GET /api/analytics/employees
 * @desc Get employee analytics
 * @access Private (Admin, HR Manager, Operations Manager)
 */
router.get('/employees', restrictTo(['ADMIN', 'HR_MANAGER', 'OPERATIONS_MANAGER']), getEmployees);

/**
 * @route GET /api/analytics/payroll
 * @desc Get payroll analytics
 * @access Private (Admin, HR Manager, Payroll Manager)
 */
router.get('/payroll', restrictTo(['ADMIN', 'HR_MANAGER', 'PAYROLL_MANAGER']), getPayroll);

/**
 * @route GET /api/analytics/leave
 * @desc Get leave analytics
 * @access Private (Admin, HR Manager, Operations Manager)
 */
router.get('/leave', restrictTo(['ADMIN', 'HR_MANAGER', 'OPERATIONS_MANAGER']), getLeave);

/**
 * @route GET /api/analytics/performance
 * @desc Get performance analytics
 * @access Private (Admin, HR Manager, Operations Manager)
 */
router.get('/performance-reviews', restrictTo(['ADMIN', 'HR_MANAGER', 'OPERATIONS_MANAGER']), getPerformance);

/**
 * @route GET /api/analytics/training
 * @desc Get training analytics
 * @access Private (Admin, HR Manager, Operations Manager)
 */
router.get('/training', restrictTo(['ADMIN', 'HR_MANAGER', 'OPERATIONS_MANAGER']), getTraining);

/**
 * @route POST /api/analytics/custom
 * @desc Generate custom analytics
 * @access Private (Admin only)
 */
router.post('/reports/generate', restrictTo(['ADMIN']), getCustomAnalytics);
router.get('/reports', restrictTo(['ADMIN']), getCustomReports);
router.post('/reports/:reportId/schedule', restrictTo(['ADMIN']), scheduleReport);
router.get('/alerts', restrictTo(['ADMIN']), getSystemAlerts);
router.patch('/alerts/:alertId/read', restrictTo(['ADMIN']), markAlertAsRead);

/**
 * @route POST /api/analytics/export
 * @desc Export analytics data
 * @access Private (Admin, HR Manager, Operations Manager)
 */
router.post('/export', restrictTo(['ADMIN', 'HR_MANAGER', 'OPERATIONS_MANAGER']), exportAnalytics);

/**
 * @route GET /api/analytics/overtime
 * @desc Get overtime analytics
 * @access Private (Admin, HR Manager, Payroll Manager)
 */
router.get('/overtime', restrictTo(['ADMIN', 'HR_MANAGER', 'PAYROLL_MANAGER']), getOvertimeAnalytics);

/**
 * @route GET /api/analytics/diversity
 * @desc Get diversity analytics (not supported)
 * @access Private (Admin, HR Manager, Operations Manager)
 */
router.get('/diversity', restrictTo(['ADMIN', 'HR_MANAGER', 'OPERATIONS_MANAGER']), getDiversityAnalytics);

/**
 * @route GET /api/analytics/attendance
 * @desc Get attendance trends (not supported)
 * @access Private (Admin, HR Manager, Operations Manager)
 */
router.get('/attendance', restrictTo(['ADMIN', 'HR_MANAGER', 'OPERATIONS_MANAGER']), getAttendanceTrends);

/**
 * @route GET /api/analytics/realtime
 * @desc Get real-time dashboard metrics
 * @access Private (All authenticated users)
 */
router.get('/realtime', getRealTimeMetrics);

/**
 * @route GET /api/analytics/salary-advances
 * @desc Get salary advance analytics
 * @access Private (Admin, HR Manager, Operations Manager)
 */
router.get('/salary-advances', restrictTo(['ADMIN', 'HR_MANAGER', 'OPERATIONS_MANAGER']), getSalaryAdvanceAnalytics);

/**
 * @route GET /api/analytics/audit-trail
 * @desc Get recent HR activities (audit trail)
 * @access Private (Admin, HR Manager, Operations Manager)
 */
router.get('/audit-trail', restrictTo(['ADMIN', 'HR_MANAGER', 'OPERATIONS_MANAGER']), getAuditTrail);

export default router;
