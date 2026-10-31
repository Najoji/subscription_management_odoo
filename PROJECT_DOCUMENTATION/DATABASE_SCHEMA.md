# Database Schema — Brightloop Subscription Management System

All primary keys are `UUID` (generated with `gen_random_uuid()`).
Monetary fields use `NUMERIC(12,2)`.
Dates are stored in ISO format, interpreted in business timezone (`Asia/Kolkata`).

---

## 1. Profiles (`profiles`)
Linked 1:1 with `auth.users`.
| Column | Type | Constraints / Description |
|---|---|---|
| `id` | UUID | PK, REFERENCES `auth.users(id)` ON DELETE CASCADE |
| `full_name` | VARCHAR(255) | NOT NULL |
| `email` | VARCHAR(255) | NOT NULL UNIQUE |
| `phone` | VARCHAR(50) | NULL |
| `role` | VARCHAR(20) | NOT NULL CHECK (`role` IN ('admin', 'staff', 'customer')) DEFAULT 'customer' |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() |

Trigger: On `auth.users` insert, automatically insert a row in `profiles` with role `'customer'`.

---

## 2. Taxes (`taxes`)
| Column | Type | Constraints / Description |
|---|---|---|
| `id` | UUID | PK DEFAULT gen_random_uuid() |
| `name` | VARCHAR(100) | NOT NULL (e.g. "GST 18%", "VAT 5%") |
| `rate` | NUMERIC(5,2) | NOT NULL (e.g. 18.00) |
| `is_active` | BOOLEAN | NOT NULL DEFAULT TRUE |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() |

---

## 3. Products (`products`)
| Column | Type | Constraints / Description |
|---|---|---|
| `id` | UUID | PK DEFAULT gen_random_uuid() |
| `name` | VARCHAR(255) | NOT NULL |
| `product_type` | VARCHAR(50) | NOT NULL DEFAULT 'service' |
| `sales_price` | NUMERIC(12,2) | NOT NULL DEFAULT 0.00 |
| `cost_price` | NUMERIC(12,2) | NOT NULL DEFAULT 0.00 |
| `notes` | TEXT | NULL |
| `tax_id` | UUID | REFERENCES `taxes(id)` ON DELETE SET NULL |
| `is_active` | BOOLEAN | NOT NULL DEFAULT TRUE |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() |

---

## 4. Product Variants (`product_variants`)
| Column | Type | Constraints / Description |
|---|---|---|
| `id` | UUID | PK DEFAULT gen_random_uuid() |
| `product_id` | UUID | NOT NULL REFERENCES `products(id)` ON DELETE CASCADE |
| `name` | VARCHAR(100) | NOT NULL (e.g., "Odoo Brand", "Enterprise Edition") |
| `extra_price` | NUMERIC(12,2) | NOT NULL DEFAULT 0.00 (e.g., 560.00) |
| `is_active` | BOOLEAN | NOT NULL DEFAULT TRUE |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() |

---

## 5. Subscription Plans (`plans`)
| Column | Type | Constraints / Description |
|---|---|---|
| `id` | UUID | PK DEFAULT gen_random_uuid() |
| `name` | VARCHAR(100) | NOT NULL (e.g. "Monthly Pro", "Yearly Enterprise") |
| `billing_interval` | VARCHAR(20) | NOT NULL CHECK (`billing_interval` IN ('daily', 'weekly', 'monthly', 'yearly')) |
| `interval_count` | INTEGER | NOT NULL DEFAULT 1 |
| `minimum_quantity` | INTEGER | NOT NULL DEFAULT 1 |
| `available_from` | DATE | NULL |
| `available_to` | DATE | NULL |
| `auto_close` | BOOLEAN | NOT NULL DEFAULT FALSE |
| `auto_close_days` | INTEGER | NULL |
| `allow_early_close`| BOOLEAN | NOT NULL DEFAULT TRUE |
| `allow_pause` | BOOLEAN | NOT NULL DEFAULT TRUE |
| `allow_renewal` | BOOLEAN | NOT NULL DEFAULT TRUE |
| `is_active` | BOOLEAN | NOT NULL DEFAULT TRUE |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() |

