import { Router } from 'express';
import { authenticateUser } from '../../middleware/auth.js';
import { authorizeRoles } from '../../middleware/authorize.js';
import * as planController from './controller.js';

const router = Router();

router.use(authenticateUser);

// All authenticated roles can view plans
router.get('/', planController.getPlans);
router.get('/:id', planController.getPlanById);

// Admin-only can create and update plans
router.post('/', authorizeRoles('admin'), planController.createPlan);
router.patch('/:id', authorizeRoles('admin'), planController.updatePlan);

export default router;
