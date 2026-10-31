import { supabaseAdmin } from '../../config/supabase.js';
import Decimal from 'decimal.js';
import { getKolkataToday, addIntervalToDate } from '../../utils/dateUtils.js';

/**
 * Generate a unique subscription number: SUB-YYYYMMDD-XXXX
 */
export const generateSubscriptionNumber = async () => {
  const datePart = getKolkataToday().replace(/-/g, '');
  let isUnique = false;
  let subNumber = '';

  while (!isUnique) {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    subNumber = `SUB-${datePart}-${randomSuffix}`;

    const { data } = await supabaseAdmin
      .from('subscriptions')
      .select('id')
      .eq('subscription_number', subNumber)
      .maybeSingle();

    if (!data) {
      isUnique = true;
    }
  }

  return subNumber;
};

/**
 * List subscriptions with filters, search, and pagination.
 */
export const listSubscriptions = async ({
  user,
  search,
  status,
  customerId,
  planId,
  page = 1,
  limit = 10,
  startDate,
  expiryDate,
}) => {
  const numPage = Math.max(1, Number(page) || 1);
  const numLimit = Math.max(1, Number(limit) || 10);
  const from = (numPage - 1) * numLimit;
  const to = from + numLimit - 1;

  let query = supabaseAdmin
    .from('subscriptions')
    .select(`
      *,
      customer:customer_id (id, full_name, email, phone),
      plan:plan_id (*),
      subscription_items (
        id, product_id, variant_id, description, quantity, unit_price,
        product:product_id (id, name, sales_price),
        variant:variant_id (id, name, extra_price)
      )
    `, { count: 'exact' });

  // Customer role security: Customers can view only their own subscriptions
  if (user.role === 'customer') {
    query = query.eq('customer_id', user.id);
  } else if (customerId) {
    query = query.eq('customer_id', customerId);
  }

  if (status) {
    query = query.eq('status', status);
  }

  if (planId) {
    query = query.eq('plan_id', planId);
  }

  if (startDate) {
    query = query.gte('start_date', startDate);
  }

  if (expiryDate) {
    query = query.lte('expiry_date', expiryDate);
  }

  if (search) {
    query = query.ilike('subscription_number', `%${search}%`);
  }

  query = query.order('created_at', { ascending: false }).range(from, to);

  const { data, count, error } = await query;
  if (error) throw error;

  const enriched = (data || []).map(enrichSubscriptionWithTotals);

  return {
    subscriptions: enriched,
    pagination: {
      page: numPage,
      limit: numLimit,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / numLimit),
    },
  };
};

/**
 * Enrich a subscription object with recurring cycle totals and friendly aliases.
 */
export const enrichSubscriptionWithTotals = (sub) => {
  if (!sub) return sub;
  const items = sub.subscription_items || [];
  let subtotal = new Decimal(0);

  for (const it of items) {
    const unitPrice = new Decimal(it.unit_price || it.product?.sales_price || 0);
    const extraPrice = new Decimal(it.variant?.extra_price || 0);
    const qty = new Decimal(it.quantity || 1);
    subtotal = subtotal.plus(unitPrice.plus(extraPrice).times(qty));
  }

  // Standard GST 18%
  const taxTotal = subtotal.times(0.18).toDecimalPlaces(2);
  const total = subtotal.plus(taxTotal).toDecimalPlaces(2);

  return {
    ...sub,
    subtotal: subtotal.toNumber(),
    taxTotal: taxTotal.toNumber(),
    total: total.toNumber(),
    cycle_rate: total.toNumber(),
    subscriptionNumber: sub.subscription_number,
    startDate: sub.start_date,
    expiryDate: sub.expiry_date,
    nextBillingDate: sub.next_billing_date,
    customerName: sub.customer?.full_name || sub.customer?.email || 'Customer',
    planName: sub.plan?.name || 'Standard Monthly',
  };
};

/**
 * Get subscription by ID with related items, plan, customer, and invoices.
 */
export const getSubscriptionById = async (id, user) => {
  const { data, error } = await supabaseAdmin
    .from('subscriptions')
    .select(`
      *,
      customer:customer_id (id, full_name, email, phone),
      plan:plan_id (*),
      quotation:quotation_id (id, quote_number, status, total),
      subscription_items (
        id, product_id, variant_id, description, quantity, unit_price,
        product:product_id (id, name, sales_price, product_type),
        variant:variant_id (id, name, extra_price)
      ),
      invoices (
        id, invoice_number, period_start, period_end, issue_date, due_date, status, total, amount_paid
      )
    `)
    .eq('id', id)
    .single();

  if (error || !data) {
    const notFoundErr = new Error('Subscription not found');
    notFoundErr.statusCode = 404;
    throw notFoundErr;
  }

  // Customer security check
  if (user.role === 'customer' && data.customer_id !== user.id) {
    const forbiddenErr = new Error('Access denied: You can only view your own subscriptions');
    forbiddenErr.statusCode = 403;
    throw forbiddenErr;
  }

  return enrichSubscriptionWithTotals(data);
};

