import { Router } from 'express';
import { authenticateUser } from '../../middleware/auth.js';
import { authorizeRoles } from '../../middleware/authorize.js';
import * as billingController from './controller.js';

const router = Router();

router.use(authenticateUser);

// Billing runs can be triggered by Admin or Staff
router.post('/run', authorizeRoles('admin', 'staff'), billingController.runBilling);

export default router;
