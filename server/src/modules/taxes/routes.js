import { Router } from 'express';
import { authenticateUser } from '../../middleware/auth.js';
import { authorizeRoles } from '../../middleware/authorize.js';
import * as taxController from './controller.js';

const router = Router();

router.use(authenticateUser);

router.get('/', taxController.getTaxes);
router.post('/', authorizeRoles('admin'), taxController.createTax);
router.patch('/:id', authorizeRoles('admin'), taxController.updateTax);

export default router;
