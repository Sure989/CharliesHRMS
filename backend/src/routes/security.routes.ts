import { Router } from 'express';
import { getSecuritySettings, updateSecuritySettings } from '../controllers/security.controller';
import { getSecurityAlerts, addSecurityAlert } from '../controllers/securityAlert.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Security Settings (requires authentication)
router.get('/settings', authenticate, getSecuritySettings);
router.put('/settings', authenticate, updateSecuritySettings);

// Security Alerts (requires authentication)
router.get('/alerts', authenticate, getSecurityAlerts);
router.post('/alerts', authenticate, addSecurityAlert);

export default router;
