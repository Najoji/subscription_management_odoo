import { supabaseAdmin } from '../src/config/supabase.js';
import { calculateLineItemPricing, calculateDocumentPricing } from '../src/modules/billing/pricingService.js';
import { runBillingEngine } from '../src/modules/billing/billingEngine.js';
import * as invoiceService from '../src/modules/invoices/service.js';
import * as paymentService from '../src/modules/payments/service.js';
import * as discountService from '../src/modules/discounts/service.js';
import * as dashboardService from '../src/modules/dashboard/service.js';

const runVerificationSuite = async () => {
  console.log('====================================================');
  console.log('BRIGHTLOOP MEMBER 3 INTEGRATION & VERIFICATION SUITE');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  const assertEqual = (actual, expected, testName) => {
    if (actual === expected) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName} - Expected: ${expected}, Got: ${actual}`);
      failed++;
    }
  };

  const assertMoney = (actual, expected, testName) => {
    const act = Number(actual).toFixed(2);
    const exp = Number(expected).toFixed(2);
    if (act === exp) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName} - Expected: ${exp}, Got: ${act}`);
      failed++;
    }
  };

  const assertTrue = (condition, testName) => {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName} - Condition was false`);
      failed++;
    }
  };

  try {
    // -------------------------------------------------------------------------
    // TEST 1: Central Pricing Service - Formula and Exact Match to Spec
    // -------------------------------------------------------------------------
    console.log('\n--- 1. Testing Central Pricing Service ---');
    const pricingSpec = calculateLineItemPricing({
      salesPrice: 1000,
      extraPrice: 560,
      quantity: 2,
      taxRate: 18,
      discount: { discountType: 'percentage', value: 10 },
    });

    assertEqual(pricingSpec.unitPrice, '1560.00', '1.1 Unit price calculation (1000 + 560)');
    assertEqual(pricingSpec.lineSubtotal, '3120.00', '1.2 Line subtotal (1560 * 2)');
    assertEqual(pricingSpec.discountAmount, '312.00', '1.3 Eligible discount (10% of 3120)');
    assertEqual(pricingSpec.taxableBase, '2808.00', '1.4 Taxable base (3120 - 312)');
    assertEqual(pricingSpec.taxAmount, '505.44', '1.5 Applicable tax (18% of 2808)');
    assertEqual(pricingSpec.lineTotal, '3313.44', '1.6 Final invoice total (2808 + 505.44)');

    // -------------------------------------------------------------------------
    // TEST 2: Discounts Validation Service
    // -------------------------------------------------------------------------
    console.log('\n--- 2. Testing Discounts Service ---');
    const discValidation = await discountService.validateDiscount({
      code: 'WELCOME10',
      subtotal: 1000,
      quantity: 1,
      targetType: 'subscription',
      asOfDate: '2026-10-31',
    });
    assertTrue(discValidation.isValid, '2.1 Validated active seed discount WELCOME10');
    assertEqual(discValidation.calculatedAmount, '100.00', '2.2 WELCOME10 gives ₹100 on ₹1000');

    // -------------------------------------------------------------------------
    // SETUP FOR DB TESTS: Get or create customer & subscription
    // -------------------------------------------------------------------------
    console.log('\n--- Setting up DB test fixtures ---');
    const customerId = 'ee65bf70-5488-4e80-93e1-7a409d09e500'; // Admin profile as test actor
    const productId = '22222222-2222-2222-2222-222222222221'; // Brightloop CRM Core
    const variantId = '33333333-3333-3333-3333-333333333331'; // Odoo Connector (+560)
    const planId = '44444444-4444-4444-4444-444444444441'; // Monthly Standard Plan

    // Create a dedicated active test subscription
    const subNumber = `SUB-TEST-${Date.now()}`;
    const { data: testSub, error: subErr } = await supabaseAdmin
      .from('subscriptions')
      .insert([
        {
          subscription_number: subNumber,
          customer_id: customerId,
          plan_id: planId,
          start_date: '2026-10-01',
          next_billing_date: '2026-10-01',
          payment_terms: '15 days',
          status: 'Active',
        },
      ])
      .select()
      .single();

    if (subErr) throw subErr;
    console.log(`Created test subscription: ${testSub.id} (${subNumber})`);

    // Add subscription line item (Quantity: 2)
    const { error: itemErr } = await supabaseAdmin
      .from('subscription_items')
      .insert([
        {
          subscription_id: testSub.id,
          product_id: productId,
          variant_id: variantId,
          description: 'Brightloop CRM Core with Odoo Brand Connector',
          quantity: 2,
          unit_price: '1560.00',
        },
      ]);
    if (itemErr) throw itemErr;

    // -------------------------------------------------------------------------
    // TEST 3: Billing Engine - Run for Active Due Subscription
    // -------------------------------------------------------------------------
    console.log('\n--- 3. Testing Billing Engine Execution ---');
    const billingRun1 = await runBillingEngine({
      asOfDate: '2026-10-01',
      specificSubscriptionId: testSub.id,
    });

    assertEqual(billingRun1.invoicesGenerated, 1, '3.1 Invoices generated on initial run');
    assertTrue(billingRun1.invoices.length > 0, '3.2 Invoice object returned in summary');

    const createdInvId = billingRun1.invoices[0].id;
    const invDetails = await invoiceService.getInvoiceById(createdInvId);
    assertEqual(invDetails.status, 'Draft', '3.3 Newly generated invoice initial status is Draft');
    assertMoney(invDetails.subtotal, '3120.00', '3.4 Invoice subtotal is ₹3,120.00');
    assertMoney(invDetails.tax_total, '561.60', '3.5 Invoice tax is 18% of 3120 (₹561.60)');
    assertMoney(invDetails.total, '3681.60', '3.6 Invoice total is ₹3,681.60');

    // Verify subscription next billing date advanced
    const { data: refreshedSub } = await supabaseAdmin
      .from('subscriptions')
      .select('next_billing_date')
      .eq('id', testSub.id)
      .single();
    assertEqual(refreshedSub.next_billing_date, '2026-11-01', '3.7 Subscription next_billing_date advanced to 2026-11-01');

    // -------------------------------------------------------------------------
    // TEST 4: Duplicate Prevention Check
    // -------------------------------------------------------------------------
    console.log('\n--- 4. Testing Duplicate Prevention ---');
    // Run billing again with asOfDate before next billing date
    const billingRun2 = await runBillingEngine({
      asOfDate: '2026-10-15',
      specificSubscriptionId: testSub.id,
    });
    assertEqual(billingRun2.invoicesGenerated, 0, '4.1 No duplicate invoices generated when run again');

    // Manually test period_start unique constraint: Attempting to insert duplicate period directly
    const { error: dupErr } = await supabaseAdmin
      .from('invoices')
      .insert([
        {
          invoice_number: `INV-DUP-${Date.now()}`,
          subscription_id: testSub.id,
          customer_id: customerId,
          period_start: '2026-10-01',
          period_end: '2026-11-01',
          issue_date: '2026-10-01',
          due_date: '2026-10-16',
          status: 'Draft',
          total: '3681.60',
        },
      ]);
    assertTrue(dupErr !== null && dupErr.code === '23505', '4.2 DB enforces UNIQUE(subscription_id, period_start) constraint');

    // -------------------------------------------------------------------------
    // TEST 5: Overdue Catch-up Test (Multiple Periods Due)
    // -------------------------------------------------------------------------
    console.log('\n--- 5. Testing Overdue Missed Billing Periods Catch-up ---');
    const overdueSubNumber = `SUB-OVERDUE-${Date.now()}`;
    const { data: overdueSub } = await supabaseAdmin
      .from('subscriptions')
      .insert([
        {
          subscription_number: overdueSubNumber,
          customer_id: customerId,
          plan_id: planId,
          start_date: '2026-08-01',
          next_billing_date: '2026-08-01', // 3 months overdue as of Nov 1
          payment_terms: 'Due Upon Receipt',
          status: 'Active',
        },
      ])
      .select()
      .single();

    await supabaseAdmin
      .from('subscription_items')
      .insert([
        {
          subscription_id: overdueSub.id,
          product_id: productId,
          quantity: 1,
          unit_price: '1000.00',
        },
      ]);

    const catchupRun = await runBillingEngine({
      asOfDate: '2026-11-01',
      specificSubscriptionId: overdueSub.id,
    });

    assertEqual(catchupRun.invoicesGenerated, 4, '5.1 Generated all 4 overdue monthly periods (Aug, Sep, Oct, Nov)');
    
    // Check advanced date
    const { data: updatedOverdueSub } = await supabaseAdmin
      .from('subscriptions')
      .select('next_billing_date')
      .eq('id', overdueSub.id)
      .single();
    assertEqual(updatedOverdueSub.next_billing_date, '2026-12-01', '5.2 Next billing date caught up to 2026-12-01');

    // -------------------------------------------------------------------------
    // TEST 6: Invoice Confirmation & Status Transition
    // -------------------------------------------------------------------------
    console.log('\n--- 6. Testing Invoice Confirmation ---');
    const confirmedInv = await invoiceService.confirmInvoice(createdInvId);
    assertEqual(confirmedInv.status, 'Confirmed', '6.1 Invoice moved from Draft to Confirmed');

    // -------------------------------------------------------------------------
    // TEST 7: Payment Recording, Balance Tracking, and Paid Status
    // -------------------------------------------------------------------------
    console.log('\n--- 7. Testing Payment Recording & Status Progression ---');
    // Total is ₹3,681.60. First pay ₹1,000.00
    const pay1 = await paymentService.recordPayment({
      invoiceId: createdInvId,
      method: 'UPI',
      amount: 1000,
      note: 'Part 1 via UPI',
      receivedBy: customerId,
    });

    assertEqual(pay1.invoice.status, 'Confirmed', '7.1 Partial payment keeps invoice in Confirmed status');
    assertMoney(pay1.invoice.amount_paid, '1000.00', '7.2 Invoice amount_paid updated to ₹1000.00');
    assertMoney(pay1.remainingBalance, '2681.60', '7.3 Remaining balance accurately computed as ₹2681.60');

    // Pay remaining balance of ₹2,681.60
    const pay2 = await paymentService.recordPayment({
      invoiceId: createdInvId,
      method: 'Bank Transfer',
      amount: 2681.60,
      note: 'Settlement payment',
      receivedBy: customerId,
    });

    assertEqual(pay2.invoice.status, 'Paid', '7.4 Full payment transitions invoice status to Paid');
    assertEqual(pay2.remainingBalance, '0.00', '7.5 Remaining balance becomes ₹0.00');
    assertTrue(pay2.isFullyPaid, '7.6 isFullyPaid flag is true');

    // -------------------------------------------------------------------------
    // TEST 8: Cancelled Invoice Payment Prevention
    // -------------------------------------------------------------------------
    console.log('\n--- 8. Testing Cancelled Invoice Restrictions ---');
    // Create draft invoice and cancel it
    const { data: invToCancel } = await supabaseAdmin
      .from('invoices')
      .insert([
        {
          invoice_number: `INV-CANCEL-${Date.now()}`,
          subscription_id: testSub.id,
          customer_id: customerId,
          period_start: '2027-01-01',
          period_end: '2027-02-01',
          issue_date: '2027-01-01',
          due_date: '2027-01-15',
          status: 'Draft',
          total: '500.00',
        },
      ])
      .select()
      .single();

    await invoiceService.cancelInvoice(invToCancel.id);
    const cancelledDetails = await invoiceService.getInvoiceById(invToCancel.id);
    assertEqual(cancelledDetails.status, 'Cancelled', '8.1 Invoice successfully cancelled');

    let paymentBlocked = false;
    try {
      await paymentService.recordPayment({
        invoiceId: invToCancel.id,
        method: 'Cash',
        amount: 100,
        receivedBy: customerId,
      });
    } catch (e) {
      paymentBlocked = true;
    }
    assertTrue(paymentBlocked, '8.2 Payments strictly forbidden on Cancelled invoice');

    // -------------------------------------------------------------------------
    // TEST 9: Dashboard KPI Analytics
    // -------------------------------------------------------------------------
    console.log('\n--- 9. Testing Dashboard KPI Analytics ---');
    const dashboard = await dashboardService.getDashboardSummary();
    assertTrue(dashboard.activeSubscriptions >= 2, '9.1 Dashboard reflects active subscriptions');
    assertTrue(dashboard.revenueCollected >= 3681.60, '9.2 Revenue collected includes actual recorded payments');
    assertTrue(Array.isArray(dashboard.revenueByPeriod), '9.3 Revenue by period is formatted as an array');
    console.log('Dashboard KPI sample:', {
      activeSubscriptions: dashboard.activeSubscriptions,
      revenueCollected: dashboard.revenueCollected,
      outstandingAmount: dashboard.outstandingAmount,
      revenueByPeriod: dashboard.revenueByPeriod,
    });

    // -------------------------------------------------------------------------
    // Cleanup temporary test subscriptions to leave DB clean
    // -------------------------------------------------------------------------
    console.log('\n--- Cleaning up test records ---');
    await supabaseAdmin.from('invoices').delete().eq('id', invToCancel.id);
    // Keep testSub / invoices for demo verification
    console.log('Cleanup completed successfully.');

  } catch (err) {
    console.error('Test Suite encountered unhandled error:', err);
    failed++;
  }

  console.log('\n====================================================');
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  }
};

runVerificationSuite();