---

## 6. Quotation Templates & Items (`quotation_templates`, `quotation_template_items`)
`quotation_templates`:
- `id` UUID PK
- `name` VARCHAR(255) NOT NULL
- `plan_id` UUID REFERENCES `plans(id)` ON DELETE SET NULL
- `created_by` UUID REFERENCES `profiles(id)`
- `created_at` TIMESTAMPTZ DEFAULT NOW()

`quotation_template_items`:
- `id` UUID PK
- `template_id` UUID NOT NULL REFERENCES `quotation_templates(id)` ON DELETE CASCADE
- `product_id` UUID NOT NULL REFERENCES `products(id)`
- `variant_id` UUID REFERENCES `product_variants(id)`
- `quantity` INTEGER NOT NULL DEFAULT 1

---

## 7. Quotations & Items (`quotations`, `quotation_items`)
`quotations`:
- `id` UUID PK
- `quote_number` VARCHAR(50) NOT NULL UNIQUE
- `customer_id` UUID NOT NULL REFERENCES `profiles(id)`
- `template_id` UUID REFERENCES `quotation_templates(id)`
- `plan_id` UUID REFERENCES `plans(id)`
- `created_by` UUID REFERENCES `profiles(id)`
- `valid_until` DATE NOT NULL
- `status` VARCHAR(20) NOT NULL CHECK (`status` IN ('Draft', 'Sent', 'Accepted', 'Rejected', 'Expired', 'Converted')) DEFAULT 'Draft'
- `subtotal` NUMERIC(12,2) NOT NULL DEFAULT 0.00
- `discount_total` NUMERIC(12,2) NOT NULL DEFAULT 0.00
- `tax_total` NUMERIC(12,2) NOT NULL DEFAULT 0.00
- `total` NUMERIC(12,2) NOT NULL DEFAULT 0.00
- `notes` TEXT NULL
- `converted_subscription_id` UUID NULL
- `created_at` TIMESTAMPTZ DEFAULT NOW()
- `updated_at` TIMESTAMPTZ DEFAULT NOW()

`quotation_items`:
- `id` UUID PK
- `quotation_id` UUID NOT NULL REFERENCES `quotations(id)` ON DELETE CASCADE
- `product_id` UUID NOT NULL REFERENCES `products(id)`
- `variant_id` UUID REFERENCES `product_variants(id)`
- `description` VARCHAR(255) NULL
- `quantity` INTEGER NOT NULL DEFAULT 1
- `unit_price` NUMERIC(12,2) NOT NULL DEFAULT 0.00
- `line_total` NUMERIC(12,2) NOT NULL DEFAULT 0.00

---

## 8. Subscriptions & Items (`subscriptions`, `subscription_items`)
`subscriptions`:
- `id` UUID PK
- `subscription_number` VARCHAR(50) NOT NULL UNIQUE
- `customer_id` UUID NOT NULL REFERENCES `profiles(id)`
- `plan_id` UUID NOT NULL REFERENCES `plans(id)`
- `quotation_id` UUID REFERENCES `quotations(id)`
- `start_date` DATE NOT NULL
- `expiry_date` DATE NULL
- `next_billing_date` DATE NOT NULL
- `payment_terms` VARCHAR(100) DEFAULT 'Due Upon Receipt'
- `status` VARCHAR(20) NOT NULL CHECK (`status` IN ('Draft', 'Quotation', 'Confirmed', 'Active', 'Paused', 'Closed')) DEFAULT 'Draft'
- `closed_at` TIMESTAMPTZ NULL
- `created_at` TIMESTAMPTZ DEFAULT NOW()
- `updated_at` TIMESTAMPTZ DEFAULT NOW()

`subscription_items`:
- `id` UUID PK
- `subscription_id` UUID NOT NULL REFERENCES `subscriptions(id)` ON DELETE CASCADE
- `product_id` UUID NOT NULL REFERENCES `products(id)`
- `variant_id` UUID REFERENCES `product_variants(id)`
- `description` VARCHAR(255) NULL
- `quantity` INTEGER NOT NULL DEFAULT 1
- `unit_price` NUMERIC(12,2) NOT NULL DEFAULT 0.00

