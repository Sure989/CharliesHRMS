import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

/**
 * @route GET /api/session/check
 * @desc Check if session is valid
 * @access Private
 */
router.get('/check', authenticate, (req, res) => {
  res.json({
    status: 'success',
    data: {
      isValid: true,
      user: req.user,
      tenantId: req.tenantId
    }
  });
});

/**
 * @route POST /api/session/refresh
 * @desc Refresh session
 * @access Private
 */
router.post('/refresh', authenticate, (req, res) => {
  res.json({
    status: 'success',
    message: 'Session refreshed successfully'
  });
});

export default router;