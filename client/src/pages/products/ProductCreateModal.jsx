import React, { useState, useEffect } from 'react';
import Modal from '../../components/common/Modal.jsx';
import Button from '../../components/common/Button.jsx';
import FormField from '../../components/forms/FormField.jsx';
import Input from '../../components/forms/Input.jsx';
import Select from '../../components/forms/Select.jsx';
import TextArea from '../../components/forms/TextArea.jsx';
import { productApi } from '../../api/productApi.js';
import { taxApi } from '../../api/taxApi.js';
import { useToast } from '../../context/ToastContext.jsx';
import { formatCurrency } from '../../utils/formatters.js';
import { Plus, Trash2, Package } from 'lucide-react';

export default function ProductCreateModal({ isOpen, onClose, onSuccess }) {
  const [name, setName] = useState('');
  const [productType, setProductType] = useState('service');
  const [salesPrice, setSalesPrice] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [notes, setNotes] = useState('');
  const [taxId, setTaxId] = useState('');
  const [taxes, setTaxes] = useState([]);
  const [variants, setVariants] = useState([{ name: '', extraPrice: '' }]);
  const [isLoading, setIsLoading] = useState(false);

  const { success, error } = useToast();

  useEffect(() => {
    if (isOpen) {
      taxApi.getTaxes()
        .then((res) => {
          if (res?.data) {
            setTaxes(res.data);
            if (res.data.length > 0) setTaxId(res.data[0].id);
          }
        })
        .catch((err) => console.warn('Could not load taxes:', err));
    }
  }, [isOpen]);

  const handleAddVariantRow = () => {
    setVariants([...variants, { name: '', extraPrice: '' }]);
  };

  const handleRemoveVariantRow = (index) => {
    setVariants(variants.filter((_, i) => i !== index));
  };

  const handleVariantChange = (index, field, value) => {
    const updated = [...variants];
    updated[index][field] = value;
    setVariants(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      error('Product name is required');
      return;
    }
    if (!salesPrice || Number(salesPrice) < 0) {
      error('Please enter a valid sales price');
      return;
    }

    setIsLoading(true);
    try {
      // Clean variants
      const cleanVariants = variants
        .filter((v) => v.name.trim())
        .map((v) => ({
          name: v.name.trim(),
          extraPrice: Number(v.extraPrice || 0),
        }));

      const payload = {
        name: name.trim(),
        productType,
        salesPrice: Number(salesPrice),
        costPrice: costPrice ? Number(costPrice) : 0,
        notes: notes.trim(),
        taxId: taxId || null,
        variants: cleanVariants,
      };

      const res = await productApi.createProduct(payload);
      if (res?.success) {
        success('Product and variants created successfully!');
        if (onSuccess) onSuccess(res.data);
        handleReset();
        onClose();
      } else {
        throw new Error(res?.message || 'Failed to create product');
      }
    } catch (err) {
      error(err.message || 'Error creating product');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setName('');
    setProductType('service');
    setSalesPrice('');
    setCostPrice('');
    setNotes('');
    setVariants([{ name: '', extraPrice: '' }]);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Subscription Product"
      subtitle="Define catalog item, base sales price, and optional variants"
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="Product Name" required>
            <Input
              placeholder="e.g. Brightloop CRM Core"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </FormField>

          <FormField label="Product Type" required>
            <Select
              options={[
                { value: 'service', label: 'Service / SaaS' },
                { value: 'software', label: 'Software License' },
                { value: 'addon', label: 'Add-on / Extension' },
                { value: 'consulting', label: 'Professional Consulting' },
              ]}
              value={productType}
              onChange={(e) => setProductType(e.target.value)}
            />
          </FormField>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <FormField label="Sales Price (₹)" required helperText="Base selling price">
            <Input
              type="number"
              step="0.01"
              min="0"
              placeholder="1000.00"
              value={salesPrice}
              onChange={(e) => setSalesPrice(e.target.value)}
              required
            />
          </FormField>

          <FormField label="Cost Price (₹)" helperText="Internal unit cost">
            <Input
              type="number"
              step="0.01"
              min="0"
              placeholder="400.00"
              value={costPrice}
              onChange={(e) => setCostPrice(e.target.value)}
            />
          </FormField>

          <FormField label="Applicable Tax (GST)">
            <Select
              placeholder="Select Tax"
              options={taxes.map((t) => ({ value: t.id, label: `${t.name} (${t.rate}%)` }))}
              value={taxId}
              onChange={(e) => setTaxId(e.target.value)}
            />
          </FormField>
        </div>

        <FormField label="Product Notes / Specifications">
          <TextArea
            rows={2}
            placeholder="Key features, SLA terms, or implementation details..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </FormField>

        {/* Product Variants Subsection */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Product Variants & Add-ons
              </span>
              <p className="text-[11px] text-slate-400">
                Extra options that adjust unit price (e.g. Odoo Integration Add-on +₹560)
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              icon={Plus}
              onClick={handleAddVariantRow}
            >
              Add Variant
            </Button>
          </div>

          <div className="space-y-2">
            {variants.map((v, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <div className="flex-1">
                  <Input
                    placeholder="Variant name (e.g. Odoo Integration Add-on)"
                    value={v.name}
                    onChange={(e) => handleVariantChange(idx, 'name', e.target.value)}
                  />
                </div>
                <div className="w-36">
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="+Extra ₹"
                    value={v.extraPrice}
                    onChange={(e) => handleVariantChange(idx, 'extraPrice', e.target.value)}
                  />
                </div>
                {variants.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveVariantRow(idx)}
                    className="p-2 text-rose-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            icon={Package}
            isLoading={isLoading}
          >
            Create Product
          </Button>
        </div>
      </form>
    </Modal>
  );
}
