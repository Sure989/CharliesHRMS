import { Router } from 'express';
import { login, logout, refreshToken, getCurrentUser } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

/**
 * Session endpoints (aliases to auth endpoints for backward compatibility)
 */
router.post('/login', login);
router.post('/logout', logout);
router.post('/refresh-token', refreshToken);
router.get('/me', authenticate, getCurrentUser);

export default router;