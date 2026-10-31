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
- **Query**: `status`, `customerId`, `page`, `limit`, `search`

### `POST /api/quotations`
- **Role**: `admin`, `staff`
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

### `GET /api/quotations/:id`
- Full quotation details, item lines, snapshot pricing.

### `PATCH /api/quotations/:id/status`
- **Body**: `{ "status": "Accepted" }` (Valid: Draft, Sent, Accepted, Rejected, Expired)

### `POST /api/quotations/:id/convert`
- Converts accepted quotation to subscription.
- **Body**:
```json
{
  "startDate": "2026-11-01",
  "expiryDate": "2027-10-31",
  "paymentTerms": "15 days"
}
```

---

## 6. Subscriptions (Owner: Member 2)

### `GET /api/subscriptions`
- **Query**: `status`, `customerId`, `planId`, `page`, `limit`

### `GET /api/subscriptions/:id`
- Full subscription details with items, plan details, and customer information.

### `PATCH /api/subscriptions/:id/status`
- **Body**: `{ "status": "Active" }` (Valid: Draft, Quotation, Confirmed, Active, Paused, Closed)

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
