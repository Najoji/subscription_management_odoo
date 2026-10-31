import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthLayout from '../../layouts/AuthLayout.jsx';
import FormField from '../../components/forms/FormField.jsx';
import Input from '../../components/forms/Input.jsx';
import Button from '../../components/common/Button.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { Lock, KeyRound, CheckCircle2, XCircle } from 'lucide-react';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { updatePassword } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();

  const hasLength = password.length >= 9;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  const isPasswordValid = hasLength && hasUpper && hasLower && hasSpecial;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isPasswordValid) {
      error('Password does not fulfill all required security criteria');
      return;
    }
    if (password !== confirmPassword) {
      error('Passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      await updatePassword(password);
      success('Password updated successfully! Please log in.');
      navigate('/login');
    } catch (err) {
      error(err.message || 'Failed to update password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Create New Password"
      subtitle="Ensure your new password meets the security requirements"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label="New Password" required>
          <Input
            type="password"
            icon={Lock}
            placeholder="•••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </FormField>

        {/* Real-time Checklist */}
        <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-[11px] space-y-1.5">
          <p className="font-semibold text-slate-300">Password requirements:</p>
          <div className="grid grid-cols-2 gap-1.5">
            <div className={`flex items-center gap-1.5 ${hasLength ? 'text-emerald-400' : 'text-slate-500'}`}>
              {hasLength ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
              <span>At least 9 characters</span>
            </div>
            <div className={`flex items-center gap-1.5 ${hasUpper ? 'text-emerald-400' : 'text-slate-500'}`}>
              {hasUpper ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
              <span>1 uppercase letter (A-Z)</span>
            </div>
            <div className={`flex items-center gap-1.5 ${hasLower ? 'text-emerald-400' : 'text-slate-500'}`}>
              {hasLower ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
              <span>1 lowercase letter (a-z)</span>
            </div>
            <div className={`flex items-center gap-1.5 ${hasSpecial ? 'text-emerald-400' : 'text-slate-500'}`}>
              {hasSpecial ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
              <span>1 special symbol (!@#$)</span>
            </div>
          </div>
        </div>

        <FormField label="Confirm New Password" required>
          <Input
            type="password"
            icon={Lock}
            placeholder="•••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </FormField>

        <Button
          type="submit"
          variant="primary"
          icon={KeyRound}
          isLoading={isLoading}
          disabled={!isPasswordValid || password !== confirmPassword}
          className="w-full mt-2"
        >
          Set New Password
        </Button>
      </form>
    </AuthLayout>
  );
}
