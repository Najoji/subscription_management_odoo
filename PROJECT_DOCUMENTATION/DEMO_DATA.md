# Brightloop Demo Data Seeding System

This document outlines the demo data seeding engine for the Brightloop Subscription Management System, designed for realistic demonstration during hackathon pitches, jury evaluations, and local development.

---

## 1. Quick Start

### Prerequisites
Ensure your server environment has the Supabase credentials and the demo activation flags configured in `server/.env`:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
DEMO_USER_PASSWORD=YourSecureDemoPassword123!
SEED_DEMO_DATA=true
```

> **Security Note**: Never commit actual secrets or service-role keys to public GitHub repositories. Use `.env.example` as a template.

### Execute Seeding Script
Run the dedicated seeding command from the `server` directory:

```bash
cd server
npm run seed:demo
```

---

## 2. Demo Authentication Accounts

All synthetic demo accounts are created via the Supabase Auth Admin API with email confirmation enabled.

### Administrator
* **Email**: `admin@brightloop.example.com`
* **Role**: `admin`
* **Access**: Unrestricted access to system configuration, tax rules, product/plan catalog, employee/staff management, quotations, subscriptions, billing engine, and executive financial analytics.

### Operations Staff
* `staff1@brightloop.example.com` (Priya Sharma — Operations Lead)
* `staff2@brightloop.example.com` (Rohan Varma — Billing Specialist)
* `staff3@brightloop.example.com` (Ananya Iyer — Customer Success Lead)
* **Role**: `staff`
* **Access**: Can create/manage quotations, convert quotes into subscriptions, generate/confirm invoices, and record incoming customer payments. Restricted from user administration and system settings.

### Customer Portal Accounts (15 Accounts)
1. `acme@brightloop.example.com` — **Acme Infotech Pvt Ltd** *(Multi-subscription showcase & billing demo)*
2. `nova@brightloop.example.com` — **Nova Retail & Logistics Solutions**
3. `bluewave@brightloop.example.com` — **Bluewave Media & Design Labs**
4. `greenfield@brightloop.example.com` — **Greenfield AgriTech Innovations** *(Unpaid invoice & closed subscription scenario)*
5. `apex@brightloop.example.com` — **Apex FinServe Advisory Services** *(Annual plan & multi-payment installment scenario)*
6. `pixelcraft@brightloop.example.com` — **PixelCraft Interactive Studios** *(Multi-line items scenario)*
7. `cloudnest@brightloop.example.com` — **CloudNest Cloud Solutions** *(Enterprise tier)*
8. `vertex@brightloop.example.com` — **Vertex AI & Robotics Systems** *(Quarterly plan)*
9. `orbit@brightloop.example.com` — **Orbit Pharma Networks** *(Weekly plan)*
10. `nexgen@brightloop.example.com` — **NexGen Mobility & Fleet Corp** *(Overdue invoice showcase)*
11. `alphacore@brightloop.example.com` — **AlphaCore Telecom Infrastructure** *(Partially paid invoice showcase)*
12. `zenith@brightloop.example.com` — **Zenith Hospitality Group** *(Confirmed subscription & draft invoice)*
13. `prism@brightloop.example.com` — **Prism Energy & Utilities**
14. `skylabs@brightloop.example.com` — **SkyLabs Aerospace & Drones** *(Cancelled invoice scenario)*
15. `quantum@brightloop.example.com` — **Quantum Retail E-Commerce** *(Paused / Vacation hold scenario)*

---

## 3. Seeded Business Data Catalog

### Products (8 Service Offerings)
1. **Brightloop Starter SaaS** (₹999.00/mo) — Single-user and Multi-user (+5 seats) variants.
2. **Brightloop Professional** (₹2,499.00/mo) — Audit trail and dedicated IP variants.
3. **Brightloop Enterprise** (₹6,999.00/mo) — SSO SAML Federation and Multi-region HA Cluster variants.
4. **Cloud Storage Package** (₹499.00/mo) — 100 GB SSD, 500 GB NVMe, and 2 TB Cold Storage variants.
5. **Analytics Add-on** (₹1,299.00/mo) — Executive Dashboards and AI Forecasting variants.
6. **Support Package** (₹1,999.00/mo) — 24/7 Priority Support and Dedicated Technical Account Manager variants.
7. **API Access Package** (₹1,499.00/mo) — Standard and High-Throughput (1,000 req/min) variants.
8. **Premium Security Package** (₹2,999.00/mo) — SOC-2 Suite and Zero-Trust Network Access variants.

### Subscription Plans (5 Cadences)
* **Weekly Sprint Plan** (`weekly`, 1 interval)
* **Monthly Standard Plan** (`monthly`, 1 interval)
* **Quarterly Growth Plan** (`monthly`, 3 intervals)
* **Annual Value Plan** (`yearly`, 1 interval)
* **Enterprise Biennial Plan** (`yearly`, 2 intervals)

### Tax Configurations (4 Rules)
* `GST 18%` (18.00%)
* `VAT 5%` (5.00%)
* `GST 12%` (12.00%)
* `Zero Tax (Exempt) 0%` (0.00%)

### Discounts (5 Promos)
* `WELCOME10`: 10% onboarding discount (min purchase ₹500)
* `HACKATHON20`: 20% hackathon demo promo (min purchase ₹1,000)
* `FLAT500`: Flat ₹500 deduction (min purchase ₹2,500)
* `ENTERPRISE15`: 15% VIP enterprise credit (min purchase ₹5,000)
* `STARTUP1000`: Flat ₹1,000 voucher (min purchase ₹4,000)

---

## 4. Business Demonstration Scenarios

| Scenario | Primary Customer | Record ID | What to Show Judges |
|---|---|---|---|
| **Autonomous Billing Generation** | Acme Infotech (`acme@...`) | `SUB-DEMO-001` | Active subscription due **TODAY** with no invoice yet for current period. Trigger `POST /api/billing/run` and watch the invoice generate in real-time. |
| **Upcoming Renewals (Next 7 Days)** | Acme Infotech & Apex FinServe | `SUB-DEMO-002`, `SUB-DEMO-003` | Demonstrates renewal alerts occurring in 3 and 5 days. |
| **Overdue Receivables** | NexGen Mobility (`nexgen@...`) | `INV-DEMO-011`, `INV-DEMO-012` | Invoices with past due dates (`due_date < CURRENT_DATE`) and ₹0 payments. Highlighted as Overdue on Admin Dashboard. |
| **Partially Paid Invoices** | AlphaCore Telecom (`alphacore@...`) | `INV-DEMO-013` | Shows ₹4,000 paid against the total bill, retaining `Confirmed` status with a remaining balance. |
| **Multiple Payments (Installments)** | Apex FinServe (`apex@...`) | `INV-DEMO-003` | Single invoice settled via two equal installments: 50% Bank Transfer + 50% Corporate Card. |
| **Draft & Cancelled Invoices** | Zenith Hospitality & SkyLabs | `INV-DEMO-014`, `INV-DEMO-016` | Demonstrates that draft and cancelled invoices do not contribute to outstanding receivables. |
| **Multi-Line & Variant Pricing** | PixelCraft Studios (`pixelcraft@...`) | `SUB-DEMO-007` | 3 distinct products with variants. Verifies pricing math: `(Base + Variant) × Qty - Discount + Tax`. |
| **Paused (Vacation Hold)** | Quantum E-Commerce (`quantum@...`) | `SUB-DEMO-016` | Suspended billing cycle; excluded from automated recurring generation. |
| **Closed Subscriptions** | Greenfield AgriTech (`greenfield@...`) | `SUB-DEMO-018` | Terminated subscription with timestamped `closed_at`. |
| **Customer Portal Isolation** | Acme Infotech (`acme@...`) | Portal View | Logging in as `acme@brightloop.example.com` shows only Acme's 3 subscriptions, invoices, and payments, strictly isolated by RBAC. |

---

## 5. Billing Engine & Duplicate Protection Demonstration

The demo system guarantees mathematical consistency and duplicate protection:
1. **First Billing Run**:
   * Calling `POST /api/billing/run` with today's date identifies `SUB-DEMO-001` (due today).
   * Generates a new invoice, creates line items with tax/variant calculations, and advances `next_billing_date` by 1 month.
2. **Second Billing Run (Idempotency)**:
   * Calling `POST /api/billing/run` a second time skips `SUB-DEMO-001` due to the database constraint `UNIQUE(subscription_id, period_start)`.
   * Result: `0 invoices generated, 0 duplicate errors`.

---

## 6. Idempotency & Data Safety Guarantees

* **Safety Flag**: If `SEED_DEMO_DATA=true` is not present, the script immediately aborts.
* **Production Guard**: If `NODE_ENV=production`, the script requires `ALLOW_PROD_DEMO_SEED=true`.
* **Zero Truncation**: The script never drops tables, never truncates data, and never deletes real customer or staff records.
* **Upsert Identification**: Uses deterministic demo codes (`SUB-DEMO-XXX`, `INV-DEMO-XXX`, `QT-DEMO-XXX`) and known email addresses to safely update or insert records.

---

## 7. Known Limitations & Notes

* **Supabase Free Tier Rate Limits**: Creating all 19 Auth accounts on first run performs sequential requests to avoid HTTP 429 rate limits. Subsequent runs detect existing accounts and execute in under 3 seconds.
* **Timezone Consistency**: All dates are normalized to `Asia/Kolkata` (`en-CA` format: `YYYY-MM-DD`) matching the business requirements.
