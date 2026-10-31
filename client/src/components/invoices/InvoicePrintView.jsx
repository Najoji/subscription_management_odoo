import React from 'react';
import { Printer, Download, CheckCircle2, AlertCircle } from 'lucide-react';
import Button from '../common/Button.jsx';
import Badge from '../common/Badge.jsx';
import { formatCurrency, formatDate } from '../../utils/formatters.js';

export default function InvoicePrintView({ invoice, onRecordPayment }) {
  if (!invoice) return null;

  const handlePrint = () => {
    window.print();
  };

  const balance = Math.max(0, Number(invoice.total || 0) - Number(invoice.amountPaid || 0));

  return (
    <div className="bg-white text-slate-900 rounded-2xl border border-slate-200 shadow-xl overflow-hidden print:border-none print:shadow-none">
      {/* Action Bar (Hidden on print) */}
      <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between print:hidden">
        <div className="flex items-center gap-2">
          <Badge status={invoice.status} />
          <span className="text-xs text-slate-500">Invoice ID: {invoice.id}</span>
        </div>
        <div className="flex items-center gap-2">
          {invoice.status !== 'Paid' && invoice.status !== 'Cancelled' && onRecordPayment && (
            <Button size="sm" variant="success" onClick={onRecordPayment}>
              Record Payment
            </Button>
          )}
          <Button size="sm" variant="outline" icon={Printer} onClick={handlePrint}>
            Print Invoice
          </Button>
        </div>
      </div>

      {/* Printable Sheet */}
      <div className="p-8 sm:p-12 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-6 border-b border-slate-100 pb-8">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-black text-lg">
                B
              </div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900">
                Brightloop
              </h1>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Subscription Management & Recurring Billing Platform
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              support@brightloop.com • billing.brightloop.internal
            </p>
          </div>

          <div className="sm:text-right">
            <h2 className="text-xl font-bold tracking-tight text-indigo-600">
              INVOICE
            </h2>
            <p className="text-sm font-semibold text-slate-800 mt-0.5">
              #{invoice.invoiceNumber || 'INV-DRAFT'}
            </p>
            <div className="mt-2 text-xs text-slate-500 space-y-0.5">
              <p>Issue Date: <span className="font-medium text-slate-700">{formatDate(invoice.issueDate)}</span></p>
              <p>Due Date: <span className="font-medium text-slate-700">{formatDate(invoice.dueDate)}</span></p>
              {invoice.periodStart && invoice.periodEnd && (
                <p>Billing Period: <span className="font-medium text-slate-700">{formatDate(invoice.periodStart)} – {formatDate(invoice.periodEnd)}</span></p>
              )}
            </div>
          </div>
        </div>

        {/* Bill To & Subscription Meta */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 text-xs">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
            <p className="font-bold text-slate-500 uppercase tracking-wider mb-2">
              Bill To
            </p>
            <p className="text-sm font-bold text-slate-900">
              {invoice.customerName || invoice.profiles?.full_name || 'Valued Customer'}
            </p>
            <p className="text-slate-600 mt-0.5">
              {invoice.customerEmail || invoice.profiles?.email || 'customer@brightloop.com'}
            </p>
            {invoice.profiles?.phone && (
              <p className="text-slate-600 mt-0.5">{invoice.profiles.phone}</p>
            )}
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 sm:text-right">
            <p className="font-bold text-slate-500 uppercase tracking-wider mb-2">
              Subscription Reference
            </p>
            <p className="text-sm font-bold text-indigo-600">
              {invoice.subscriptionNumber || invoice.subscriptions?.subscription_number || 'Direct Subscription'}
            </p>
            <p className="text-slate-500 mt-0.5">
              Payment Terms: <span className="font-medium text-slate-700">{invoice.subscriptions?.payment_terms || '15 Days Net'}</span>
            </p>
            <div className="mt-2 inline-flex items-center">
              <Badge status={invoice.status} />
            </div>
          </div>
        </div>

        {/* Line Items Table */}
        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className="p-3.5">Item Description</th>
                <th className="p-3.5 text-center">Qty</th>
                <th className="p-3.5 text-right">Unit Price</th>
                <th className="p-3.5 text-right">Tax Rate</th>
                <th className="p-3.5 text-right">Tax Amount</th>
                <th className="p-3.5 text-right">Line Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(invoice.items || invoice.invoice_items || []).length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-4 text-center text-slate-400">
                    No item lines in this invoice snapshot
                  </td>
                </tr>
              ) : (
                (invoice.items || invoice.invoice_items || []).map((item, idx) => (
                  <tr key={item.id || idx}>
                    <td className="p-3.5">
                      <p className="font-bold text-slate-900">
                        {item.productName || item.products?.name || item.description || 'Subscription Line'}
                      </p>
                      {item.variantName && (
                        <p className="text-indigo-600 font-medium text-[11px]">
                          Variant: {item.variantName}
                        </p>
                      )}
                    </td>
                    <td className="p-3.5 text-center font-medium text-slate-700">
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

        {/* Financial Summary */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-6 pt-2">
          <div className="max-w-xs text-xs text-slate-500">
            <p className="font-semibold text-slate-700 mb-1">Notes & Instructions:</p>
            <p>
              Please quote invoice number #{invoice.invoiceNumber || 'INV'} when making payments via UPI or Bank Transfer.
            </p>
          </div>

          <div className="w-full sm:w-72 bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal:</span>
              <span className="font-semibold text-slate-800">{formatCurrency(invoice.subtotal)}</span>
            </div>
            {Number(invoice.discountTotal || invoice.discount_total || 0) > 0 && (
              <div className="flex justify-between text-emerald-600">
                <span>Discount:</span>
                <span className="font-semibold">-{formatCurrency(invoice.discountTotal || invoice.discount_total)}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-600">
              <span>Tax (GST):</span>
              <span className="font-semibold text-slate-800">{formatCurrency(invoice.taxTotal || invoice.tax_total)}</span>
            </div>
            <div className="border-t border-slate-200 pt-2 flex justify-between text-sm font-black text-slate-900">
              <span>Total:</span>
              <span className="text-indigo-600">{formatCurrency(invoice.total)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Amount Paid:</span>
              <span className="font-semibold text-emerald-600">{formatCurrency(invoice.amountPaid || invoice.amount_paid || 0)}</span>
            </div>
            <div className="border-t border-slate-200 pt-1.5 flex justify-between font-bold text-slate-900">
              <span>Balance Due:</span>
              <span className={balance > 0 ? 'text-rose-600' : 'text-emerald-600'}>
                {formatCurrency(balance)}
              </span>
            </div>
          </div>
        </div>

        {/* Payments Section */}
        {invoice.payments && invoice.payments.length > 0 && (
          <div className="border-t border-slate-100 pt-6">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
              Recorded Payments
            </h4>
            <div className="space-y-2 text-xs">
              {invoice.payments.map((p) => (
                <div key={p.id} className="flex items-center justify-between p-2.5 bg-emerald-50/60 border border-emerald-100 rounded-lg text-emerald-900">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span className="font-semibold">{p.method} Payment</span>
                    <span className="text-slate-500">• {formatDate(p.paymentDate || p.payment_date)}</span>
                    {p.note && <span className="text-slate-600 text-[11px]">({p.note})</span>}
                  </div>
                  <span className="font-bold text-emerald-700">{formatCurrency(p.amount)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
