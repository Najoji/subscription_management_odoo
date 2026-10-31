import React, { useState } from 'react';
import {
  Printer,
  Download,
  CheckCircle2,
  AlertCircle,
  Building2,
  Calendar,
  CreditCard,
  FileText,
  Mail,
  Phone,
  Clock,
  Ban,
  Loader2,
} from 'lucide-react';
import Button from '../common/Button.jsx';
import Badge from '../common/Badge.jsx';
import { formatCurrency, formatDate } from '../../utils/formatters.js';
import { COMPANY_CONFIG } from '../../config/company.js';
import { invoiceApi } from '../../api/invoiceApi.js';
import { useToast } from '../../context/ToastContext.jsx';

export default function InvoicePrintView({ invoice, onRecordPayment }) {
  const { success, error: toastError } = useToast();
  const [isDownloading, setIsDownloading] = useState(false);

  if (!invoice) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    if (isDownloading) return;
    setIsDownloading(true);
    try {
      await invoiceApi.downloadPdf(invoice.id, invoice.invoice_number || invoice.invoiceNumber);
      success('Invoice PDF downloaded successfully!');
    } catch (err) {
      console.error('Download PDF error:', err);
      toastError(err.message || 'Failed to download PDF invoice.');
    } finally {
      setIsDownloading(false);
    }
  };

  const total = Number(invoice.total || 0);
  const amountPaid = Number(invoice.amount_paid || invoice.amountPaid || 0);
  const balance = Math.max(0, total - amountPaid);
  const discountTotal = Number(invoice.discount_total || invoice.discountTotal || 0);
  const taxTotal = Number(invoice.tax_total || invoice.taxTotal || 0);
  const subtotal = Number(invoice.subtotal || 0);

  // Status computation for banner display
  const statusUpper = (invoice.status || 'Draft').toUpperCase();
  const isOverdue =
    statusUpper === 'CONFIRMED' &&
    invoice.due_date &&
    new Date(invoice.due_date) < new Date() &&
    balance > 0;

  const displayStatus = isOverdue
    ? 'OVERDUE'
    : statusUpper === 'PAID'
    ? 'PAID'
    : balance < total && balance > 0
    ? 'PARTIALLY PAID'
    : statusUpper === 'CANCELLED'
    ? 'CANCELLED'
    : statusUpper;

  // Status visual attributes
  const statusStyles = {
    PAID: { bg: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20', icon: CheckCircle2 },
    'PARTIALLY PAID': { bg: 'bg-amber-500/10 text-amber-500 border-amber-500/20', icon: Clock },
    CONFIRMED: { bg: 'bg-blue-500/10 text-blue-500 border-blue-500/20', icon: CheckCircle2 },
    OVERDUE: { bg: 'bg-rose-500/10 text-rose-500 border-rose-500/20', icon: AlertCircle },
    CANCELLED: { bg: 'bg-slate-500/10 text-slate-400 border-slate-500/20', icon: Ban },
    DRAFT: { bg: 'bg-slate-500/10 text-slate-400 border-slate-500/20', icon: FileText },
  };
  const activeStyle = statusStyles[displayStatus] || statusStyles.DRAFT;
  const StatusIcon = activeStyle.icon;

  const items = invoice.invoice_items || invoice.items || [];
  const payments = invoice.payments || [];

  return (
    <div className="bg-white text-slate-900 rounded-2xl border border-slate-200 shadow-xl overflow-hidden print:border-none print:shadow-none print:rounded-none">
      {/* Action Bar (Hidden on print) */}
      <div className="p-4 sm:p-5 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div className="flex items-center gap-3">
          <div className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 ${activeStyle.bg}`}>
            <StatusIcon className="w-3.5 h-3.5" />
            <span>{displayStatus}</span>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            #{invoice.invoice_number || invoice.invoiceNumber || 'INV-DRAFT'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {invoice.status !== 'Paid' && invoice.status !== 'Cancelled' && onRecordPayment && (
            <Button size="sm" variant="success" icon={CreditCard} onClick={onRecordPayment}>
              Record Payment
            </Button>
          )}

          <Button
            size="sm"
            variant="primary"
            icon={isDownloading ? Loader2 : Download}
            onClick={handleDownloadPdf}
            disabled={isDownloading}
            className="shadow-sm"
          >
            {isDownloading ? 'Generating PDF...' : 'Download PDF'}
          </Button>

          <Button size="sm" variant="outline" icon={Printer} onClick={handlePrint} className="bg-slate-800 text-slate-200 hover:text-white border-slate-700">
            Print
          </Button>
        </div>
      </div>

      {/* Printable Sheet */}
      <div className="p-8 sm:p-12 space-y-8 print:p-0 print:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-6 border-b border-slate-100 pb-8">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-black text-xl shadow-md">
                B
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tight text-slate-900">
                  {COMPANY_CONFIG.brandName}
                </h1>
                <p className="text-xs text-slate-500 font-medium">{COMPANY_CONFIG.tagline}</p>
              </div>
            </div>

            <div className="mt-3 text-xs text-slate-500 space-y-0.5">
              <p>{COMPANY_CONFIG.name}</p>
              <p>{COMPANY_CONFIG.addressLine1}, {COMPANY_CONFIG.addressLine2}</p>
              <p>Email: <span className="text-slate-700">{COMPANY_CONFIG.email}</span> • Phone: <span className="text-slate-700">{COMPANY_CONFIG.phone}</span></p>
              {COMPANY_CONFIG.gstin && (
                <p className="font-semibold text-slate-700">GSTIN: {COMPANY_CONFIG.gstin}</p>
              )}
            </div>
          </div>

          <div className="sm:text-right">
            <h2 className="text-2xl font-black tracking-tight text-indigo-600">
              TAX INVOICE
            </h2>
            <p className="text-base font-bold text-slate-800 mt-0.5 font-mono">
              #{invoice.invoice_number || invoice.invoiceNumber || 'INV-DRAFT'}
            </p>
            <div className="mt-3 text-xs text-slate-600 space-y-1">
              <p>Issue Date: <span className="font-semibold text-slate-800">{formatDate(invoice.issue_date || invoice.issueDate)}</span></p>
              <p>Due Date: <span className="font-semibold text-slate-800">{formatDate(invoice.due_date || invoice.dueDate)}</span></p>
              {(invoice.period_start || invoice.periodStart) && (invoice.period_end || invoice.periodEnd) && (
                <p>Billing Period: <span className="font-medium text-slate-700">{formatDate(invoice.period_start || invoice.periodStart)} – {formatDate(invoice.period_end || invoice.periodEnd)}</span></p>
              )}
            </div>
          </div>
        </div>

        {/* Bill To & Subscription Meta */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
          <div className="bg-slate-50 p-5 rounded-xl border border-slate-200/80">
            <p className="font-bold text-indigo-600 uppercase tracking-wider text-[11px] mb-2 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5" /> Billed To
            </p>
            <p className="text-sm font-bold text-slate-900">
              {invoice.customer_name || invoice.profiles?.full_name || 'Valued Customer'}
            </p>
            <p className="text-slate-600 mt-1 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-slate-400" />
              {invoice.customer_email || invoice.profiles?.email || 'customer@brightloop.com'}
            </p>
            {invoice.profiles?.phone && (
              <p className="text-slate-600 mt-1 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                {invoice.profiles.phone}
              </p>
            )}
            <p className="text-slate-500 mt-1 text-[11px]">GSTIN / State: Unregistered / Karnataka (29)</p>
          </div>

          <div className="bg-slate-50 p-5 rounded-xl border border-slate-200/80">
            <p className="font-bold text-indigo-600 uppercase tracking-wider text-[11px] mb-2 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" /> Subscription Reference
            </p>
            <div className="space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Subscription #:</span>
                <span className="font-bold text-indigo-600 font-mono">
                  {invoice.subscription_number || invoice.subscriptions?.subscription_number || 'Direct'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Payment Terms:</span>
                <span className="font-semibold text-slate-800">
                  {invoice.subscriptions?.payment_terms || '15 Days Net'}
                </span>
              </div>
              <div className="flex justify-between items-center pt-1 border-t border-slate-200/60">
                <span className="text-slate-500">Invoice Status:</span>
                <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${activeStyle.bg}`}>
                  {displayStatus}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Line Items Table */}
        <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="p-3.5">Description</th>
                <th className="p-3.5">Variant</th>
                <th className="p-3.5 text-center">Qty</th>
                <th className="p-3.5 text-right">Unit Price</th>
                <th className="p-3.5 text-right">Tax Rate</th>
                <th className="p-3.5 text-right">Tax Amount</th>
                <th className="p-3.5 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-slate-400">
                    No item lines in this invoice snapshot
                  </td>
                </tr>
              ) : (
                items.map((item, idx) => (
                  <tr key={item.id || idx} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-3.5">
                      <p className="font-bold text-slate-900">
                        {item.productName || item.products?.name || item.description || 'Subscription Line'}
                      </p>
                      {item.description && item.description !== item.products?.name && (
                        <p className="text-slate-500 text-[11px] mt-0.5">{item.description}</p>
                      )}
                    </td>
                    <td className="p-3.5">
                      {item.variantName || item.product_variants?.name ? (
                        <span className="inline-block px-2 py-0.5 bg-indigo-50 text-indigo-700 font-semibold rounded text-[11px]">
                          {item.variantName || item.product_variants?.name}
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="p-3.5 text-center font-semibold text-slate-700">
                      {item.quantity}
                    </td>
                    <td className="p-3.5 text-right font-medium text-slate-700">
                      {formatCurrency(item.unitPrice || item.unit_price)}
                    </td>
                    <td className="p-3.5 text-right font-medium text-slate-600">
                      {item.taxRate || item.tax_rate || 18}%
                    </td>
                    <td className="p-3.5 text-right font-medium text-slate-600">
                      {formatCurrency(item.taxAmount || item.tax_amount || 0)}
                    </td>
                    <td className="p-3.5 text-right font-bold text-slate-900">
                      {formatCurrency(item.lineTotal || item.line_total || item.line_subtotal)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Financial Summary & Bank Information */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
          {/* Bank / Payment info */}
          <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-2 text-xs">
            <p className="font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-2 flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-indigo-600" /> Payment & Bank Transfer Details
            </p>
            <div className="space-y-1 text-slate-600">
              <p><span className="text-slate-500">Bank:</span> <span className="font-semibold text-slate-800">{COMPANY_CONFIG.bankDetails.bankName}</span></p>
              <p><span className="text-slate-500">Account Name:</span> <span className="font-semibold text-slate-800">{COMPANY_CONFIG.bankDetails.accountName}</span></p>
              <p><span className="text-slate-500">Account No:</span> <span className="font-mono font-bold text-slate-900">{COMPANY_CONFIG.bankDetails.accountNumber}</span></p>
              <p><span className="text-slate-500">IFSC Code:</span> <span className="font-mono font-bold text-slate-900">{COMPANY_CONFIG.bankDetails.ifsc}</span></p>
              <p><span className="text-slate-500">Branch:</span> <span className="text-slate-700">{COMPANY_CONFIG.bankDetails.branch}</span></p>
            </div>
            <p className="text-[11px] text-slate-500 italic pt-2 border-t border-slate-200">
              {COMPANY_CONFIG.notes}
            </p>
          </div>

          {/* Financial Totals */}
          <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-2.5 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal:</span>
              <span className="font-semibold text-slate-800">{formatCurrency(subtotal)}</span>
            </div>

            {discountTotal > 0 && (
              <div className="flex justify-between text-emerald-600 font-medium">
                <span>Discount Applied:</span>
                <span>-{formatCurrency(discountTotal)}</span>
              </div>
            )}

            <div className="flex justify-between text-slate-600">
              <span>Tax (GST 18%):</span>
              <span className="font-semibold text-slate-800">{formatCurrency(taxTotal)}</span>
            </div>

            <div className="border-t border-slate-200 pt-2 flex justify-between text-base font-black text-slate-900">
              <span>Grand Total:</span>
              <span className="text-indigo-600">{formatCurrency(total)}</span>
            </div>

            <div className="flex justify-between text-slate-600 pt-1">
              <span>Amount Paid:</span>
              <span className="font-bold text-emerald-600">{formatCurrency(amountPaid)}</span>
            </div>

            <div className="border-t border-slate-200 pt-2 flex justify-between font-bold text-sm">
              <span className="text-slate-800">Outstanding Balance:</span>
              <span className={balance > 0 ? 'text-rose-600 font-black' : 'text-emerald-600 font-black'}>
                {formatCurrency(balance)}
              </span>
            </div>
          </div>
        </div>

        {/* Payments History Table */}
        <div className="border-t border-slate-200 pt-6">
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Payment History & Receipts
          </h4>

          {payments.length === 0 ? (
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-center text-xs text-slate-400">
              No payments recorded against this invoice yet.
            </div>
          ) : (
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="p-3">Payment Date</th>
                    <th className="p-3">Method</th>
                    <th className="p-3">Reference / Note</th>
                    <th className="p-3 text-right">Amount Paid</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {payments.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/50">
                      <td className="p-3 font-medium text-slate-800">
                        {formatDate(p.payment_date || p.paymentDate || p.created_at)}
                      </td>
                      <td className="p-3">
                        <span className="inline-block px-2 py-0.5 bg-emerald-50 text-emerald-700 font-semibold rounded text-[11px]">
                          {p.method}
                        </span>
                      </td>
                      <td className="p-3 text-slate-600">
                        {p.note || 'Recorded payment'}
                      </td>
                      <td className="p-3 text-right font-bold text-emerald-700">
                        {formatCurrency(p.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-6 border-t border-slate-200 text-center text-[11px] text-slate-400 space-y-1">
          <p>This is a computer generated invoice and requires no physical signature.</p>
          <p>Thank you for choosing Brightloop Technologies! For support, contact {COMPANY_CONFIG.supportEmail}</p>
        </div>
      </div>
    </div>
  );
}
