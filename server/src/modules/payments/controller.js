import * as paymentService from './service.js';
import { sendSuccess, sendError } from '../../utils/apiResponse.js';

export const listPayments = async (req, res) => {
  try {
    const { invoiceId, page, limit } = req.query;
    const result = await paymentService.listPayments({
      userRole: req.user.role,
      userId: req.user.id,
      invoiceId,
      page,
      limit,
    });

    return sendSuccess(res, 'Payments retrieved successfully', result.payments, 200, result.pagination);
  } catch (err) {
    console.error('Error fetching payments:', err);
    return sendError(res, err.message || 'Failed to fetch payments', 500);
  }
};

export const recordPaymentForInvoice = async (req, res) => {
  try {
    const invoiceId = req.params.id || req.body.invoiceId;
    const { method, amount, paymentDate, note } = req.body;

    const result = await paymentService.recordPayment({
      invoiceId,
      method,
      amount,
      paymentDate,
      note,
      receivedBy: req.user.id,
    });

    return sendSuccess(res, 'Payment recorded successfully', result, 201);
  } catch (err) {
    console.error('Error recording payment:', err);
    return sendError(res, err.message || 'Failed to record payment', 400);
  }
};
