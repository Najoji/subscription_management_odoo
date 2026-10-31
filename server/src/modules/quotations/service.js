import { supabaseAdmin } from '../../config/supabase.js';
import Decimal from 'decimal.js';
import { getKolkataToday, addIntervalToDate } from '../../utils/dateUtils.js';

/**
 * Generate a unique quotation number: QT-YYYYMMDD-XXXX
 */
export const generateQuotationNumber = async () => {
  const datePart = getKolkataToday().replace(/-/g, '');
  let isUnique = false;
  let quoteNumber = '';

  while (!isUnique) {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    quoteNumber = `QT-${datePart}-${randomSuffix}`;

    const { data } = await supabaseAdmin
      .from('quotations')
      .select('id')
      .eq('quote_number', quoteNumber)
      .maybeSingle();

    if (!data) {
      isUnique = true;
    }
  }

  return quoteNumber;
};

/**
 * List quotations with filters, search, and pagination.
 */
export const listQuotations = async ({
  user,
  search,
  status,
  customerId,
  page = 1,
  limit = 10,
  startDate,
  endDate,
}) => {
  const numPage = Math.max(1, Number(page) || 1);
  const numLimit = Math.max(1, Number(limit) || 10);
  const from = (numPage - 1) * numLimit;
  const to = from + numLimit - 1;

  let query = supabaseAdmin
    .from('quotations')
    .select(`
      *,
      customer:customer_id (id, full_name, email, phone),
      creator:created_by (id, full_name, email),
      plan:plan_id (id, name, billing_interval, interval_count),
      quotation_items (
        id, product_id, variant_id, description, quantity, unit_price, line_total,
        product:product_id (id, name, sales_price),
        variant:variant_id (id, name, extra_price)
      )
    `, { count: 'exact' });

  // Access control: customers can only view their own quotations
  if (user.role === 'customer') {
    query = query.eq('customer_id', user.id);
  } else if (customerId) {
    query = query.eq('customer_id', customerId);
  }

  if (status) {
    query = query.eq('status', status);
  }

  if (startDate) {
    query = query.gte('valid_until', startDate);
  }

  if (endDate) {
    query = query.lte('valid_until', endDate);
  }

  if (search) {
    query = query.or(`quote_number.ilike.%${search}%,notes.ilike.%${search}%`);
  }

  query = query.order('created_at', { ascending: false }).range(from, to);

  const { data, count, error } = await query;
  if (error) throw error;

  return {
    quotations: data || [],
    pagination: {
      page: numPage,
      limit: numLimit,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / numLimit),
    },
  };
};

/**
 * Get quotation by ID with permissions check.
 */
export const getQuotationById = async (id, user) => {
  const { data, error } = await supabaseAdmin
    .from('quotations')
    .select(`
      *,
      customer:customer_id (id, full_name, email, phone),
      creator:created_by (id, full_name, email),
      plan:plan_id (*),
      template:template_id (id, name),
      quotation_items (
        id, product_id, variant_id, description, quantity, unit_price, line_total,
        product:product_id (id, name, product_type, sales_price, tax_id, taxes:tax_id(id, name, rate)),
        variant:variant_id (id, name, extra_price)
      )
    `)
    .eq('id', id)
    .single();

  if (error || !data) {
    const notFoundErr = new Error('Quotation not found');
    notFoundErr.statusCode = 404;
    throw notFoundErr;
  }

  // Customers can only view their own quotations
  if (user.role === 'customer' && data.customer_id !== user.id) {
    const forbiddenErr = new Error('Access denied: You can only view your own quotations');
    forbiddenErr.statusCode = 403;
    throw forbiddenErr;
  }

  return data;
};

/**
 * Create a new quotation.
 * Computes product/variant pricing and tax strictly on backend.
 */
