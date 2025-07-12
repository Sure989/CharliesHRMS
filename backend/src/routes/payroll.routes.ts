import { Router } from 'express';
import {
  getPayrollPeriods,
  createPayrollPeriod,
  getPayrollsByPeriod,
  processPayroll,
  bulkProcessPayroll,
  getPayStub,
  getPayStubs,
  getTimeEntries,
  saveTimeEntry,
  getTaxTables,
  updateTaxTable,
  generatePayrollReport,
  getPayrollReports,
  getPayrollStatistics,
  getPayrollSettings,
  updatePayrollSettings,
  getComplianceReports,
  generateComplianceReport,
  getPayrollAuditLogs,
  getPayrollEmployees,
  getPayrollRecords,
  getPayrollRecordById,
  approvePayrollRecords,
} from '../controllers/payroll.controller';
import { authenticate, restrictTo } from '../middleware/auth.middleware';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

/**
 * @route GET /api/payroll/periods
 * @desc Get all payroll periods for the authenticated user's tenant
 * @access Private (All authenticated users)
 */
router.get('/periods', getPayrollPeriods);

/**
 * @route POST /api/payroll/periods
 * @desc Create a new payroll period
 * @access Private (Admin, HR Manager)
 */
router.post('/periods', restrictTo(['ADMIN', 'HR_MANAGER']), createPayrollPeriod);

/**
 * @route GET /api/payroll/periods/:periodId/payrolls
 * @desc Get all payrolls for a specific period
 * @access Private (Admin, HR Manager, Operations Manager)
 */
router.get('/periods/:periodId/payrolls', restrictTo(['ADMIN', 'HR_MANAGER', 'OPERATIONS_MANAGER']), getPayrollsByPeriod);

/**
 * @route POST /api/payroll/process
 * @desc Process payroll for a specific employee and period
 * @access Private (Admin, HR Manager)
 */
router.post('/process', restrictTo(['ADMIN', 'HR_MANAGER']), processPayroll);

/**
 * @route POST /api/payroll/periods/:periodId/process-all
 * @desc Bulk process payroll for all employees in a period
 * @access Private (Admin, HR Manager)
 */
router.post('/periods/:periodId/process-all', restrictTo(['ADMIN', 'HR_MANAGER']), bulkProcessPayroll);

/**
 * @route GET /api/payroll/records
 * @desc Get payroll records with filters
 * @access Private (Admin, HR Manager, Operations Manager)
 */
router.get('/records', restrictTo(['ADMIN', 'HR_MANAGER', 'OPERATIONS_MANAGER']), getPayrollRecords);

/**
 * @route GET /api/payroll/records/:id
 * @desc Get a payroll record by ID
 * @access Private (Admin, HR Manager, Operations Manager)
 */
router.get('/records/:id', restrictTo(['ADMIN', 'HR_MANAGER', 'OPERATIONS_MANAGER']), getPayrollRecordById);

/**
 * @route POST /api/payroll/records/approve
 * @desc Approve payroll records
 * @access Private (Admin, HR Manager)
 */
router.post('/records/approve', restrictTo(['ADMIN', 'HR_MANAGER']), approvePayrollRecords);

/**
 * @route GET /api/payroll/pay-stubs/:id
 * @desc Get a pay stub by ID
 * @access Private (All authenticated users - with employee access control in controller)
 */
router.get('/pay-stubs/:id', getPayStub);

/**
 * @route GET /api/payroll/pay-stubs
 * @desc Get all pay stubs with filters
 * @access Private (All authenticated users)
 */
router.get('/pay-stubs', getPayStubs);

/**
 * @route GET /api/payroll/time-entries
 * @desc Get time entries
 * @access Private (All authenticated users)
 */
router.get('/time-entries', getTimeEntries);

/**
 * @route POST /api/payroll/time-entries
 * @desc Save time entry
 * @access Private (All authenticated users)
 */
router.post('/time-entries', saveTimeEntry);

/**
 * @route GET /api/payroll/tax-tables
 * @desc Get tax tables
 * @access Private (Admin, HR Manager)
 */
router.get('/tax-tables', restrictTo(['ADMIN', 'HR_MANAGER']), getTaxTables);

/**
 * @route PUT /api/payroll/tax-tables/:id
 * @desc Update tax table
 * @access Private (Admin)
 */
router.put('/tax-tables/:id', restrictTo(['ADMIN']), updateTaxTable);

/**
 * @route POST /api/payroll/reports/generate
 * @desc Generate payroll report
 * @access Private (Admin, HR Manager)
 */
router.post('/reports/generate', restrictTo(['ADMIN', 'HR_MANAGER']), generatePayrollReport);

/**
 * @route GET /api/payroll/reports
 * @desc Get payroll reports
 * @access Private (Admin, HR Manager, Operations Manager)
 */
router.get('/reports', restrictTo(['ADMIN', 'HR_MANAGER', 'OPERATIONS_MANAGER']), getPayrollReports);

/**
 * @route GET /api/payroll/statistics
 * @desc Get payroll statistics
 * @access Private (Admin, HR Manager, Operations Manager)
 */
router.get('/statistics', restrictTo(['ADMIN', 'HR_MANAGER', 'OPERATIONS_MANAGER']), getPayrollStatistics);

/**
 * @route GET /api/payroll/settings
 * @desc Get payroll settings
 * @access Private (Admin, HR Manager)
 */
router.get('/settings', restrictTo(['ADMIN', 'HR_MANAGER']), getPayrollSettings);

/**
 * @route PUT /api/payroll/settings
 * @desc Update payroll settings
 * @access Private (Admin)
 */
router.put('/settings', restrictTo(['ADMIN']), updatePayrollSettings);

/**
 * @route GET /api/payroll/compliance
 * @desc Get compliance reports
 * @access Private (Admin, HR Manager)
 */
router.get('/compliance', restrictTo(['ADMIN', 'HR_MANAGER']), getComplianceReports);

/**
 * @route POST /api/payroll/compliance/generate
 * @desc Generate compliance report
 * @access Private (Admin, HR Manager)
 */
router.post('/compliance/generate', restrictTo(['ADMIN', 'HR_MANAGER']), generateComplianceReport);

/**
 * @route GET /api/payroll/audit-logs
 * @desc Get payroll audit logs
 * @access Private (Admin)
 */
router.get('/audit-logs', restrictTo(['ADMIN']), getPayrollAuditLogs);

/**
 * @route GET /api/payroll/employees
 * @desc Get payroll employees with compensation information
 * @access Private (Admin, HR Manager, Operations Manager)
 */
router.get('/employees', restrictTo(['ADMIN', 'HR_MANAGER', 'OPERATIONS_MANAGER']), getPayrollEmployees);

export default router;
