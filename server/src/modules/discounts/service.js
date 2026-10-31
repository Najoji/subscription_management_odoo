import { supabaseAdmin } from '../../config/supabase.js';
import Decimal from 'decimal.js';
import { round2 } from '../billing/pricingService.js';

/**
 * List discounts with optional filters
 */
export const listDiscounts = async ({ isActive, search, page = 1, limit = 20 } = {}) => {
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabaseAdmin
    .from('discounts')
    .select('*', { count: 'exact' });

  if (isActive !== undefined) {
    query = query.eq('is_active', isActive === 'true' || isActive === true);
  }

  if (search) {
    query = query.or(`name.ilike.%${search}%,code.ilike.%${search}%`);
  }

  query = query.order('created_at', { ascending: false }).range(from, to);

  const { data, count, error } = await query;
  if (error) throw error;

  return {
    discounts: data,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit),
    },
  };
};

/**
 * Get discount by ID or Code
 */
export const getDiscountById = async (id) => {
  const { data, error } = await supabaseAdmin
    .from('discounts')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
};

export const getDiscountByCode = async (code) => {
  const { data, error } = await supabaseAdmin
    .from('discounts')
    .select('*')
    .eq('code', code.trim().toUpperCase())
    .maybeSingle();

  if (error) throw error;
  return data;
};

/**
 * Create a new discount
 */
export const createDiscount = async ({
  name,
  code,
  discountType,
  value,
  minimumPurchase = 0,
  minimumQuantity = 1,
  startAt = null,
  endAt = null,
  usageLimit = null,
  applicableTo = 'subscription',
  isActive = true,
}) => {
  if (!name || !code || !discountType || value === undefined) {
    throw new Error('Name, code, discountType, and value are required.');
  }

  const cleanCode = code.trim().toUpperCase();
  const cleanType = discountType.toLowerCase();

  if (!['fixed', 'percentage'].includes(cleanType)) {
    throw new Error("discountType must be either 'fixed' or 'percentage'");
  }

  const dVal = new Decimal(value);
  if (dVal.isNegative()) {
    throw new Error('Discount value cannot be negative.');
  }

  if (cleanType === 'percentage' && dVal.greaterThan(100)) {
    throw new Error('Percentage discount cannot exceed 100%.');
  }

  if (!['subscription', 'product'].includes(applicableTo)) {
    throw new Error("applicableTo must be 'subscription' or 'product'");
  }

  const { data, error } = await supabaseAdmin
    .from('discounts')
    .insert([
      {
        name,
        code: cleanCode,
        discount_type: cleanType,
        value: dVal.toFixed(2),
        minimum_purchase: new Decimal(minimumPurchase || 0).toFixed(2),
        minimum_quantity: Math.max(1, parseInt(minimumQuantity || 1, 10)),
        start_at: startAt || null,
        end_at: endAt || null,
        usage_limit: usageLimit ? parseInt(usageLimit, 10) : null,
        usage_count: 0,
        applicable_to: applicableTo,
        is_active: isActive !== false,
      },
    ])
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new Error(`Discount code '${cleanCode}' already exists.`);
    }
    throw error;
  }

  return data;
};

/**
 * Update an existing discount
 */
