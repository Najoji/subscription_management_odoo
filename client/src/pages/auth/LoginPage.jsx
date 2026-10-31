import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import AuthLayout from '../../layouts/AuthLayout.jsx';
import FormField from '../../components/forms/FormField.jsx';
import Input from '../../components/forms/Input.jsx';
import Button from '../../components/common/Button.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { Mail, Lock, LogIn, Eye, EyeOff, ShieldCheck, Briefcase, User, CheckCircle2 } from 'lucide-react';

export default function LoginPage() {
  // Role selection state: 'customer' | 'admin' | 'staff'
  const [selectedRole, setSelectedRole] = useState('customer');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const { success, error, info } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname;

  // Role metadata configurations
  const ROLE_CONFIG = {
    customer: {
      title: 'Customer Portal',
      description: 'Access your active subscriptions, quotations, invoices & payment history.',
      icon: User,
      color: 'emerald',
      activeTabClass: 'bg-emerald-600/20 text-emerald-300 border-emerald-500 shadow-sm shadow-emerald-500/20',
      badgeClass: 'bg-emerald-950/60 text-emerald-400 border-emerald-800/60',
      defaultPath: '/portal/dashboard',
      placeholder: 'customer@company.com',
    },
    admin: {
      title: 'Admin Console',
      description: 'Manage products, pricing plans, automated billing, team accounts & reports.',
      icon: ShieldCheck,
      color: 'indigo',
      activeTabClass: 'bg-indigo-600/20 text-indigo-300 border-indigo-500 shadow-sm shadow-indigo-500/20',
      badgeClass: 'bg-indigo-950/60 text-indigo-400 border-indigo-800/60',
      defaultPath: '/admin/dashboard',
      placeholder: 'admin@brightloop.com',
    },
    staff: {
      title: 'Staff Workspace',
      description: 'Operations console for customer subscriptions, quotations, and invoice management.',
      icon: Briefcase,
      color: 'blue',
      activeTabClass: 'bg-blue-600/20 text-blue-300 border-blue-500 shadow-sm shadow-blue-500/20',
      badgeClass: 'bg-blue-950/60 text-blue-400 border-blue-800/60',
      defaultPath: '/staff/dashboard',
      placeholder: 'staff@brightloop.com',
    },
  };

  const currentRoleConfig = ROLE_CONFIG[selectedRole];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      error('Please enter your email and password');
      return;
    }

    setIsLoading(true);
    try {
      const res = await login({ email, password });
      const actualRole = res?.profile?.role || 'customer';

      // Verify that the user signed into the matching portal
      if (actualRole !== selectedRole) {
        info(`Note: Signed in as a registered '${actualRole.toUpperCase()}' account.`);
      } else {
        success(`Welcome! Signed into ${currentRoleConfig.title}`);
      }

      // Navigate strictly to the authenticated user's authorized portal
      if (actualRole === 'admin') {
        const dest = (from && from.startsWith('/admin')) ? from : '/admin/dashboard';
        navigate(dest, { replace: true });
      } else if (actualRole === 'staff') {
        const dest = (from && from.startsWith('/staff')) ? from : '/staff/dashboard';
        navigate(dest, { replace: true });
      } else {
        const dest = (from && from.startsWith('/portal')) ? from : '/portal/dashboard';
        navigate(dest, { replace: true });
      }
    } catch (err) {
      error(err.message || 'Invalid email or password for this account');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome to Brightloop"
      subtitle="Select your account type and sign in to your portal"
    >
      {/* 1. Account Type Selector (Customer, Admin, Staff) */}
      <div className="mb-5">
        <label className="block text-xs font-semibold text-slate-300 mb-2">
          Select Your Access Portal:
        </label>
        <div className="grid grid-cols-3 gap-2 p-1 bg-slate-900 border border-slate-800 rounded-xl">
          <button
            type="button"
            onClick={() => setSelectedRole('customer')}
            className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-lg border text-xs font-semibold transition-all ${
              selectedRole === 'customer'
                ? ROLE_CONFIG.customer.activeTabClass
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <User className={`w-4 h-4 mb-1 ${selectedRole === 'customer' ? 'text-emerald-400' : 'text-slate-400'}`} />
            <span>Customer</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedRole('admin')}
            className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-lg border text-xs font-semibold transition-all ${
              selectedRole === 'admin'
                ? ROLE_CONFIG.admin.activeTabClass
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <ShieldCheck className={`w-4 h-4 mb-1 ${selectedRole === 'admin' ? 'text-indigo-400' : 'text-slate-400'}`} />
            <span>Admin</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedRole('staff')}
            className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-lg border text-xs font-semibold transition-all ${
              selectedRole === 'staff'
                ? ROLE_CONFIG.staff.activeTabClass
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Briefcase className={`w-4 h-4 mb-1 ${selectedRole === 'staff' ? 'text-blue-400' : 'text-slate-400'}`} />
            <span>Staff</span>
          </button>
        </div>

        {/* Selected Portal Explanation */}
        <div className={`mt-3 p-3 rounded-xl border text-xs flex items-start gap-2.5 transition-colors ${currentRoleConfig.badgeClass}`}>
          <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 opacity-80" />
          <div>
            <span className="font-bold block">{currentRoleConfig.title}</span>
            <span className="text-[11px] opacity-80 leading-relaxed block mt-0.5">
              {currentRoleConfig.description}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Credentials Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label="Email Address" required>
          <Input
            type="email"
            icon={Mail}
            placeholder={currentRoleConfig.placeholder}
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
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
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
          Sign In as {selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)}
        </Button>
      </form>

      {/* Footer Registration for Customers */}
      {selectedRole === 'customer' && (
        <div className="mt-6 pt-5 border-t border-slate-800 text-center text-xs text-slate-400">
          New customer organization?{' '}
          <Link
            to="/register"
            className="font-bold text-indigo-400 hover:text-indigo-300 transition-colors ml-1"
          >
            Create an account
          </Link>
        </div>
      )}

      {selectedRole !== 'customer' && (
        <div className="mt-6 pt-5 border-t border-slate-800 text-center text-[11px] text-slate-500">
          Organization internal access is restricted to authorized {selectedRole} personnel.
        </div>
      )}
    </AuthLayout>
  );
}
