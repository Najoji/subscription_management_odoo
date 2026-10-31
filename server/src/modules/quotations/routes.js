import { Router } from 'express';
import { authenticateUser } from '../../middleware/auth.js';
import { authorizeRoles } from '../../middleware/authorize.js';
import * as quotationController from './controller.js';

const router = Router();

// ==============================================================================
// TEMPLATES (Must precede :id routes)
// ==============================================================================
router.get(
  '/templates',
  authenticateUser,
  authorizeRoles('admin', 'staff', 'customer'),
  quotationController.listTemplates
);

router.get(
  '/templates/:id',
  authenticateUser,
  authorizeRoles('admin', 'staff', 'customer'),
  quotationController.getTemplateById
);

router.post(
  '/templates',
  authenticateUser,
  authorizeRoles('admin', 'staff'),
  quotationController.createTemplate
);

router.delete(
  '/templates/:id',
  authenticateUser,
  authorizeRoles('admin', 'staff'),
  quotationController.deleteTemplate
);

// ==============================================================================
// QUOTATIONS CORE
// ==============================================================================
router.get(
  '/',
  authenticateUser,
  authorizeRoles('admin', 'staff', 'customer'),
  quotationController.listQuotations
);

router.get(
  '/:id',
  authenticateUser,
  authorizeRoles('admin', 'staff', 'customer'),
  quotationController.getQuotationById
);

router.post(
  '/',
  authenticateUser,
  authorizeRoles('admin', 'staff', 'customer'),
  quotationController.createQuotation
);

router.patch(
  '/:id/status',
  authenticateUser,
  authorizeRoles('admin', 'staff', 'customer'),
  quotationController.updateQuotationStatus
);

router.post(
  '/:id/convert',
  authenticateUser,
  authorizeRoles('admin', 'staff'),
  quotationController.convertQuotation
);

export default router;
