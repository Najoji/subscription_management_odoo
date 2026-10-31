import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import AuthLayout from '../../layouts/AuthLayout.jsx';
import FormField from '../../components/forms/FormField.jsx';
import Input from '../../components/forms/Input.jsx';
import Button from '../../components/common/Button.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { Mail, ArrowLeft, Send } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { resetPassword } = useAuth();
  const { success, error } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      error('Please enter your email address');
      return;
    }

    setIsLoading(true);
    try {
      await resetPassword(email);
      setSubmitted(true);
      success('Password reset link sent to your email.');
    } catch (err) {
      error(err.message || 'Failed to send password reset email');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Reset Your Password"
      subtitle="Enter your email to receive recovery instructions"
    >
      {!submitted ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Registered Email Address" required>
            <Input
              type="email"
              icon={Mail}
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </FormField>

          <Button
            type="submit"
            variant="primary"
            icon={Send}
            isLoading={isLoading}
            className="w-full mt-2"
          >
            Send Reset Instructions
          </Button>
        </form>
      ) : (
        <div className="p-4 bg-emerald-950/40 border border-emerald-800 rounded-xl text-center space-y-2">
          <p className="text-sm font-semibold text-emerald-300">Email Dispatched</p>
          <p className="text-xs text-slate-300">
            If an account exists for <strong>{email}</strong>, a secure password reset link has been sent.
          </p>
        </div>
      )}

      <div className="mt-6 pt-6 border-t border-slate-800 text-center text-xs">
        <Link
          to="/login"
          className="inline-flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
        </Link>
      </div>
    </AuthLayout>
  );
}
