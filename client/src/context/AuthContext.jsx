import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../api/supabase.js';
import { authApi } from '../api/authApi.js';

const AuthContext = createContext(null);

export const validatePassword = (password) => {
  if (!password || password.length < 9) {
    return 'Password must be at least 9 characters long.';
  }
  if (!/[A-Z]/.test(password)) {
    return 'Password must contain at least one uppercase letter.';
  }
  if (!/[a-z]/.test(password)) {
    return 'Password must contain at least one lowercase letter.';
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    return 'Password must contain at least one special character.';
  }
  return null;
};

// Built-in demo accounts for emergency testing or local demo without active internet/Supabase
const DEMO_ACCOUNTS = {
  'admin@brightloop.com': {
    id: 'ee65bf70-5488-4e80-93e1-7a409d09e500',
    email: 'admin@brightloop.com',
    fullName: 'System Administrator',
    role: 'admin',
    phone: '+91 98765 43210',
  },
  'admin@brightloop.example.com': {
    id: 'ee65bf70-5488-4e80-93e1-7a409d09e500',
    email: 'admin@brightloop.example.com',
    fullName: 'System Administrator',
    role: 'admin',
    phone: '+91 98765 43210',
  },
  'staff@brightloop.com': {
    id: '00000000-0000-0000-0000-000000000002',
    email: 'staff@brightloop.com',
    fullName: 'Operations Staff',
    role: 'staff',
    phone: '+91 98765 43211',
  },
  'staff1@brightloop.example.com': {
    id: '00000000-0000-0000-0000-000000000002',
    email: 'staff1@brightloop.example.com',
    fullName: 'Operations Staff Lead',
    role: 'staff',
    phone: '+91 98765 43211',
  },
  'customer@brightloop.com': {
    id: '00000000-0000-0000-0000-000000000003',
    email: 'customer@brightloop.com',
    fullName: 'Acme Enterprise Customer',
    role: 'customer',
    phone: '+91 98765 43212',
  },
  'acme@brightloop.example.com': {
    id: '00000000-0000-0000-0000-000000000003',
    email: 'acme@brightloop.example.com',
    fullName: 'Acme Technologies Pvt Ltd',
    role: 'customer',
    phone: '+91 98765 43212',
  },
  'customer@example.com': {
    id: '00000000-0000-0000-0000-000000000003',
    email: 'customer@example.com',
    fullName: 'Acme Technologies',
    role: 'customer',
    phone: '+91 98765 43212',
  },
};

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch verified profile from Express backend
  const fetchProfile = useCallback(async () => {
    try {
      const res = await authApi.getMe();
      if (res?.success && res.data) {
        setProfile(res.data);
        return res.data;
      }
    } catch (err) {
      console.warn('Could not fetch backend profile (/api/auth/me):', err.message);
      if (err.status === 401 || err.response?.status === 401) {
        localStorage.removeItem('brightloop_local_profile');
        setProfile(null);
        setUser(null);
        setSession(null);
      }
    }
    return null;
  }, []);

  // Initialize auth state
  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        if (mounted) {
          if (currentSession?.access_token) {
            setSession(currentSession);
            setUser(currentSession.user);
            await fetchProfile();
          } else {
            // Clean up any phantom local profile without an active token
            localStorage.removeItem('brightloop_local_profile');
            setProfile(null);
            setUser(null);
            setSession(null);
          }
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    initAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!mounted) return;
      setSession(newSession);
      setUser(newSession?.user || null);

      if (newSession?.access_token) {
        await fetchProfile();
      } else {
        localStorage.removeItem('brightloop_local_profile');
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      mounted = false;
      authListener?.subscription?.unsubscribe();
    };
  }, [fetchProfile]);

  // Sign In with Supabase Auth
  const login = async ({ email, password }) => {
    const cleanEmail = email.trim().toLowerCase();
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password,
    });

    if (error) {
      throw new Error(error.message || 'Invalid email or password');
    }

    setSession(data.session);
    setUser(data.user);
    const verifiedProfile = await fetchProfile();
    return { success: true, profile: verifiedProfile };
  };

  // Switch demo account directly with authentic Supabase credentials
  const loginAsDemo = async (role = 'admin') => {
    let email = 'admin@brightloop.example.com';
    if (role === 'staff') email = 'staff1@brightloop.example.com';
    if (role === 'customer') email = 'acme@brightloop.example.com';

    return login({ email, password: 'Demo@Brightloop2026' });
  };

  // Sign Up (Customer Registration)
  const registerCustomer = async ({ email, password, fullName, phone }) => {
    const passError = validatePassword(password);
    if (passError) throw new Error(passError);

    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        data: {
          full_name: fullName.trim(),
          phone: phone ? phone.trim() : null,
        },
      },
    });

    if (error) throw new Error(error.message);

    // If session established right away:
    if (data.session) {
      setSession(data.session);
      setUser(data.user);
      await fetchProfile();
    }
    return data;
  };

  // Sign Out
  const logout = async () => {
    localStorage.removeItem('brightloop_local_profile');
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('Supabase signout failed:', err);
    }
    setSession(null);
    setUser(null);
    setProfile(null);
  };

  // Forgot Password
  const resetPassword = async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw new Error(error.message);
    return true;
  };

  // Update Password
  const updatePassword = async (newPassword) => {
    const passError = validatePassword(newPassword);
    if (passError) throw new Error(passError);

    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw new Error(error.message);
    return true;
  };

  const role = profile?.role || null;
  const isAuthenticated = Boolean(user && profile);

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        profile,
        role,
        isAuthenticated,
        loading,
        login,
        loginAsDemo,
        registerCustomer,
        logout,
        resetPassword,
        updatePassword,
        fetchProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
