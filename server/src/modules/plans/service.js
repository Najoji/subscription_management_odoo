import { supabaseAdmin } from '../../config/supabase.js';

const VALID_INTERVALS = ['daily', 'weekly', 'monthly', 'yearly'];

export const listPlans = async ({ search, isActive, billingInterval, page = 1, limit = 20 }) => {
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabaseAdmin.from('plans').select('*', { count: 'exact' });

  if (isActive !== undefined) {
    query = query.eq('is_active', isActive === 'true' || isActive === true);
  }

  if (billingInterval) {
    query = query.eq('billing_interval', billingInterval);
  }

  if (search) {
    query = query.ilike('name', `%${search}%`);
  }

  query = query.order('created_at', { ascending: false }).range(from, to);

  const { data, count, error } = await query;
  if (error) throw error;

  return {
    plans: data,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit),
    },
  };
};

export const getPlanById = async (id) => {
  const { data, error } = await supabaseAdmin.from('plans').select('*').eq('id', id).single();
  if (error) throw error;
  return data;
};

export const createPlan = async ({
  name,
  billingInterval,
  intervalCount = 1,
  minimumQuantity = 1,
  availableFrom,
  availableTo,
  autoClose = false,
  autoCloseDays,
  allowEarlyClose = true,
  allowPause = true,
  allowRenewal = true,
}) => {
  if (!name || !billingInterval) {
    throw new Error('Plan name and billingInterval are required.');
  }

  if (!VALID_INTERVALS.includes(billingInterval)) {
    throw new Error(`Invalid billingInterval. Must be one of: ${VALID_INTERVALS.join(', ')}`);
  }

  if (intervalCount < 1) {
    throw new Error('intervalCount must be at least 1.');
  }

  if (minimumQuantity < 1) {
    throw new Error('minimumQuantity must be at least 1.');
  }

  if (availableFrom && availableTo && new Date(availableFrom) > new Date(availableTo)) {
    throw new Error('availableFrom date cannot be after availableTo date.');
  }

  const { data, error } = await supabaseAdmin
    .from('plans')
    .insert([
      {
        name,
        billing_interval: billingInterval,
        interval_count: intervalCount,
        minimum_quantity: minimumQuantity,
        available_from: availableFrom || null,
        available_to: availableTo || null,
        auto_close: autoClose,
        auto_close_days: autoCloseDays || null,
        allow_early_close: allowEarlyClose,
        allow_pause: allowPause,
        allow_renewal: allowRenewal,
        is_active: true,
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updatePlan = async (id, updateFields) => {
  const allowed = [
    'name',
    'billing_interval',
    'interval_count',
    'minimum_quantity',
    'available_from',
    'available_to',
    'auto_close',
    'auto_close_days',
    'allow_early_close',
    'allow_pause',
    'allow_renewal',
    'is_active',
  ];

  const updateData = {};
  for (const key of allowed) {
    if (updateFields[key] !== undefined) {
      updateData[key] = updateFields[key];
    }
  }

  if (updateData.billing_interval && !VALID_INTERVALS.includes(updateData.billing_interval)) {
    throw new Error(`Invalid billing_interval. Must be one of: ${VALID_INTERVALS.join(', ')}`);
  }

  updateData.updated_at = new Date().toISOString();

  const { data, error } = await supabaseAdmin
    .from('plans')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};
