import { Router } from 'express';
import { authenticateUser } from '../../middleware/auth.js';
import { authorizeRoles } from '../../middleware/authorize.js';
import * as userController from './controller.js';

const router = Router();

// Protect all user routes
router.use(authenticateUser);

// Admin-only: list all users
router.get('/', authorizeRoles('admin'), userController.getUsers);

// Admin-only: create staff account
router.post('/staff', authorizeRoles('admin'), userController.createStaff);

// Admin and Staff: list customers
router.get('/customers', authorizeRoles('admin', 'staff'), userController.getCustomers);

export default router;
