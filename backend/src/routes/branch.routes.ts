import { Router } from 'express';
import {
  getBranches,
  getBranchById,
  createBranch,
  updateBranch,
  deleteBranch,
  getBranchEmployees,
} from '../controllers/branch.controller';
import { authenticate, restrictTo } from '../middleware/auth.middleware';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

/**
 * @route GET /api/branches
 * @desc Get all branches for the authenticated user's tenant
 * @access Private (All authenticated users)
 */
router.get('/', getBranches);

/**
 * @route GET /api/branches/:id
 * @desc Get a single branch by ID
 * @access Private (All authenticated users)
 */
router.get('/:id', getBranchById);

/**
 * @route POST /api/branches
 * @desc Create a new branch
 * @access Private (Admin, HR Manager)
 */
router.post('/', restrictTo(['ADMIN', 'HR_MANAGER']), createBranch);

/**
 * @route PUT /api/branches/:id
 * @desc Update a branch
 * @access Private (Admin, HR Manager)
 */
router.put('/:id', restrictTo(['ADMIN', 'HR_MANAGER']), updateBranch);

/**
 * @route DELETE /api/branches/:id
 * @desc Delete a branch
 * @access Private (Admin)
 */
router.delete('/:id', restrictTo(['ADMIN']), deleteBranch);

/**
 * @route GET /api/branches/:id/employees
 * @desc Get all employees for a specific branch
 * @access Private (All authenticated users)
 */
router.get('/:id/employees', getBranchEmployees);

export default router;
