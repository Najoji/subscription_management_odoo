import { supabaseAdmin } from '../../config/supabase.js';
import Decimal from 'decimal.js';
import { round2 } from '../billing/pricingService.js';

/**
 * List invoices with rich filtering and pagination
 */
export const listInvoices = async ({
  userRole,
  userId,
  search,
  customerId,
  subscriptionId,
  status,
  startDate,
  endDate,
  isOverdue,
  page = 1,
  limit = 10,
}) => {
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabaseAdmin
    .from('invoices')
    .select(`
      *,
      profiles:customer_id (id, full_name, email, phone),
      subscriptions:subscription_id (id, subscription_number, status)
    `, { count: 'exact' });

  // Security enforcement: customers can only view their own invoices
  if (userRole === 'customer') {
    query = query.eq('customer_id', userId);
  } else if (customerId) {
    query = query.eq('customer_id', customerId);
  }

  if (subscriptionId) {
    query = query.eq('subscription_id', subscriptionId);
  }

  if (status) {
    query = query.eq('status', status);
  }

  if (search) {
    query = query.ilike('invoice_number', `%${search.trim()}%`);
  }

  if (startDate) {
    query = query.gte('issue_date', startDate);
  }

  if (endDate) {
    query = query.lte('issue_date', endDate);
  }

  // Overdue filter: Confirmed AND due_date < today AND amount_paid < total
  if (isOverdue === 'true' || isOverdue === true) {
    const today = new Date().toISOString().split('T')[0];
    query = query
      .eq('status', 'Confirmed')
      .lt('due_date', today);
  }

  query = query.order('created_at', { ascending: false }).range(from, to);

  const { data, count, error } = await query;
  if (error) throw error;

  // Enhance each invoice with balance calculation
  const enrichedInvoices = (data || []).map((inv) => {
    const total = new Decimal(inv.total || 0);
    const paid = new Decimal(inv.amount_paid || 0);
    const balance = round2(Decimal.max(0, total.minus(paid)));

    return {
      ...inv,
      balance: balance.toFixed(2),
    };
  });

  return {
    invoices: enrichedInvoices,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit),
    },
  };
};

/**
 * Get detailed invoice by ID with line items and payment history
 */
export const getInvoiceById = async (id, requestingUser = null) => {
  const { data: invoice, error } = await supabaseAdmin
    .from('invoices')
    .select(`
      *,
      profiles:customer_id (id, full_name, email, phone),
      subscriptions:subscription_id (id, subscription_number, status, start_date),
      invoice_items (
        id,
        description,
        quantity,
        unit_price,
        line_subtotal,
        tax_rate,
        tax_amount,
        line_total,
        products:product_id (id, name),
        product_variants:variant_id (id, name)
      )
    `)
    .eq('id', id)
    .single();

  if (error || !invoice) {
    throw new Error(`Invoice with ID ${id} not found.`);
  }

  // Security check for customers
  if (requestingUser && requestingUser.role === 'customer') {
    if (invoice.customer_id !== requestingUser.id) {
      throw new Error('Access denied: You cannot view another customer’s invoice.');
    }
  }

  // Fetch related payments
  const { data: payments } = await supabaseAdmin
    .from('payments')
    .select(`
      id,
      method,
      amount,
      payment_date,
      note,
      created_at,
      received_by,
      profiles:received_by (id, full_name, email)
    `)
    .eq('invoice_id', id)
    .order('created_at', { ascending: false });

  const total = new Decimal(invoice.total || 0);
  const paid = new Decimal(invoice.amount_paid || 0);
  const balance = round2(Decimal.max(0, total.minus(paid)));

  return {
    ...invoice,
    balance: balance.toFixed(2),
    payments: payments || [],
  };
};

/**
 * Confirm a draft invoice
 */
export const confirmInvoice = async (id) => {
  const { data: invoice, error: fetchErr } = await supabaseAdmin
    .from('invoices')
    .select('id, status, invoice_number')
    .eq('id', id)
    .single();

  if (fetchErr || !invoice) {
    throw new Error(`Invoice with ID ${id} not found.`);
  }

  if (invoice.status !== 'Draft') {
    throw new Error(`Cannot confirm invoice with status '${invoice.status}'. Only Draft invoices can be confirmed.`);
  }

  const { data: updated, error: updateErr } = await supabaseAdmin
    .from('invoices')
    .update({ status: 'Confirmed' })
    .eq('id', id)
    .select()
    .single();

  if (updateErr) throw updateErr;
  return updated;
};

/**
 * Cancel an eligible invoice
 */
export const cancelInvoice = async (id) => {
  const { data: invoice, error: fetchErr } = await supabaseAdmin
    .from('invoices')
    .select('id, status, amount_paid, invoice_number')
    .eq('id', id)
    .single();

  if (fetchErr || !invoice) {
    throw new Error(`Invoice with ID ${id} not found.`);
  }

  if (invoice.status === 'Cancelled') {
    throw new Error('Invoice is already cancelled.');
  }

  if (invoice.status === 'Paid') {
    throw new Error('Cannot cancel a fully Paid invoice directly.');
  }

  const amountPaid = new Decimal(invoice.amount_paid || 0);
  if (amountPaid.greaterThan(0)) {
    throw new Error(`Cannot cancel invoice with recorded payments (₹${amountPaid.toFixed(2)} paid).`);
  }

  const { data: updated, error: updateErr } = await supabaseAdmin
    .from('invoices')
    .update({ status: 'Cancelled' })
    .eq('id', id)
    .select()
    .single();

  if (updateErr) throw updateErr;
  return updated;
};
