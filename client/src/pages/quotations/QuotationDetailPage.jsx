import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Card from '../../components/common/Card.jsx';
import Button from '../../components/common/Button.jsx';
import Badge from '../../components/common/Badge.jsx';
import Modal from '../../components/common/Modal.jsx';
import FormField from '../../components/forms/FormField.jsx';
import Input from '../../components/forms/Input.jsx';
import Select from '../../components/forms/Select.jsx';
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx';
import { quotationApi } from '../../api/quotationApi.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { formatCurrency, formatDate } from '../../utils/formatters.js';
import {
  FileText,
  ArrowLeft,
  CheckCircle2,
  Repeat,
  Calendar,
  CreditCard,
  Printer,
} from 'lucide-react';

export default function QuotationDetailPage() {
  const { id } = useParams();
  const { role } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();

  const [quotation, setQuotation] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [convertModalOpen, setConvertModalOpen] = useState(false);

  // Convert Form State
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [expiryDate, setExpiryDate] = useState(
    new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0]
  );
  const [paymentTerms, setPaymentTerms] = useState('15 days');
  const [isConverting, setIsConverting] = useState(false);

  const basePath = role === 'admin' ? '/admin' : role === 'staff' ? '/staff' : '/portal';
  const isCustomer = role === 'customer';

  const loadQuotation = async () => {
    setIsLoading(true);
    try {
      const res = await quotationApi.getQuotationById(id);
      if (res?.data) {
        setQuotation(res.data);
      } else {
        throw new Error('Quotation not found');
      }
    } catch (err) {
      error(err.message || 'Failed to load quotation');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadQuotation();
  }, [id]);

  const handleUpdateStatus = async (newStatus) => {
    try {
      await quotationApi.updateQuotationStatus(id, newStatus);
      success(`Quotation marked as ${newStatus}`);
      loadQuotation();
    } catch (err) {
      error(err.message || 'Failed to update quotation status');
    }
  };

  const handleConvertSubscription = async (e) => {
    e.preventDefault();
    setIsConverting(true);
    try {
      const payload = {
        startDate,
        expiryDate,
        paymentTerms,
      };

      const res = await quotationApi.convertQuotation(id, payload);
      if (res?.success) {
        success('Quotation converted to subscription successfully!');
        setConvertModalOpen(false);
        const subId = res.data?.id;
        if (subId) {
          navigate(`${basePath}/subscriptions/${subId}`);
        } else {
          navigate(`${basePath}/subscriptions`);
        }
      } else {
        throw new Error(res?.message || 'Conversion failed');
      }
    } catch (err) {
      error(err.message || 'Failed to convert quotation');
    } finally {
      setIsConverting(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner size="lg" message="Loading quotation details..." className="min-h-[60vh]" />;
  }

  if (!quotation) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-400">Quotation not found.</p>
        <Button onClick={() => navigate(`${basePath}/quotations`)} className="mt-4">
          Back to Quotations
        </Button>
      </div>
    );
  }

  const items = quotation.items || quotation.quotation_items || [];
  const isAccepted = quotation.status === 'Accepted';
  const isQuotationOrDraft = quotation.status === 'Quotation' || quotation.status === 'Draft' || quotation.status === 'Sent';

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          onClick={() => navigate(`${basePath}/quotations`)}
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Quotations
        </button>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {!isCustomer && isQuotationOrDraft && (
            <Button
              size="sm"
              variant="outline"
              icon={CheckCircle2}
              onClick={() => handleUpdateStatus('Accepted')}
            >
              Mark Accepted
            </Button>
          )}

          {!isCustomer && isAccepted && (
            <Button
              size="sm"
              variant="primary"
              icon={Repeat}
              onClick={() => setConvertModalOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              Convert into Subscription
            </Button>
          )}

          <Button
            size="sm"
            variant="outline"
            icon={Printer}
            onClick={() => window.print()}
          >
            Print
          </Button>
        </div>
      </div>

      {/* Main Quotation Sheet */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-10 shadow-lg space-y-8">
        {/* Header Block */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-6 border-b border-slate-200 dark:border-slate-800 pb-6">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                Formal Quotation
              </span>
              <Badge status={quotation.status} />
            </div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              #{quotation.quoteNumber || quotation.quote_number || 'QT-DRAFT'}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Created on: {formatDate(quotation.createdAt || quotation.created_at)}
            </p>
          </div>

          <div className="sm:text-right text-xs text-slate-500 dark:text-slate-400 space-y-1">
            <p>
              Valid Until: <span className="font-bold text-slate-900 dark:text-white">{formatDate(quotation.validUntil || quotation.valid_until)}</span>
            </p>
            <p>
              Plan: <span className="font-semibold text-indigo-400">{quotation.planName || quotation.plans?.name || 'Subscription Plan'}</span>
            </p>
          </div>
        </div>

        {/* Customer Information */}
        <div className="p-4 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
          <p className="font-bold text-slate-500 uppercase tracking-wider mb-1">
            Prepared For
          </p>
          <p className="text-sm font-bold text-slate-900 dark:text-white">
            {quotation.customerName || quotation.profiles?.full_name || 'Customer Organization'}
          </p>
          <p className="text-slate-400">{quotation.profiles?.email || 'customer@organization.com'}</p>
          {quotation.notes && (
            <p className="text-slate-300 italic mt-2 border-t border-slate-800/60 pt-2">
              Note: "{quotation.notes}"
            </p>
          )}
        </div>

        {/* Quoted Items Table */}
        <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className="p-3.5">Product & Variant</th>
                <th className="p-3.5 text-center">Qty</th>
                <th className="p-3.5 text-right">Agreed Unit Price</th>
                <th className="p-3.5 text-right">Line Total</th>
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
                    {formatCurrency(it.lineTotal || it.line_total || (it.unitPrice || it.unit_price) * it.quantity)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Financial Summary */}
        <div className="flex justify-end pt-2">
          <div className="w-full sm:w-72 bg-slate-50 dark:bg-slate-950/80 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
            <div className="flex justify-between text-slate-600 dark:text-slate-400">
              <span>Subtotal:</span>
              <span className="font-semibold text-slate-900 dark:text-white">{formatCurrency(quotation.subtotal)}</span>
            </div>
            {Number(quotation.discountTotal || quotation.discount_total || 0) > 0 && (
              <div className="flex justify-between text-emerald-400">
                <span>Discount:</span>
                <span className="font-semibold">-{formatCurrency(quotation.discountTotal || quotation.discount_total)}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-600 dark:text-slate-400">
              <span>Tax (GST 18%):</span>
              <span className="font-semibold text-slate-900 dark:text-white">{formatCurrency(quotation.taxTotal || quotation.tax_total)}</span>
            </div>
            <div className="border-t border-slate-200 dark:border-slate-800 pt-2 flex justify-between text-sm font-black text-slate-900 dark:text-white">
              <span>Grand Total:</span>
              <span className="text-indigo-400">{formatCurrency(quotation.total)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Convert to Subscription Modal */}
      <Modal
        isOpen={convertModalOpen}
        onClose={() => setConvertModalOpen(false)}
        title="Convert Quotation to Subscription"
        subtitle="Finalize subscription commencement and contractual payment terms"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleConvertSubscription} className="space-y-4">
          <FormField label="Start Date" required>
            <Input
              type="date"
              icon={Calendar}
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
          </FormField>

          <FormField label="Expiry Date" required>
            <Input
              type="date"
              icon={Calendar}
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              required
            />
          </FormField>

          <FormField label="Payment Terms" required>
            <Select
              options={[
                { value: 'Immediate', label: 'Due Upon Receipt' },
                { value: '15 days', label: '15 Days Net' },
                { value: '30 days', label: '30 Days Net' },
                { value: '45 days', label: '45 Days Net' },
              ]}
              value={paymentTerms}
              onChange={(e) => setPaymentTerms(e.target.value)}
            />
          </FormField>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button
              variant="outline"
              onClick={() => setConvertModalOpen(false)}
              disabled={isConverting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="success"
              icon={Repeat}
              isLoading={isConverting}
            >
              Confirm Conversion
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
