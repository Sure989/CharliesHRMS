import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import prisma from '../lib/prisma';
import { generateToken, generateRefreshToken, TokenPayload } from '../utils/jwt';
import config from '../config/config';

/**
 * Login user and return JWT token
 * @route POST /api/auth/login
 * @param req - Express request object
 * @param res - Express response object
 */
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password, tenantId } = req.body;

    // Validate request body
    if (!email || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Email and password are required',
      });
    }


    // Find user by email
    // If no tenantId is provided, find user by email only
    // If tenantId is provided, filter by both email and tenantId
    const user = await prisma.user.findFirst({
      where: {
        email,
        ...(tenantId ? { tenantId } : {}),
      },
    });

    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid email or password',
      });
    }

    // Check if user is active
    if (user.status !== 'ACTIVE') {
      return res.status(403).json({
        status: 'error',
        message: 'Your account is not active. Please contact an administrator.',
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid email or password',
      });
    }

    // Create token payload
    const tokenPayload: TokenPayload = {
      userId: user.id,
      role: user.role,
      tenantId: user.tenantId || tenantId,
      permissions: user.permissions,
    };

    // Generate tokens
    const accessToken = generateToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    // Store refresh token in database
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now

    await prisma.userSession.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt,
      },
    });

    // Update last login timestamp
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    // Return tokens and user info
    // Fetch branchId and branch details if employeeId is present
    let branchId = null;
    let branch = null;
    if (user.employeeId) {
      const employee = await prisma.employee.findUnique({
        where: { id: user.employeeId },
        select: {
          branchId: true,
          branch: { select: { id: true, name: true, location: true, address: true } }
        }
      });
      if (employee) {
        branchId = employee.branchId;
        branch = employee.branch;
      }
    }
    return res.status(200).json({
      status: 'success',
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          tenantId: user.tenantId || tenantId,
          employeeId: user.employeeId,
          branchId,
          branch,
          permissions: user.permissions, // Include permissions in the user object
        },
        accessToken,
        refreshToken,
        expiresAt,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error during login',
    });
  }
};

/**
 * Logout user by invalidating refresh token
 * @route POST /api/auth/logout
 * @param req - Express request object
 * @param res - Express response object
 */
export const logout = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        status: 'error',
        message: 'Refresh token is required',
      });
    }

    // Delete the session with this refresh token
    await prisma.userSession.deleteMany({
      where: { token: refreshToken },
    });

    return res.status(200).json({
      status: 'success',
      message: 'Logout successful',
    });
  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error during logout',
    });
  }
};

/**
 * Refresh access token using refresh token
 * @route POST /api/auth/refresh-token
 * @param req - Express request object
 * @param res - Express response object
 */
export const refreshToken = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        status: 'error',
        message: 'Refresh token is required',
      });
    }

    // Find session with this refresh token
    const session = await prisma.userSession.findFirst({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!session) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid refresh token',
      });
    }

    // Check if token is expired
    if (new Date() > session.expiresAt) {
      // Delete expired session
      await prisma.userSession.delete({
        where: { id: session.id },
      });

      return res.status(401).json({
        status: 'error',
        message: 'Refresh token has expired. Please log in again.',
      });
    }

    // Create token payload
    const tenantIdForToken = session.user.tenantId || "00000000-0000-0000-0000-000000000000";
    const tokenPayload: TokenPayload = {
      userId: session.user.id,
      role: session.user.role,
      tenantId: tenantIdForToken,
      permissions: session.user.permissions,
    };

    // Generate new access token
    const accessToken = generateToken(tokenPayload);
    const newRefreshToken = generateRefreshToken(tokenPayload);

    // Update the session with the new refresh token
    await prisma.userSession.update({
        where: { id: session.id },
        data: { token: newRefreshToken },
    });

    return res.status(200).json({
      status: 'success',
      message: 'Token refreshed successfully',
      data: {
        accessToken,
        refreshToken: newRefreshToken,
      },
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error during token refresh',
    });
  }
};

/**
 * Get current user information
 * @route GET /api/auth/me
 * @param req - Express request object
 * @param res - Express response object
 */
export const getCurrentUser = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required. Please log in.',
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        lastLogin: true,
        tenantId: true,
        employeeId: true,
      },
    });

    let branchId = null;
    let branch = null;
    if (user && user.employeeId) {
      const employee = await prisma.employee.findUnique({
        where: { id: user.employeeId },
        select: {
          branchId: true,
          branch: { select: { id: true, name: true, location: true, address: true } }
        }
      });
      if (employee) {
        branchId = employee.branchId;
        branch = employee.branch;
      }
    }

    if (user) {
      (user as any).branchId = branchId;
      (user as any).branch = branch;
    }

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found',
      });
    }

    return res.status(200).json({
      status: 'success',
      data: {
        user,
      },
    });
  } catch (error) {
    console.error('Get current user error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error while fetching user data',
    });
  }
};

/**
 * Register new user (for admin use or self-registration if enabled)
 * @route POST /api/auth/register
 */
