import { supabaseAdmin } from '../../config/supabase.js';
import Decimal from 'decimal.js';
import { calculateDocumentPricing, round2 } from './pricingService.js';
import crypto from 'crypto';

/**
 * Add interval to an ISO date string (YYYY-MM-DD) without timezone shifts
 * 
 * @param {string} dateStr - 'YYYY-MM-DD'
 * @param {string} interval - 'daily' | 'weekly' | 'monthly' | 'yearly'
 * @param {number} [intervalCount=1]
 * @returns {string} Next date string 'YYYY-MM-DD'
 */
export const calculatePeriodEnd = (dateStr, interval, intervalCount = 1) => {
  const [year, month, day] = dateStr.split('-').map(Number);
  const count = Math.max(1, parseInt(intervalCount, 10) || 1);
  const target = new Date(Date.UTC(year, month - 1, day));

  switch (interval.toLowerCase()) {
    case 'daily':
      target.setUTCDate(target.getUTCDate() + count);
      break;
    case 'weekly':
      target.setUTCDate(target.getUTCDate() + (7 * count));
      break;
    case 'monthly': {
      const currentDay = target.getUTCDate();
      target.setUTCMonth(target.getUTCMonth() + count);
      // Handle month end overflow (e.g. Jan 31 + 1 month -> Feb 28/29)
      if (target.getUTCDate() < currentDay) {
        target.setUTCDate(0); // set to last day of previous month
      }
      break;
    }
    case 'yearly': {
      target.setUTCFullYear(target.getUTCFullYear() + count);
      break;
    }
    default:
      target.setUTCMonth(target.getUTCMonth() + count);
  }

  return target.toISOString().split('T')[0];
};

/**
 * Calculate due date based on issue date and payment terms
 * 
 * @param {string} issueDate - 'YYYY-MM-DD'
 * @param {string} [paymentTerms='Due Upon Receipt']
 * @returns {string} 'YYYY-MM-DD'
 */
export const calculateDueDate = (issueDate, paymentTerms = 'Due Upon Receipt') => {
  const [year, month, day] = issueDate.split('-').map(Number);
  const target = new Date(Date.UTC(year, month - 1, day));

  let daysToAdd = 15; // default net 15
  const terms = (paymentTerms || '').toLowerCase();

  if (terms.includes('receipt') || terms.includes('immediate')) {
    daysToAdd = 0;
  } else if (terms.includes('7')) {
    daysToAdd = 7;
  } else if (terms.includes('15')) {
    daysToAdd = 15;
  } else if (terms.includes('30')) {
    daysToAdd = 30;
  } else if (terms.includes('60')) {
    daysToAdd = 60;
  }

  target.setUTCDate(target.getUTCDate() + daysToAdd);
  return target.toISOString().split('T')[0];
};

/**
 * Generate a clean, unique invoice number
 * Format: INV-YYYYMMDD-XXXX
 */
export const generateInvoiceNumber = () => {
  const datePart = new Date().toISOString().split('T')[0].replace(/-/g, '');
  const randomPart = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `INV-${datePart}-${randomPart}`;
};

/**
 * Run central billing engine for all eligible subscriptions due on or before asOfDate
 * 
 * @param {Object} params
 * @param {string} [params.asOfDate] - ISO date string 'YYYY-MM-DD'
 * @param {string} [params.specificSubscriptionId] - Optional subscription ID to bill selectively
 * @returns {Promise<Object>} Billing run summary
 */
