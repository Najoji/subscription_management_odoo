import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import StatCard from '../../components/dashboard/StatCard.jsx';
import Card from '../../components/common/Card.jsx';
import Button from '../../components/common/Button.jsx';
import Badge from '../../components/common/Badge.jsx';
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx';
import { subscriptionApi } from '../../api/subscriptionApi.js';
import { invoiceApi } from '../../api/invoiceApi.js';
import { formatCurrency, formatDate } from '../../utils/formatters.js';
import {
  Repeat,
  Receipt,
  CreditCard,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

export default function CustomerDashboardPage() {
  const { profile } = useAuth();
  const [subscriptions, setSubscriptions] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const loadCustomerData = async () => {
      setIsLoading(true);
      try {
        const [subsRes, invsRes] = await Promise.allSettled([
          subscriptionApi.getSubscriptions({ customerId: profile?.id }),
          invoiceApi.getInvoices({ customerId: profile?.id }),
        ]);

        if (subsRes.status === 'fulfilled' && subsRes.value?.data) {
          setSubscriptions(subsRes.value.data);
        }
        if (invsRes.status === 'fulfilled' && invsRes.value?.data) {
          setInvoices(invsRes.value.data);
        }
      } catch (err) {
        console.error('Failed to load customer portal data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    if (profile?.id) {
      loadCustomerData();
    } else {
      setIsLoading(false);
    }
  }, [profile?.id]);

  if (isLoading) {
    return <LoadingSpinner size="lg" message="Loading your customer portal..." className="min-h-[60vh]" />;
  }

  const activeCount = subscriptions.filter((s) => s.status === 'Active').length;
  const totalBilled = invoices.reduce((sum, inv) => sum + Number(inv.total || 0), 0);
  const totalPaid = invoices.reduce((sum, inv) => sum + Number(inv.amountPaid || 0), 0);
  const balanceDue = Math.max(0, totalBilled - totalPaid);

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="p-6 bg-gradient-to-r from-indigo-900/60 to-slate-900 border border-indigo-800/40 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
            Customer Self-Service Portal
          </span>
          <h1 className="text-2xl font-bold text-white mt-1">
            Welcome back, {profile?.fullName || 'Valued Customer'}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage your Brightloop software subscriptions, review itemized invoices, and track payments.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge status="Active" label="Verified Account" />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Subscriptions"
          value={activeCount}
          icon={Repeat}
          color="emerald"
          subtitle="Currently running services"
        />
        <StatCard
          title="Total Invoiced"
          value={formatCurrency(totalBilled)}
          icon={Receipt}
          color="indigo"
          subtitle="Lifetime billing"
        />
        <StatCard
          title="Amount Paid"
          value={formatCurrency(totalPaid)}
          icon={CreditCard}
          color="emerald"
          subtitle="Cleared payments"
        />
        <StatCard
          title="Balance Due"
          value={formatCurrency(balanceDue)}
          icon={AlertCircle}
          color={balanceDue > 0 ? 'rose' : 'emerald'}
          subtitle={balanceDue > 0 ? 'Payment pending' : 'All accounts settled'}
        />
      </div>

      {/* Grid: Subscriptions & Invoices */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* My Subscriptions */}
        <Card
          title="My Subscriptions"
          subtitle="Active software licenses and services"
          action={
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/portal/subscriptions')}
              className="text-xs text-indigo-400"
            >
              View all <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          }
        >
          {subscriptions.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-6">
              You do not have any active subscriptions yet.
            </p>
          ) : (
            <div className="divide-y divide-slate-800 text-xs">
              {subscriptions.slice(0, 5).map((sub) => (
                <div
                  key={sub.id}
                  onClick={() => navigate(`/portal/subscriptions/${sub.id}`)}
                  className="py-3.5 flex items-center justify-between hover:bg-slate-800/40 px-2 rounded-lg cursor-pointer transition-colors"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">{sub.subscription_number || sub.subscriptionNumber || 'SUB'}</span>
                      <Badge status={sub.status} />
                    </div>
                    <p className="text-slate-400 mt-0.5">{sub.plan?.name || sub.planName || 'Standard Plan'}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-white">{formatCurrency(sub.total ?? sub.cycle_rate ?? 0)}</p>
                    <p className="text-slate-500 text-[11px]">Next: {formatDate(sub.next_billing_date || sub.nextBillingDate)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* My Invoices */}
        <Card
          title="Recent Invoices"
          subtitle="Statements and payment receipts"
          action={
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/portal/invoices')}
              className="text-xs text-indigo-400"
            >
              View all <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          }
        >
          {invoices.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-6">
              No invoices generated for your account yet.
            </p>
          ) : (
            <div className="divide-y divide-slate-800 text-xs">
              {invoices.slice(0, 5).map((inv) => (
                <div
                  key={inv.id}
                  onClick={() => navigate(`/portal/invoices/${inv.id}`)}
                  className="py-3.5 flex items-center justify-between hover:bg-slate-800/40 px-2 rounded-lg cursor-pointer transition-colors"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">{inv.invoice_number || inv.invoiceNumber || 'INV'}</span>
                      <Badge status={inv.status} />
                    </div>
                    <p className="text-slate-400 mt-0.5">Due: {formatDate(inv.due_date || inv.dueDate)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-white">{formatCurrency(inv.total)}</p>
                    <span className="text-[11px] text-indigo-400 font-semibold hover:underline">
                      View details
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
