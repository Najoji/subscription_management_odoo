import { Router } from 'express';
import { authenticateUser } from '../../middleware/auth.js';
import { authorizeRoles } from '../../middleware/authorize.js';
import * as dashboardController from './controller.js';

const router = Router();

router.use(authenticateUser);

// Dashboard KPI analytics endpoint accessible to Admin and Staff
router.get('/summary', authorizeRoles('admin', 'staff'), dashboardController.getSummary);

export default router;