export const updateDiscount = async (id, updateFields) => {
  const allowed = [
    'name',
    'code',
    'discount_type',
    'discountType',
    'value',
    'minimum_purchase',
    'minimumPurchase',
    'minimum_quantity',
    'minimumQuantity',
    'start_at',
    'startAt',
    'end_at',
    'endAt',
    'usage_limit',
    'usageLimit',
    'applicable_to',
    'applicableTo',
    'is_active',
    'isActive',
  ];

  const updateData = {};

  if (updateFields.name !== undefined) updateData.name = updateFields.name;
  if (updateFields.code !== undefined) updateData.code = updateFields.code.trim().toUpperCase();
  if (updateFields.discountType !== undefined || updateFields.discount_type !== undefined) {
    const dt = (updateFields.discountType || updateFields.discount_type).toLowerCase();
    if (!['fixed', 'percentage'].includes(dt)) {
      throw new Error("discountType must be 'fixed' or 'percentage'");
    }
    updateData.discount_type = dt;
  }
  if (updateFields.value !== undefined) {
    const dVal = new Decimal(updateFields.value);
    if (dVal.isNegative()) throw new Error('Discount value cannot be negative.');
    updateData.value = dVal.toFixed(2);
  }
  if (updateFields.minimumPurchase !== undefined || updateFields.minimum_purchase !== undefined) {
    updateData.minimum_purchase = new Decimal(updateFields.minimumPurchase || updateFields.minimum_purchase || 0).toFixed(2);
  }
  if (updateFields.minimumQuantity !== undefined || updateFields.minimum_quantity !== undefined) {
    updateData.minimum_quantity = Math.max(1, parseInt(updateFields.minimumQuantity || updateFields.minimum_quantity, 10));
  }
  if (updateFields.startAt !== undefined || updateFields.start_at !== undefined) {
    updateData.start_at = updateFields.startAt || updateFields.start_at || null;
  }
  if (updateFields.endAt !== undefined || updateFields.end_at !== undefined) {
    updateData.end_at = updateFields.endAt || updateFields.end_at || null;
  }
  if (updateFields.usageLimit !== undefined || updateFields.usage_limit !== undefined) {
    const ul = updateFields.usageLimit !== undefined ? updateFields.usageLimit : updateFields.usage_limit;
    updateData.usage_limit = ul ? parseInt(ul, 10) : null;
  }
  if (updateFields.applicableTo !== undefined || updateFields.applicable_to !== undefined) {
    const at = updateFields.applicableTo || updateFields.applicable_to;
    if (!['subscription', 'product'].includes(at)) {
      throw new Error("applicableTo must be 'subscription' or 'product'");
    }
    updateData.applicable_to = at;
  }
  if (updateFields.isActive !== undefined || updateFields.is_active !== undefined) {
    const ia = updateFields.isActive !== undefined ? updateFields.isActive : updateFields.is_active;
    updateData.is_active = Boolean(ia);
  }

  const { data, error } = await supabaseAdmin
    .from('discounts')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

/**
 * Validate discount eligibility against an operation (order / invoice / subscription)
 * 
 * @param {Object} params
 * @param {string} [params.discountId]
 * @param {string} [params.code]
 * @param {number|string} params.subtotal
 * @param {number} [params.quantity=1]
 * @param {string} [params.targetType='subscription'] - 'subscription' or 'product'
 * @param {string} [params.asOfDate] - ISO date string (YYYY-MM-DD)
 * @returns {Object} { isValid: boolean, discount: Object, calculatedAmount: string, reason?: string }
 */
export const validateDiscount = async ({
  discountId,
  code,
  subtotal = 0,
  quantity = 1,
  targetType = 'subscription',
  asOfDate = new Date().toISOString().split('T')[0],
}) => {
  let discount = null;

  if (discountId) {
    discount = await getDiscountById(discountId);
  } else if (code) {
    discount = await getDiscountByCode(code);
  } else {
    return { isValid: false, reason: 'Either discountId or code must be provided.' };
  }

  if (!discount) {
    return { isValid: false, reason: 'Discount not found.' };
  }

  // 1. Active check
  if (!discount.is_active) {
    return { isValid: false, discount, reason: 'Discount is currently inactive.' };
  }

  // 2. Validity date range check
  if (discount.start_at && asOfDate < discount.start_at) {
    return {
      isValid: false,
      discount,
      reason: `Discount is not yet valid. Starts on ${discount.start_at}.`,
    };
  }

  if (discount.end_at && asOfDate > discount.end_at) {
    return {
      isValid: false,
      discount,
      reason: `Discount expired on ${discount.end_at}.`,
    };
  }

  // 3. Usage limit check
  if (discount.usage_limit !== null && discount.usage_count >= discount.usage_limit) {
    return {
      isValid: false,
      discount,
      reason: `Discount usage limit of ${discount.usage_limit} has been reached.`,
    };
  }

  // 4. Target type applicability
  if (discount.applicable_to && discount.applicable_to !== targetType) {
    return {
      isValid: false,
      discount,
      reason: `Discount is only applicable to ${discount.applicable_to}.`,
    };
  }

  const dSubtotal = round2(subtotal || 0);

  // 5. Minimum purchase check
  const minPurchase = round2(discount.minimum_purchase || 0);
  if (minPurchase.greaterThan(0) && dSubtotal.lessThan(minPurchase)) {
    return {
      isValid: false,
      discount,
      reason: `Minimum purchase of ₹${minPurchase.toFixed(2)} required. Current subtotal is ₹${dSubtotal.toFixed(2)}.`,
    };
  }

  // 6. Minimum quantity check
  const minQty = discount.minimum_quantity || 1;
  if (quantity < minQty) {
    return {
      isValid: false,
      discount,
      reason: `Minimum item quantity of ${minQty} required. Provided quantity is ${quantity}.`,
    };
  }

  // 7. Calculate exact discount amount
  let calculatedAmount = new Decimal(0);
  if (discount.discount_type === 'percentage') {
    const rate = new Decimal(discount.value).dividedBy(100);
    calculatedAmount = round2(dSubtotal.times(rate));
  } else if (discount.discount_type === 'fixed') {
    calculatedAmount = round2(discount.value);
  }

  // Prevent discount from exceeding subtotal
  if (calculatedAmount.greaterThan(dSubtotal)) {
    calculatedAmount = dSubtotal;
  }

  return {
    isValid: true,
    discount,
    calculatedAmount: calculatedAmount.toFixed(2),
  };
};

/**
 * Increment discount usage count atomically
 */
export const incrementDiscountUsage = async (discountId) => {
  if (!discountId) return;

  const { data: current, error: fetchErr } = await supabaseAdmin
    .from('discounts')
    .select('usage_count')
    .eq('id', discountId)
    .single();

  if (fetchErr || !current) return;

  await supabaseAdmin
    .from('discounts')
    .update({ usage_count: (current.usage_count || 0) + 1 })
    .eq('id', discountId);
};
