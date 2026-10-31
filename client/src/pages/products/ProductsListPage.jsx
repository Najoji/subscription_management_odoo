import React, { useState, useEffect } from 'react';
import DataTable from '../../components/tables/DataTable.jsx';
import Button from '../../components/common/Button.jsx';
import Badge from '../../components/common/Badge.jsx';
import ProductCreateModal from './ProductCreateModal.jsx';
import { productApi } from '../../api/productApi.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { formatCurrency } from '../../utils/formatters.js';
import { Plus, Package, Check, X, Layers } from 'lucide-react';

export default function ProductsListPage() {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const { role } = useAuth();
  const { success, error } = useToast();
  const isAdmin = role === 'admin';

  const loadProducts = async () => {
    setIsLoading(true);
    try {
      const res = await productApi.getProducts();
      if (res?.data) {
        setProducts(res.data);
      }
    } catch (err) {
      error(err.message || 'Failed to load products');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleToggleActive = async (product, e) => {
    e.stopPropagation();
    try {
      const updatedActive = !product.isActive;
      await productApi.updateProduct(product.id, { isActive: updatedActive });
      success(`Product "${product.name}" marked ${updatedActive ? 'Active' : 'Inactive'}`);
      loadProducts();
    } catch (err) {
      error(err.message || 'Failed to update product status');
    }
  };

  const columns = [
    {
      key: 'name',
      label: 'Product Name',
      render: (_, row) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-950/60 border border-indigo-800/40 text-indigo-400 flex items-center justify-center font-bold">
            <Package className="w-4 h-4" />
          </div>
          <div>
            <p className="font-bold text-white">{row.name}</p>
            {row.notes && <p className="text-[11px] text-slate-400 line-clamp-1">{row.notes}</p>}
          </div>
        </div>
      ),
    },
    {
      key: 'productType',
      label: 'Type',
      render: (val) => (
        <span className="capitalize text-slate-300 font-medium">
          {val || 'Service'}
        </span>
      ),
    },
    {
      key: 'salesPrice',
      label: 'Base Sales Price',
      align: 'right',
      render: (val) => (
        <span className="font-bold text-emerald-400">
          {formatCurrency(val)}
        </span>
      ),
    },
    {
      key: 'costPrice',
      label: 'Cost Price',
      align: 'right',
      render: (val) => (
        <span className="text-slate-400">
          {val ? formatCurrency(val) : '—'}
        </span>
      ),
    },
    {
      key: 'variants',
      label: 'Variants',
      render: (_, row) => {
        const variantsList = row.variants || row.product_variants || [];
        if (variantsList.length === 0) {
          return <span className="text-slate-500 text-[11px]">No variants</span>;
        }
        return (
          <div className="flex flex-wrap gap-1">
            {variantsList.map((v, i) => (
              <span
                key={v.id || i}
                className="text-[10px] px-2 py-0.5 rounded-md bg-indigo-950/80 border border-indigo-800/40 text-indigo-300 font-medium"
              >
                {v.name} (+{formatCurrency(v.extraPrice || v.extra_price)})
              </span>
            ))}
          </div>
        );
      },
    },
    {
      key: 'tax',
      label: 'Tax (GST)',
      render: (_, row) => {
        const tax = row.tax || row.taxes;
        return tax ? `${tax.name} (${tax.rate}%)` : '18% GST';
      },
    },
    {
      key: 'isActive',
      label: 'Status',
      align: 'center',
      render: (val) => (
        <Badge status={val !== false ? 'Active' : 'Closed'} label={val !== false ? 'Active' : 'Inactive'} />
      ),
    },
    ...(isAdmin
      ? [
          {
            key: 'actions',
            label: 'Actions',
            align: 'right',
            render: (_, row) => (
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => handleToggleActive(row, e)}
                className="text-xs"
              >
                {row.isActive !== false ? 'Deactivate' : 'Activate'}
              </Button>
            ),
          },
        ]
      : []),
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white">
            Products & Add-on Catalog
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage subscription software modules, base rates, and tiered variants.
          </p>
        </div>

        {isAdmin && (
          <Button
            variant="primary"
            size="sm"
            icon={Plus}
            onClick={() => setCreateModalOpen(true)}
          >
            Create Product
          </Button>
        )}
      </div>

      <DataTable
        columns={columns}
        data={products}
        isLoading={isLoading}
        searchPlaceholder="Search product by name or notes..."
        searchField={['name', 'productType', 'notes']}
        emptyTitle="No products found"
        emptyDescription="Get started by creating your first subscription product or add-on variant."
      />

      <ProductCreateModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSuccess={() => loadProducts()}
      />
    </div>
  );
}
