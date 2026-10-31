import { Router } from 'express';
import { authenticateUser } from '../../middleware/auth.js';
import { authorizeRoles } from '../../middleware/authorize.js';
import * as paymentController from './controller.js';

const router = Router();

router.use(authenticateUser);

// All users can list their visible payments
router.get('/', paymentController.listPayments);

// Staff and Admin can record payment
router.post('/', authorizeRoles('admin', 'staff'), paymentController.recordPaymentForInvoice);

export default router;
