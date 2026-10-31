import { supabaseAnon, supabaseAdmin } from '../config/supabase.js';
import { sendError } from '../utils/apiResponse.js';

/**
 * Authentication Middleware:
 * Verifies JWT token supplied in Authorization header via Supabase Auth,
 * retrieves profile from public.profiles, and attaches user info to req.user.
 */
export const authenticateUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendError(res, 'Authentication token missing or invalid', 401);
    }

    const token = authHeader.split(' ')[1];

    // Verify token with Supabase Auth
    const { data: { user }, error: authError } = await supabaseAnon.auth.getUser(token);

    if (authError || !user) {
      return sendError(res, 'Invalid or expired authentication token', 401);
    }

    // Fetch user profile from profiles table using admin client
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return sendError(res, 'User profile not found', 401);
    }

    // Attach user information to request object
    req.user = {
      id: user.id,
      email: user.email,
      role: profile.role,
      fullName: profile.full_name,
      phone: profile.phone,
      profile,
    };

    next();
  } catch (err) {
    console.error('Authentication error:', err);
    return sendError(res, 'Authentication internal error', 500);
  }
};
