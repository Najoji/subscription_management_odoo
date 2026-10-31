import React, { useState, useEffect } from 'react';
import DataTable from '../../components/tables/DataTable.jsx';
import Button from '../../components/common/Button.jsx';
import Badge from '../../components/common/Badge.jsx';
import DiscountCreateModal from './DiscountCreateModal.jsx';
import { discountApi } from '../../api/discountApi.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { formatCurrency, formatDate } from '../../utils/formatters.js';
import { Plus, Percent, Tag } from 'lucide-react';

export default function DiscountsListPage() {
  const [discounts, setDiscounts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const { role } = useAuth();
  const { error } = useToast();
  const isAdmin = role === 'admin';

  const loadDiscounts = async () => {
    setIsLoading(true);
    try {
      const res = await discountApi.getDiscounts();
      if (res?.data) {
        setDiscounts(res.data);
      }
    } catch (err) {
      error(err.message || 'Failed to load discounts');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDiscounts();
  }, []);

  const columns = [
    {
      key: 'code',
      label: 'Discount Code',
      render: (val, row) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-950/60 border border-indigo-800/40 text-indigo-400 flex items-center justify-center font-bold">
            <Tag className="w-4 h-4" />
          </div>
          <div>
            <span className="font-mono font-bold text-white tracking-wider bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
              {val || row.name}
            </span>
            <p className="text-[11px] text-slate-400 mt-1">{row.name}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'value',
      label: 'Benefit',
      render: (val, row) => {
        const isPct = (row.discountType || row.discount_type) === 'percentage';
        return (
          <span className="font-bold text-emerald-400">
            {isPct ? `${val}% OFF` : `-${formatCurrency(val)}`}
          </span>
        );
      },
    },
    {
      key: 'applicableTo',
      label: 'Applies To',
      render: (val, row) => (
        <span className="capitalize text-slate-300 font-medium">
          {val || row.applicable_to || 'Subscription'}
        </span>
      ),
    },
    {
      key: 'thresholds',
      label: 'Purchase Criteria',
      render: (_, row) => {
        const minPurchase = row.minimumPurchase || row.minimum_purchase;
        const minQty = row.minimumQuantity || row.minimum_quantity;
        return (
          <div className="text-xs text-slate-300">
            {minPurchase ? <span>Min: {formatCurrency(minPurchase)}</span> : <span>No min amount</span>}
            {minQty && minQty > 1 && <span className="block text-slate-500 text-[11px]">Min {minQty} seats</span>}
          </div>
        );
      },
    },
    {
      key: 'validity',
      label: 'Promotion Validity',
      render: (_, row) => {
        const start = row.startAt || row.start_at;
        const end = row.endAt || row.end_at;
        return (
          <span className="text-xs text-slate-400">
            {start && end ? `${formatDate(start)} – ${formatDate(end)}` : 'Always active'}
          </span>
        );
      },
    },
    {
      key: 'usage',
      label: 'Redemptions',
      align: 'center',
      render: (_, row) => {
        const count = row.usageCount || row.usage_count || 0;
        const limit = row.usageLimit || row.usage_limit;
        return (
          <span className="text-xs text-slate-300">
            {count} / {limit ? limit : '∞'}
          </span>
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
            Discount & Promotional Rules
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Configure percentage and fixed price incentives automatically evaluated during billing.
          </p>
        </div>

        {isAdmin && (
          <Button
            variant="primary"
            size="sm"
            icon={Plus}
            onClick={() => setCreateModalOpen(true)}
          >
            Create Discount
          </Button>
        )}
      </div>

      <DataTable
        columns={columns}
        data={discounts}
        isLoading={isLoading}
        searchPlaceholder="Search discount code or name..."
        searchField={['code', 'name']}
        emptyTitle="No discounts active"
        emptyDescription="Create a promotional discount code to apply savings to customer quotations or subscriptions."
      />

      <DiscountCreateModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSuccess={() => loadDiscounts()}
      />
    </div>
  );
}
