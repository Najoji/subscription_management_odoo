import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Card from '../../components/common/Card.jsx';
import Button from '../../components/common/Button.jsx';
import Badge from '../../components/common/Badge.jsx';
import ConfirmDialog from '../../components/common/ConfirmDialog.jsx';
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx';
import { subscriptionApi } from '../../api/subscriptionApi.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { formatCurrency, formatDate } from '../../utils/formatters.js';
import {
  Repeat,
  ArrowLeft,
  Play,
  Pause,
  XCircle,
  Receipt,
  Calendar,
  CheckCircle2,
} from 'lucide-react';

export default function SubscriptionDetailPage() {
  const { id } = useParams();
  const { role } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();

  const [subscription, setSubscription] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionConfirm, setActionConfirm] = useState({ open: false, status: '', message: '' });
  const [isUpdating, setIsUpdating] = useState(false);

  const basePath = role === 'admin' ? '/admin' : role === 'staff' ? '/staff' : '/portal';
  const isCustomer = role === 'customer';

  const loadSubscription = async () => {
    setIsLoading(true);
    try {
      const res = await subscriptionApi.getSubscriptionById(id);
      if (res?.data) {
        setSubscription(res.data);
      } else {
        throw new Error('Subscription not found');
      }
    } catch (err) {
      error(err.message || 'Failed to load subscription details');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSubscription();
  }, [id]);

  const handleStatusChange = async (targetStatus) => {
    setIsUpdating(true);
    try {
      await subscriptionApi.updateSubscriptionStatus(id, targetStatus);
      success(`Subscription successfully transitioned to ${targetStatus}`);
      setActionConfirm({ open: false, status: '', message: '' });
      loadSubscription();
    } catch (err) {
      error(err.message || 'Failed to update subscription status');
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner size="lg" message="Loading subscription contract..." className="min-h-[60vh]" />;
  }

  if (!subscription) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-400">Subscription contract not found.</p>
        <Button onClick={() => navigate(`${basePath}/subscriptions`)} className="mt-4">
          Back to Subscriptions
        </Button>
      </div>
    );
  }

  const items = subscription.items || subscription.subscription_items || [];
  const status = subscription.status || 'Confirmed';

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          onClick={() => navigate(`${basePath}/subscriptions`)}
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Subscriptions
        </button>

        {/* Operational Status Action Controls */}
        {!isCustomer && (
          <div className="flex items-center gap-2">
            {status === 'Confirmed' && (
              <Button
                size="sm"
                variant="success"
                icon={Play}
                onClick={() =>
                  setActionConfirm({
                    open: true,
                    status: 'Active',
                    message:
                      'Are you sure you want to Activate this subscription? It will immediately enter the active recurring billing schedule.',
                  })
                }
              >
                Activate Subscription
              </Button>
            )}

            {status === 'Active' && (
              <Button
                size="sm"
                variant="outline"
                icon={Pause}
                onClick={() =>
                  setActionConfirm({
                    open: true,
                    status: 'Paused',
                    message:
                      'Pause this subscription? Paused subscriptions do not generate new invoices during billing runs.',
                  })
                }
              >
                Pause
              </Button>
            )}

            {status === 'Paused' && (
              <Button
                size="sm"
                variant="success"
                icon={Play}
                onClick={() => handleStatusChange('Active')}
              >
                Resume Subscription
              </Button>
            )}

            {status !== 'Closed' && (
              <Button
                size="sm"
                variant="danger"
                icon={XCircle}
                onClick={() =>
                  setActionConfirm({
                    open: true,
                    status: 'Closed',
                    message:
                      'Are you sure you want to Close this subscription contract? This action stops all future billing.',
                  })
                }
              >
                Close Contract
              </Button>
            )}

            <Button
              size="sm"
              variant="outline"
              icon={Receipt}
              onClick={() => navigate(`${basePath}/invoices`)}
            >
              View Invoices
            </Button>
          </div>
        )}
      </div>

      {/* Main Details Sheet */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-10 shadow-lg space-y-8">
        {/* Header Block */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-6 border-b border-slate-200 dark:border-slate-800 pb-6">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                Subscription Agreement
              </span>
              <Badge status={status} />
            </div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              #{subscription.subscriptionNumber || subscription.subscription_number || 'SUB-DRAFT'}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Associated Quotation: #{subscription.quotationNumber || 'Converted from quotation'}
            </p>
          </div>

          <div className="sm:text-right text-xs text-slate-500 dark:text-slate-400 space-y-1">
            <p>
              Plan: <span className="font-bold text-slate-900 dark:text-white">{subscription.planName || subscription.plans?.name || 'Standard Monthly'}</span>
            </p>
            <p>
              Payment Terms: <span className="font-semibold text-indigo-400">{subscription.paymentTerms || subscription.payment_terms || '15 days'}</span>
            </p>
          </div>
        </div>

        {/* Contract Schedule Timeline Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-4 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800">
            <p className="font-semibold text-slate-400 mb-1">Contract Start Date</p>
            <p className="text-sm font-bold text-slate-900 dark:text-white">
              {formatDate(subscription.startDate || subscription.start_date)}
            </p>
          </div>

          <div className="p-4 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl border border-indigo-100 dark:border-indigo-900/50">
            <p className="font-semibold text-indigo-600 dark:text-indigo-400 mb-1">Next Billing Date</p>
            <p className="text-sm font-black text-indigo-900 dark:text-white">
              {formatDate(subscription.nextBillingDate || subscription.next_billing_date)}
            </p>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800">
            <p className="font-semibold text-slate-400 mb-1">Contract Expiry Date</p>
            <p className="text-sm font-bold text-slate-900 dark:text-white">
              {formatDate(subscription.expiryDate || subscription.expiry_date)}
            </p>
          </div>
        </div>

        {/* Customer Account */}
        <div className="p-4 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
          <p className="font-bold text-slate-500 uppercase tracking-wider mb-1">
            Account Holder
          </p>
          <p className="text-sm font-bold text-slate-900 dark:text-white">
            {subscription.customerName || subscription.profiles?.full_name || 'Customer Organization'}
          </p>
          <p className="text-slate-400">{subscription.profiles?.email || 'customer@organization.com'}</p>
        </div>

        {/* Contracted Lines Table */}
        <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className="p-3.5">Subscribed Item & Variant</th>
                <th className="p-3.5 text-center">Seats / Qty</th>
                <th className="p-3.5 text-right">Contract Unit Price</th>
                <th className="p-3.5 text-right">Cycle Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {items.map((it, idx) => (
                <tr key={it.id || idx}>
                  <td className="p-3.5">
                    <p className="font-bold text-slate-900 dark:text-white">
                      {it.productName || it.products?.name || it.description || 'Subscription Line'}
                    </p>
                    {it.variantName && (
                      <p className="text-indigo-400 text-[11px] font-medium">
                        Variant: {it.variantName}
                      </p>
                    )}
                  </td>
                  <td className="p-3.5 text-center font-medium">
                    {it.quantity}
                  </td>
                  <td className="p-3.5 text-right font-medium">
                    {formatCurrency(it.unitPrice || it.unit_price)}
                  </td>
                  <td className="p-3.5 text-right font-bold text-slate-900 dark:text-white">
                    {formatCurrency(it.lineTotal || (it.unitPrice || it.unit_price) * it.quantity)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pricing Summary */}
        {(() => {
          const items = subscription.subscription_items || [];
          const computedSubtotal = items.reduce((sum, it) => {
            const p = Number(it.unit_price || it.unitPrice || it.product?.sales_price || 0);
            const extra = Number(it.variant?.extra_price || 0);
            return sum + (p + extra) * (Number(it.quantity) || 1);
          }, 0);
          const computedTax = computedSubtotal * 0.18;
          const computedTotal = computedSubtotal + computedTax;

          const displaySubtotal = subscription.subtotal ?? computedSubtotal;
          const displayTax = subscription.taxTotal ?? computedTax;
          const displayTotal = subscription.total ?? subscription.cycle_rate ?? computedTotal;

          return (
            <div className="flex justify-end pt-2">
              <div className="w-full sm:w-72 bg-slate-50 dark:bg-slate-950/80 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Cycle Subtotal:</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{formatCurrency(displaySubtotal)}</span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Estimated Tax (18%):</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{formatCurrency(displayTax)}</span>
                </div>
                <div className="border-t border-slate-200 dark:border-slate-800 pt-2 flex justify-between text-sm font-black text-slate-900 dark:text-white">
                  <span>Recurring Cycle Rate:</span>
                  <span className="text-emerald-400">{formatCurrency(displayTotal)}</span>
                </div>
              </div>
            </div>
          );
        })()}
      </div>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={actionConfirm.open}
        onClose={() => setActionConfirm({ open: false, status: '', message: '' })}
        onConfirm={() => handleStatusChange(actionConfirm.status)}
        title={`Confirm ${actionConfirm.status} Action`}
        message={actionConfirm.message}
        type={actionConfirm.status === 'Closed' ? 'danger' : 'success'}
        confirmText={`Yes, ${actionConfirm.status}`}
        isLoading={isUpdating}
      />
    </div>
  );
}
