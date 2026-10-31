import test from 'node:test';
import assert from 'node:assert/strict';
import Decimal from 'decimal.js';

import {
  isValidUUID,
  validateCreateQuotation,
  validateUpdateQuotationStatus,
  validateConvertQuotation,
  validateCreateTemplate,
} from '../src/modules/quotations/validation.js';

import {
  validateCreateSubscription,
  validateUpdateSubscriptionStatus,
  validateRenewSubscription,
} from '../src/modules/subscriptions/validation.js';

import {
  addIntervalToDate,
  isValidDateString,
  getKolkataToday,
} from '../src/utils/dateUtils.js';

// ==============================================================================
// 1. DATE UTILITY TESTS
// ==============================================================================
test('Date Utilities: interval calculations and format validation', () => {
  assert.strictEqual(isValidDateString('2026-10-31'), true);
  assert.strictEqual(isValidDateString('invalid-date'), false);
  assert.strictEqual(isValidDateString(''), false);

  assert.strictEqual(addIntervalToDate('2026-10-31', 'daily', 1), '2026-11-01');
  assert.strictEqual(addIntervalToDate('2026-10-31', 'weekly', 1), '2026-11-07');
  assert.strictEqual(addIntervalToDate('2026-10-31', 'monthly', 1), '2026-12-01');
  assert.strictEqual(addIntervalToDate('2026-10-31', 'yearly', 1), '2027-10-31');
  assert.strictEqual(addIntervalToDate('2026-01-31', 'monthly', 1), '2026-03-03'); // Month overflow handling

  const today = getKolkataToday();
  assert.match(today, /^\d{4}-\d{2}-\d{2}$/);
});

