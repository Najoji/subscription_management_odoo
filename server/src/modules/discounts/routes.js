import { Router } from 'express';
import { authenticateUser } from '../../middleware/auth.js';
import { authorizeRoles } from '../../middleware/authorize.js';
import * as discountController from './controller.js';

const router = Router();

router.use(authenticateUser);

// All authenticated users can list discounts and validate discount codes
router.get('/', discountController.listDiscounts);
router.post('/validate', discountController.validateDiscount);
router.get('/:id', discountController.getDiscountById);

// Admin-only management endpoints
router.post('/', authorizeRoles('admin'), discountController.createDiscount);
router.patch('/:id', authorizeRoles('admin'), discountController.updateDiscount);

export default router;
