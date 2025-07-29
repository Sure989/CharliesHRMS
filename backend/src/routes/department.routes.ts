import { Router } from 'express';
import {
  getDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  getDepartmentEmployees,
  getDepartmentStats,
} from '../controllers/department.controller';
import { authenticate, restrictTo } from '../middleware/auth.middleware';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

/**
 * @route GET /api/departments
 * @desc Get all departments for the authenticated user's tenant
 * @access Private (All authenticated users)
 */
router.get('/', getDepartments);

/**
 * @route GET /api/departments/:id
 * @desc Get a single department by ID
 * @access Private (All authenticated users)
 */
router.get('/:id', getDepartmentById);

/**
 * @route POST /api/departments
 * @desc Create a new department
 * @access Private (Admin, HR Manager)
 */
router.post('/', restrictTo(['ADMIN', 'HR_MANAGER']), createDepartment);

/**
 * @route PUT /api/departments/:id
 * @desc Update a department
 * @access Private (Admin, HR Manager)
 */
router.put('/:id', restrictTo(['ADMIN', 'HR_MANAGER']), updateDepartment);

/**
 * @route DELETE /api/departments/:id
 * @desc Delete a department
 * @access Private (Admin)
 */
router.delete('/:id', restrictTo(['ADMIN']), deleteDepartment);

/**
 * @route GET /api/departments/:id/employees
 * @desc Get all employees in a department
 * @access Private (All authenticated users)
 */
router.get('/:id/employees', getDepartmentEmployees);

/**
 * @route GET /api/departments/:id/stats
 * @desc Get statistics for a specific department
 * @access Private (All authenticated users)
 */
router.get('/:id/stats', getDepartmentStats);

export default router;
