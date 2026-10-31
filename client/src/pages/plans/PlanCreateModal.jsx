import React, { useState } from 'react';
import Modal from '../../components/common/Modal.jsx';
import Button from '../../components/common/Button.jsx';
import FormField from '../../components/forms/FormField.jsx';
import Input from '../../components/forms/Input.jsx';
import Select from '../../components/forms/Select.jsx';
import { planApi } from '../../api/planApi.js';
import { useToast } from '../../context/ToastContext.jsx';
import { CalendarDays } from 'lucide-react';

export default function PlanCreateModal({ isOpen, onClose, onSuccess }) {
  const [name, setName] = useState('');
  const [billingInterval, setBillingInterval] = useState('monthly');
  const [intervalCount, setIntervalCount] = useState('1');
  const [minimumQuantity, setMinimumQuantity] = useState('1');
  const [availableFrom, setAvailableFrom] = useState(new Date().toISOString().split('T')[0]);
  const [availableTo, setAvailableTo] = useState(new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0]);
  const [autoClose, setAutoClose] = useState(false);
  const [autoCloseDays, setAutoCloseDays] = useState('');
  const [allowEarlyClose, setAllowEarlyClose] = useState(true);
  const [allowPause, setAllowPause] = useState(true);
  const [allowRenewal, setAllowRenewal] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const { success, error } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      error('Plan name is required');
      return;
    }

    setIsLoading(true);
    try {
      const payload = {
        name: name.trim(),
        billingInterval,
        intervalCount: Number(intervalCount || 1),
        minimumQuantity: Number(minimumQuantity || 1),
        availableFrom: availableFrom || null,
        availableTo: availableTo || null,
        autoClose,
        autoCloseDays: autoClose && autoCloseDays ? Number(autoCloseDays) : null,
        allowEarlyClose,
        allowPause,
        allowRenewal,
      };

      const res = await planApi.createPlan(payload);
      if (res?.success) {
        success('Subscription plan created successfully!');
        if (onSuccess) onSuccess(res.data);
        handleReset();
        onClose();
      } else {
        throw new Error(res?.message || 'Failed to create plan');
      }
    } catch (err) {
      error(err.message || 'Error creating plan');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setName('');
    setBillingInterval('monthly');
    setIntervalCount('1');
    setMinimumQuantity('1');
    setAutoClose(false);
    setAutoCloseDays('');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Subscription Plan"
      subtitle="Configure recurring frequency, constraints, and lifecycle permissions"
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label="Plan Name" required>
          <Input
            placeholder="e.g. Pro Monthly Plan"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </FormField>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <FormField label="Billing Frequency" required>
            <Select
              options={[
                { value: 'daily', label: 'Daily' },
                { value: 'weekly', label: 'Weekly' },
                { value: 'monthly', label: 'Monthly' },
                { value: 'yearly', label: 'Yearly' },
              ]}
              value={billingInterval}
              onChange={(e) => setBillingInterval(e.target.value)}
            />
          </FormField>

          <FormField label="Interval Count" required helperText="e.g. Every 1 month">
            <Input
              type="number"
              min="1"
              value={intervalCount}
              onChange={(e) => setIntervalCount(e.target.value)}
              required
            />
          </FormField>

          <FormField label="Minimum Quantity" required helperText="Min seats / units">
            <Input
              type="number"
              min="1"
              value={minimumQuantity}
              onChange={(e) => setMinimumQuantity(e.target.value)}
              required
            />
          </FormField>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="Available From (Start Date)">
            <Input
              type="date"
              value={availableFrom}
              onChange={(e) => setAvailableFrom(e.target.value)}
            />
          </FormField>

          <FormField label="Available Until (End Date)">
            <Input
              type="date"
              value={availableTo}
              onChange={(e) => setAvailableTo(e.target.value)}
            />
          </FormField>
        </div>

        {/* Lifecycle Permissions Box */}
        <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 space-y-3">
          <p className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Lifecycle Policy & Rules
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <label className="flex items-center gap-2 cursor-pointer text-slate-300">
              <input
                type="checkbox"
                checked={allowPause}
                onChange={(e) => setAllowPause(e.target.checked)}
                className="rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500"
              />
              <span>Allow Customer to Pause</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-slate-300">
              <input
                type="checkbox"
                checked={allowEarlyClose}
                onChange={(e) => setAllowEarlyClose(e.target.checked)}
                className="rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500"
              />
              <span>Allow Early Close</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-slate-300">
              <input
                type="checkbox"
                checked={allowRenewal}
                onChange={(e) => setAllowRenewal(e.target.checked)}
                className="rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500"
              />
              <span>Allow Auto-Renewal</span>
            </label>
          </div>

          <div className="pt-2 border-t border-slate-800/80 flex items-center gap-4 text-xs">
            <label className="flex items-center gap-2 cursor-pointer text-slate-300">
              <input
                type="checkbox"
                checked={autoClose}
                onChange={(e) => setAutoClose(e.target.checked)}
                className="rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500"
              />
              <span>Auto Close when period ends</span>
            </label>

            {autoClose && (
              <div className="w-32">
                <Input
                  type="number"
                  placeholder="Days"
                  value={autoCloseDays}
                  onChange={(e) => setAutoCloseDays(e.target.value)}
                />
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            icon={CalendarDays}
            isLoading={isLoading}
          >
            Create Plan
          </Button>
        </div>
      </form>
    </Modal>
  );
}