/**
 * Direct subscription creation by staff/admin.
 */
export const createSubscriptionDirectly = async ({
  customerId,
  planId,
  startDate,
  expiryDate,
  paymentTerms,
  items = [],
  status = 'Confirmed',
}, user) => {
  if (status !== 'Confirmed') {
    const err = new Error("Direct subscription creation only supports the 'Confirmed' initial status.");
    err.statusCode = 400;
    throw err;
  }

  // Validate customer existence
  const { data: customer, error: custError } = await supabaseAdmin
    .from('profiles')
    .select('id, full_name, email')
    .eq('id', customerId)
    .single();

  if (custError || !customer) {
    const err = new Error('Customer not found');
    err.statusCode = 400;
    throw err;
  }

  // Validate plan existence and rules
  const { data: plan, error: planError } = await supabaseAdmin
    .from('plans')
    .select('*')
    .eq('id', planId)
    .single();

  if (planError || !plan) {
    const err = new Error('Plan not found');
    err.statusCode = 404;
    throw err;
  }

  if (!plan.is_active) {
    const err = new Error('Selected plan is inactive.');
    err.statusCode = 400;
    throw err;
  }

  const todayStr = getKolkataToday();
  if (plan.available_from && todayStr < plan.available_from) {
    const err = new Error(`Plan is not available until ${plan.available_from}.`);
    err.statusCode = 400;
    throw err;
  }
  if (plan.available_to && todayStr > plan.available_to) {
    const err = new Error(`Plan availability expired on ${plan.available_to}.`);
    err.statusCode = 400;
    throw err;
  }

  // Process and calculate prices strictly on backend
  let totalQuantity = 0;
  const processedItems = [];

  for (const item of items) {
    const qty = Number(item.quantity) || 1;
    totalQuantity += qty;

    const { data: product, error: prodError } = await supabaseAdmin
      .from('products')
      .select('id, name, sales_price, is_active')
      .eq('id', item.productId)
      .single();

    if (prodError || !product) {
      const err = new Error(`Product not found with id ${item.productId}`);
      err.statusCode = 400;
      throw err;
    }

    if (!product.is_active) {
      const err = new Error(`Product '${product.name}' is inactive.`);
      err.statusCode = 400;
      throw err;
    }

    let unitPrice = new Decimal(product.sales_price);
    let variantName = '';

    if (item.variantId) {
      const { data: variant, error: varError } = await supabaseAdmin
        .from('product_variants')
        .select('id, name, extra_price, is_active')
        .eq('id', item.variantId)
        .eq('product_id', item.productId)
        .single();

      if (varError || !variant) {
        const err = new Error(`Variant not found or does not belong to product '${product.name}'`);
        err.statusCode = 400;
        throw err;
      }

      if (!variant.is_active) {
        const err = new Error(`Variant '${variant.name}' is inactive.`);
        err.statusCode = 400;
        throw err;
      }

      variantName = variant.name;
      unitPrice = unitPrice.plus(new Decimal(variant.extra_price));
    }

    processedItems.push({
      product_id: product.id,
      variant_id: item.variantId || null,
      description: item.description || (variantName ? `${product.name} (${variantName})` : product.name),
      quantity: qty,
      unit_price: unitPrice.toFixed(2),
    });
  }

  if (plan.minimum_quantity && totalQuantity < plan.minimum_quantity) {
    const err = new Error(`Plan requires minimum quantity of ${plan.minimum_quantity}. Provided: ${totalQuantity}`);
    err.statusCode = 400;
    throw err;
  }

  const effectiveStartDate = startDate || todayStr;
  const nextBillingDate = effectiveStartDate;
  const subNumber = await generateSubscriptionNumber();

  const { data: subscriptionId, error: subError } = await supabaseAdmin.rpc(
    'create_subscription_atomic',
    {
      p_subscription: {
        subscription_number: subNumber,
        customer_id: customerId,
        plan_id: planId,
        quotation_id: null,
        start_date: effectiveStartDate,
        expiry_date: expiryDate || null,
        next_billing_date: nextBillingDate,
        payment_terms: paymentTerms || 'Due Upon Receipt',
        status: status || 'Confirmed',
      },
      p_items: processedItems,
    }
  );

  if (subError) throw subError;

  const { data: subscription, error: fetchError } = await supabaseAdmin
    .from('subscriptions')
    .select(`
      *,
      customer:customer_id (id, full_name, email, phone),
      plan:plan_id (*),
      subscription_items (
        *,
        product:product_id (id, name, sales_price),
        variant:variant_id (id, name, extra_price)
      )
    `)
    .eq('id', subscriptionId)
    .single();

  if (fetchError || !subscription) throw fetchError || new Error('Created subscription could not be loaded.');

  return {
    ...subscription,
    subscription_items: subscription.subscription_items || [],
  };
};

