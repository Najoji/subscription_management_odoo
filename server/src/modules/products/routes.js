import { Router } from 'express';
import { authenticateUser } from '../../middleware/auth.js';
import { authorizeRoles } from '../../middleware/authorize.js';
import * as productController from './controller.js';

const router = Router();

router.use(authenticateUser);

// All authenticated roles can view products and calculate price
router.get('/', productController.getProducts);
router.get('/calculate-price', productController.calculatePrice);
router.get('/:id', productController.getProductById);

// Admin-only can create, update, or add variants
router.post('/', authorizeRoles('admin'), productController.createProduct);
router.patch('/:id', authorizeRoles('admin'), productController.updateProduct);
router.post('/:id/variants', authorizeRoles('admin'), productController.addVariant);

export default router;
