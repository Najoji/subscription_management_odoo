import React, { useState } from 'react';
import Modal from '../../components/common/Modal.jsx';
import Button from '../../components/common/Button.jsx';
import FormField from '../../components/forms/FormField.jsx';
import Input from '../../components/forms/Input.jsx';
import { authApi } from '../../api/authApi.js';
import { useToast } from '../../context/ToastContext.jsx';
import { UserCheck, Mail, Lock, Phone, User, CheckCircle2, XCircle, Eye, EyeOff } from 'lucide-react';

export default function StaffCreateModal({ isOpen, onClose, onSuccess }) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { success, error } = useToast();

  const hasLength = password.length >= 9;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  const isPasswordValid = hasLength && hasUpper && hasLower && hasSpecial;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim()) {
      error('Staff name and email are required');
      return;
    }
    if (!isPasswordValid) {
      error('Password does not fulfill all required security criteria');
      return;
    }

    setIsLoading(true);
    try {
      const payload = {
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone ? phone.trim() : null,
        password,
      };

      const res = await authApi.createStaff(payload);
      if (res?.success) {
        success(`Staff account for ${fullName} created successfully!`);
        if (onSuccess) onSuccess(res.data);
        handleReset();
        onClose();
      } else {
        throw new Error(res?.message || 'Failed to create staff account');
      }
    } catch (err) {
      error(err.message || 'Error creating staff member');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setFullName('');
    setEmail('');
    setPhone('');
    setPassword('');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Staff Member Account"
      subtitle="Authorized internal user with operational and billing permissions"
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label="Full Name" required>
          <Input
            icon={User}
            placeholder="e.g. Alex Operational"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
        </FormField>

        <FormField label="Staff Email" required>
          <Input
            type="email"
            icon={Mail}
            placeholder="alex@brightloop.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </FormField>

        <FormField label="Phone Number">
          <Input
            type="tel"
            icon={Phone}
            placeholder="+91 98765 43211"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
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

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            icon={UserCheck}
            isLoading={isLoading}
            disabled={!isPasswordValid}
          >
            Create Staff Account
          </Button>
        </div>
      </form>
    </Modal>
  );
}