export const register = async (req: Request, res: Response) => {
  try {
    const { firstName, lastName, email, password, confirmPassword, role = 'EMPLOYEE' } = req.body;

    // Validate input
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'First name, last name, email, and password are required',
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        status: 'error',
        message: 'Passwords do not match',
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        status: 'error',
        message: 'Password must be at least 8 characters long',
      });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(409).json({
        status: 'error',
        message: 'User with this email already exists',
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // For self-registration, use default tenant or require tenant selection
    // For admin registration, use current tenant
    const tenantId = req.tenantId || "00000000-0000-0000-0000-000000000000";

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        firstName,
        lastName,
        passwordHash,
        role,
        tenantId,
        status: 'ACTIVE',
      },
    });

    // Generate tokens
    const tokenPayload: TokenPayload = {
      userId: user.id,
      role: user.role,
      tenantId: user.tenantId,
      permissions: user.permissions,
    };

    const accessToken = generateToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    // Store refresh token
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await prisma.userSession.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt,
      },
    });

    // Log registration
    await prisma.auditLog.create({
      data: {
        tenantId: user.tenantId,
        userId: user.id,
        action: 'USER_REGISTERED',
        entity: 'USER',
        entityId: user.id,
        details: {
          email: user.email,
          role: user.role,
        },
      },
    });

    return res.status(201).json({
      status: 'success',
      message: 'User registered successfully',
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          tenantId: user.tenantId,
        },
        token: accessToken,  // Frontend expects 'token', not 'accessToken'
        refreshToken,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error during registration',
    });
  }
};

/**
 * Update user profile
 * @route PUT /api/auth/profile
 */
export const updateProfile = async (req: Request, res: Response) => {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required',
      });
    }

    const { firstName, lastName, phone } = req.body;

    // Validate input
    if (!firstName || !lastName) {
      return res.status(400).json({
        status: 'error',
        message: 'First name and last name are required',
      });
    }

    // Update user profile
    const updatedUser = await prisma.user.update({
      where: { id: req.user.userId },
      data: {
        firstName,
        lastName,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        tenantId: true,
        employeeId: true,
      },
    });

    // Update related employee record if exists
    if (updatedUser.employeeId) {
      await prisma.employee.update({
        where: { id: updatedUser.employeeId },
        data: {
          firstName,
          lastName,
          ...(phone && { phone }),
          updatedAt: new Date(),
        },
      });
    }

    // Log profile update
    await prisma.auditLog.create({
      data: {
        tenantId: updatedUser.tenantId,
        userId: updatedUser.id,
        action: 'PROFILE_UPDATED',
        entity: 'USER',
        entityId: updatedUser.id,
        details: {
          updatedFields: ['firstName', 'lastName', ...(phone ? ['phone'] : [])],
        },
      },
    });

    return res.status(200).json({
      status: 'success',
      message: 'Profile updated successfully',
      data: updatedUser,  // Frontend expects user data directly, not wrapped in { user: ... }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error while updating profile',
    });
  }
};

/**
 * Change password
 * @route POST /api/auth/change-password
 */
export const changePassword = async (req: Request, res: Response) => {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required',
      });
    }

    const { currentPassword, newPassword, confirmPassword } = req.body;

    // Validate input
    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        status: 'error',
        message: 'Current password, new password, and confirmation are required',
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        status: 'error',
        message: 'New passwords do not match',
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        status: 'error',
        message: 'New password must be at least 8 characters long',
      });
    }

    // Get current user
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
    });

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found',
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        status: 'error',
        message: 'Current password is incorrect',
      });
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 12);

    // Update password
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: newPasswordHash,
        updatedAt: new Date(),
      },
    });

    // Invalidate all existing sessions except current one
    await prisma.userSession.deleteMany({
      where: {
        userId: user.id,
        // Keep current session if we can identify it
      },
    });

    // Log password change
    await prisma.auditLog.create({
      data: {
        tenantId: user.tenantId,
        userId: user.id,
        action: 'PASSWORD_CHANGED',
        entity: 'USER',
        entityId: user.id,
        details: {
          timestamp: new Date().toISOString(),
        },
      },
    });

    return res.status(200).json({
      status: 'success',
      message: 'Password changed successfully',
    });
  } catch (error) {
    console.error('Change password error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error while changing password',
    });
  }
};

/**
 * Request password reset
 * @route POST /api/auth/forgot-password
 */
export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        status: 'error',
        message: 'Email is required',
      });
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // Always return success to prevent email enumeration
    if (!user) {
      return res.status(200).json({
        status: 'success',
        message: 'If an account with that email exists, a password reset link has been sent',
      });
    }

    // Generate reset token (in production, use crypto.randomBytes)
    const resetToken = Math.random().toString(36).substring(2, 15) + 
                      Math.random().toString(36).substring(2, 15);
    const resetExpires = new Date();
    resetExpires.setHours(resetExpires.getHours() + 1); // 1 hour expiry

    // Store reset token (Note: This requires adding fields to User model)
    // For now, we'll store in audit log as a workaround
    await prisma.auditLog.create({
      data: {
        tenantId: user.tenantId,
        userId: user.id,
        action: 'PASSWORD_RESET_REQUESTED',
        entity: 'USER',
        entityId: user.id,
        details: {
          resetToken,
          resetExpires: resetExpires.toISOString(),
          email: user.email,
        },
      },
    });

    // In production, send email here
    console.log(`Password reset token for ${email}: ${resetToken}`);
    console.log(`Reset link: ${config.frontendUrl}/reset-password?token=${resetToken}`);

    return res.status(200).json({
      status: 'success',
      message: 'If an account with that email exists, a password reset link has been sent',
      // Remove in production - only for development
      ...(config.nodeEnv === 'development' && { 
        resetToken,
        resetLink: `${config.frontendUrl}/reset-password?token=${resetToken}`
      }),
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error while processing password reset request',
    });
  }
};

