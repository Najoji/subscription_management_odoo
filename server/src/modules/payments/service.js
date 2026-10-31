import { supabaseAdmin } from '../../config/supabase.js';
import Decimal from 'decimal.js';
import { round2 } from '../billing/pricingService.js';

const VALID_METHODS = ['Cash', 'UPI', 'Card', 'Bank Transfer', 'Other'];

/**
 * List payments with filters and pagination
 */
export const listPayments = async ({
  userRole,
  userId,
  invoiceId,
  page = 1,
  limit = 20,
} = {}) => {
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabaseAdmin
    .from('payments')
    .select(`
      *,
      invoices:invoice_id (
        id, invoice_number, total, amount_paid, status, customer_id
      ),
      profiles:received_by (id, full_name, email)
    `, { count: 'exact' });

  if (invoiceId) {
    query = query.eq('invoice_id', invoiceId);
  }

  // Customers can only see payments for their own invoices
  if (userRole === 'customer') {
    // Sub-select invoices for this customer
    const { data: customerInvoices } = await supabaseAdmin
      .from('invoices')
      .select('id')
      .eq('customer_id', userId);

    const ids = (customerInvoices || []).map((i) => i.id);
    if (ids.length === 0) {
      return {
        payments: [],
        pagination: { page: Number(page), limit: Number(limit), total: 0, totalPages: 0 },
      };
    }
    query = query.in('invoice_id', ids);
  }

  query = query.order('created_at', { ascending: false }).range(from, to);

  const { data, count, error } = await query;
  if (error) throw error;

  return {
    payments: data || [],
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit),
    },
  };
};

/**
 * Record a payment against an invoice
 * 
 * @param {Object} params
 * @param {string} params.invoiceId
 * @param {string} params.method - 'Cash' | 'UPI' | 'Card' | 'Bank Transfer' | 'Other'
 * @param {number|string} params.amount
 * @param {string} [params.paymentDate] - 'YYYY-MM-DD'
 * @param {string} [params.note]
 * @param {string} params.receivedBy - Profile UUID
 * @returns {Promise<Object>} { payment, invoice, remainingBalance }
 */
export const recordPayment = async ({
  invoiceId,
  method,
  amount,
  paymentDate = new Date().toISOString().split('T')[0],
  note = null,
  receivedBy,
}) => {
  if (!invoiceId) {
    throw new Error('Invoice ID is required.');
  }

  if (!method) {
    throw new Error('Payment method is required.');
  }

  // Normalize method casing
  const matchedMethod = VALID_METHODS.find(
    (m) => m.toLowerCase() === method.trim().toLowerCase()
  );
  if (!matchedMethod) {
    throw new Error(`Invalid payment method '${method}'. Allowed methods: ${VALID_METHODS.join(', ')}`);
  }

  const dAmount = round2(amount);
  if (dAmount.lessThanOrEqualTo(0)) {
    throw new Error('Payment amount must be greater than zero.');
  }

  // 1. Fetch current invoice state
  const { data: invoice, error: invError } = await supabaseAdmin
    .from('invoices')
    .select('*')
    .eq('id', invoiceId)
    .single();

  if (invError || !invoice) {
    throw new Error(`Invoice with ID ${invoiceId} not found.`);
  }

  // 2. Validate invoice status
  if (invoice.status === 'Cancelled') {
    throw new Error('Cannot record payments against a Cancelled invoice.');
  }

  if (invoice.status === 'Paid') {
    throw new Error('Invoice is already fully Paid.');
  }

  const currentPaid = round2(invoice.amount_paid || 0);
  const totalAmount = round2(invoice.total || 0);
  const remainingBalance = round2(Decimal.max(0, totalAmount.minus(currentPaid)));

  if (remainingBalance.lessThanOrEqualTo(0)) {
    throw new Error('Invoice has no outstanding balance.');
  }

  if (dAmount.greaterThan(remainingBalance)) {
    throw new Error(
      `Payment amount ₹${dAmount.toFixed(2)} exceeds remaining invoice balance of ₹${remainingBalance.toFixed(2)}.`
    );
  }

  // 3. Insert payment record
  const { data: payment, error: payError } = await supabaseAdmin
    .from('payments')
    .insert([
      {
        invoice_id: invoiceId,
        method: matchedMethod,
        amount: dAmount.toFixed(2),
        payment_date: paymentDate,
        note: note || null,
        received_by: receivedBy || null,
      },
    ])
    .select()
    .single();

  if (payError) throw payError;

  // 4. Update invoice amount_paid and status
  const newAmountPaid = round2(currentPaid.plus(dAmount));
  const newBalance = round2(Decimal.max(0, totalAmount.minus(newAmountPaid)));
  
  // Rule: Mark invoice Paid only when full amount is collected, otherwise remain Confirmed
  const newStatus = newBalance.isZero() ? 'Paid' : 'Confirmed';

  const { data: updatedInvoice, error: updateError } = await supabaseAdmin
    .from('invoices')
    .update({
      amount_paid: newAmountPaid.toFixed(2),
      status: newStatus,
    })
    .eq('id', invoiceId)
    .select(`
      *,
      profiles:customer_id (id, full_name, email)
    `)
    .single();

  if (updateError) {
    console.error('Failed to update invoice status after payment:', updateError);
    throw updateError;
  }

  return {
    payment,
    invoice: {
      ...updatedInvoice,
      balance: newBalance.toFixed(2),
    },
    remainingBalance: newBalance.toFixed(2),
    isFullyPaid: newStatus === 'Paid',
  };
};
