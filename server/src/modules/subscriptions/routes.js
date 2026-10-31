import { Router } from 'express';
import { authenticateUser } from '../../middleware/auth.js';
import { authorizeRoles } from '../../middleware/authorize.js';
import * as subscriptionController from './controller.js';

const router = Router();

// ==============================================================================
// SUBSCRIPTION CORE
// ==============================================================================
router.get(
  '/',
  authenticateUser,
  authorizeRoles('admin', 'staff', 'customer'),
  subscriptionController.listSubscriptions
);

router.get(
  '/:id',
  authenticateUser,
  authorizeRoles('admin', 'staff', 'customer'),
  subscriptionController.getSubscriptionById
);

router.post(
  '/',
  authenticateUser,
  authorizeRoles('admin', 'staff'),
  subscriptionController.createSubscription
);

router.patch(
  '/:id/status',
  authenticateUser,
  authorizeRoles('admin', 'staff'),
  subscriptionController.updateSubscriptionStatus
);

// ==============================================================================
// DEDICATED LIFECYCLE ACTION ENDPOINTS
// ==============================================================================
router.post(
  '/:id/confirm',
  authenticateUser,
  authorizeRoles('admin', 'staff'),
  subscriptionController.confirmSubscription
);

router.post(
  '/:id/activate',
  authenticateUser,
  authorizeRoles('admin', 'staff'),
  subscriptionController.activateSubscription
);

router.post(
  '/:id/pause',
  authenticateUser,
  authorizeRoles('admin', 'staff'),
  subscriptionController.pauseSubscription
);

router.post(
  '/:id/resume',
  authenticateUser,
  authorizeRoles('admin', 'staff'),
  subscriptionController.resumeSubscription
);

router.post(
  '/:id/close',
  authenticateUser,
  authorizeRoles('admin', 'staff'),
  subscriptionController.closeSubscription
);

router.post(
  '/:id/renew',
  authenticateUser,
  authorizeRoles('admin', 'staff'),
  subscriptionController.renewSubscription
);

export default router;
