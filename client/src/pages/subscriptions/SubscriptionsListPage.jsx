import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DataTable from '../../components/tables/DataTable.jsx';
import Button from '../../components/common/Button.jsx';
import Badge from '../../components/common/Badge.jsx';
import RunBillingModal from '../../components/billing/RunBillingModal.jsx';
import { subscriptionApi } from '../../api/subscriptionApi.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { formatCurrency, formatDate } from '../../utils/formatters.js';
import { Repeat, Zap, ArrowRight } from 'lucide-react';

export default function SubscriptionsListPage() {
  const [subscriptions, setSubscriptions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [billingModalOpen, setBillingModalOpen] = useState(false);

  const { role, profile } = useAuth();
  const { error } = useToast();
  const navigate = useNavigate();

  const basePath = role === 'admin' ? '/admin' : role === 'staff' ? '/staff' : '/portal';
  const isCustomer = role === 'customer';

  const loadSubscriptions = async () => {
    setIsLoading(true);
    try {
      const params = isCustomer ? { customerId: profile?.id } : {};
      const res = await subscriptionApi.getSubscriptions(params);
      if (res?.data) {
        setSubscriptions(res.data);
      }
    } catch (err) {
      error(err.message || 'Failed to load subscriptions');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSubscriptions();

    const handleRefresh = () => loadSubscriptions();
    window.addEventListener('billing-run-completed', handleRefresh);
    return () => window.removeEventListener('billing-run-completed', handleRefresh);
  }, [profile?.id]);

  const columns = [
    {
      key: 'subscriptionNumber',
      label: 'Subscription Number',
      render: (val, row) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-950/60 border border-indigo-800/40 text-indigo-400 flex items-center justify-center font-bold">
            <Repeat className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-white">{val || row.subscription_number || 'SUB-DRAFT'}</span>
            <p className="text-[11px] text-slate-400">Started: {formatDate(row.startDate || row.start_date)}</p>
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
      render: (val, row) => val || row.plans?.name || 'Standard Monthly',
    },
    {
      key: 'nextBillingDate',
      label: 'Next Billing Date',
      render: (val, row) => (
        <span className="font-semibold text-indigo-400">
          {formatDate(val || row.next_billing_date)}
        </span>
      ),
    },
    {
      key: 'total',
      label: 'Cycle Rate',
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
          onClick={() => navigate(`${basePath}/subscriptions/${row.id}`)}
          className="text-xs text-indigo-400 hover:text-white"
        >
          Manage <ArrowRight className="w-3.5 h-3.5 ml-1" />
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
            {isCustomer ? 'My Subscriptions' : 'Subscriptions Management'}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {isCustomer
              ? 'View your active software services, plan terms, and renewal cycles.'
              : 'Monitor subscription contracts, manage pauses/resumptions, and execute billing cycles.'}
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
        data={subscriptions}
        isLoading={isLoading}
        searchPlaceholder="Search subscription number or customer..."
        searchField={['subscriptionNumber', 'subscription_number', 'customerName', 'planName']}
        filterOptions={{
          label: 'Status',
          key: 'status',
          options: ['Active', 'Confirmed', 'Paused', 'Closed'],
        }}
        onRowClick={(row) => navigate(`${basePath}/subscriptions/${row.id}`)}
        emptyTitle="No subscriptions found"
        emptyDescription="Convert accepted quotations into active subscriptions to view them here."
      />

      <RunBillingModal
        isOpen={billingModalOpen}
        onClose={() => setBillingModalOpen(false)}
        onSuccess={() => loadSubscriptions()}
      />
    </div>
  );
}
