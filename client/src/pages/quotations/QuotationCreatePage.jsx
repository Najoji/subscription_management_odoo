import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Card from '../../components/common/Card.jsx';
import Button from '../../components/common/Button.jsx';
import FormField from '../../components/forms/FormField.jsx';
import Input from '../../components/forms/Input.jsx';
import Select from '../../components/forms/Select.jsx';
import TextArea from '../../components/forms/TextArea.jsx';
import { quotationApi } from '../../api/quotationApi.js';
import { productApi } from '../../api/productApi.js';
import { planApi } from '../../api/planApi.js';
import { authApi } from '../../api/authApi.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { formatCurrency } from '../../utils/formatters.js';
import { Plus, Trash2, ArrowLeft, FileText, CheckCircle2 } from 'lucide-react';

export default function QuotationCreatePage() {
  const { role } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [customers, setCustomers] = useState([]);
  const [plans, setPlans] = useState([]);
  const [products, setProducts] = useState([]);

  const [customerId, setCustomerId] = useState(location.state?.selectedCustomerId || '');
  const [planId, setPlanId] = useState('');
  const [validUntil, setValidUntil] = useState(
    new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0]
  );
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState([
    { productId: '', variantId: '', quantity: 1 },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  const basePath = role === 'admin' ? '/admin' : '/staff';

  // Load prerequisite options
  useEffect(() => {
    const loadPrerequisites = async () => {
      try {
        const [custRes, planRes, prodRes] = await Promise.allSettled([
          authApi.getCustomers(),
          planApi.getPlans(),
          productApi.getProducts(),
        ]);

        if (custRes.status === 'fulfilled' && custRes.value?.data) {
          setCustomers(custRes.value.data);
          if (!customerId && custRes.value.data.length > 0) {
            setCustomerId(custRes.value.data[0].id);
          }
        }
        if (planRes.status === 'fulfilled' && planRes.value?.data) {
          setPlans(planRes.value.data);
          if (planRes.value.data.length > 0) {
            setPlanId(planRes.value.data[0].id);
          }
        }
        if (prodRes.status === 'fulfilled' && prodRes.value?.data) {
          setProducts(prodRes.value.data);
          if (prodRes.value.data.length > 0) {
            setItems([{ productId: prodRes.value.data[0].id, variantId: '', quantity: 1 }]);
          }
        }
      } catch (err) {
        console.error('Failed to load quotation form dependencies:', err);
      } finally {
        setIsInitializing(false);
      }
    };

    loadPrerequisites();
  }, []);

  const handleAddItem = () => {
    const defaultProdId = products.length > 0 ? products[0].id : '';
    setItems([...items, { productId: defaultProdId, variantId: '', quantity: 1 }]);
  };

  const handleRemoveItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index, field, value) => {
    const updated = [...items];
    updated[index][field] = value;
    // If product changed, reset variantId
    if (field === 'productId') {
      updated[index].variantId = '';
    }
    setItems(updated);
  };

  // Live estimated totals for user guidance (final totals calculated on server)
  const estimatedSubtotal = items.reduce((sum, item) => {
    const prod = products.find((p) => p.id === item.productId);
    const variantsList = prod?.variants || prod?.product_variants || [];
    const variant = variantsList.find((v) => v.id === item.variantId);
    const unitPrice = Number(prod?.salesPrice || prod?.sales_price || 0) + Number(variant?.extraPrice || variant?.extra_price || 0);
    return sum + unitPrice * Number(item.quantity || 1);
  }, 0);

  const estimatedTax = Math.round(estimatedSubtotal * 0.18 * 100) / 100;
  const estimatedTotal = estimatedSubtotal + estimatedTax;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!customerId) {
      error('Please select a customer');
      return;
    }
    if (!planId) {
      error('Please select a subscription plan');
      return;
    }
    if (items.length === 0 || !items.some((it) => it.productId)) {
      error('Please add at least one valid product line');
      return;
    }

    setIsLoading(true);
    try {
      const selectedCustomer = customers.find((c) => c.id === customerId);
      const selectedPlan = plans.find((p) => p.id === planId);

      const payload = {
        customerId,
        planId,
        validUntil,
        notes: notes.trim(),
        items: items
          .filter((it) => it.productId)
          .map((it) => ({
            productId: it.productId,
            variantId: it.variantId || null,
            quantity: Number(it.quantity || 1),
          })),
      };

      const res = await quotationApi.createQuotation(payload, {
        products,
        customer: selectedCustomer,
        plan: selectedPlan,
      });

      if (res?.success) {
        success('Quotation created successfully!');
        const quoteId = res.data?.id;
        if (quoteId) {
          navigate(`${basePath}/quotations/${quoteId}`);
        } else {
          navigate(`${basePath}/quotations`);
        }
      } else {
        throw new Error(res?.message || 'Failed to create quotation');
      }
    } catch (err) {
      error(err.message || 'Error creating quotation');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(`${basePath}/quotations`)}
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Quotations
        </button>

        <h1 className="text-xl font-bold text-white tracking-tight">
          Create Subscription Quotation
        </h1>
        <div />
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Customer & Plan Details */}
        <Card title="Quotation Header & Customer Details">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <FormField label="Customer Organization" required>
              <Select
                placeholder="Select Customer"
                options={customers.map((c) => ({
                  value: c.id,
                  label: `${c.fullName || c.full_name || 'Customer'} (${c.email})`,
                }))}
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                required
              />
            </FormField>

            <FormField label="Subscription Plan" required>
              <Select
                placeholder="Select Plan"
                options={plans.map((p) => ({
                  value: p.id,
                  label: `${p.name} (Billed ${p.billingInterval || p.billing_interval})`,
                }))}
                value={planId}
                onChange={(e) => setPlanId(e.target.value)}
                required
              />
            </FormField>

            <FormField label="Quotation Validity Date" required>
              <Input
                type="date"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
                required
              />
            </FormField>
          </div>
        </Card>

        {/* Product Lines */}
        <Card
          title="Quoted Products & Add-ons"
          subtitle="Select products, choose variants, and set required license quantities"
          action={
            <Button
              type="button"
              variant="outline"
              size="sm"
              icon={Plus}
              onClick={handleAddItem}
            >
              Add Product Line
            </Button>
          }
        >
          <div className="space-y-4">
            {items.map((item, idx) => {
              const selectedProd = products.find((p) => p.id === item.productId);
              const availableVariants = selectedProd?.variants || selectedProd?.product_variants || [];
              const selectedVariant = availableVariants.find((v) => v.id === item.variantId);
              const unitPrice =
                Number(selectedProd?.salesPrice || selectedProd?.sales_price || 0) +
                Number(selectedVariant?.extraPrice || selectedVariant?.extra_price || 0);
              const lineTotal = unitPrice * Number(item.quantity || 1);

              return (
                <div
                  key={idx}
                  className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center gap-3"
                >
                  <div className="flex-1 w-full sm:w-auto">
                    <FormField label="Product" required>
                      <Select
                        placeholder="Select Product"
                        options={products.map((p) => ({
                          value: p.id,
                          label: `${p.name} — ${formatCurrency(p.salesPrice || p.sales_price)}`,
                        }))}
                        value={item.productId}
                        onChange={(e) => handleItemChange(idx, 'productId', e.target.value)}
                        required
                      />
                    </FormField>
                  </div>

                  {availableVariants.length > 0 && (
                    <div className="w-full sm:w-56">
                      <FormField label="Variant / Add-on">
                        <Select
                          placeholder="Standard (No Variant)"
                          options={availableVariants.map((v) => ({
                            value: v.id,
                            label: `${v.name} (+${formatCurrency(v.extraPrice || v.extra_price)})`,
                          }))}
                          value={item.variantId}
                          onChange={(e) => handleItemChange(idx, 'variantId', e.target.value)}
                        />
                      </FormField>
                    </div>
                  )}

                  <div className="w-full sm:w-24">
                    <FormField label="Quantity" required>
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                        required
                      />
                    </FormField>
                  </div>

                  <div className="w-full sm:w-32 text-right self-end sm:self-center pt-2 sm:pt-0">
                    <span className="text-[10px] text-slate-500 uppercase block">Line Total</span>
                    <span className="text-sm font-bold text-emerald-400">
                      {formatCurrency(lineTotal)}
                    </span>
                  </div>

                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
                      className="self-end sm:self-center p-2 text-rose-400 hover:text-rose-500 rounded-lg hover:bg-rose-950/30"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Pricing Estimation Note */}
          <div className="mt-6 pt-4 border-t border-slate-800 flex flex-col sm:flex-row justify-between items-start gap-4">
            <div className="flex-1 max-w-sm">
              <FormField label="Quotation Notes / Terms">
                <TextArea
                  rows={2}
                  placeholder="Payment conditions, implementation timeline, or special clauses..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </FormField>
            </div>

            <div className="w-full sm:w-64 bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Estimated Subtotal:</span>
                <span className="font-semibold text-white">{formatCurrency(estimatedSubtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Estimated GST (18%):</span>
                <span className="font-semibold text-white">{formatCurrency(estimatedTax)}</span>
              </div>
              <div className="border-t border-slate-800 pt-2 flex justify-between text-sm font-black text-white">
                <span>Estimated Total:</span>
                <span className="text-emerald-400">{formatCurrency(estimatedTotal)}</span>
              </div>
              <p className="text-[10px] text-slate-500 pt-1">
                *Final line snapshots and taxes will be locked upon quotation creation by backend.
              </p>
            </div>
          </div>
        </Card>

        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={() => navigate(`${basePath}/quotations`)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            icon={FileText}
            isLoading={isLoading}
          >
            Save Quotation
          </Button>
        </div>
      </form>
    </div>
  );
}
