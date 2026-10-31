import React, { useState } from 'react';
import Modal from '../common/Modal.jsx';
import Button from '../common/Button.jsx';
import FormField from '../forms/FormField.jsx';
import Input from '../forms/Input.jsx';
import { billingApi } from '../../api/billingApi.js';
import { useToast } from '../../context/ToastContext.jsx';
import { Zap, CheckCircle2, AlertCircle, Calendar } from 'lucide-react';

export default function RunBillingModal({ isOpen, onClose, onSuccess }) {
  const [asOfDate, setAsOfDate] = useState(new Date().toISOString().split('T')[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const { success, error } = useToast();

  const handleRunBilling = async () => {
    setIsLoading(true);
    setResult(null);
    try {
      const res = await billingApi.runBilling(asOfDate);
      if (res?.success) {
        setResult(res.data);
        success(res.message || 'Billing run executed successfully');
        if (onSuccess) onSuccess(res.data);
      } else {
        throw new Error(res?.message || 'Billing run failed');
      }
    } catch (err) {
      error(err.message || 'Error executing billing run');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setResult(null);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Run Recurring Billing"
      subtitle="Evaluate active subscriptions and generate due invoices"
      maxWidth="max-w-lg"
    >
      <div className="space-y-5">
        {!result ? (
          <>
            <div className="p-4 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl border border-indigo-100 dark:border-indigo-900/50 flex gap-3 text-xs leading-relaxed text-indigo-900 dark:text-indigo-200">
              <Zap className="w-5 h-5 flex-shrink-0 text-indigo-600 dark:text-indigo-400 mt-0.5" />
              <div>
                <p className="font-semibold mb-1">Automated Recurring Billing Engine</p>
                <p>
                  Running billing will find all <strong>Active</strong> subscriptions whose next billing date is on or before the selected cut-off date, snapshot current product prices, calculate taxes and discounts, and generate official draft invoices.
                </p>
              </div>
            </div>

            <FormField
              label="Billing Cut-off Date (As of Date)"
              required
              helperText="All active subscriptions due on or before this date will be billed."
            >
              <Input
                type="date"
                icon={Calendar}
                value={asOfDate}
                onChange={(e) => setAsOfDate(e.target.value)}
              />
            </FormField>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <Button variant="outline" onClick={handleClose} disabled={isLoading}>
                Cancel
              </Button>
              <Button
                variant="primary"
                icon={Zap}
                onClick={handleRunBilling}
                isLoading={isLoading}
              >
                Execute Billing Run
              </Button>
            </div>
          </>
        ) : (
          <div className="space-y-4">
            <div className="p-5 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800 text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white">
                Billing Completed Successfully
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Evaluated for cut-off date: <strong>{asOfDate}</strong>
              </p>

              <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-emerald-100 dark:border-emerald-900/40 text-left">
                <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-emerald-100 dark:border-emerald-900/40">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 uppercase font-semibold">
                    Invoices Generated
                  </span>
                  <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                    {result.invoicesGenerated || 0}
                  </div>
                </div>

                <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-emerald-100 dark:border-emerald-900/40">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 uppercase font-semibold">
                    Duplicates Skipped
                  </span>
                  <div className="text-2xl font-black text-slate-600 dark:text-slate-300">
                    {result.skippedDuplicates || 0}
                  </div>
                </div>
              </div>

              {result.errors && result.errors.length > 0 && (
                <div className="mt-4 p-3 bg-rose-50 text-rose-700 rounded-lg text-xs text-left">
                  <div className="font-semibold flex items-center gap-1.5 mb-1">
                    <AlertCircle className="w-4 h-4" /> Errors encountered:
                  </div>
                  <ul className="list-disc pl-4 space-y-0.5">
                    {result.errors.map((err, i) => (
                      <li key={i}>{typeof err === 'string' ? err : err.message}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="primary" onClick={handleClose}>
                Done
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
