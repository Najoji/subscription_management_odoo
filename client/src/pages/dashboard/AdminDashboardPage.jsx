import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import StatCard from '../../components/dashboard/StatCard.jsx';
import RevenueChart from '../../components/dashboard/RevenueChart.jsx';
import StatusPieChart from '../../components/dashboard/StatusPieChart.jsx';
import Card from '../../components/common/Card.jsx';
import Button from '../../components/common/Button.jsx';
import Badge from '../../components/common/Badge.jsx';
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx';
import RunBillingModal from '../../components/billing/RunBillingModal.jsx';
import { dashboardApi } from '../../api/dashboardApi.js';
import { subscriptionApi } from '../../api/subscriptionApi.js';
import { invoiceApi } from '../../api/invoiceApi.js';
import { formatCurrency, formatDate } from '../../utils/formatters.js';
import {
  Repeat,
  DollarSign,
  AlertTriangle,
  Receipt,
  Zap,
  Plus,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';

export default function AdminDashboardPage() {
  const [summary, setSummary] = useState(null);
  const [recentSubs, setRecentSubs] = useState([]);
  const [recentInvs, setRecentInvs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [billingModalOpen, setBillingModalOpen] = useState(false);
  const navigate = useNavigate();

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      const [sumRes, subsRes, invsRes] = await Promise.allSettled([
        dashboardApi.getSummary(),
        subscriptionApi.getSubscriptions({ limit: 5 }),
        invoiceApi.getInvoices({ limit: 5 }),
      ]);

      if (sumRes.status === 'fulfilled' && sumRes.value?.data) {
        setSummary(sumRes.value.data);
      }
      if (subsRes.status === 'fulfilled' && subsRes.value?.data) {
        setRecentSubs(subsRes.value.data.slice(0, 5));
      }
      if (invsRes.status === 'fulfilled' && invsRes.value?.data) {
        setRecentInvs(invsRes.value.data.slice(0, 5));
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();

    // Listen for billing run events
    const handleRefresh = () => loadDashboardData();
    window.addEventListener('billing-run-completed', handleRefresh);
    return () => window.removeEventListener('billing-run-completed', handleRefresh);
  }, []);

  if (isLoading) {
    return <LoadingSpinner size="lg" message="Loading executive analytics..." className="min-h-[60vh]" />;
  }

  const statusCounts = summary?.subscriptionStatusCounts || {
    Active: summary?.activeSubscriptions || 0,
    Confirmed: 0,
    Draft: 0,
    Paused: 0,
    Closed: 0,
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white">
            Operations & Financial Overview
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time subscription lifecycles, billing performance, and receivables.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/admin/quotations/new')}
            icon={Plus}
          >
            New Quotation
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setBillingModalOpen(true)}
            icon={Zap}
          >
            Run Billing
          </Button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Active Subscriptions"
          value={summary?.activeSubscriptions || 0}
          icon={Repeat}
          color="emerald"
          trend={+12}
          trendLabel="active recurring accounts"
        />
        <StatCard
          title="Total Subscriptions"
          value={summary?.totalSubscriptions || 0}
          icon={Repeat}
          color="indigo"
          subtitle="lifetime subscriptions"
        />
        <StatCard
          title="Revenue Collected"
          value={formatCurrency(summary?.revenueCollected || 0)}
          icon={DollarSign}
          color="emerald"
          trend={+18.4}
          trendLabel="net received in INR"
        />
        <StatCard
          title="Outstanding Balance"
          value={formatCurrency(summary?.outstandingAmount || 0)}
          icon={Receipt}
          color="amber"
          subtitle="unpaid confirmed invoices"
        />
        <StatCard
          title="Overdue Invoices"
          value={summary?.overdueInvoices || 0}
          icon={AlertTriangle}
          color="rose"
          subtitle="past due date"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card
            title="Recurring Revenue Trend"
            subtitle="Monthly billed and collected subscription revenue (₹ INR)"
          >
            <RevenueChart data={summary?.revenueByPeriod || []} />
          </Card>
        </div>

        <div>
          <Card
            title="Subscription Distribution"
            subtitle="Breakdown by subscription lifecycle state"
          >
            <StatusPieChart counts={statusCounts} />
          </Card>
        </div>
      </div>

      {/* Quick Summary Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Subscriptions */}
        <Card
          title="Recent Subscriptions"
          subtitle="Latest active and confirmed contracts"
          action={
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/admin/subscriptions')}
              className="text-xs text-indigo-400"
            >
              View all <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          }
        >
          {recentSubs.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-6">No subscriptions recorded yet</p>
          ) : (
            <div className="divide-y divide-slate-800 text-xs">
              {recentSubs.map((sub) => (
                <div
                  key={sub.id}
                  onClick={() => navigate(`/admin/subscriptions/${sub.id}`)}
                  className="py-3 flex items-center justify-between hover:bg-slate-800/40 px-2 rounded-lg cursor-pointer transition-colors"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">{sub.subscription_number || sub.subscriptionNumber || 'SUB'}</span>
                      <Badge status={sub.status} />
                    </div>
                    <p className="text-slate-400 mt-0.5">{sub.customer?.full_name || sub.customerName || sub.customer?.name || sub.profiles?.full_name || 'Customer'}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-white">{formatCurrency(sub.total ?? sub.cycle_rate ?? 0)}</p>
                    <p className="text-slate-500 text-[11px]">Due: {formatDate(sub.next_billing_date || sub.nextBillingDate)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Recent Invoices */}
        <Card
          title="Recent Invoices"
          subtitle="Latest billing cycle invoices"
          action={
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/admin/invoices')}
              className="text-xs text-indigo-400"
            >
              View all <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          }
        >
          {recentInvs.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-6">No invoices created yet</p>
          ) : (
            <div className="divide-y divide-slate-800 text-xs">
              {recentInvs.map((inv) => (
                <div
                  key={inv.id}
                  onClick={() => navigate(`/admin/invoices/${inv.id}`)}
                  className="py-3 flex items-center justify-between hover:bg-slate-800/40 px-2 rounded-lg cursor-pointer transition-colors"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">{inv.invoice_number || inv.invoiceNumber || 'INV'}</span>
                      <Badge status={inv.status} />
                    </div>
                    <p className="text-slate-400 mt-0.5">{inv.customer?.full_name || inv.customerName || inv.customer?.name || inv.profiles?.full_name || 'Customer'}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-white">{formatCurrency(inv.total)}</p>
                    <p className="text-slate-500 text-[11px]">Due: {formatDate(inv.due_date || inv.dueDate)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <RunBillingModal
        isOpen={billingModalOpen}
        onClose={() => setBillingModalOpen(false)}
        onSuccess={() => loadDashboardData()}
      />
    </div>
  );
}