---

## 9. Discounts (`discounts`)
| Column | Type | Constraints / Description |
|---|---|---|
| `id` | UUID | PK DEFAULT gen_random_uuid() |
| `name` | VARCHAR(100) | NOT NULL |
| `code` | VARCHAR(50) | NOT NULL UNIQUE |
| `discount_type` | VARCHAR(20) | NOT NULL CHECK (`discount_type` IN ('fixed', 'percentage')) |
| `value` | NUMERIC(12,2) | NOT NULL |
| `minimum_purchase` | NUMERIC(12,2) | DEFAULT 0.00 |
| `minimum_quantity` | INTEGER | DEFAULT 1 |
| `start_at` | DATE | NULL |
| `end_at` | DATE | NULL |
| `usage_limit` | INTEGER | NULL |
| `usage_count` | INTEGER | NOT NULL DEFAULT 0 |
| `applicable_to` | VARCHAR(20) | NOT NULL DEFAULT 'subscription' CHECK (`applicable_to` IN ('subscription', 'product')) |
| `is_active` | BOOLEAN | NOT NULL DEFAULT TRUE |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() |

---

## 10. Invoices & Items (`invoices`, `invoice_items`)
`invoices`:
- `id` UUID PK
- `invoice_number` VARCHAR(50) NOT NULL UNIQUE
- `subscription_id` UUID NOT NULL REFERENCES `subscriptions(id)`
- `customer_id` UUID NOT NULL REFERENCES `profiles(id)`
- `period_start` DATE NOT NULL
- `period_end` DATE NOT NULL
- `issue_date` DATE NOT NULL DEFAULT CURRENT_DATE
- `due_date` DATE NOT NULL
- `status` VARCHAR(20) NOT NULL CHECK (`status` IN ('Draft', 'Confirmed', 'Paid', 'Cancelled')) DEFAULT 'Draft'
- `subtotal` NUMERIC(12,2) NOT NULL DEFAULT 0.00
- `discount_total` NUMERIC(12,2) NOT NULL DEFAULT 0.00
- `tax_total` NUMERIC(12,2) NOT NULL DEFAULT 0.00
- `total` NUMERIC(12,2) NOT NULL DEFAULT 0.00
- `amount_paid` NUMERIC(12,2) NOT NULL DEFAULT 0.00
- `discount_id` UUID REFERENCES `discounts(id)`
- `created_at` TIMESTAMPTZ DEFAULT NOW()
- **CRITICAL CONSTRAINT**: `UNIQUE(subscription_id, period_start)` — prevents duplicate billing!

`invoice_items`:
- `id` UUID PK
- `invoice_id` UUID NOT NULL REFERENCES `invoices(id)` ON DELETE CASCADE
- `product_id` UUID NOT NULL REFERENCES `products(id)`
- `variant_id` UUID REFERENCES `product_variants(id)`
- `description` VARCHAR(255) NULL
- `quantity` INTEGER NOT NULL DEFAULT 1
- `unit_price` NUMERIC(12,2) NOT NULL DEFAULT 0.00
- `line_subtotal` NUMERIC(12,2) NOT NULL DEFAULT 0.00
- `tax_rate` NUMERIC(5,2) NOT NULL DEFAULT 0.00
- `tax_amount` NUMERIC(12,2) NOT NULL DEFAULT 0.00
- `line_total` NUMERIC(12,2) NOT NULL DEFAULT 0.00

---

## 11. Payments (`payments`)
| Column | Type | Constraints / Description |
|---|---|---|
| `id` | UUID | PK DEFAULT gen_random_uuid() |
| `invoice_id` | UUID | NOT NULL REFERENCES `invoices(id)` |
| `method` | VARCHAR(50) | NOT NULL CHECK (`method` IN ('Cash', 'UPI', 'Card', 'Bank Transfer', 'Other')) |
| `amount` | NUMERIC(12,2) | NOT NULL CHECK (`amount` > 0) |
| `payment_date` | DATE | NOT NULL DEFAULT CURRENT_DATE |
| `note` | TEXT | NULL |
| `received_by` | UUID | REFERENCES `profiles(id)` |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() |
