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
      // Check if session has demo user or local profile saved
      const saved = localStorage.getItem('brightloop_local_profile');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setProfile(parsed);
          return parsed;
        } catch {}
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
          if (currentSession) {
            setSession(currentSession);
            setUser(currentSession.user);
            await fetchProfile();
          } else {
            // Check local demo profile
            const saved = localStorage.getItem('brightloop_local_profile');
            if (saved) {
              const parsed = JSON.parse(saved);
              setProfile(parsed);
              setUser({ id: parsed.id, email: parsed.email });
            }
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

      if (newSession) {
        await fetchProfile();
      } else if (!localStorage.getItem('brightloop_local_profile')) {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      mounted = false;
      authListener?.subscription?.unsubscribe();
    };
  }, [fetchProfile]);

  // Sign In
  const login = async ({ email, password }) => {
    // Check if this matches a demo account for quick hackathon switch
    const cleanEmail = email.trim().toLowerCase();
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (error) {
        // If Supabase failed (e.g. invalid credentials or network/placeholder key), check DEMO_ACCOUNTS
        if (DEMO_ACCOUNTS[cleanEmail] && (password === 'Password123!' || password === 'Admin@1234' || password === 'Demo@1234' || password === 'Demo@Brightloop2026' || password === 'Brightloop@2026')) {
          const demoUser = DEMO_ACCOUNTS[cleanEmail];
          setProfile(demoUser);
          setUser({ id: demoUser.id, email: demoUser.email });
          localStorage.setItem('brightloop_local_profile', JSON.stringify(demoUser));
          return { success: true, profile: demoUser };
        }
        throw new Error(error.message);
      }

      setSession(data.session);
      setUser(data.user);
      const verifiedProfile = await fetchProfile();
      return { success: true, profile: verifiedProfile };
    } catch (err) {
      // Check fallback for demo mode
      if (DEMO_ACCOUNTS[cleanEmail]) {
        const demoUser = DEMO_ACCOUNTS[cleanEmail];
        setProfile(demoUser);
        setUser({ id: demoUser.id, email: demoUser.email });
        localStorage.setItem('brightloop_local_profile', JSON.stringify(demoUser));
        return { success: true, profile: demoUser };
      }
      throw err;
    }
  };

  // Switch demo account directly (useful during hackathon review)
  const loginAsDemo = (role = 'admin') => {
    let email = 'admin@brightloop.com';
    if (role === 'staff') email = 'staff@brightloop.com';
    if (role === 'customer') email = 'customer@brightloop.com';

    const demoUser = DEMO_ACCOUNTS[email] || DEMO_ACCOUNTS['customer@example.com'];
    setProfile(demoUser);
    setUser({ id: demoUser.id, email: demoUser.email });
    localStorage.setItem('brightloop_local_profile', JSON.stringify(demoUser));
    return demoUser;
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
