import { supabaseAdmin } from '../../config/supabase.js';

export const validatePasswordStrength = (password) => {
  if (!password || typeof password !== 'string') return false;
  if (password.length < 9) return false;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  return hasUpper && hasLower && hasSpecial;
};

export const listUsers = async ({ role, search, page = 1, limit = 10 }) => {
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabaseAdmin
    .from('profiles')
    .select('*', { count: 'exact' });

  if (role) {
    query = query.eq('role', role);
  }

  if (search) {
    query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
  }

  query = query.order('created_at', { ascending: false }).range(from, to);

  const { data, count, error } = await query;
  if (error) throw error;

  return {
    users: data,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit),
    },
  };
};

export const createStaffUser = async ({ email, password, fullName, phone }) => {
  if (!validatePasswordStrength(password)) {
    throw new Error('Password must be at least 9 characters long and contain at least one uppercase letter, one lowercase letter, and one special character.');
  }

  // Create user using Supabase Admin Auth API
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
      phone,
    },
  });

  if (authError) throw authError;

  const userId = authData.user.id;

  // Ensure profile is updated/set with role 'staff'
  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .upsert({
      id: userId,
      full_name: fullName,
      email,
      phone,
      role: 'staff',
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (profileError) throw profileError;

  return profile;
};

export const listCustomers = async ({ search, page = 1, limit = 10 }) => {
  return listUsers({ role: 'customer', search, page, limit });
};
