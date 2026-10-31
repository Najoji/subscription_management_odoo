import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DataTable from '../../components/tables/DataTable.jsx';
import Button from '../../components/common/Button.jsx';
import Badge from '../../components/common/Badge.jsx';
import RunBillingModal from '../../components/billing/RunBillingModal.jsx';
import { invoiceApi } from '../../api/invoiceApi.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { formatCurrency, formatDate } from '../../utils/formatters.js';
import { Receipt, Zap, ArrowRight, Printer } from 'lucide-react';

export default function InvoicesListPage() {
  const [invoices, setInvoices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [billingModalOpen, setBillingModalOpen] = useState(false);

  const { role, profile } = useAuth();
  const { error } = useToast();
  const navigate = useNavigate();

  const basePath = role === 'admin' ? '/admin' : role === 'staff' ? '/staff' : '/portal';
  const isCustomer = role === 'customer';

  const loadInvoices = async () => {
    setIsLoading(true);
    try {
      const params = isCustomer ? { customerId: profile?.id } : {};
      const res = await invoiceApi.getInvoices(params);
      if (res?.data) {
        setInvoices(res.data);
      }
    } catch (err) {
      error(err.message || 'Failed to load invoices');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInvoices();

    const handleRefresh = () => loadInvoices();
    window.addEventListener('billing-run-completed', handleRefresh);
    return () => window.removeEventListener('billing-run-completed', handleRefresh);
  }, [profile?.id]);

  const columns = [
    {
      key: 'invoiceNumber',
      label: 'Invoice Number',
      render: (val, row) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-950/60 border border-indigo-800/40 text-indigo-400 flex items-center justify-center font-bold">
            <Receipt className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-white">{val || row.invoice_number || 'INV-DRAFT'}</span>
            <p className="text-[11px] text-slate-400">Issued: {formatDate(row.issueDate || row.issue_date)}</p>
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
                {val || row.profiles?.full_name || row.profiles?.email || 'Customer'}
              </span>
            ),
          },
        ]
      : []),
    {
      key: 'period',
      label: 'Billing Period',
      render: (_, row) => {
        const start = row.periodStart || row.period_start;
        const end = row.periodEnd || row.period_end;
        return (
          <span className="text-xs text-slate-300">
            {start && end ? `${formatDate(start)} – ${formatDate(end)}` : 'Recurring'}
          </span>
        );
      },
    },
    {
      key: 'dueDate',
      label: 'Due Date',
      render: (val, row) => formatDate(val || row.due_date),
    },
    {
      key: 'total',
      label: 'Invoice Total',
      align: 'right',
      render: (val) => (
        <span className="font-bold text-white">
          {formatCurrency(val)}
        </span>
      ),
    },
    {
      key: 'amountPaid',
      label: 'Paid',
      align: 'right',
      render: (val, row) => (
        <span className="font-semibold text-emerald-400">
          {formatCurrency(val || row.amount_paid || 0)}
        </span>
      ),
    },
    {
      key: 'balance',
      label: 'Balance Due',
      align: 'right',
      render: (_, row) => {
        const total = Number(row.total || 0);
        const paid = Number(row.amountPaid || row.amount_paid || 0);
        const bal = Math.max(0, total - paid);
        return (
          <span className={`font-bold ${bal > 0 ? 'text-rose-400' : 'text-slate-400'}`}>
            {formatCurrency(bal)}
          </span>
        );
      },
    },
    {
      key: 'status',
      label: 'Status',
      align: 'center',
      render: (val) => <Badge status={val} />,
    },
    {
      key: 'actions',
      label: '',
      align: 'right',
      render: (_, row) => (
        <Button
          size="sm"
          variant="ghost"
          onClick={() => navigate(`${basePath}/invoices/${row.id}`)}
          className="text-xs text-indigo-400 hover:text-white"
        >
          View <ArrowRight className="w-3.5 h-3.5 ml-1" />
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white">
            {isCustomer ? 'My Invoices' : 'Invoices & Billing'}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {isCustomer
              ? 'View statements, itemized taxes, and record payments.'
              : 'Review due invoices generated from subscriptions, confirm drafts, and record payments.'}
          </p>
        </div>

        {!isCustomer && (
          <Button
            variant="primary"
            size="sm"
            icon={Zap}
            onClick={() => setBillingModalOpen(true)}
          >
            Run Billing
          </Button>
        )}
      </div>

      <DataTable
        columns={columns}
        data={invoices}
        isLoading={isLoading}
        searchPlaceholder="Search invoice number or customer..."
        searchField={['invoiceNumber', 'invoice_number', 'customerName']}
        filterOptions={{
          label: 'Status',
          key: 'status',
          options: ['Draft', 'Confirmed', 'Paid', 'Cancelled'],
        }}
        onRowClick={(row) => navigate(`${basePath}/invoices/${row.id}`)}
        emptyTitle="No invoices found"
        emptyDescription="Execute the billing engine to generate invoices for due active subscriptions."
      />

      <RunBillingModal
        isOpen={billingModalOpen}
        onClose={() => setBillingModalOpen(false)}
        onSuccess={() => loadInvoices()}
      />
    </div>
  );
}
