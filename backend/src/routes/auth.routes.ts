import { Router } from 'express';
import { login, logout, refreshToken, getCurrentUser } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

/**
 * @route POST /api/auth/login
 * @desc Login user and get tokens
 * @access Public
 */
router.post('/login', login);

/**
 * @route POST /api/auth/logout
 * @desc Logout user and invalidate refresh token
 * @access Public
 */
router.post('/logout', logout);

/**
 * @route POST /api/auth/refresh-token
 * @desc Refresh access token using refresh token
 * @access Public
 */
router.post('/refresh-token', refreshToken);

/**
 * @route GET /api/auth/me
 * @desc Get current user information
 * @access Private
 */
router.get('/me', authenticate, getCurrentUser);

export default router;
