import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import AuthLayout from '../../layouts/AuthLayout.jsx';
import FormField from '../../components/forms/FormField.jsx';
import Input from '../../components/forms/Input.jsx';
import Button from '../../components/common/Button.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { Mail, Lock, LogIn, Eye, EyeOff, ShieldCheck, Briefcase, User } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { login, loginAsDemo } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname;

  const handleRoleRedirect = (roleToRedirect) => {
    if (roleToRedirect === 'admin') {
      const dest = (from && from.startsWith('/admin')) ? from : '/admin/dashboard';
      navigate(dest, { replace: true });
    } else if (roleToRedirect === 'staff') {
      const dest = (from && from.startsWith('/staff')) ? from : '/staff/dashboard';
      navigate(dest, { replace: true });
    } else {
      const dest = (from && from.startsWith('/portal')) ? from : '/portal/dashboard';
      navigate(dest, { replace: true });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      error('Please enter both email and password');
      return;
    }

    setIsLoading(true);
    try {
      const res = await login({ email, password });
      success('Logged in successfully!');

      const userRole = res?.profile?.role || (email.includes('admin') ? 'admin' : email.includes('staff') ? 'staff' : 'customer');
      handleRoleRedirect(userRole);
    } catch (err) {
      error(err.message || 'Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemoLogin = async (selectedRole) => {
    setIsLoading(true);
    let targetEmail = 'admin@brightloop.com';
    if (selectedRole === 'staff') targetEmail = 'staff@brightloop.com';
    if (selectedRole === 'customer') targetEmail = 'customer@brightloop.com';

    setEmail(targetEmail);
    setPassword('Brightloop@2026');

    try {
      const res = await login({ email: targetEmail, password: 'Brightloop@2026' });
      success(`Signed in as ${selectedRole.toUpperCase()}!`);
      const userRole = res?.profile?.role || selectedRole;
      handleRoleRedirect(userRole);
    } catch (err) {
      // Fallback to local demo profile
      const demoUser = loginAsDemo(selectedRole);
      success(`Signed in as demo ${selectedRole.toUpperCase()}!`);
      handleRoleRedirect(demoUser.role);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome to Brightloop"
      subtitle="Sign in to your organization or customer portal"
    >
      {/* Quick Role One-Click Switcher */}
      <div className="mb-6 p-3 bg-slate-900/80 border border-slate-800 rounded-xl">
        <span className="text-[11px] font-semibold text-slate-400 block mb-2 text-center uppercase tracking-wider">
          ⚡ Quick 1-Click Role Login:
        </span>
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => handleQuickDemoLogin('admin')}
            disabled={isLoading}
            className="flex flex-col items-center justify-center p-2 rounded-lg bg-indigo-950/60 border border-indigo-700/50 hover:bg-indigo-900/80 hover:border-indigo-500 transition-all text-indigo-300 group"
          >
            <ShieldCheck className="w-5 h-5 mb-1 text-indigo-400 group-hover:scale-110 transition-transform" />
            <span className="text-[11px] font-bold">Admin</span>
            <span className="text-[9px] text-slate-400">Full Access</span>
          </button>

          <button
            type="button"
            onClick={() => handleQuickDemoLogin('staff')}
            disabled={isLoading}
            className="flex flex-col items-center justify-center p-2 rounded-lg bg-blue-950/60 border border-blue-700/50 hover:bg-blue-900/80 hover:border-blue-500 transition-all text-blue-300 group"
          >
            <Briefcase className="w-5 h-5 mb-1 text-blue-400 group-hover:scale-110 transition-transform" />
            <span className="text-[11px] font-bold">Staff</span>
            <span className="text-[9px] text-slate-400">Operations</span>
          </button>

          <button
            type="button"
            onClick={() => handleQuickDemoLogin('customer')}
            disabled={isLoading}
            className="flex flex-col items-center justify-center p-2 rounded-lg bg-emerald-950/60 border border-emerald-700/50 hover:bg-emerald-900/80 hover:border-emerald-500 transition-all text-emerald-300 group"
          >
            <User className="w-5 h-5 mb-1 text-emerald-400 group-hover:scale-110 transition-transform" />
            <span className="text-[11px] font-bold">Customer</span>
            <span className="text-[9px] text-slate-400">My Portal</span>
          </button>
        </div>
      </div>

      <div className="relative my-4 text-center">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-800" />
        </div>
        <span className="relative bg-slate-900 px-3 text-[11px] uppercase tracking-wider text-slate-500">
          Or Enter Credentials
        </span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label="Email Address" required>
          <Input
            type="email"
            icon={Mail}
            placeholder="name@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
        </FormField>

        <FormField label="Password" required>
          <div className="relative">
            <Input
              type={showPassword ? 'text' : 'password'}
              icon={Lock}
              placeholder="•••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </FormField>

        <div className="flex items-center justify-between text-xs pt-1">
          <Link
            to="/forgot-password"
            className="text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            Forgot password?
          </Link>
        </div>

        <Button
          type="submit"
          variant="primary"
          icon={LogIn}
          isLoading={isLoading}
          className="w-full mt-2"
        >
          Sign In
        </Button>
      </form>

      <div className="mt-6 pt-6 border-t border-slate-800 text-center text-xs text-slate-400">
        New customer business?{' '}
        <Link
          to="/register"
          className="font-bold text-indigo-400 hover:text-indigo-300 transition-colors ml-1"
        >
          Register here
        </Link>
      </div>
    </AuthLayout>
  );
}
