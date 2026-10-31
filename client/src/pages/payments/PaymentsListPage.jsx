import React, { useState, useEffect } from 'react';
import DataTable from '../../components/tables/DataTable.jsx';
import Badge from '../../components/common/Badge.jsx';
import { paymentApi } from '../../api/paymentApi.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { formatCurrency, formatDate } from '../../utils/formatters.js';
import { CreditCard, CheckCircle2 } from 'lucide-react';

export default function PaymentsListPage() {
  const [payments, setPayments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const { role, profile } = useAuth();
  const { error } = useToast();
  const isCustomer = role === 'customer';

  const loadPayments = async () => {
    setIsLoading(true);
    try {
      const params = isCustomer ? { customerId: profile?.id } : {};
      const res = await paymentApi.getPayments(params);
      if (res?.data) {
        setPayments(res.data);
      }
    } catch (err) {
      error(err.message || 'Failed to load payments');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPayments();
  }, [profile?.id]);

  const totalCollected = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);

  const columns = [
    {
      key: 'invoiceNumber',
      label: 'Invoice Reference',
      render: (val, row) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-950/60 border border-emerald-800/40 text-emerald-400 flex items-center justify-center font-bold">
            <CreditCard className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-white">#{val || row.invoices?.invoice_number || 'INV'}</span>
            <p className="text-[11px] text-slate-400">Date: {formatDate(row.paymentDate || row.payment_date)}</p>
          </div>
        </div>
      ),
    },
    ...(!isCustomer
      ? [
          {
            key: 'customerName',
            label: 'Customer',
            render: (val, row) => (
              <span className="font-medium text-slate-200">
                {val || row.customer_name || 'Customer'}
              </span>
            ),
          },
        ]
      : []),
    {
      key: 'method',
      label: 'Payment Method',
      render: (val) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-950/80 border border-indigo-800/40 text-indigo-300">
          {val || 'UPI'}
        </span>
      ),
    },
    {
      key: 'amount',
      label: 'Amount Paid',
      align: 'right',
      render: (val) => (
        <span className="font-black text-emerald-400 text-sm">
          {formatCurrency(val)}
        </span>
      ),
    },
    {
      key: 'note',
      label: 'Reference / Note',
      render: (val) => (
        <span className="text-xs text-slate-400 line-clamp-1">
          {val || 'Direct Payment'}
        </span>
      ),
    },
    ...(!isCustomer
      ? [
          {
            key: 'receivedBy',
            label: 'Received By',
            render: (val, row) => (
              <span className="text-xs text-slate-400">
                {val || row.received_by || 'Staff'}
              </span>
            ),
          },
        ]
      : []),
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white">
            {isCustomer ? 'My Payment Receipts' : 'Payments Received'}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {isCustomer
              ? 'View all settled transaction receipts and payment timestamps.'
              : 'Audit all completed customer transactions across UPI, Net Banking, and Cards.'}
          </p>
        </div>

        {/* Total Banner */}
        <div className="p-3 bg-emerald-950/40 border border-emerald-800/60 rounded-xl flex items-center gap-3">
          <div className="p-2 bg-emerald-900/60 text-emerald-400 rounded-lg">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-emerald-300 font-semibold uppercase">Total Cleared</span>
            <p className="text-lg font-black text-white">{formatCurrency(totalCollected)}</p>
          </div>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={payments}
        isLoading={isLoading}
        searchPlaceholder="Search payments by invoice or customer..."
        searchField={['invoiceNumber', 'customerName', 'note', 'method']}
        filterOptions={{
          label: 'Method',
          key: 'method',
          options: ['UPI', 'Bank Transfer', 'Credit Card', 'Cash'],
        }}
        emptyTitle="No payment records found"
        emptyDescription="Recorded invoice payments will appear here in chronological order."
      />
    </div>
  );
}
