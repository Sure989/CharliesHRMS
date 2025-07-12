import { body, param } from 'express-validator';

export const validateCreateUser = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('firstName').notEmpty().withMessage('First name is required'),
  body('lastName').notEmpty().withMessage('Last name is required'),
  body('role').notEmpty().withMessage('Role is required'),
  // Add more validations as needed
];

export const validateUpdateUser = [
  param('id').notEmpty().withMessage('User ID is required'),
  body('email').optional().isEmail().withMessage('Valid email is required'),
  body('firstName').optional().notEmpty(),
  body('lastName').optional().notEmpty(),
  // Add more validations as needed
];

export const validateUserId = [
  param('id').notEmpty().withMessage('User ID is required'),
];

export const validateChangePassword = [
  param('id').notEmpty().withMessage('User ID is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
];
