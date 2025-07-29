import { Router } from 'express';
import {
  getEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  getEmployeePerformance,
  getEmployeeLeave,
  getEmployeePayroll,
  importEmployees,
  exportEmployees,
} from '../controllers/employee.controller';
import { getEmployeeActivity, getTrainingProgress } from '../controllers/employeeExtras.controller';
import { authenticate, restrictTo } from '../middleware/auth.middleware';
import multer from 'multer';

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

/**
 * @route GET /api/employees
 * @desc Get all employees for the authenticated user's tenant
 * @access Private (All authenticated users)
 */
router.get('/', getEmployees);

/**
 * @route GET /api/employees/:id
 * @desc Get a single employee by ID
 * @access Private (All authenticated users)
 */
router.get('/:id', getEmployeeById);

/**
 * @route POST /api/employees
 * @desc Create a new employee
 * @access Private (Admin, HR Manager)
 */
router.post('/', restrictTo(['ADMIN', 'HR_MANAGER']), createEmployee);

/**
 * @route PUT /api/employees/:id
 * @desc Update an employee
 * @access Private (Admin, HR Manager)
 */
router.put('/:id', restrictTo(['ADMIN', 'HR_MANAGER']), updateEmployee);

/**
 * @route DELETE /api/employees/:id
 * @desc Delete an employee
 * @access Private (Admin)
 */
router.delete('/:id', restrictTo(['ADMIN']), deleteEmployee);

/**
 * @route GET /api/employees/:id/performance
 * @desc Get employee performance data
 * @access Private (Admin, HR Manager)
 */
router.get('/:id/performance', getEmployeePerformance);

/**
 * @route GET /api/employees/:id/leave
 * @desc Get employee leave data
 * @access Private (Admin, HR Manager)
 */
router.get('/:id/leave', getEmployeeLeave);

/**
 * @route GET /api/employees/:id/payroll
 * @desc Get employee payroll history
 * @access Private (Admin, HR Manager)
 */
router.get('/:id/payroll', getEmployeePayroll);

/**
 * @route GET /api/employees/by-employee-id/:employeeId
 * @desc Get employee by employee ID (not database ID)
 * @access Private (All authenticated users)
 */
import { getEmployeeByEmployeeNumber } from '../controllers/employee.controller';
router.get('/by-employee-id/:employeeId', getEmployeeByEmployeeNumber);

/**
 * @route GET /api/employees/department/:department
 * @desc Get employees by department
 * @access Private (All authenticated users)
 */
router.get('/department/:department', getEmployees);

/**
 * @route GET /api/employees/branch/:branch
 * @desc Get employees by branch
 * @access Private (All authenticated users)
 */
router.get('/branch/:branch', getEmployees);

/**
 * @route GET /api/employees/manager/:managerId
 * @desc Get employees by manager
 * @access Private (All authenticated users)
 */
router.get('/manager/:managerId', getEmployees);

/**
 * @route GET /api/employees/search
 * @desc Search employees
 * @access Private (All authenticated users)
 */
router.get('/search', getEmployees);

/**
 * @route PATCH /api/employees/:id/activate
 * @desc Activate employee
 * @access Private (Admin, HR Manager)
 */
router.patch('/:id/activate', restrictTo(['ADMIN', 'HR_MANAGER']), updateEmployee);

/**
 * @route PATCH /api/employees/:id/deactivate
 * @desc Deactivate employee
 * @access Private (Admin, HR Manager)
 */
router.patch('/:id/deactivate', restrictTo(['ADMIN', 'HR_MANAGER']), updateEmployee);

/**
 * @route GET /api/employees/stats
 * @desc Get employee statistics
 * @access Private (Admin, HR Manager, Operations Manager)
 */
router.get('/stats', restrictTo(['ADMIN', 'HR_MANAGER', 'OPERATIONS_MANAGER']), getEmployees);

/**
 * @route POST /api/employees/import
 * @desc Import employee data from CSV/Excel file
 * @access Private (Admin, HR Manager)
 */
router.post('/import', restrictTo(['ADMIN', 'HR_MANAGER']), upload.single('file'), importEmployees);

/**
 * @route GET /api/employees/export
 * @desc Export employee data to CSV
 * @access Private (Admin, HR Manager)
 */
router.post('/:id/profile-picture', restrictTo(['ADMIN', 'HR_MANAGER']), upload.single('file'), updateEmployee);
router.post('/:id/profile-picture', restrictTo(['ADMIN', 'HR_MANAGER']), upload.single('file'), updateEmployee);
router.get('/export', restrictTo(['ADMIN', 'HR_MANAGER']), exportEmployees);

/**
 * @route GET /api/employees/:id/activity
 * @desc Get employee activity
 * @access Private (All authenticated users)
 */
router.get('/:id/activity', getEmployeeActivity);

/**
 * @route GET /api/training/progress/:employeeId
 * @desc Get training progress for an employee
 * @access Private (All authenticated users)
 */
router.get('/training/progress/:employeeId', getTrainingProgress);
export default router;
