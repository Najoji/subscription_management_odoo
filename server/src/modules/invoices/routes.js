import { Router } from 'express';
import { authenticateUser } from '../../middleware/auth.js';
import { authorizeRoles } from '../../middleware/authorize.js';
import * as invoiceController from './controller.js';
import { recordPaymentForInvoice } from '../payments/controller.js';

const router = Router();

router.use(authenticateUser);

// Invoices listing, details, and PDF download
router.get('/', invoiceController.listInvoices);
router.get('/:id/pdf', invoiceController.downloadInvoicePdf);
router.get('/:id', invoiceController.getInvoiceById);

// Staff and Admin operations
router.post('/:id/confirm', authorizeRoles('admin', 'staff'), invoiceController.confirmInvoice);
router.post('/:id/cancel', authorizeRoles('admin', 'staff'), invoiceController.cancelInvoice);

// Record payment against an invoice (POST /api/invoices/:id/payments)
router.post('/:id/payments', authorizeRoles('admin', 'staff'), recordPaymentForInvoice);

export default router;