/**
 * Reset password with token
 * @route POST /api/auth/reset-password
 */
export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token, password, confirmPassword } = req.body;

    if (!token || !password || !confirmPassword) {
      return res.status(400).json({
        status: 'error',
        message: 'Token, password, and confirmation are required',
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        status: 'error',
        message: 'Passwords do not match',
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        status: 'error',
        message: 'Password must be at least 8 characters long',
      });
    }

    // Find reset token in audit logs (temporary solution)
    const resetLog = await prisma.auditLog.findFirst({
      where: {
        action: 'PASSWORD_RESET_REQUESTED',
        details: {
          path: ['resetToken'],
          equals: token,
        },
      },
      orderBy: { createdAt: 'desc' },
      include: { user: true },
    });

    if (!resetLog || !resetLog.user) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid or expired reset token',
      });
    }

    // Check if token is expired
    const resetExpires = new Date((resetLog.details as any)?.resetExpires);
    if (new Date() > resetExpires) {
      return res.status(400).json({
        status: 'error',
        message: 'Reset token has expired',
      });
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(password, 12);

    // Update password
    await prisma.user.update({
      where: { id: resetLog.user.id },
      data: {
        passwordHash,
        updatedAt: new Date(),
      },
    });

    // Invalidate all sessions
    await prisma.userSession.deleteMany({
      where: { userId: resetLog.user.id },
    });

    // Log password reset
    await prisma.auditLog.create({
      data: {
        tenantId: resetLog.user.tenantId,
        userId: resetLog.user.id,
        action: 'PASSWORD_RESET_COMPLETED',
        entity: 'USER',
        entityId: resetLog.user.id,
        details: {
          timestamp: new Date().toISOString(),
        },
      },
    });

    return res.status(200).json({
      status: 'success',
      message: 'Password reset successfully',
    });
  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error while resetting password',
    });
  }
};

/**
 * Verify email address
 * @route POST /api/auth/verify-email
 */
export const verifyEmail = async (req: Request, res: Response) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        status: 'error',
        message: 'Verification token is required',
      });
    }

    // Find verification token in audit logs (temporary solution)
    const verificationLog = await prisma.auditLog.findFirst({
      where: {
        action: 'EMAIL_VERIFICATION_SENT',
        details: {
          path: ['verificationToken'],
          equals: token,
        },
      },
      orderBy: { createdAt: 'desc' },
      include: { user: true },
    });

    if (!verificationLog || !verificationLog.user) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid verification token',
      });
    }

    // Mark email as verified (Note: This requires adding emailVerified field to User model)
    // For now, we'll log the verification
    await prisma.auditLog.create({
      data: {
        tenantId: verificationLog.user.tenantId,
        userId: verificationLog.user.id,
        action: 'EMAIL_VERIFIED',
        entity: 'USER',
        entityId: verificationLog.user.id,
        details: {
          email: verificationLog.user.email,
          verifiedAt: new Date().toISOString(),
        },
      },
    });

    return res.status(200).json({
      status: 'success',
      message: 'Email verified successfully',
    });
  } catch (error) {
    console.error('Verify email error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error while verifying email',
    });
  }
};

/**
 * Resend verification email
 * @route POST /api/auth/resend-verification
 */
export const resendVerificationEmail = async (req: Request, res: Response) => {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required',
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
    });

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found',
      });
    }

    // Generate verification token
    const verificationToken = Math.random().toString(36).substring(2, 15) + 
                             Math.random().toString(36).substring(2, 15);

    // Store verification token
    await prisma.auditLog.create({
      data: {
        tenantId: user.tenantId,
        userId: user.id,
        action: 'EMAIL_VERIFICATION_SENT',
        entity: 'USER',
        entityId: user.id,
        details: {
          verificationToken,
          email: user.email,
          sentAt: new Date().toISOString(),
        },
      },
    });

    // In production, send email here
    console.log(`Verification token for ${user.email}: ${verificationToken}`);
    console.log(`Verification link: ${config.frontendUrl}/verify-email?token=${verificationToken}`);

    return res.status(200).json({
      status: 'success',
      message: 'Verification email sent successfully',
      // Remove in production - only for development
      ...(config.nodeEnv === 'development' && { 
        verificationToken,
        verificationLink: `${config.frontendUrl}/verify-email?token=${verificationToken}`
      }),
    });
  } catch (error) {
    console.error('Resend verification email error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error while sending verification email',
    });
  }
};
