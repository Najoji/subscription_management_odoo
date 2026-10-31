# API Contracts — Brightloop Subscription Management System

Base URL: `http://localhost:5000/api`

---

## Standard Response Wrappers

### Success Response (HTTP 200 / 201)
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {},
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 45,
    "totalPages": 5
  }
}
```
*(Note: `pagination` is `null` for single-object or non-paginated endpoints).*

### Error Response (HTTP 400, 401, 403, 404, 409, 500)
```json
{
  "success": false,
  "message": "Detailed error message",
  "errors": []
}
```

---

## 1. Authentication & Users

### `GET /api/auth/me`
- **Headers**: `Authorization: Bearer <token>`
- **Response**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "admin@brightloop.com",
    "fullName": "System Admin",
    "role": "admin",
    "phone": "+919876543210"
  }
}
```

### `GET /api/users`
- **Role**: `admin`
- **Query**: `role`, `search`, `page`, `limit`

### `POST /api/users/staff`
- **Role**: `admin` only
- **Body**:
```json
{
  "fullName": "Alex Staff",
  "email": "alex@brightloop.com",
  "password": "Password123!",
  "phone": "+919876543211"
}
```

### `GET /api/users/customers`
- **Role**: `admin`, `staff`
- **Query**: `search`, `page`, `limit`

---

## 2. Taxes

### `GET /api/taxes`
- **Query**: `isActive`

### `POST /api/taxes`
- **Role**: `admin`
- **Body**: `{ "name": "GST 18%", "rate": 18.00 }`

---

## 3. Products & Variants

### `GET /api/products`
- **Query**: `search`, `isActive`, `page`, `limit`

### `POST /api/products`
- **Role**: `admin`
- **Body**:
```json
{
  "name": "Brightloop CRM Core",
  "productType": "service",
  "salesPrice": 1000.00,
  "costPrice": 400.00,
  "notes": "Standard CRM subscription",
  "taxId": "uuid-of-tax",
  "variants": [
    {
      "name": "Odoo Integration Add-on",
      "extraPrice": 560.00
    }
  ]
}
```

### `GET /api/products/:id`
- Returns product along with its `product_variants` and associated `taxes`.

### `PATCH /api/products/:id`
- Updates product details or active status.

---

## 4. Plans

### `GET /api/plans`
- **Query**: `search`, `isActive`, `billingInterval`

### `POST /api/plans`
- **Role**: `admin`
- **Body**:
```json
{
  "name": "Pro Monthly",
  "billingInterval": "monthly",
  "intervalCount": 1,
  "minimumQuantity": 1,
  "availableFrom": "2026-01-01",
  "availableTo": "2027-12-31",
  "autoClose": false,
  "autoCloseDays": null,
  "allowEarlyClose": true,
  "allowPause": true,
  "allowRenewal": true
}
```

---

## 5. Quotations (Owner: Member 2)

### `GET /api/quotations`
- **Role**: `admin`, `staff`, `customer` (customers automatically scoped to their own quotations)
- **Query**: `status`, `customerId`, `page`, `limit`, `search`, `startDate`, `endDate`
- **Response**: List of quotations with customer profile, plan, creator, and items snapshot.

### `GET /api/quotations/:id`
- **Role**: `admin`, `staff`, `customer` (customer ownership strictly enforced)
- **Response**: Full quotation details, item lines, snapshot pricing, customer, plan, and template.

### `POST /api/quotations`
- **Role**: `admin`, `staff`, `customer` (if customer, `customerId` is automatically derived from token)
- **Body**:
```json
{
  "customerId": "uuid",
  "planId": "uuid",
  "templateId": null,
  "validUntil": "2026-11-15",
  "notes": "Custom discount applied",
  "discountId": null,
  "items": [
    {
      "productId": "uuid",
      "variantId": "uuid-or-null",
      "quantity": 2
    }
  ]
}
```
*Note: Backend computes prices from products and variants tables. Frontend unit prices are never trusted.*

### `PATCH /api/quotations/:id/status`
- **Role**: `admin`, `staff`, `customer`
  - Customers can transition `Sent` -> `Accepted` or `Rejected` for their own quotations.
  - Staff/admin can transition `Draft` -> `Sent`/`Rejected`, `Sent` -> `Accepted`/`Rejected`/`Expired`/`Draft`, etc.
- **Body**: `{ "status": "Accepted" }` (Valid: Draft, Sent, Accepted, Rejected, Expired)

### `POST /api/quotations/:id/convert`
- **Role**: `admin`, `staff`
- **Description**: Converts an accepted quotation to a subscription, creating the subscription and snapshot items, and marking quotation as `Converted` with `converted_subscription_id`.
- **Body**:
```json
{
  "planId": "uuid-or-null-if-quotation-has-plan",
  "startDate": "2026-11-01",
  "expiryDate": "2027-10-31",
  "paymentTerms": "15 days"
}
```

### Quotation Templates

#### `GET /api/quotations/templates`
- **Role**: `admin`, `staff`, `customer`
- Returns all reusable quotation templates with items and plan.

#### `GET /api/quotations/templates/:id`
- **Role**: `admin`, `staff`, `customer`

