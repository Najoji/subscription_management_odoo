import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://osfeqdndfzunznnsqzhl.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9zZmVxZG5kZnp1bnpubnNxemhsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM0MTkxNDMsImV4cCI6MjEwODk5NTE0M30.QEhYHlSqFUAvURxopP149wNnMmCPZHTyk-6h9g-RoUs';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});
