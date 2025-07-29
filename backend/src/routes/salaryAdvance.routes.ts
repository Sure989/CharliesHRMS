import { Router } from 'express';
import {
  getSalaryAdvanceRequests,
  createSalaryAdvanceRequest,
  updateSalaryAdvanceRequest,
  getSalaryAdvanceEligibility,
  getSalaryAdvanceById,
  updateSalaryAdvance,
  cancelSalaryAdvance,
  disburseSalaryAdvance,
  getRepaymentSchedule,
  updateRepaymentSchedule,
  getEmployeeSalaryAdvanceHistory,
  getEmployeeOutstandingSalaryAdvance,
  getSalaryAdvanceStatistics,
  getSalaryAdvanceSettings,
  updateSalaryAdvanceSettings,
  generateSalaryAdvanceReport,
  calculateSalaryAdvanceDeduction,
  processSalaryAdvanceDeductions,
  getPendingSalaryAdvanceApprovals,
  bulkApproveSalaryAdvances,
  exportSalaryAdvanceData
} from '../controllers/salaryAdvance.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);


router.get('/', getSalaryAdvanceRequests);
router.post('/', createSalaryAdvanceRequest);
router.patch('/:id', updateSalaryAdvanceRequest);

// Additional endpoints
router.get('/eligibility/:employeeId', getSalaryAdvanceEligibility);
router.get('/:id', getSalaryAdvanceById);
router.put('/:id', updateSalaryAdvance);
router.patch('/:id/cancel', cancelSalaryAdvance);
router.post('/:id/disburse', disburseSalaryAdvance);
router.get('/:id/repayment-schedule', getRepaymentSchedule);
router.put('/:id/repayment-schedule', updateRepaymentSchedule);
router.get('/employee/:employeeId/history', getEmployeeSalaryAdvanceHistory);
router.get('/employee/:employeeId/outstanding', getEmployeeOutstandingSalaryAdvance);
router.get('/statistics', getSalaryAdvanceStatistics);
router.get('/settings', getSalaryAdvanceSettings);
router.put('/settings', updateSalaryAdvanceSettings);
router.post('/reports/generate', generateSalaryAdvanceReport);
router.get('/calculate-deduction/:employeeId/:payrollPeriodId', calculateSalaryAdvanceDeduction);
router.post('/process-deductions/:payrollPeriodId', processSalaryAdvanceDeductions);
router.get('/pending-approvals/:managerId', getPendingSalaryAdvanceApprovals);
router.post('/bulk-approve', bulkApproveSalaryAdvances);
router.get('/export', exportSalaryAdvanceData);

export default router;