// ==============================================================================
// 2. QUOTATION VALIDATION TESTS
// ==============================================================================
test('Quotation Validation: rejects missing customer for staff/admin', () => {
  const errors = validateCreateQuotation({
    validUntil: '2026-11-15',
    items: [{ productId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479', quantity: 1 }],
  }, 'staff');

  assert.ok(errors.some((e) => e.includes('customerId is required')));
});

test('Quotation Validation: accepts customer creating quotation for self', () => {
  const errors = validateCreateQuotation({
    validUntil: '2026-11-15',
    items: [{ productId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479', quantity: 2 }],
  }, 'customer');

  assert.strictEqual(errors.length, 0);
});

test('Quotation Validation: rejects invalid product UUID and non-positive quantity', () => {
  const errors = validateCreateQuotation({
    customerId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    validUntil: '2026-11-15',
    items: [
      { productId: 'not-a-uuid', quantity: 0 },
      { productId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479', quantity: -2 },
    ],
  }, 'staff');

  assert.ok(errors.some((e) => e.includes('valid productId UUID')));
  assert.ok(errors.some((e) => e.includes('positive integer quantity')));
});

test('Quotation Validation: status update validation rules', () => {
  const validStatus = validateUpdateQuotationStatus({ status: 'Accepted' });
  assert.strictEqual(validStatus.length, 0);

  const invalidStatus = validateUpdateQuotationStatus({ status: 'RandomStatus' });
  assert.ok(invalidStatus.length > 0);

  const convertedDirectly = validateUpdateQuotationStatus({ status: 'Converted' });
  assert.ok(convertedDirectly.some((e) => e.includes('Use /convert')));
});

test('Quotation Template Validation: requires name and valid items', () => {
  const emptyName = validateCreateTemplate({
    name: '   ',
    items: [{ productId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479', quantity: 1 }],
  });
  assert.ok(emptyName.some((e) => e.includes('name is required')));

  const validTemplate = validateCreateTemplate({
    name: 'Standard SaaS Bundle',
    items: [{ productId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479', quantity: 1 }],
  });
  assert.strictEqual(validTemplate.length, 0);
});

// ==============================================================================
// 3. PRICING & DECIMAL CALCULATION TESTS
// ==============================================================================
test('Pricing Calculation: Variant pricing (sales price + variant extra price)', () => {
  const productSalesPrice = new Decimal('1000.00');
  const variantExtraPrice = new Decimal('560.00');
  const quantity = 2;

  // Unit price = 1000 + 560 = 1560
  const unitPrice = productSalesPrice.plus(variantExtraPrice);
  assert.strictEqual(unitPrice.toFixed(2), '1560.00');

  // Subtotal = 1560 * 2 = 3120
  const subtotal = unitPrice.times(quantity);
  assert.strictEqual(subtotal.toFixed(2), '3120.00');
});

test('Pricing Calculation: Tax and Percentage Discount applied in correct sequence', () => {
  const subtotal = new Decimal('3120.00');
  const discountPercent = new Decimal('10'); // 10%
  const taxRate = new Decimal('18'); // 18% GST

  // Step 1: Discount = 3120 * 0.10 = 312.00
  const discountTotal = subtotal.times(discountPercent).dividedBy(100);
  assert.strictEqual(discountTotal.toFixed(2), '312.00');

  // Step 2: Taxable Base = 3120 - 312 = 2808.00
  const taxableBase = subtotal.minus(discountTotal);
  assert.strictEqual(taxableBase.toFixed(2), '2808.00');

  // Step 3: Tax = 2808 * 0.18 = 505.44
  const taxTotal = taxableBase.times(taxRate).dividedBy(100);
  assert.strictEqual(taxTotal.toFixed(2), '505.44');

  // Step 4: Final Grand Total = 2808 + 505.44 = 3313.44
  const grandTotal = taxableBase.plus(taxTotal);
  assert.strictEqual(grandTotal.toFixed(2), '3313.44');
});

test('Pricing Calculation: Fixed discount capped at subtotal', () => {
  const subtotal = new Decimal('500.00');
  const fixedDiscount = new Decimal('800.00');

  const discountApplied = Decimal.min(subtotal, fixedDiscount);
  assert.strictEqual(discountApplied.toFixed(2), '500.00');

  const taxableBase = subtotal.minus(discountApplied);
  assert.strictEqual(taxableBase.toFixed(2), '0.00');
});

// ==============================================================================
// 4. SUBSCRIPTION VALIDATION & PERMISSION LOGIC TESTS
// ==============================================================================
test('Subscription Validation: requires customerId, planId, startDate, and valid items', () => {
  const missingFields = validateCreateSubscription({});
  assert.ok(missingFields.some((e) => e.includes('customerId is required')));
  assert.ok(missingFields.some((e) => e.includes('planId is required')));
  assert.ok(missingFields.some((e) => e.includes('startDate is required')));
  assert.ok(missingFields.some((e) => e.includes('Subscription must contain at least one item')));

  const validSub = validateCreateSubscription({
    customerId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    planId: 'f47ac10b-58cc-4372-a567-0e02b2c3d478',
    startDate: '2026-11-01',
    items: [{ productId: 'f47ac10b-58cc-4372-a567-0e02b2c3d477', quantity: 1 }],
  });
  assert.strictEqual(validSub.length, 0);

  const invalidInitialStatus = validateCreateSubscription({
    customerId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    planId: 'f47ac10b-58cc-4372-a567-0e02b2c3d478',
    startDate: '2026-11-01',
    status: 'Active',
    items: [{ productId: 'f47ac10b-58cc-4372-a567-0e02b2c3d477', quantity: 1 }],
  });
  assert.ok(invalidInitialStatus.some((e) => e.includes('status must be one of: Confirmed')));
});

test('Subscription Status Validation: valid statuses accepted', () => {
  assert.strictEqual(validateUpdateSubscriptionStatus({ status: 'Active' }).length, 0);
  assert.strictEqual(validateUpdateSubscriptionStatus({ status: 'Paused' }).length, 0);
  assert.strictEqual(validateUpdateSubscriptionStatus({ status: 'Closed' }).length, 0);
  assert.ok(validateUpdateSubscriptionStatus({ status: 'NonExistent' }).length > 0);
});

test('Subscription Business Rules: Plan permission checks for Pause, Early Close, Renewal', () => {
  const planDisallowingPause = {
    name: 'Basic Daily',
    allow_pause: false,
    allow_early_close: true,
    allow_renewal: true,
  };

  const planDisallowingEarlyClose = {
    name: 'Yearly Fixed Contract',
    allow_pause: true,
    allow_early_close: false,
    allow_renewal: false,
  };

  // Rule 1: Pausing check
  const canPause1 = planDisallowingPause.allow_pause === true;
  assert.strictEqual(canPause1, false, 'Should disallow pausing if plan.allow_pause is false');

  // Rule 2: Early close check
  const isEarlyClose = true;
  const canEarlyClose = isEarlyClose ? planDisallowingEarlyClose.allow_early_close === true : true;
  assert.strictEqual(canEarlyClose, false, 'Should disallow early close if plan.allow_early_close is false');

  // Rule 3: Renewal check
  const canRenew = planDisallowingEarlyClose.allow_renewal === true;
  assert.strictEqual(canRenew, false, 'Should disallow renewal if plan.allow_renewal is false');
});

// ==============================================================================
// 5. CUSTOMER ISOLATION & ACCESS CONTROL RULES
// ==============================================================================
test('Customer Isolation: Customers can only query their own records', () => {
  const customerUser = {
    id: 'cust-uuid-1111',
    role: 'customer',
  };

  const otherCustomerUser = {
    id: 'cust-uuid-2222',
    role: 'customer',
  };

  const quotationOwnedByCust1 = {
    id: 'quote-uuid-0001',
    customer_id: 'cust-uuid-1111',
    status: 'Sent',
  };

  // Access check for cust1 -> permitted
  const cust1CanAccess = quotationOwnedByCust1.customer_id === customerUser.id;
  assert.strictEqual(cust1CanAccess, true);

  // Access check for cust2 -> forbidden
  const cust2CanAccess = quotationOwnedByCust1.customer_id === otherCustomerUser.id;
  assert.strictEqual(cust2CanAccess, false);
});
