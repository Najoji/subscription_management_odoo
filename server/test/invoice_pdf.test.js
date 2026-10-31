import test from 'node:test';
import assert from 'node:assert';
import { generateInvoicePdf } from '../src/modules/invoices/pdfService.js';
import { COMPANY_CONFIG } from '../src/config/company.js';
import { Writable } from 'node:stream';

test('Company Config: has valid details', () => {
  assert.ok(COMPANY_CONFIG.brandName);
  assert.ok(COMPANY_CONFIG.email);
  assert.ok(COMPANY_CONFIG.gstin);
  assert.ok(COMPANY_CONFIG.bankDetails.accountNumber);
});

test('PDF Generation: streams valid PDF for complete invoice with items, variants, tax, discounts, and payments', async () => {
  const mockInvoice = {
    id: 'test-inv-001',
    invoice_number: 'INV-2026-0001',
    status: 'Paid',
    issue_date: '2026-10-01',
    due_date: '2026-10-15',
    period_start: '2026-10-01',
    period_end: '2026-10-31',
    subtotal: '2560.00',
    discount_total: '200.00',
    tax_total: '424.80',
    total: '2784.80',
    amount_paid: '2784.80',
    profiles: {
      full_name: 'Acme Corp',
      email: 'finance@acme.com',
      phone: '+91 98765 43210',
    },
    subscriptions: {
      subscription_number: 'SUB-2026-0042',
      payment_terms: '15 Days Net',
    },
    invoice_items: [
      {
        id: 'item-1',
        description: 'Odoo Subscription Core',
        quantity: 1,
        unit_price: '2000.00',
        tax_rate: 18,
        tax_amount: '360.00',
        line_total: '2360.00',
        products: { name: 'Odoo Subscription Core' },
        product_variants: { name: 'Pro Variant (+560)' },
      },
    ],
    payments: [
      {
        id: 'pay-1',
        method: 'Bank Transfer',
        amount: '2784.80',
        payment_date: '2026-10-05',
        note: 'HDFC NEFT Ref: N123456789',
      },
    ],
  };

  const chunks = [];
  const dummyStream = new Writable({
    write(chunk, encoding, callback) {
      chunks.push(chunk);
      callback();
    },
  });

  await new Promise((resolve, reject) => {
    dummyStream.on('finish', resolve);
    dummyStream.on('error', reject);
    generateInvoicePdf(mockInvoice, dummyStream);
  });

  const pdfBuffer = Buffer.concat(chunks);
  // Verify PDF magic header '%PDF-'
  assert.ok(pdfBuffer.length > 500, 'PDF buffer should contain generated content');
  assert.strictEqual(pdfBuffer.subarray(0, 5).toString('ascii'), '%PDF-');
});

test('PDF Generation: handles empty line items and zero payment gracefully without crashing', async () => {
  const minimalInvoice = {
    id: 'test-inv-002',
    invoice_number: 'INV-2026-0002',
    status: 'Draft',
    subtotal: '0.00',
    total: '0.00',
    amount_paid: '0.00',
    invoice_items: [],
    payments: [],
  };

  const chunks = [];
  const dummyStream = new Writable({
    write(chunk, encoding, callback) {
      chunks.push(chunk);
      callback();
    },
  });

  await new Promise((resolve, reject) => {
    dummyStream.on('finish', resolve);
    dummyStream.on('error', reject);
    generateInvoicePdf(minimalInvoice, dummyStream);
  });

  const pdfBuffer = Buffer.concat(chunks);
  assert.ok(pdfBuffer.length > 300);
  assert.strictEqual(pdfBuffer.subarray(0, 5).toString('ascii'), '%PDF-');
});
