import express from 'express';
import { getUsers, createUser, updateUser, toggleUserStatus, deleteUser, getRoles, updateRolePermissions, getActivityLogs } from '../controllers/userController.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';
import { readOnlyForSuperAdmin } from '../middleware/readOnlyMiddleware.js';

const router = express.Router();

router.use(protect);

// Logs and Roles viewable by Admin only
router.get('/activity-logs', restrictTo('Admin'), getActivityLogs);
router.get('/roles', restrictTo('Admin', 'Sales Manager', 'Purchase Manager'), getRoles);
router.get('/', restrictTo('Admin', 'Sales Manager', 'Purchase Manager'), getUsers);

// User editing & Roles mapping restricts to Admin & Managers
router.post('/', restrictTo('Admin', 'Sales Manager', 'Purchase Manager'), readOnlyForSuperAdmin, createUser);
router.put('/roles/:id', restrictTo('Admin'), readOnlyForSuperAdmin, updateRolePermissions);
router.put('/:id', restrictTo('Admin', 'Sales Manager', 'Purchase Manager'), readOnlyForSuperAdmin, updateUser);
router.patch('/:id/status', restrictTo('Admin', 'Sales Manager', 'Purchase Manager'), readOnlyForSuperAdmin, toggleUserStatus);
router.delete('/:id', restrictTo('Admin', 'Sales Manager', 'Purchase Manager'), readOnlyForSuperAdmin, deleteUser);

export default router;