export const createQuotation = async ({
  customerId,
  planId,
  templateId,
  validUntil,
  notes,
  discountId,
  items = [],
}, user) => {
  // Determine customer ID based on user role
  const targetCustomerId = user.role === 'customer' ? user.id : customerId;

  // Validate customer existence
  const { data: customer, error: custError } = await supabaseAdmin
    .from('profiles')
    .select('id, full_name, email')
    .eq('id', targetCustomerId)
    .single();

  if (custError || !customer) {
    const err = new Error('Target customer does not exist in profiles.');
    err.statusCode = 400;
    throw err;
  }

  // Handle template expansion if provided and items are empty
  let effectiveItems = items;
  let effectivePlanId = planId || null;

  if (templateId && (!effectiveItems || effectiveItems.length === 0)) {
    const { data: template, error: tmplError } = await supabaseAdmin
      .from('quotation_templates')
      .select('*, quotation_template_items (*)')
      .eq('id', templateId)
      .single();

    if (tmplError || !template) {
      const err = new Error(`Quotation template not found with id ${templateId}`);
      err.statusCode = 404;
      throw err;
    }

    if (!effectivePlanId && template.plan_id) {
      effectivePlanId = template.plan_id;
    }

    effectiveItems = (template.quotation_template_items || []).map((ti) => ({
      productId: ti.product_id,
      variantId: ti.variant_id,
      quantity: ti.quantity,
    }));
  }

  if (!effectiveItems || effectiveItems.length === 0) {
    const err = new Error('Quotation must contain at least one item.');
    err.statusCode = 400;
    throw err;
  }

  // Validate plan if specified
  let planData = null;
  if (effectivePlanId) {
    const { data: plan, error: planError } = await supabaseAdmin
      .from('plans')
      .select('*')
      .eq('id', effectivePlanId)
      .single();

    if (planError || !plan) {
      const err = new Error(`Plan not found with id ${effectivePlanId}`);
      err.statusCode = 404;
      throw err;
    }

    if (!plan.is_active) {
      const err = new Error('Selected subscription plan is not active.');
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

    planData = plan;
  }

  // Calculate pricing for each item strictly on backend
  let subtotal = new Decimal(0);
  let totalQuantity = 0;
  const processedItems = [];

  for (const item of effectiveItems) {
    const qty = Number(item.quantity) || 1;
    totalQuantity += qty;

    // Fetch product with taxes
    const { data: product, error: prodError } = await supabaseAdmin
      .from('products')
      .select('id, name, sales_price, is_active, tax_id, taxes:tax_id(id, name, rate)')
      .eq('id', item.productId)
      .single();

    if (prodError || !product) {
      const err = new Error(`Product not found with id ${item.productId}`);
      err.statusCode = 400;
      throw err;
    }

    if (!product.is_active) {
      const err = new Error(`Product '${product.name}' is inactive and cannot be quoted.`);
      err.statusCode = 400;
      throw err;
    }

    let unitPrice = new Decimal(product.sales_price);
    let variantName = '';

    // Fetch variant if specified
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

    const lineTotal = unitPrice.times(qty);
    subtotal = subtotal.plus(lineTotal);

    const taxRate = product.taxes?.rate ? new Decimal(product.taxes.rate) : new Decimal(0);

    processedItems.push({
      product_id: product.id,
      variant_id: item.variantId || null,
      description: item.description || (variantName ? `${product.name} (${variantName})` : product.name),
      quantity: qty,
      unit_price: unitPrice.toFixed(2),
      line_total: lineTotal.toFixed(2),
      tax_rate: taxRate,
    });
  }

  // Check plan minimum quantity
  if (planData && planData.minimum_quantity && totalQuantity < planData.minimum_quantity) {
    const err = new Error(`Plan '${planData.name}' requires a minimum quantity of ${planData.minimum_quantity}. Current quantity: ${totalQuantity}`);
    err.statusCode = 400;
    throw err;
  }

  // Validate and calculate discount if provided
  let discountTotal = new Decimal(0);
  let appliedDiscountId = null;

  if (discountId) {
    const { data: discount, error: discError } = await supabaseAdmin
      .from('discounts')
      .select('*')
      .eq('id', discountId)
      .single();

    if (discError || !discount) {
      const err = new Error('Discount not found.');
      err.statusCode = 400;
      throw err;
    }

    if (!discount.is_active) {
      const err = new Error(`Discount '${discount.code}' is inactive.`);
      err.statusCode = 400;
      throw err;
    }

    const todayStr = getKolkataToday();
    if (discount.start_at && todayStr < discount.start_at) {
      const err = new Error(`Discount '${discount.code}' is not valid until ${discount.start_at}.`);
      err.statusCode = 400;
      throw err;
    }
    if (discount.end_at && todayStr > discount.end_at) {
      const err = new Error(`Discount '${discount.code}' expired on ${discount.end_at}.`);
      err.statusCode = 400;
      throw err;
    }

    if (discount.usage_limit && discount.usage_count >= discount.usage_limit) {
      const err = new Error(`Discount '${discount.code}' has reached its usage limit.`);
      err.statusCode = 400;
      throw err;
    }

    if (discount.minimum_purchase && subtotal.lessThan(discount.minimum_purchase)) {
      const err = new Error(`Discount requires a minimum purchase of ₹${discount.minimum_purchase}.`);
      err.statusCode = 400;
      throw err;
    }

    if (discount.minimum_quantity && totalQuantity < discount.minimum_quantity) {
      const err = new Error(`Discount requires a minimum quantity of ${discount.minimum_quantity}.`);
      err.statusCode = 400;
      throw err;
    }

    if (discount.discount_type === 'percentage') {
      discountTotal = subtotal.times(new Decimal(discount.value)).dividedBy(100);
    } else {
      discountTotal = new Decimal(discount.value);
    }

    // Cap discount at subtotal
    if (discountTotal.greaterThan(subtotal)) {
      discountTotal = subtotal;
    }

    appliedDiscountId = discount.id;
  }

  // Calculate tax per item after proportional discount
  let taxTotal = new Decimal(0);
  for (const pItem of processedItems) {
    const lineSubtotal = new Decimal(pItem.line_total);
    let lineDiscount = new Decimal(0);

    if (discountTotal.greaterThan(0) && subtotal.greaterThan(0)) {
      lineDiscount = discountTotal.times(lineSubtotal).dividedBy(subtotal);
    }

    const taxableBase = lineSubtotal.minus(lineDiscount);
    const lineTax = taxableBase.times(pItem.tax_rate).dividedBy(100);
    taxTotal = taxTotal.plus(lineTax);
  }

  const grandTotal = subtotal.minus(discountTotal).plus(taxTotal);
  const quoteNumber = await generateQuotationNumber();

  // Insert quotation
  const { data: quotation, error: insertError } = await supabaseAdmin
    .from('quotations')
    .insert([
      {
        quote_number: quoteNumber,
        customer_id: targetCustomerId,
        template_id: templateId || null,
        plan_id: effectivePlanId,
        created_by: user.id,
        valid_until: validUntil,
        status: 'Draft',
        subtotal: subtotal.toFixed(2),
        discount_total: discountTotal.toFixed(2),
        tax_total: taxTotal.toFixed(2),
        total: grandTotal.toFixed(2),
        notes: notes || null,
      },
    ])
    .select(`
      *,
      customer:customer_id (id, full_name, email, phone),
      plan:plan_id (id, name, billing_interval)
    `)
    .single();

  if (insertError) throw insertError;

  // Insert quotation items
  const itemsPayload = processedItems.map((pItem) => ({
    quotation_id: quotation.id,
    product_id: pItem.product_id,
    variant_id: pItem.variant_id,
    description: pItem.description,
    quantity: pItem.quantity,
    unit_price: pItem.unit_price,
    line_total: pItem.line_total,
  }));

  const { data: insertedItems, error: itemsError } = await supabaseAdmin
    .from('quotation_items')
    .insert(itemsPayload)
    .select(`
      *,
      product:product_id (id, name, sales_price),
      variant:variant_id (id, name, extra_price)
    `);

  if (itemsError) throw itemsError;

  return {
    ...quotation,
    quotation_items: insertedItems || [],
  };
};

/**
 * Update quotation status adhering to state machine transitions.
 */
export const updateQuotationStatus = async (id, newStatus, user) => {
  const { data: quotation, error } = await supabaseAdmin
    .from('quotations')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !quotation) {
    const err = new Error('Quotation not found');
    err.statusCode = 404;
    throw err;
  }

  if (quotation.status === 'Converted') {
    const err = new Error('Quotation has already been converted to a subscription and its status cannot be changed.');
    err.statusCode = 409;
    throw err;
  }

  // Customer access rules: can only accept or reject their own sent quotation
  if (user.role === 'customer') {
    if (quotation.customer_id !== user.id) {
      const err = new Error('Access denied: You can only update your own quotations.');
      err.statusCode = 403;
      throw err;
    }

    if (quotation.status !== 'Sent') {
      const err = new Error(`Customer cannot update status when quotation is in '${quotation.status}' state. Only 'Sent' quotations can be accepted or rejected.`);
      err.statusCode = 400;
      throw err;
    }

    if (!['Accepted', 'Rejected'].includes(newStatus)) {
      const err = new Error('Customer can only set status to Accepted or Rejected.');
      err.statusCode = 400;
      throw err;
    }
  } else {
    // Staff/Admin transitions
    const validTransitions = {
      Draft: ['Sent', 'Rejected'],
      Sent: ['Accepted', 'Rejected', 'Expired', 'Draft'],
      Accepted: ['Rejected', 'Expired', 'Sent'],
      Rejected: ['Draft', 'Sent'],
      Expired: ['Draft', 'Sent'],
    };

    const allowed = validTransitions[quotation.status] || [];
    if (!allowed.includes(newStatus)) {
      const err = new Error(`Cannot transition quotation from '${quotation.status}' to '${newStatus}'. Allowed: ${allowed.join(', ')}.`);
      err.statusCode = 400;
      throw err;
    }
  }

  const { data: updated, error: updateError } = await supabaseAdmin
    .from('quotations')
    .update({
      status: newStatus,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select(`
      *,
      customer:customer_id (id, full_name, email, phone),
      plan:plan_id (id, name, billing_interval),
      quotation_items (*)
    `)
    .single();

  if (updateError) throw updateError;
  return updated;
};

/**
 * Convert an accepted quotation into an active/confirmed subscription.
 * Copies customer, items, agreed snapshot unit prices, and associates the plan.
 */
export const convertQuotationToSubscription = async (id, {
  planId,
  startDate,
  expiryDate,
  paymentTerms,
}, user) => {
  // Fetch quotation with items and plan
  const { data: quotation, error } = await supabaseAdmin
    .from('quotations')
    .select(`
      *,
      quotation_items (*)
    `)
    .eq('id', id)
    .single();

  if (error || !quotation) {
    const err = new Error('Quotation not found');
    err.statusCode = 404;
    throw err;
  }

  if (quotation.status === 'Converted' || quotation.converted_subscription_id) {
    const err = new Error('Quotation has already been converted to a subscription.');
    err.statusCode = 409;
    throw err;
  }

  if (!['Accepted', 'Sent'].includes(quotation.status)) {
    const err = new Error(`Only Accepted quotations can be converted to a subscription. Current status is '${quotation.status}'.`);
    err.statusCode = 400;
    throw err;
  }

  const effectivePlanId = planId || quotation.plan_id;
  if (!effectivePlanId) {
    const err = new Error('A subscription plan is required to convert the quotation into a subscription.');
    err.statusCode = 400;
    throw err;
  }

  // Validate plan
  const { data: plan, error: planError } = await supabaseAdmin
    .from('plans')
    .select('*')
    .eq('id', effectivePlanId)
    .single();

  if (planError || !plan) {
    const err = new Error(`Plan not found with id ${effectivePlanId}`);
    err.statusCode = 404;
    throw err;
  }

  if (!plan.is_active) {
    const err = new Error('Selected plan is inactive.');
    err.statusCode = 400;
    throw err;
  }

  // Validate items presence
  if (!quotation.quotation_items || quotation.quotation_items.length === 0) {
    const err = new Error('Quotation has no line items to convert.');
    err.statusCode = 400;
    throw err;
  }

  // Check minimum quantity
  const totalQuantity = quotation.quotation_items.reduce((sum, item) => sum + item.quantity, 0);
  if (plan.minimum_quantity && totalQuantity < plan.minimum_quantity) {
    const err = new Error(`Plan '${plan.name}' requires minimum quantity of ${plan.minimum_quantity}. Quotation total is ${totalQuantity}.`);
    err.statusCode = 400;
    throw err;
  }

  const effectiveStartDate = startDate || getKolkataToday();
  const nextBillingDate = effectiveStartDate; // First billing due on start date

  // Generate unique subscription number: SUB-YYYYMMDD-XXXX
  const datePart = getKolkataToday().replace(/-/g, '');
  let isUnique = false;
  let subNumber = '';

  while (!isUnique) {
    const rand = Math.floor(1000 + Math.random() * 9000);
    subNumber = `SUB-${datePart}-${rand}`;

    const { data: existing } = await supabaseAdmin
      .from('subscriptions')
      .select('id')
      .eq('subscription_number', subNumber)
      .maybeSingle();

    if (!existing) isUnique = true;
  }

  // 1. Insert subscription
  const { data: subscription, error: subError } = await supabaseAdmin
    .from('subscriptions')
    .insert([
      {
        subscription_number: subNumber,
        customer_id: quotation.customer_id,
        plan_id: effectivePlanId,
        quotation_id: quotation.id,
        start_date: effectiveStartDate,
        expiry_date: expiryDate || null,
        next_billing_date: nextBillingDate,
        payment_terms: paymentTerms || 'Due Upon Receipt',
        status: 'Confirmed',
      },
    ])
    .select(`
      *,
      customer:customer_id (id, full_name, email, phone),
      plan:plan_id (*)
    `)
    .single();

  if (subError) throw subError;

  // 2. Insert subscription items preserving agreed snapshot unit_price
  const subItemsPayload = quotation.quotation_items.map((qi) => ({
    subscription_id: subscription.id,
    product_id: qi.product_id,
    variant_id: qi.variant_id,
    description: qi.description,
    quantity: qi.quantity,
    unit_price: qi.unit_price,
  }));

  const { data: insertedSubItems, error: subItemsError } = await supabaseAdmin
    .from('subscription_items')
    .insert(subItemsPayload)
    .select(`
      *,
      product:product_id (id, name, sales_price),
      variant:variant_id (id, name, extra_price)
    `);

  if (subItemsError) throw subItemsError;

  // 3. Mark quotation as Converted with link to new subscription
  const { error: quoteUpdateError } = await supabaseAdmin
    .from('quotations')
    .update({
      status: 'Converted',
      converted_subscription_id: subscription.id,
      updated_at: new Date().toISOString(),
    })
    .eq('id', quotation.id);

  if (quoteUpdateError) {
    console.error('Failed to link subscription back to quotation:', quoteUpdateError);
  }

  return {
    ...subscription,
    subscription_items: insertedSubItems || [],
  };
};

/**
 * List quotation templates with their items and associated plan.
 */
export const listTemplates = async () => {
  const { data, error } = await supabaseAdmin
    .from('quotation_templates')
    .select(`
      *,
      plan:plan_id (id, name, billing_interval),
      creator:created_by (id, full_name, email),
      quotation_template_items (
        id, product_id, variant_id, quantity,
        product:product_id (id, name, sales_price),
        variant:variant_id (id, name, extra_price)
      )
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

/**
 * Get quotation template by ID.
 */
export const getTemplateById = async (id) => {
  const { data, error } = await supabaseAdmin
    .from('quotation_templates')
    .select(`
      *,
      plan:plan_id (*),
      creator:created_by (id, full_name, email),
      quotation_template_items (
        id, product_id, variant_id, quantity,
        product:product_id (id, name, sales_price),
        variant:variant_id (id, name, extra_price)
      )
    `)
    .eq('id', id)
    .single();

  if (error || !data) {
    const err = new Error('Quotation template not found');
    err.statusCode = 404;
    throw err;
  }

  return data;
};

/**
 * Create a new quotation template.
 */
export const createTemplate = async ({ name, planId, items = [] }, user) => {
  const { data: template, error: tmplError } = await supabaseAdmin
    .from('quotation_templates')
    .insert([
      {
        name: name.trim(),
        plan_id: planId || null,
        created_by: user.id,
      },
    ])
    .select()
    .single();

  if (tmplError) throw tmplError;

  const itemPayloads = items.map((item) => ({
    template_id: template.id,
    product_id: item.productId,
    variant_id: item.variantId || null,
    quantity: Number(item.quantity) || 1,
  }));

  const { data: templateItems, error: itemsError } = await supabaseAdmin
    .from('quotation_template_items')
    .insert(itemPayloads)
    .select(`
      *,
      product:product_id (id, name, sales_price),
      variant:variant_id (id, name, extra_price)
    `);

  if (itemsError) throw itemsError;

  return {
    ...template,
    quotation_template_items: templateItems || [],
  };
};

/**
 * Delete a quotation template.
 */
export const deleteTemplate = async (id) => {
  const { error } = await supabaseAdmin
    .from('quotation_templates')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return true;
};
