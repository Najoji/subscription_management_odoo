// Mock fallback storage for seamless testing during multi-member hackathon development
// When backend endpoints return 501 (Not Implemented) or 404 while Member 2 & 3 are coding,
// this allows the UI demonstration flow to function end-to-end without breaking.

const STORAGE_KEYS = {
  QUOTATIONS: 'brightloop_mock_quotations',
  SUBSCRIPTIONS: 'brightloop_mock_subscriptions',
  INVOICES: 'brightloop_mock_invoices',
  PAYMENTS: 'brightloop_mock_payments',
  DISCOUNTS: 'brightloop_mock_discounts',
};

const getStored = (key, defaultVal = []) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : defaultVal;
  } catch {
    return defaultVal;
  }
};

const setStored = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.error('Failed to save to mock storage', err);
  }
};

export const mockFallback = {
  getQuotations(params = {}) {
    let list = getStored(STORAGE_KEYS.QUOTATIONS, []);
    if (params.status) {
      list = list.filter((q) => q.status.toLowerCase() === params.status.toLowerCase());
    }
    if (params.customerId) {
      list = list.filter((q) => q.customerId === params.customerId);
    }
    return { data: list, pagination: { total: list.length, page: 1, limit: 50 } };
  },

  getQuotationById(id) {
    const list = getStored(STORAGE_KEYS.QUOTATIONS, []);
    return list.find((q) => q.id === id) || null;
  },

  createQuotation(payload, products = [], customer = null, plan = null) {
    const list = getStored(STORAGE_KEYS.QUOTATIONS, []);
    const quoteNum = `QT-${new Date().getFullYear()}-${String(list.length + 101).padStart(4, '0')}`;
    
    // Calculate preview items
    let subtotal = 0;
    const items = (payload.items || []).map((item) => {
      const prod = products.find((p) => p.id === item.productId);
      const variant = prod?.variants?.find((v) => v.id === item.variantId);
      const unitPrice = Number(prod?.salesPrice || 0) + Number(variant?.extraPrice || 0);
      const lineTotal = unitPrice * Number(item.quantity || 1);
      subtotal += lineTotal;
      return {
        id: crypto.randomUUID(),
        productId: item.productId,
        variantId: item.variantId,
        productName: prod?.name || 'Product',
        variantName: variant?.name || null,
        description: prod?.notes || prod?.name || '',
        quantity: Number(item.quantity || 1),
        unitPrice,
        lineTotal,
      };
    });

    const taxRate = 18; // default 18%
    const taxTotal = Math.round(subtotal * (taxRate / 100) * 100) / 100;
    const total = subtotal + taxTotal;

    const newQuote = {
      id: crypto.randomUUID(),
      quoteNumber: quoteNum,
      customerId: payload.customerId,
      customerName: customer?.fullName || customer?.email || 'Customer',
      planId: payload.planId,
      planName: plan?.name || 'Standard Plan',
      templateId: payload.templateId || null,
      validUntil: payload.validUntil || new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
      status: 'Quotation',
      subtotal,
      discountTotal: 0,
      taxTotal,
      total,
      notes: payload.notes || '',
      items,
      createdAt: new Date().toISOString(),
    };

    list.unshift(newQuote);
    setStored(STORAGE_KEYS.QUOTATIONS, list);
    return newQuote;
  },

  updateQuotationStatus(id, status) {
    const list = getStored(STORAGE_KEYS.QUOTATIONS, []);
    const idx = list.findIndex((q) => q.id === id);
    if (idx !== -1) {
      list[idx].status = status;
      setStored(STORAGE_KEYS.QUOTATIONS, list);
      return list[idx];
    }
    return null;
  },

  convertQuotation(id, convertPayload = {}) {
    const list = getStored(STORAGE_KEYS.QUOTATIONS, []);
    const quote = list.find((q) => q.id === id);
    if (!quote) throw new Error('Quotation not found');

    quote.status = 'Accepted';
    setStored(STORAGE_KEYS.QUOTATIONS, list);

    // Create Subscription
    const subList = getStored(STORAGE_KEYS.SUBSCRIPTIONS, []);
    const subNum = `SUB-${new Date().getFullYear()}-${String(subList.length + 1001).padStart(5, '0')}`;
    const startDate = convertPayload.startDate || new Date().toISOString().split('T')[0];
    const expiryDate = convertPayload.expiryDate || new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0];

    const newSub = {
      id: crypto.randomUUID(),
      subscriptionNumber: subNum,
      customerId: quote.customerId,
      customerName: quote.customerName,
      planId: quote.planId,
      planName: quote.planName,
      quotationId: quote.id,
      startDate,
      expiryDate,
      nextBillingDate: startDate,
      paymentTerms: convertPayload.paymentTerms || '15 days',
      status: 'Confirmed',
      items: quote.items || [],
      subtotal: quote.subtotal,
      taxTotal: quote.taxTotal,
      total: quote.total,
      createdAt: new Date().toISOString(),
    };

    subList.unshift(newSub);
    setStored(STORAGE_KEYS.SUBSCRIPTIONS, subList);
    return newSub;
  },

  getSubscriptions(params = {}) {
    let list = getStored(STORAGE_KEYS.SUBSCRIPTIONS, []);
    if (params.status) {
      list = list.filter((s) => s.status.toLowerCase() === params.status.toLowerCase());
    }
    if (params.customerId) {
      list = list.filter((s) => s.customerId === params.customerId);
    }
    return { data: list, pagination: { total: list.length, page: 1, limit: 50 } };
  },

  getSubscriptionById(id) {
    const list = getStored(STORAGE_KEYS.SUBSCRIPTIONS, []);
    return list.find((s) => s.id === id) || null;
  },

  updateSubscriptionStatus(id, status) {
    const list = getStored(STORAGE_KEYS.SUBSCRIPTIONS, []);
    const idx = list.findIndex((s) => s.id === id);
    if (idx !== -1) {
      list[idx].status = status;
      if (status === 'Closed') {
        list[idx].closedAt = new Date().toISOString();
      }
      setStored(STORAGE_KEYS.SUBSCRIPTIONS, list);
      return list[idx];
    }
    return null;
  },

  runBilling(asOfDate = new Date().toISOString().split('T')[0]) {
    const subList = getStored(STORAGE_KEYS.SUBSCRIPTIONS, []);
    const invList = getStored(STORAGE_KEYS.INVOICES, []);

    let generatedCount = 0;
    let skippedCount = 0;

    subList.forEach((sub) => {
      if (sub.status !== 'Active') return;
      if (sub.nextBillingDate && sub.nextBillingDate <= asOfDate) {
        // Check duplicate
        const periodStart = sub.nextBillingDate;
        const exists = invList.some(
          (inv) => inv.subscriptionId === sub.id && inv.periodStart === periodStart
        );

        if (exists) {
          skippedCount++;
          return;
        }

        const d = new Date(periodStart);
        d.setMonth(d.getMonth() + 1);
        const periodEnd = d.toISOString().split('T')[0];

        const invNum = `INV-${new Date().getFullYear()}-${String(invList.length + 1001).padStart(5, '0')}`;
        const newInv = {
          id: crypto.randomUUID(),
          invoiceNumber: invNum,
          subscriptionId: sub.id,
          subscriptionNumber: sub.subscriptionNumber,
          customerId: sub.customerId,
          customerName: sub.customerName,
          periodStart,
          periodEnd,
          issueDate: new Date().toISOString().split('T')[0],
          dueDate: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
          status: 'Draft',
          subtotal: sub.subtotal || 1000,
          discountTotal: 0,
          taxTotal: sub.taxTotal || 180,
          total: sub.total || 1180,
          amountPaid: 0,
          items: (sub.items || []).map((it) => ({
            id: crypto.randomUUID(),
            productName: it.productName || 'Subscription Service',
            variantName: it.variantName || null,
            quantity: it.quantity || 1,
            unitPrice: it.unitPrice || 1000,
            lineSubtotal: (it.unitPrice || 1000) * (it.quantity || 1),
            taxRate: 18,
            taxAmount: Math.round((it.unitPrice || 1000) * (it.quantity || 1) * 0.18 * 100) / 100,
            lineTotal: Math.round((it.unitPrice || 1000) * (it.quantity || 1) * 1.18 * 100) / 100,
          })),
          createdAt: new Date().toISOString(),
        };

        invList.unshift(newInv);
        sub.nextBillingDate = periodEnd;
        generatedCount++;
      }
    });

    setStored(STORAGE_KEYS.INVOICES, invList);
    setStored(STORAGE_KEYS.SUBSCRIPTIONS, subList);

    return {
      invoicesGenerated: generatedCount,
      skippedDuplicates: skippedCount,
      errors: [],
    };
  },

  getInvoices(params = {}) {
    let list = getStored(STORAGE_KEYS.INVOICES, []);
    if (params.status) {
      list = list.filter((i) => i.status.toLowerCase() === params.status.toLowerCase());
    }
    if (params.customerId) {
      list = list.filter((i) => i.customerId === params.customerId);
    }
    return { data: list, pagination: { total: list.length, page: 1, limit: 50 } };
  },

  getInvoiceById(id) {
    const list = getStored(STORAGE_KEYS.INVOICES, []);
    const inv = list.find((i) => i.id === id);
    if (!inv) return null;
    const payments = getStored(STORAGE_KEYS.PAYMENTS, []).filter((p) => p.invoiceId === id);
    return { ...inv, payments };
  },

  confirmInvoice(id) {
    const list = getStored(STORAGE_KEYS.INVOICES, []);
    const inv = list.find((i) => i.id === id);
    if (inv) {
      inv.status = 'Confirmed';
      setStored(STORAGE_KEYS.INVOICES, list);
      return inv;
    }
    return null;
  },

  cancelInvoice(id) {
    const list = getStored(STORAGE_KEYS.INVOICES, []);
    const inv = list.find((i) => i.id === id);
    if (inv) {
      inv.status = 'Cancelled';
      setStored(STORAGE_KEYS.INVOICES, list);
      return inv;
    }
    return null;
  },

  recordPayment(invoiceId, payload, staffUser) {
    const invList = getStored(STORAGE_KEYS.INVOICES, []);
    const inv = invList.find((i) => i.id === invoiceId);
    if (!inv) throw new Error('Invoice not found');

    const amount = Number(payload.amount);
    const newPaid = Number(inv.amountPaid || 0) + amount;
    inv.amountPaid = newPaid;

    if (newPaid >= Number(inv.total)) {
      inv.status = 'Paid';
    }

    setStored(STORAGE_KEYS.INVOICES, invList);

    // Save payment record
    const payList = getStored(STORAGE_KEYS.PAYMENTS, []);
    const newPayment = {
      id: crypto.randomUUID(),
      invoiceId,
      invoiceNumber: inv.invoiceNumber,
      customerName: inv.customerName,
      method: payload.method || 'UPI',
      amount,
      paymentDate: payload.paymentDate || new Date().toISOString().split('T')[0],
      note: payload.note || '',
      receivedBy: staffUser?.fullName || 'Staff User',
      createdAt: new Date().toISOString(),
    };

    payList.unshift(newPayment);
    setStored(STORAGE_KEYS.PAYMENTS, payList);
    return newPayment;
  },

  getPayments(params = {}) {
    let list = getStored(STORAGE_KEYS.PAYMENTS, []);
    if (params.invoiceId) {
      list = list.filter((p) => p.invoiceId === params.invoiceId);
    }
    return { data: list, pagination: { total: list.length, page: 1, limit: 50 } };
  },

  getDiscounts() {
    return { data: getStored(STORAGE_KEYS.DISCOUNTS, []) };
  },

  createDiscount(payload) {
    const list = getStored(STORAGE_KEYS.DISCOUNTS, []);
    const newDisc = {
      id: crypto.randomUUID(),
      ...payload,
      usageCount: 0,
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    list.unshift(newDisc);
    setStored(STORAGE_KEYS.DISCOUNTS, list);
    return newDisc;
  },

  getDashboardSummary() {
    const subList = getStored(STORAGE_KEYS.SUBSCRIPTIONS, []);
    const invList = getStored(STORAGE_KEYS.INVOICES, []);
    const payList = getStored(STORAGE_KEYS.PAYMENTS, []);

    const activeSubs = subList.filter((s) => s.status === 'Active').length;
    const totalRevenue = payList.reduce((sum, p) => sum + Number(p.amount || 0), 0);
    const outstanding = invList
      .filter((i) => i.status !== 'Paid' && i.status !== 'Cancelled')
      .reduce((sum, i) => sum + (Number(i.total || 0) - Number(i.amountPaid || 0)), 0);

    const todayStr = new Date().toISOString().split('T')[0];
    const overdue = invList.filter(
      (i) => i.status === 'Confirmed' && i.dueDate < todayStr && Number(i.amountPaid || 0) < Number(i.total || 0)
    ).length;

    const statusCounts = { Active: 0, Confirmed: 0, Draft: 0, Paused: 0, Closed: 0 };
    subList.forEach((s) => {
      if (statusCounts[s.status] !== undefined) {
        statusCounts[s.status]++;
      } else {
        statusCounts[s.status] = 1;
      }
    });

    return {
      activeSubscriptions: activeSubs,
      totalSubscriptions: subList.length,
      revenueCollected: totalRevenue,
      outstandingAmount: outstanding,
      overdueInvoices: overdue,
      subscriptionStatusCounts: statusCounts,
      revenueByPeriod: [
        { period: '2026-08', revenue: 42000 },
        { period: '2026-09', revenue: 58000 },
        { period: '2026-10', revenue: totalRevenue > 0 ? totalRevenue : 65000 },
      ],
    };
  },
};
