import jwt from 'jsonwebtoken';
import config from '../config/config';

export interface TokenPayload {
  userId: string;
  role: string;
  tenantId: string;
  permissions: string[];
}

/**
 * Generate a JWT token
 * @param payload - The data to be included in the token
 * @param expiresIn - Token expiration time
 * @returns The generated token
 */
export const generateToken = (
  payload: TokenPayload,
  expiresIn: string = config.jwt.expiresIn
): string => {
  // Using any type to bypass TypeScript errors
  const options: any = { expiresIn };
  return jwt.sign(payload, config.jwt.secret, options);
};

/**
 * Generate a refresh token
 * @param payload - The data to be included in the token
 * @returns The generated refresh token
 */
export const generateRefreshToken = (payload: TokenPayload): string => {
  // Using any type to bypass TypeScript errors
  const options: any = { expiresIn: config.jwt.refreshExpiresIn };
  return jwt.sign(payload, config.jwt.secret, options);
};

/**
 * Verify a JWT token
 * @param token - The token to verify
 * @returns The decoded token payload or null if invalid
 */
export const verifyToken = (token: string): TokenPayload | null => {
  try {
    const decoded = jwt.verify(token, config.jwt.secret) as TokenPayload;
    return decoded;
  } catch {
    return null;
  }
};
