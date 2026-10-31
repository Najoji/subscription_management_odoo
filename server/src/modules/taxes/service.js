import { supabaseAdmin } from '../../config/supabase.js';

export const listTaxes = async ({ isActive }) => {
  let query = supabaseAdmin.from('taxes').select('*').order('rate', { ascending: true });

  if (isActive !== undefined) {
    query = query.eq('is_active', isActive === 'true' || isActive === true);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
};

export const createTax = async ({ name, rate, isActive = true }) => {
  const { data, error } = await supabaseAdmin
    .from('taxes')
    .insert([{ name, rate, is_active: isActive }])
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateTax = async (id, updateData) => {
  const { data, error } = await supabaseAdmin
    .from('taxes')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};
