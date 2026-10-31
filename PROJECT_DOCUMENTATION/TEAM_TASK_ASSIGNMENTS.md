# Team Task Assignments — Brightloop Subscription Management System

| Member | Role | Branch | Assigned Modules / Responsibilities |
|---|---|---|---|
| **Member 1 (You)** | Integration Lead, Platform Foundation | `feature/auth-foundation` | Central Express app (`app.js`, `server.js`), Auth/RBAC middleware, Supabase schema migration, Products, Plans, Taxes, User/Staff management, PR merges into `develop`. |
| **Member 2** | Backend Module Owner | `feature/subscriptions` | Quotations (`/api/quotations`), Quotation templates, Quotation conversion (`/api/quotations/:id/convert`), Subscriptions lifecycle (`/api/subscriptions`). |
| **Member 3** | Backend Module Owner | `feature/billing-engine` | Recurring billing runner (`/api/billing/run`), Invoices (`/api/invoices`), Discounts (`/api/discounts`), Payments (`/api/payments`), Dashboard analytics (`/api/dashboard/summary`). |
| **Member 4** | Frontend Lead | `feature/frontend-dashboard` | Entire `client/` React + Vite application, Tailwind styling, AuthContext, Admin/Staff/Customer portals, Demo workflow navigation, API integration. |
