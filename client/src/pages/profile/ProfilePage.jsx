import React, { useState } from 'react';
import Card from '../../components/common/Card.jsx';
import Button from '../../components/common/Button.jsx';
import FormField from '../../components/forms/FormField.jsx';
import Input from '../../components/forms/Input.jsx';
import Badge from '../../components/common/Badge.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { User, Mail, Phone, Lock, ShieldCheck, CheckCircle2, XCircle } from 'lucide-react';

export default function ProfilePage() {
  const { profile, role, updatePassword } = useAuth();
  const { success, error } = useToast();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const hasLength = password.length >= 9;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  const isPasswordValid = hasLength && hasUpper && hasLower && hasSpecial;

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    if (!isPasswordValid) {
      error('Password does not meet the security criteria');
      return;
    }
    if (password !== confirmPassword) {
      error('Passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      await updatePassword(password);
      success('Password successfully updated!');
      setPassword('');
      setConfirmPassword('');
    } catch (err) {
      error(err.message || 'Failed to update password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-white">
          My Account & Profile
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Review your account identity, assigned permissions, and update security credentials.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Profile Card */}
        <Card title="Account Information">
          <div className="space-y-4 text-xs">
            <div className="flex items-center gap-4 pb-4 border-b border-slate-800">
              <div className="w-14 h-14 rounded-2xl bg-indigo-900/60 border border-indigo-700/60 flex items-center justify-center text-xl font-black text-indigo-300">
                {(profile?.fullName || profile?.email || 'U')[0].toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-white">{profile?.fullName || 'User Profile'}</h3>
                  <Badge status={role} />
                </div>
                <p className="text-slate-400 mt-0.5">{profile?.email}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <span className="text-slate-500 font-semibold uppercase">Email</span>
                <p className="text-slate-200 font-medium mt-0.5">{profile?.email || '—'}</p>
              </div>
              <div>
                <span className="text-slate-500 font-semibold uppercase">Phone</span>
                <p className="text-slate-200 font-medium mt-0.5">{profile?.phone || 'Not provided'}</p>
              </div>
              <div>
                <span className="text-slate-500 font-semibold uppercase">System Role</span>
                <p className="text-indigo-400 font-bold uppercase mt-0.5">{role}</p>
              </div>
              <div>
                <span className="text-slate-500 font-semibold uppercase">Account ID</span>
                <p className="text-slate-400 font-mono text-[11px] truncate mt-0.5">{profile?.id}</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Change Password Card */}
        <Card
          title="Update Account Password"
          subtitle="Ensure your new password contains at least 9 characters, uppercase, lowercase, and symbols"
        >
          <form onSubmit={handlePasswordUpdate} className="space-y-4">
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

            <div className="flex justify-end pt-2">
              <Button
                type="submit"
                variant="primary"
                isLoading={isLoading}
                disabled={!isPasswordValid || password !== confirmPassword}
              >
                Update Password
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
