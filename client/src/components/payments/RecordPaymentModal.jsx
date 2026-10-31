import React, { useState } from 'react';
import Modal from '../common/Modal.jsx';
import Button from '../common/Button.jsx';
import FormField from '../forms/FormField.jsx';
import Input from '../forms/Input.jsx';
import Select from '../forms/Select.jsx';
import { paymentApi } from '../../api/paymentApi.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { formatCurrency } from '../../utils/formatters.js';
import { CreditCard, Calendar, FileText } from 'lucide-react';

const PAYMENT_METHODS = [
  { value: 'UPI', label: 'UPI (Google Pay, PhonePe, Paytm)' },
  { value: 'Bank Transfer', label: 'Net Banking / NEFT / RTGS' },
  { value: 'Credit Card', label: 'Credit / Debit Card' },
  { value: 'Cash', label: 'Cash' },
  { value: 'Cheque', label: 'Cheque / Demand Draft' },
];

export default function RecordPaymentModal({ isOpen, onClose, invoice, onSuccess }) {
  const { profile } = useAuth();
  const { success, error } = useToast();

  const balance = invoice
    ? Math.max(0, Number(invoice.total || 0) - Number(invoice.amountPaid || 0))
    : 0;

  const [method, setMethod] = useState('UPI');
  const [amount, setAmount] = useState(balance || '');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Sync amount when invoice opens
  React.useEffect(() => {
    if (invoice) {
      const remaining = Math.max(0, Number(invoice.total || 0) - Number(invoice.amountPaid || 0));
      setAmount(remaining);
    }
  }, [invoice]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) {
      error('Please enter a valid payment amount');
      return;
    }
    if (Number(amount) > balance) {
      error(`Payment amount cannot exceed the balance due of ${formatCurrency(balance)}`);
      return;
    }

    setIsLoading(true);
    try {
      const payload = {
        method,
        amount: Number(amount),
        paymentDate,
        note: note.trim() || `Payment via ${method}`,
      };

      const res = await paymentApi.recordPayment(invoice.id, payload, profile);
      if (res?.success) {
        success(res.message || 'Payment recorded successfully!');
        if (onSuccess) onSuccess(res.data);
        onClose();
      } else {
        throw new Error(res?.message || 'Failed to record payment');
      }
    } catch (err) {
      error(err.message || 'Error recording payment');
    } finally {
      setIsLoading(false);
    }
  };

  if (!invoice) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Record Payment"
      subtitle={`Invoice #${invoice.invoiceNumber || 'INV'}`}
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Balance Due Summary Card */}
        <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/60 flex items-center justify-between text-xs">
          <div>
            <span className="text-slate-500 dark:text-slate-400">Total Invoice:</span>
            <p className="font-semibold text-slate-800 dark:text-slate-200">{formatCurrency(invoice.total)}</p>
          </div>
          <div>
            <span className="text-slate-500 dark:text-slate-400">Already Paid:</span>
            <p className="font-semibold text-emerald-600 dark:text-emerald-400">{formatCurrency(invoice.amountPaid || 0)}</p>
          </div>
          <div className="text-right">
            <span className="text-slate-500 dark:text-slate-400">Remaining Balance:</span>
            <p className="font-bold text-rose-600 dark:text-rose-400">{formatCurrency(balance)}</p>
          </div>
        </div>

        <FormField label="Payment Method" required>
          <Select
            options={PAYMENT_METHODS}
            value={method}
            onChange={(e) => setMethod(e.target.value)}
          />
        </FormField>

        <FormField
          label="Payment Amount (₹)"
          required
          helperText={`Enter amount up to ${formatCurrency(balance)}`}
        >
          <Input
            type="number"
            step="0.01"
            min="1"
            max={balance}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
          />
        </FormField>

        <FormField label="Payment Date" required>
          <Input
            type="date"
            icon={Calendar}
            value={paymentDate}
            onChange={(e) => setPaymentDate(e.target.value)}
          />
        </FormField>

        <FormField label="Payment Note / Reference">
          <Input
            type="text"
            icon={FileText}
            placeholder="e.g. UPI Ref: 9876543210 or Bank Txn ID"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </FormField>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="success"
            icon={CreditCard}
            isLoading={isLoading}
          >
            Confirm & Record Payment
          </Button>
        </div>
      </form>
    </Modal>
  );
}
