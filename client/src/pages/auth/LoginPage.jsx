import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import AuthLayout from '../../layouts/AuthLayout.jsx';
import FormField from '../../components/forms/FormField.jsx';
import Input from '../../components/forms/Input.jsx';
import Button from '../../components/forms/../common/Button.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { Mail, Lock, LogIn, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname;

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

      const userRole = res?.profile?.role || 'admin';

      if (from) {
        navigate(from, { replace: true });
      } else if (userRole === 'admin') {
        navigate('/admin/dashboard', { replace: true });
      } else if (userRole === 'staff') {
        navigate('/staff/dashboard', { replace: true });
      } else {
        navigate('/portal/dashboard', { replace: true });
      }
    } catch (err) {
      error(err.message || 'Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome to Brightloop"
      subtitle="Sign in to your organization or customer account"
    >
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