export const runBillingEngine = async ({
  asOfDate = new Date().toISOString().split('T')[0],
  specificSubscriptionId = null,
} = {}) => {
  const summary = {
    asOfDate,
    invoicesGenerated: 0,
    skippedDuplicates: 0,
    errors: [],
    invoices: [],
  };

  // 1. Fetch active subscriptions due on or before asOfDate
  let query = supabaseAdmin
    .from('subscriptions')
    .select(`
      *,
      plans:plan_id (*),
      profiles:customer_id (*),
      subscription_items (
        *,
        products:product_id (
          id, name, sales_price, tax_id,
          taxes:tax_id (id, name, rate)
        ),
        product_variants:variant_id (
          id, name, extra_price
        )
      )
    `)
    .eq('status', 'Active')
    .lte('next_billing_date', asOfDate);

  if (specificSubscriptionId) {
    query = query.eq('id', specificSubscriptionId);
  }

  const { data: subscriptions, error: subError } = await query;

  if (subError) {
    throw new Error(`Failed to query subscriptions for billing: ${subError.message}`);
  }

  if (!subscriptions || subscriptions.length === 0) {
    return summary;
  }

  // 2. Process each due active subscription
  for (const subscription of subscriptions) {
    try {
      const plan = subscription.plans;
      if (!plan) {
        summary.errors.push({
          subscriptionId: subscription.id,
          message: 'Subscription has no associated plan configuration',
        });
        continue;
      }

      const items = subscription.subscription_items || [];
      if (items.length === 0) {
        summary.errors.push({
          subscriptionId: subscription.id,
          message: 'Subscription has no items to bill',
        });
        continue;
      }

      // Check overdue catch-up: process all missed periods up to asOfDate
      let currentPeriodStart = subscription.next_billing_date;
      let iterations = 0;
      const MAX_PERIODS_PER_RUN = 60; // Safeguard against runaway loops

      while (currentPeriodStart <= asOfDate && iterations < MAX_PERIODS_PER_RUN) {
        iterations++;

        // If subscription has an expiry_date and period_start is beyond expiry, stop
        if (subscription.expiry_date && currentPeriodStart > subscription.expiry_date) {
          // If auto_close is set on plan, close the subscription
          if (plan.auto_close) {
            await supabaseAdmin
              .from('subscriptions')
              .update({ status: 'Closed', closed_at: new Date().toISOString() })
              .eq('id', subscription.id);
          }
          break;
        }

        const periodEnd = calculatePeriodEnd(
          currentPeriodStart,
          plan.billing_interval,
          plan.interval_count
        );

        // 3. Duplicate Prevention Check (Database constraint: UNIQUE(subscription_id, period_start))
        const { data: existingInvoice, error: checkError } = await supabaseAdmin
          .from('invoices')
          .select('id, invoice_number')
          .eq('subscription_id', subscription.id)
          .eq('period_start', currentPeriodStart)
          .maybeSingle();

        if (checkError) {
          throw checkError;
        }

        if (existingInvoice) {
          summary.skippedDuplicates++;
          // Advance period to avoid staying stuck on already-billed period
          currentPeriodStart = periodEnd;
          await supabaseAdmin
            .from('subscriptions')
            .update({ next_billing_date: currentPeriodStart })
            .eq('id', subscription.id);
          continue;
        }

        // 4. Calculate line item and document pricing
        const pricingLines = items.map((item) => {
          const prod = item.products || {};
          const variant = item.product_variants || {};
          const salesPrice = prod.sales_price || item.unit_price || 0;
          const extraPrice = variant.extra_price || 0;
          const taxRate = prod.taxes?.rate || 0;

          return {
            productId: item.product_id,
            variantId: item.variant_id,
            description: item.description || prod.name || 'Subscription Service',
            salesPrice,
            extraPrice,
            quantity: item.quantity || 1,
            taxRate,
          };
        });

        const pricingResult = calculateDocumentPricing(pricingLines);

        // 5. Create the Invoice record
        const invoiceNumber = generateInvoiceNumber();
        const dueDate = calculateDueDate(asOfDate, subscription.payment_terms);

        const invoicePayload = {
          invoice_number: invoiceNumber,
          subscription_id: subscription.id,
          customer_id: subscription.customer_id,
          period_start: currentPeriodStart,
          period_end: periodEnd,
          issue_date: asOfDate,
          due_date: dueDate,
          status: 'Draft', // Initial status is Draft per business rules
          subtotal: pricingResult.subtotal,
          discount_total: pricingResult.discountTotal,
          tax_total: pricingResult.taxTotal,
          total: pricingResult.total,
          amount_paid: '0.00',
        };

        const nextBillingDate = periodEnd;
        const shouldCloseSubscription = Boolean(
          plan.auto_close && subscription.expiry_date && nextBillingDate >= subscription.expiry_date
        );

        const { data: createdInvoice, error: invError } = await supabaseAdmin.rpc(
          'create_billing_invoice_atomic',
          {
            p_invoice: invoicePayload,
            p_items: pricingResult.items.map((line) => ({
              product_id: line.productId,
              variant_id: line.variantId || null,
              description: line.description,
              quantity: line.quantity,
              unit_price: line.unitPrice,
              line_subtotal: line.lineSubtotal,
              tax_rate: line.taxRate,
              tax_amount: line.taxAmount,
              line_total: line.lineTotal,
            })),
            p_subscription_id: subscription.id,
            p_next_billing_date: nextBillingDate,
            p_close_subscription: shouldCloseSubscription,
          }
        );

        if (invError) {
          // Handle unique constraint conflict gracefully
          if (invError.code === '23505') {
            summary.skippedDuplicates++;
            currentPeriodStart = periodEnd;
            await supabaseAdmin
              .from('subscriptions')
              .update({ next_billing_date: currentPeriodStart })
              .eq('id', subscription.id);
            continue;
          }
          throw invError;
        }

        currentPeriodStart = nextBillingDate;

        summary.invoicesGenerated++;
        summary.invoices.push({
          id: createdInvoice.id,
          invoiceNumber: createdInvoice.invoice_number,
          subscriptionId: subscription.id,
          periodStart: createdInvoice.period_start,
          periodEnd: createdInvoice.period_end,
          total: createdInvoice.total,
          status: createdInvoice.status,
        });

        // Check if expiry date reached after advancing
        if (shouldCloseSubscription) {
          break;
        }
      }
    } catch (err) {
      console.error(`Billing error for subscription ${subscription.id}:`, err);
      summary.errors.push({
        subscriptionId: subscription.id,
        message: err.message || 'Error occurred during billing run',
      });
    }
  }

  return summary;
};
