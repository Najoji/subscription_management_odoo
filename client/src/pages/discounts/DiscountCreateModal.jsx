import React, { useState } from 'react';
import Modal from '../../components/common/Modal.jsx';
import Button from '../../components/common/Button.jsx';
import FormField from '../../components/forms/FormField.jsx';
import Input from '../../components/forms/Input.jsx';
import Select from '../../components/forms/Select.jsx';
import { discountApi } from '../../api/discountApi.js';
import { useToast } from '../../context/ToastContext.jsx';
import { Percent } from 'lucide-react';

export default function DiscountCreateModal({ isOpen, onClose, onSuccess }) {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState('percentage');
  const [value, setValue] = useState('');
  const [minimumPurchase, setMinimumPurchase] = useState('');
  const [minimumQuantity, setMinimumQuantity] = useState('1');
  const [startAt, setStartAt] = useState(new Date().toISOString().split('T')[0]);
  const [endAt, setEndAt] = useState(new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]);
  const [usageLimit, setUsageLimit] = useState('100');
  const [applicableTo, setApplicableTo] = useState('subscription');
  const [isLoading, setIsLoading] = useState(false);

  const { success, error } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !code.trim()) {
      error('Discount name and coupon code are required');
      return;
    }
    if (!value || Number(value) <= 0) {
      error('Please enter a valid discount value');
      return;
    }

    setIsLoading(true);
    try {
      const payload = {
        name: name.trim(),
        code: code.trim().toUpperCase(),
        discountType,
        value: Number(value),
        minimumPurchase: minimumPurchase ? Number(minimumPurchase) : 0,
        minimumQuantity: minimumQuantity ? Number(minimumQuantity) : 1,
        startAt: startAt || null,
        endAt: endAt || null,
        usageLimit: usageLimit ? Number(usageLimit) : null,
        applicableTo,
      };

      const res = await discountApi.createDiscount(payload);
      if (res?.success) {
        success('Discount promotion rule created successfully!');
        if (onSuccess) onSuccess(res.data);
        handleReset();
        onClose();
      } else {
        throw new Error(res?.message || 'Failed to create discount');
      }
    } catch (err) {
      error(err.message || 'Error creating discount');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setName('');
    setCode('');
    setValue('');
    setMinimumPurchase('');
    setMinimumQuantity('1');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Discount Promotion Rule"
      subtitle="Define percentage or fixed deduction rules with thresholds and validity"
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="Discount Name" required>
            <Input
              placeholder="e.g. Festival Offer"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </FormField>

          <FormField label="Discount / Promo Code" required>
            <Input
              placeholder="e.g. FESTIVAL15"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              required
            />
          </FormField>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <FormField label="Discount Type" required>
            <Select
              options={[
                { value: 'percentage', label: 'Percentage (%)' },
                { value: 'fixed', label: 'Fixed Amount (₹)' },
              ]}
              value={discountType}
              onChange={(e) => setDiscountType(e.target.value)}
            />
          </FormField>

          <FormField
            label={discountType === 'percentage' ? 'Rate (%)' : 'Amount (₹)'}
            required
          >
            <Input
              type="number"
              step="0.01"
              min="0.01"
              placeholder={discountType === 'percentage' ? '15' : '500'}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              required
            />
          </FormField>

          <FormField label="Applicable To" required>
            <Select
              options={[
                { value: 'subscription', label: 'Entire Subscription' },
                { value: 'product', label: 'Specific Product' },
              ]}
              value={applicableTo}
              onChange={(e) => setApplicableTo(e.target.value)}
            />
          </FormField>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="Minimum Purchase Amount (₹)" helperText="Minimum line subtotal required">
            <Input
              type="number"
              step="0.01"
              placeholder="1000.00"
              value={minimumPurchase}
              onChange={(e) => setMinimumPurchase(e.target.value)}
            />
          </FormField>

          <FormField label="Usage Limit (Max Claims)" helperText="Total times code can be redeemed">
            <Input
              type="number"
              min="1"
              placeholder="100"
              value={usageLimit}
              onChange={(e) => setUsageLimit(e.target.value)}
            />
          </FormField>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="Valid From">
            <Input
              type="date"
              value={startAt}
              onChange={(e) => setStartAt(e.target.value)}
            />
          </FormField>

          <FormField label="Valid Until">
            <Input
              type="date"
              value={endAt}
              onChange={(e) => setEndAt(e.target.value)}
            />
          </FormField>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            icon={Percent}
            isLoading={isLoading}
          >
            Create Discount
          </Button>
        </div>
      </form>
    </Modal>
  );
}
