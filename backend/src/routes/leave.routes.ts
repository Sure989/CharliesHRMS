import { Router } from 'express';
import {
  getLeaveTypes,
  createLeaveType,
  submitLeaveRequest,
  getLeaveRequests,
  processLeaveRequest,
  getLeaveBalances,
  getHolidays,
  createHoliday,
} from '../controllers/leave.controller';
import { authenticate, restrictTo } from '../middleware/auth.middleware';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

/**
 * @route GET /api/leave/types
 * @desc Get all leave types for the authenticated user's tenant
 * @access Private (All authenticated users)
 */
router.get('/types', getLeaveTypes);

/**
 * @route POST /api/leave/types
 * @desc Create a new leave type
 * @access Private (Admin, HR Manager)
 */
router.post('/types', restrictTo(['ADMIN', 'HR_MANAGER']), createLeaveType);

/**
 * @route POST /api/leave/requests
 * @desc Submit a leave request
 * @access Private (All authenticated users)
 */
router.post('/requests', submitLeaveRequest);

/**
 * @route GET /api/leave/requests
 * @desc Get leave requests with optional filtering
 * @access Private (Admin, HR Manager, Operations Manager can see all; Employees see their own)
 */
router.get('/requests', getLeaveRequests);

/**
 * @route PUT /api/leave/requests/:id/decision
 * @desc Approve or reject a leave request
 * @access Private (Admin, HR Manager, Operations Manager)
 */
router.put('/requests/:id/decision', restrictTo(['ADMIN', 'HR_MANAGER', 'OPERATIONS_MANAGER']), processLeaveRequest);

/**
 * @route GET /api/leave/balances/:employeeId
 * @desc Get leave balances for an employee
 * @access Private (All authenticated users - with employee access control in controller)
 */
router.get('/balances/:employeeId', getLeaveBalances);

/**
 * @route GET /api/leave/holidays
 * @desc Get holidays for the tenant
 * @access Private (All authenticated users)
 */
router.get('/holidays', getHolidays);

/**
 * @route POST /api/leave/holidays
 * @desc Create a holiday
 * @access Private (Admin, HR Manager)
 */
router.post('/holidays', restrictTo(['ADMIN', 'HR_MANAGER']), createHoliday);

export default router;
