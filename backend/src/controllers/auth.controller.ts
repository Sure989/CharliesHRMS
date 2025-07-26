import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { prisma } from '../index';
import { generateToken, generateRefreshToken, TokenPayload } from '../utils/jwt';
import { getUserPermissions } from '../utils/permissions';

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
    const tenantIdForToken = user.tenantId || "00000000-0000-0000-0000-000000000000";
    const tokenPayload: TokenPayload = {
      userId: user.id,
      role: user.role,
      tenantId: tenantIdForToken,
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
    // Get user permissions based on their role
    const permissions = getUserPermissions(user.role);

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
          tenantId: tenantIdForToken,
          employeeId: user.employeeId,
          branchId,
          branch,
          permissions: permissions, // Include permissions in the user object
        },
        accessToken,
        refreshToken,
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
      (user as any).permissions = getUserPermissions(user.role);
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
