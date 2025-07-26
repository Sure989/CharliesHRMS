import { Router } from 'express';
import { getSalaryAdvanceRequests, createSalaryAdvanceRequest } from '../controllers/salaryAdvance.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

/**
 * @route GET /api/salary-advances
 * @desc Get salary advance requests with optional filters
 * @access Private (All authenticated users)
 */

// List salary advances
router.get('/', getSalaryAdvanceRequests);

// Update salary advance status (approve/reject)
router.patch('/:id', require('./../controllers/salaryAdvance.controller').updateSalaryAdvanceRequest);

/**
 * @route POST /api/salary-advances
 * @desc Create a new salary advance request
 * @access Private (Employee)
 */
router.post('/', createSalaryAdvanceRequest);

export default router;