#### `POST /api/quotations/templates`
- **Role**: `admin`, `staff`
- **Body**:
```json
{
  "name": "Enterprise Bundle Template",
  "planId": "uuid-or-null",
  "items": [
    {
      "productId": "uuid",
      "variantId": "uuid-or-null",
      "quantity": 1
    }
  ]
}
```

#### `DELETE /api/quotations/templates/:id`
- **Role**: `admin`, `staff`

---

## 6. Subscriptions (Owner: Member 2)

### `GET /api/subscriptions`
- **Role**: `admin`, `staff`, `customer` (customers automatically scoped to their own subscriptions)
- **Query**: `status`, `customerId`, `planId`, `search`, `page`, `limit`, `startDate`, `expiryDate`

### `GET /api/subscriptions/:id`
- **Role**: `admin`, `staff`, `customer` (customer ownership strictly enforced)
- Full subscription details with items, plan details, customer information, and associated invoices.

### `POST /api/subscriptions`
- **Role**: `admin`, `staff`
- **Description**: Direct creation of a subscription by staff.
- **Body**:
```json
{
  "customerId": "uuid",
  "planId": "uuid",
  "startDate": "2026-11-01",
  "expiryDate": "2027-10-31",
  "paymentTerms": "Due Upon Receipt",
  "status": "Confirmed",
  "items": [
    {
      "productId": "uuid",
      "variantId": "uuid-or-null",
      "quantity": 1
    }
  ]
}
```

### `PATCH /api/subscriptions/:id/status`
- **Role**: `admin`, `staff`
- **Body**: `{ "status": "Active" }` (Valid: Draft, Quotation, Confirmed, Active, Paused, Closed)
- Enforces plan permissions (`allow_pause`, `allow_early_close`).

### Dedicated Lifecycle Action Endpoints:
- `POST /api/subscriptions/:id/confirm` — Transitions subscription to `Confirmed`.
- `POST /api/subscriptions/:id/activate` — Transitions subscription to `Active` (eligible for recurring billing).
- `POST /api/subscriptions/:id/pause` — Transitions to `Paused` (validates `plan.allow_pause`).
- `POST /api/subscriptions/:id/resume` — Transitions from `Paused` back to `Active`.
- `POST /api/subscriptions/:id/close` — Transitions to `Closed` (validates `plan.allow_early_close` if closing before expiry). Sets `closed_at`.
- `POST /api/subscriptions/:id/renew` — Renews expired/closed subscription (validates `plan.allow_renewal`). Body (optional): `{ "newExpiryDate": "2027-10-31" }`. Sets status to `Active`.

---

## 7. Billing Engine & Invoices (Owner: Member 3)

### `POST /api/billing/run`
- **Role**: `admin`, `staff`
- **Body**: `{ "asOfDate": "2026-11-01" }`
- **Response**:
```json
{
  "success": true,
  "message": "Billing run completed",
  "data": {
    "invoicesGenerated": 4,
    "skippedDuplicates": 12,
    "errors": []
  }
}
```

### `GET /api/invoices`
- **Query**: `status`, `customerId`, `subscriptionId`, `isOverdue`, `page`, `limit`

### `GET /api/invoices/:id`
- Full invoice details, line items, taxes, payment records, outstanding balance.

### `POST /api/invoices/:id/confirm`
- Moves invoice from `Draft` to `Confirmed`.

### `POST /api/invoices/:id/cancel`
- Cancels eligible invoice.

---

## 8. Discounts (Owner: Member 3)

### `GET /api/discounts`
- **Query**: `isActive`, `search`

### `POST /api/discounts`
- **Role**: `admin`
- **Body**:
```json
{
  "name": "Diwali Offer",
  "code": "DIWALI10",
  "discountType": "percentage",
  "value": 10.00,
  "minimumPurchase": 2000.00,
  "minimumQuantity": 1,
  "startAt": "2026-10-01",
  "endAt": "2026-11-15",
  "usageLimit": 100,
  "applicableTo": "subscription"
}
```

---

## 9. Payments (Owner: Member 3)

### `GET /api/payments`
- **Query**: `invoiceId`, `page`, `limit`

### `POST /api/invoices/:id/payments`
- **Role**: `admin`, `staff`
- **Body**:
```json
{
  "method": "UPI",
  "amount": 1560.00,
  "paymentDate": "2026-11-01",
  "note": "Payment ref UPI-987654"
}
```
- Automatically marks invoice `Paid` if `amount_paid + amount >= total`.

---

## 10. Dashboard Analytics (Owner: Member 3)

### `GET /api/dashboard/summary`
- **Role**: `admin`, `staff`
- **Response**:
```json
{
  "success": true,
  "data": {
    "activeSubscriptions": 14,
    "totalSubscriptions": 20,
    "revenueCollected": 124500.00,
    "outstandingAmount": 15800.00,
    "overdueInvoices": 2,
    "subscriptionStatusCounts": {
      "Active": 14,
      "Draft": 2,
      "Paused": 1,
      "Closed": 3
    },
    "revenueByPeriod": [
      { "period": "2026-10", "revenue": 62000.00 },
      { "period": "2026-11", "revenue": 62500.00 }
    ]
  }
}
```