/**
 * Update subscription status with state machine checks and plan rule enforcement.
 */
export const updateSubscriptionStatus = async (id, newStatus, user) => {
  const { data: subscription, error } = await supabaseAdmin
    .from('subscriptions')
    .select(`
      *,
      plan:plan_id (*)
    `)
    .eq('id', id)
    .single();

  if (error || !subscription) {
    const err = new Error('Subscription not found');
    err.statusCode = 404;
    throw err;
  }

  const plan = subscription.plan;
  const currentStatus = subscription.status;

  if (currentStatus === newStatus) {
    return subscription;
  }

  // Allowed transitions
  const validTransitions = {
    Draft: ['Quotation', 'Confirmed', 'Closed'],
    Quotation: ['Confirmed', 'Closed'],
    Confirmed: ['Active', 'Closed'],
    Active: ['Paused', 'Closed'],
    Paused: ['Active', 'Closed'],
    Closed: [], // Closed is terminal; use /renew
  };

  const allowed = validTransitions[currentStatus] || [];
  if (!allowed.includes(newStatus)) {
    const err = new Error(`Cannot transition subscription from '${currentStatus}' to '${newStatus}'. Allowed transitions: ${allowed.length > 0 ? allowed.join(', ') : 'None (Terminal state)'}.`);
    err.statusCode = 400;
    throw err;
  }

  const updateFields = {
    status: newStatus,
    updated_at: new Date().toISOString(),
  };

  // Plan business rule checks
  if (newStatus === 'Paused') {
    if (plan && plan.allow_pause === false) {
      const err = new Error(`Plan '${plan.name}' does not allow pausing subscriptions.`);
      err.statusCode = 400;
      throw err;
    }
  }

  if (newStatus === 'Closed') {
    const todayStr = getKolkataToday();
    const isEarlyClose = subscription.expiry_date ? todayStr < subscription.expiry_date : true;

    if (isEarlyClose && plan && plan.allow_early_close === false) {
      const err = new Error(`Plan '${plan.name}' does not allow early closure.`);
      err.statusCode = 400;
      throw err;
    }

    updateFields.closed_at = new Date().toISOString();
  }

  const { data: updated, error: updateError } = await supabaseAdmin
    .from('subscriptions')
    .update(updateFields)
    .eq('id', id)
    .select(`
      *,
      customer:customer_id (id, full_name, email, phone),
      plan:plan_id (*),
      subscription_items (*)
    `)
    .single();

  if (updateError) throw updateError;
  return updated;
};

/**
 * Dedicated action: Confirm subscription
 */
export const confirmSubscription = async (id, user) => {
  return updateSubscriptionStatus(id, 'Confirmed', user);
};

/**
 * Dedicated action: Activate subscription
 */
export const activateSubscription = async (id, user) => {
  return updateSubscriptionStatus(id, 'Active', user);
};

/**
 * Dedicated action: Pause subscription
 */
export const pauseSubscription = async (id, user) => {
  return updateSubscriptionStatus(id, 'Paused', user);
};

/**
 * Dedicated action: Resume subscription (from Paused to Active)
 */
export const resumeSubscription = async (id, user) => {
  return updateSubscriptionStatus(id, 'Active', user);
};

/**
 * Dedicated action: Close subscription
 */
export const closeSubscription = async (id, user) => {
  return updateSubscriptionStatus(id, 'Closed', user);
};

/**
 * Dedicated action: Renew subscription
 */
export const renewSubscription = async (id, { newExpiryDate }, user) => {
  const { data: subscription, error } = await supabaseAdmin
    .from('subscriptions')
    .select(`
      *,
      plan:plan_id (*)
    `)
    .eq('id', id)
    .single();

  if (error || !subscription) {
    const err = new Error('Subscription not found');
    err.statusCode = 404;
    throw err;
  }

  const plan = subscription.plan;
  if (plan && plan.allow_renewal === false) {
    const err = new Error(`Plan '${plan.name}' does not allow subscription renewals.`);
    err.statusCode = 400;
    throw err;
  }

  // Compute renewal expiry date
  let effectiveExpiryDate = newExpiryDate;
  if (!effectiveExpiryDate) {
    const todayStr = getKolkataToday();
    const baseDate = subscription.expiry_date && subscription.expiry_date > todayStr
      ? subscription.expiry_date
      : todayStr;

    effectiveExpiryDate = addIntervalToDate(
      baseDate,
      plan.billing_interval || 'monthly',
      plan.interval_count || 1
    );
  }

  const { data: updated, error: updateError } = await supabaseAdmin
    .from('subscriptions')
    .update({
      status: 'Active',
      expiry_date: effectiveExpiryDate,
      closed_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select(`
      *,
      customer:customer_id (id, full_name, email, phone),
      plan:plan_id (*),
      subscription_items (*)
    `)
    .single();

  if (updateError) throw updateError;
  return updated;
};
