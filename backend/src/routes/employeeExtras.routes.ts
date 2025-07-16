import { Router } from 'express';
import { getEmployeeActivity, getTrainingProgress } from '../controllers/employeeExtras.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

// GET /api/employees/:id/activity
router.get('/:id/activity', getEmployeeActivity);

// GET /api/training/progress/:employeeId
router.get('/training/progress/:employeeId', getTrainingProgress);

export default router;
