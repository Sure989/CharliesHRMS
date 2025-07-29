import { Router } from 'express';
import {
  login,
  logout,
  refreshToken,
  getCurrentUser,
  register,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerificationEmail,
} from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

/**
 * @route POST /api/auth/register
 * @desc Register a new user
 * @access Public
 */
router.post('/register', register);

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

/**
 * @route PUT /api/auth/profile
 * @desc Update user profile
 * @access Private
 */
router.put('/profile', authenticate, updateProfile);

/**
 * @route POST /api/auth/change-password
 * @desc Change user password
 * @access Private
 */
router.post('/change-password', authenticate, changePassword);

/**
 * @route POST /api/auth/forgot-password
 * @desc Request password reset
 * @access Public
 */
router.post('/forgot-password', forgotPassword);

/**
 * @route POST /api/auth/reset-password
 * @desc Reset password with token
 * @access Public
 */
router.post('/reset-password', resetPassword);

/**
 * @route POST /api/auth/verify-email
 * @desc Verify user's email address
 * @access Public
 */
router.post('/verify-email', verifyEmail);

/**
 * @route POST /api/auth/resend-verification
 * @desc Resend email verification link
 * @access Private
 */
router.post('/resend-verification', authenticate, resendVerificationEmail);

export default router;
