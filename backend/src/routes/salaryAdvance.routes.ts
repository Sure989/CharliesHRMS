import { Router } from 'express';
import { getSalaryAdvanceRequests } from '../controllers/salaryAdvance.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

/**
 * @route GET /api/salary-advances
 * @desc Get salary advance requests with optional filters
 * @access Private (All authenticated users)
 */
router.get('/', getSalaryAdvanceRequests);

export default router;
