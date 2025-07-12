import express from 'express';
import { getSecurityMetrics } from '../controllers/securityMetrics.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = express.Router();

// Route to fetch security metrics (requires authentication)
router.get('/metrics', authenticate, getSecurityMetrics);

export default router;
