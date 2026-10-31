# Business Rules — Brightloop Subscription Management System

## 1. Product & Variant Pricing
- **Base Formula**:
  $$\text{Unit Price} = \text{Product Sales Price} + \text{Variant Extra Price}$$
  $$\text{Line Subtotal} = \text{Unit Price} \times \text{Quantity}$$
- **Trust Rule**: The frontend must NEVER calculate or submit trusted prices. The backend queries `products` and `product_variants` directly during quotation/subscription creation.
- **Snapshot Rule**: Once saved in `quotation_items`, `subscription_items`, or `invoice_items`, prices are fixed historical snapshots. Updating product prices later in catalog never mutates existing items.

## 2. Tax & Discount Calculations
- **Calculation Sequence**:
  1. Calculate line subtotal: $\text{Quantity} \times \text{Unit Price}$.
  2. Apply eligible discount:
     - Fixed: Directly subtracted from eligible base, capped at base.
     - Percentage: $\text{Base} \times (\text{Discount Rate} / 100)$.
  3. Determine Taxable Base = $\text{Subtotal} - \text{Discount}$.
  4. Calculate Tax Amount = $\text{Taxable Base} \times (\text{Tax Rate} / 100)$.
  5. Final Invoice Line Total = $\text{Taxable Base} + \text{Tax Amount}$.
- **Rounding Rule**: Use `NUMERIC(12,2)` rounded to 2 decimal places (paise precision) to avoid floating-point drift.

## 3. Subscription Lifecycle & Permissions
- Valid States: `Draft` $\rightarrow$ `Quotation` $\rightarrow$ `Confirmed` $\rightarrow$ `Active` $\rightarrow$ `Paused` $\rightarrow$ `Closed`.
- Only `Active` subscriptions are billed.
- A subscription can only be paused if its associated `plans.allow_pause == true`.
- A subscription can only be closed early if `plans.allow_early_close == true`.
- A subscription can only be renewed if `plans.allow_renewal == true`.

## 4. Recurring Billing Engine
- **Manual Trigger**: `POST /api/billing/run` with `asOfDate`.
- **Target Selection**: All subscriptions with `status = 'Active'` and `next_billing_date <= asOfDate`.
- **Period Calculation**:
  - `daily`: `period_start` = `next_billing_date`, `period_end` = `period_start + 1 day`
  - `weekly`: `period_start` = `next_billing_date`, `period_end` = `period_start + 7 days`
  - `monthly`: `period_start` = `next_billing_date`, `period_end` = `period_start + 1 month`
  - `yearly`: `period_start` = `next_billing_date`, `period_end` = `period_start + 1 year`
- **Duplicate Prevention**:
  Database constraint `UNIQUE(subscription_id, period_start)` strictly forbids duplicate invoices if billing is run twice.
- **Advance Date**: Upon successful invoice generation, `subscriptions.next_billing_date` advances to `period_end`. Overdue periods are billed sequentially until caught up to `asOfDate`.

## 5. Invoicing & Payments
- State transitions: `Draft` $\rightarrow$ `Confirmed` $\rightarrow$ `Paid` (or `Cancelled`).
- Partial payments keep invoice in `Confirmed` state and increment `amount_paid`.
- Only when `amount_paid >= total` does invoice status become `Paid`.
- Cancelled invoices cannot receive payments.
- Overdue invoices: `status = 'Confirmed'` AND `due_date < CURRENT_DATE` AND `amount_paid < total`.
