import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DataTable from '../../components/tables/DataTable.jsx';
import Button from '../../components/common/Button.jsx';
import Badge from '../../components/common/Badge.jsx';
import { quotationApi } from '../../api/quotationApi.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { formatCurrency, formatDate } from '../../utils/formatters.js';
import { Plus, FileText, ArrowRight } from 'lucide-react';

export default function QuotationsListPage() {
  const [quotations, setQuotations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const { role, profile } = useAuth();
  const { error } = useToast();
  const navigate = useNavigate();

  const basePath = role === 'admin' ? '/admin' : role === 'staff' ? '/staff' : '/portal';
  const isCustomer = role === 'customer';

  const loadQuotations = async () => {
    setIsLoading(true);
    try {
      const params = isCustomer ? { customerId: profile?.id } : {};
      const res = await quotationApi.getQuotations(params);
      if (res?.data) {
        setQuotations(res.data);
      }
    } catch (err) {
      error(err.message || 'Failed to load quotations');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadQuotations();
  }, [profile?.id]);

  const columns = [
    {
      key: 'quoteNumber',
      label: 'Quote Number',
      render: (val, row) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-950/60 border border-indigo-800/40 text-indigo-400 flex items-center justify-center font-bold">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-white">{val || row.quote_number || 'QT-DRAFT'}</span>
            <p className="text-[11px] text-slate-400">Created: {formatDate(row.createdAt || row.created_at)}</p>
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
      key: 'planName',
      label: 'Plan',
      render: (val, row) => val || row.plans?.name || 'Standard Plan',
    },
    {
      key: 'validUntil',
      label: 'Valid Until',
      render: (val, row) => formatDate(val || row.valid_until),
    },
    {
      key: 'total',
      label: 'Total Amount',
      align: 'right',
      render: (val) => (
        <span className="font-bold text-emerald-400">
          {formatCurrency(val)}
        </span>
      ),
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
          onClick={() => navigate(`${basePath}/quotations/${row.id}`)}
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
            {isCustomer ? 'My Quotations' : 'Subscription Quotations'}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {isCustomer
              ? 'Review pending offers and accepted subscription quotations.'
              : 'Create commercial proposals, snapshot variant prices, and convert to active subscriptions.'}
          </p>
        </div>

        {!isCustomer && (
          <Button
            variant="primary"
            size="sm"
            icon={Plus}
            onClick={() => navigate(`${basePath}/quotations/new`)}
          >
            Create Quotation
          </Button>
        )}
      </div>

      <DataTable
        columns={columns}
        data={quotations}
        isLoading={isLoading}
        searchPlaceholder="Search quotation number or customer..."
        searchField={['quoteNumber', 'quote_number', 'customerName', 'planName']}
        filterOptions={{
          label: 'Status',
          key: 'status',
          options: ['Draft', 'Quotation', 'Accepted', 'Rejected', 'Expired'],
        }}
        onRowClick={(row) => navigate(`${basePath}/quotations/${row.id}`)}
        emptyTitle="No quotations found"
        emptyDescription="Create a quotation for a customer to begin a new subscription contract."
      />
    </div>
  );
}
