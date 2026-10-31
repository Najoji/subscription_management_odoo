import { supabaseAdmin } from '../../config/supabase.js';
import Decimal from 'decimal.js';
import { round2 } from '../billing/pricingService.js';

/**
 * Calculate Dashboard KPI metrics and revenue analytics
 * 
 * @param {Object} [filters]
 * @param {string} [filters.startDate]
 * @param {string} [filters.endDate]
 * @returns {Promise<Object>} Dashboard summary KPIs
 */
export const getDashboardSummary = async ({ startDate, endDate } = {}) => {
  const today = new Date().toISOString().split('T')[0];

  // 1. Subscription metrics & counts grouped by status
  const { data: subStatusList, count: totalSubCount, error: subErr } = await supabaseAdmin
    .from('subscriptions')
    .select('status', { count: 'exact' });

  if (subErr) {
    console.error('Error querying subscriptions for dashboard:', subErr);
  }

  const subscriptionStatusCounts = {
    Active: 0,
    Draft: 0,
    Quotation: 0,
    Confirmed: 0,
    Paused: 0,
    Closed: 0,
  };

  (subStatusList || []).forEach((row) => {
    const s = row.status || 'Draft';
    subscriptionStatusCounts[s] = (subscriptionStatusCounts[s] || 0) + 1;
  });

  const activeSubscriptions = subscriptionStatusCounts.Active || 0;
  const totalSubscriptions = totalSubCount || (subStatusList ? subStatusList.length : 0);

  // 2. Revenue collected from actual payments
  let payQuery = supabaseAdmin
    .from('payments')
    .select('amount, payment_date');

  if (startDate) {
    payQuery = payQuery.gte('payment_date', startDate);
  }
  if (endDate) {
    payQuery = payQuery.lte('payment_date', endDate);
  }

  const { data: payments, error: payErr } = await payQuery;
  if (payErr) {
    console.error('Error querying payments for dashboard:', payErr);
  }

  let revenueCollected = new Decimal(0);
  const revenueByPeriodMap = {};

  (payments || []).forEach((p) => {
    const amt = round2(p.amount || 0);
    revenueCollected = revenueCollected.plus(amt);

    const periodKey = p.payment_date ? p.payment_date.substring(0, 7) : today.substring(0, 7);
    revenueByPeriodMap[periodKey] = (revenueByPeriodMap[periodKey] || new Decimal(0)).plus(amt);
  });

  const revenueByPeriod = Object.keys(revenueByPeriodMap)
    .sort()
    .map((period) => ({
      period,
      revenue: revenueByPeriodMap[period].toNumber(),
    }));

  // 3. Outstanding amount & Overdue invoices
  // Query Confirmed invoices to determine balance and overdue count
  let invQuery = supabaseAdmin
    .from('invoices')
    .select('total, amount_paid, due_date, status')
    .eq('status', 'Confirmed');

  const { data: confirmedInvoices, error: invErr } = await invQuery;
  if (invErr) {
    console.error('Error querying confirmed invoices for dashboard:', invErr);
  }

  let outstandingAmount = new Decimal(0);
  let overdueInvoices = 0;

  (confirmedInvoices || []).forEach((inv) => {
    const tot = new Decimal(inv.total || 0);
    const paid = new Decimal(inv.amount_paid || 0);
    const balance = Decimal.max(0, tot.minus(paid));

    if (balance.greaterThan(0)) {
      outstandingAmount = outstandingAmount.plus(balance);

      if (inv.due_date && inv.due_date < today) {
        overdueInvoices++;
      }
    }
  });

  return {
    activeSubscriptions,
    totalSubscriptions,
    revenueCollected: revenueCollected.toNumber(),
    outstandingAmount: round2(outstandingAmount).toNumber(),
    overdueInvoices,
    subscriptionStatusCounts,
    revenueByPeriod,
  };
};
