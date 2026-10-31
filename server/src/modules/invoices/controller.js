import * as invoiceService from './service.js';
import { generateInvoicePdf } from './pdfService.js';
import { sendSuccess, sendError } from '../../utils/apiResponse.js';

export const listInvoices = async (req, res) => {
  try {
    const {
      search,
      customerId,
      subscriptionId,
      status,
      startDate,
      endDate,
      isOverdue,
      page,
      limit,
    } = req.query;

    const result = await invoiceService.listInvoices({
      userRole: req.user.role,
      userId: req.user.id,
      search,
      customerId,
      subscriptionId,
      status,
      startDate,
      endDate,
      isOverdue,
      page,
      limit,
    });

    return sendSuccess(res, 'Invoices retrieved successfully', result.invoices, 200, result.pagination);
  } catch (err) {
    console.error('Error listing invoices:', err);
    return sendError(res, err.message || 'Failed to list invoices', 500);
  }
};

export const getInvoiceById = async (req, res) => {
  try {
    const { id } = req.params;
    const invoice = await invoiceService.getInvoiceById(id, req.user);
    return sendSuccess(res, 'Invoice details retrieved successfully', invoice);
  } catch (err) {
    console.error('Error fetching invoice:', err);
    const statusCode = err.message.includes('Access denied') ? 403 : 404;
    return sendError(res, err.message || 'Failed to fetch invoice details', statusCode);
  }
};

export const downloadInvoicePdf = async (req, res) => {
  try {
    const { id } = req.params;
    const invoice = await invoiceService.getInvoiceById(id, req.user);

    const safeNumber = (invoice.invoice_number || 'INV-DRAFT').replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `Invoice-${safeNumber}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    generateInvoicePdf(invoice, res);
  } catch (err) {
    console.error('Error downloading invoice PDF:', err);
    const statusCode = err.message.includes('Access denied') ? 403 : 404;
    return sendError(res, err.message || 'Failed to generate invoice PDF', statusCode);
  }
};

export const confirmInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    const confirmedInvoice = await invoiceService.confirmInvoice(id);
    return sendSuccess(res, 'Invoice confirmed successfully', confirmedInvoice);
  } catch (err) {
    console.error('Error confirming invoice:', err);
    return sendError(res, err.message || 'Failed to confirm invoice', 400);
  }
};

export const cancelInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    const cancelledInvoice = await invoiceService.cancelInvoice(id);
    return sendSuccess(res, 'Invoice cancelled successfully', cancelledInvoice);
  } catch (err) {
    console.error('Error cancelling invoice:', err);
    return sendError(res, err.message || 'Failed to cancel invoice', 400);
  }
};
