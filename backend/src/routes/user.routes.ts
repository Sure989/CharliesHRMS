import { Router } from 'express';
import * as userController from '../controllers/user.controller';
import { validateCreateUser, validateUpdateUser, validateUserId, validateChangePassword } from '../middleware/user.validation';
// Fix import for validate middleware
import { validate } from '../middleware/validate'; // generic validation result handler

const router = Router();

router.get('/', userController.getUsers);
router.get('/profile', userController.getCurrentUserProfile);
import { authenticate, restrictTo, checkPermissions } from '../middleware/auth.middleware';

router.get('/stats', authenticate, restrictTo(['ADMIN', 'HR_MANAGER']), userController.getUserStats);
router.get('/roles', userController.getUserRoles);
router.get('/departments', userController.getDepartments);
router.get('/permissions', userController.getPermissions);
router.get('/:id', validateUserId, validate, userController.getUserById);
router.post('/', validateCreateUser, validate, userController.createUser);
router.put('/:id', validateUpdateUser, validate, userController.updateUser);
router.delete('/:id', authenticate, restrictTo(['ADMIN']), checkPermissions(['user:delete']), validateUserId, validate, userController.deleteUser);
router.patch('/:id/status', validateUserId, validate, userController.updateUserStatus);
router.patch('/:id/permissions', authenticate, restrictTo(['ADMIN']), checkPermissions(['user:edit_permissions']), validateUserId, validate, userController.updateUserPermissions);
router.patch('/:id/role', authenticate, restrictTo(['ADMIN']), checkPermissions(['user:edit_role']), validateUserId, validate, userController.updateUserRole);
router.post('/:id/change-password', validateChangePassword, validate, userController.changeUserPassword);

export default router;
