import React, { useState, useEffect } from 'react';
import DataTable from '../../components/tables/DataTable.jsx';
import Button from '../../components/common/Button.jsx';
import Badge from '../../components/common/Badge.jsx';
import PlanCreateModal from './PlanCreateModal.jsx';
import { planApi } from '../../api/planApi.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { formatDate } from '../../utils/formatters.js';
import { Plus, CalendarDays, CheckCircle2, XCircle } from 'lucide-react';

export default function PlansListPage() {
  const [plans, setPlans] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const { role } = useAuth();
  const { error } = useToast();
  const isAdmin = role === 'admin';

  const loadPlans = async () => {
    setIsLoading(true);
    try {
      const res = await planApi.getPlans();
      if (res?.data) {
        setPlans(res.data);
      }
    } catch (err) {
      error(err.message || 'Failed to load subscription plans');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPlans();
  }, []);

  const columns = [
    {
      key: 'name',
      label: 'Plan Name',
      render: (val) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-950/60 border border-indigo-800/40 text-indigo-400 flex items-center justify-center font-bold">
            <CalendarDays className="w-4 h-4" />
          </div>
          <span className="font-bold text-white">{val}</span>
        </div>
      ),
    },
    {
      key: 'billingInterval',
      label: 'Billing Interval',
      render: (val, row) => (
        <span className="capitalize font-semibold text-slate-300">
          Every {row.intervalCount || row.interval_count || 1} {val}
        </span>
      ),
    },
    {
      key: 'minimumQuantity',
      label: 'Min Quantity',
      align: 'center',
      render: (val, row) => (
        <span className="font-medium text-slate-300">
          {val || row.minimum_quantity || 1} units
        </span>
      ),
    },
    {
      key: 'availableDates',
      label: 'Availability Window',
      render: (_, row) => {
        const from = row.availableFrom || row.available_from;
        const to = row.availableTo || row.available_to;
        return (
          <span className="text-xs text-slate-400">
            {from ? formatDate(from) : 'Immediate'} – {to ? formatDate(to) : 'Indefinite'}
          </span>
        );
      },
    },
    {
      key: 'policies',
      label: 'Lifecycle Rules',
      render: (_, row) => {
        const pause = row.allowPause !== false && row.allow_pause !== false;
        const early = row.allowEarlyClose !== false && row.allow_early_close !== false;
        const renew = row.allowRenewal !== false && row.allow_renewal !== false;
        return (
          <div className="flex items-center gap-2 text-[11px]">
            <span className={`px-2 py-0.5 rounded border ${pause ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/40' : 'bg-slate-800 text-slate-500 border-slate-700'}`}>
              Pause
            </span>
            <span className={`px-2 py-0.5 rounded border ${early ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/40' : 'bg-slate-800 text-slate-500 border-slate-700'}`}>
              Early Close
            </span>
            <span className={`px-2 py-0.5 rounded border ${renew ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/40' : 'bg-slate-800 text-slate-500 border-slate-700'}`}>
              Renewal
            </span>
          </div>
        );
      },
    },
    {
      key: 'isActive',
      label: 'Status',
      align: 'center',
      render: (val, row) => {
        const active = val !== false && row.is_active !== false;
        return <Badge status={active ? 'Active' : 'Closed'} label={active ? 'Active' : 'Inactive'} />;
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white">
            Subscription Plans
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Configure recurring billing cadences (daily, weekly, monthly, yearly) and policy permissions.
          </p>
        </div>

        {isAdmin && (
          <Button
            variant="primary"
            size="sm"
            icon={Plus}
            onClick={() => setCreateModalOpen(true)}
          >
            Create Plan
          </Button>
        )}
      </div>

      <DataTable
        columns={columns}
        data={plans}
        isLoading={isLoading}
        searchPlaceholder="Search plans by name..."
        searchField="name"
        emptyTitle="No plans configured"
        emptyDescription="Define recurring billing plans for monthly, quarterly, or annual contracts."
      />

      <PlanCreateModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSuccess={() => loadPlans()}
      />
    </div>
  );
}
