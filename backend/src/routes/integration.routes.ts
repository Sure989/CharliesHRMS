import { Router } from 'express';
import { 
  getIntegrations, 
  getIntegrationLogs, 
  getIntegrationSummary, 
  testIntegration, 
  toggleIntegration 
} from '../controllers/integration.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// GET /api/integrations
router.get('/', getIntegrations);

// GET /api/integration-logs
router.get('/logs', getIntegrationLogs);

// GET /api/integration-summary
router.get('/summary', getIntegrationSummary);

// POST /api/integrations/:id/test
router.post('/:id/test', testIntegration);

// PATCH /api/integrations/:id/toggle
router.patch('/:id/toggle', toggleIntegration);

export default router;
