# Master Architecture — Brightloop Subscription Management System

## 1. Overview
Brightloop is a complete subscription management and recurring billing platform. It unifies product and plan configuration, quotations, subscription lifecycles, automated recurring billing, discount/tax calculations, payment recording, and financial KPI reporting.

## 2. High-Level Architecture
```
+----------------------------------------------------------------+
|                     Frontend (React + Vite)                    |
|    Tailwind CSS | React Router | Lucide React | Recharts       |
|    Supabase JS (Auth only: Sign-in, Sign-up, Password Reset)   |
+-------------------------------+--------------------------------+
                                |  HTTP (Bearer JWT)
                                v
+----------------------------------------------------------------+
|                   Backend API (Express.js ES6)                 |
|  - Auth & RBAC Middleware (Verifies JWT via Supabase)          |
|  - Modules: Auth/Users, Products, Plans, Taxes,                |
|             Quotations, Subscriptions, Billing, Discounts,     |
|             Payments, Dashboard                                |
|  - All pricing & billing business logic executed centrally     |
+-------------------------------+--------------------------------+
                                |  Supabase Service-Role Client
                                v
+----------------------------------------------------------------+
|                 Database (Supabase PostgreSQL)                 |
|  - Tables: profiles, products, product_variants, taxes, plans, |
|            quotations, quotation_items, quotation_templates,  |
|            subscriptions, subscription_items, discounts,       |
|            invoices, invoice_items, payments                   |
|  - Row Level Security (RLS) enabled                            |
|  - Constraints & Triggers (e.g. UNIQUE subscription/period)    |
+----------------------------------------------------------------+
```

## 3. Technology Stack Lock
- **Frontend**: React (Vite), JavaScript, Tailwind CSS, React Router, Axios, Recharts, Lucide React, `@supabase/supabase-js` (Auth only).
- **Backend**: Node.js, Express.js (ES Modules `type: "module"`), `@supabase/supabase-js` (service-role client for DB queries, anon client for auth verification).
- **Database**: Supabase PostgreSQL with SQL migrations in `supabase/migrations/`.
- **Primary Demonstrator Workflow**:
  Admin login $\rightarrow$ Create products/variants/plans/taxes $\rightarrow$ Customer registration / staff creation $\rightarrow$ Staff creates quotation $\rightarrow$ Convert to subscription $\rightarrow$ Activate subscription $\rightarrow$ Run billing $\rightarrow$ Generate invoice $\rightarrow$ Staff records payment $\rightarrow$ Invoice marks Paid $\rightarrow$ Dashboard reflects live metrics.

## 4. Security Model & Secrets
- `SUPABASE_SERVICE_ROLE_KEY` is **strictly server-side**. Never expose it in client code or Git.
- Frontend uses `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
- Backend verifies `Authorization: Bearer <token>` on every protected route and attaches `req.user` with role: `admin`, `staff`, or `customer`.
