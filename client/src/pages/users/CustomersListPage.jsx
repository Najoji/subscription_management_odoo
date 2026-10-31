import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DataTable from '../../components/tables/DataTable.jsx';
import Button from '../../components/common/Button.jsx';
import Badge from '../../components/common/Badge.jsx';
import { authApi } from '../../api/authApi.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { formatDate } from '../../utils/formatters.js';
import { Users, FileText, ArrowRight } from 'lucide-react';

export default function CustomersListPage() {
  const [customers, setCustomers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const { role } = useAuth();
  const { error } = useToast();
  const navigate = useNavigate();

  const loadCustomers = async () => {
    setIsLoading(true);
    try {
      const res = await authApi.getCustomers();
      if (res?.data) {
        setCustomers(res.data);
      }
    } catch (err) {
      error(err.message || 'Failed to load customers');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const handleCreateQuote = (customer, e) => {
    e.stopPropagation();
    const basePath = role === 'admin' ? '/admin' : '/staff';
    navigate(`${basePath}/quotations/new`, { state: { selectedCustomerId: customer.id } });
  };

  const columns = [
    {
      key: 'fullName',
      label: 'Customer Business / Contact',
      render: (_, row) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-indigo-950/60 border border-indigo-800/40 text-indigo-400 flex items-center justify-center font-bold text-xs">
            {(row.fullName || row.full_name || row.email || 'C')[0].toUpperCase()}
          </div>
          <div>
            <p className="font-bold text-white">{row.fullName || row.full_name || 'Customer'}</p>
            <p className="text-[11px] text-slate-400">{row.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'phone',
      label: 'Phone',
      render: (val) => val || '—',
    },
    {
      key: 'role',
      label: 'Account Type',
      align: 'center',
      render: (val) => <Badge status="Active" label={val || 'Customer'} />,
    },
    {
      key: 'createdAt',
      label: 'Registered On',
      render: (val, row) => formatDate(val || row.created_at),
    },
    {
      key: 'actions',
      label: 'Actions',
      align: 'right',
      render: (_, row) => (
        <Button
          size="sm"
          variant="outline"
          icon={FileText}
          onClick={(e) => handleCreateQuote(row, e)}
          className="text-xs text-indigo-300 hover:text-white"
        >
          Create Quotation
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white">
            Customer Directory
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Registered customer organizations, billing contacts, and subscription activity.
          </p>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={customers}
        isLoading={isLoading}
        searchPlaceholder="Search customers by name or email..."
        searchField={['fullName', 'full_name', 'email', 'phone']}
        emptyTitle="No customers registered yet"
        emptyDescription="Customers can register via the self-service portal or be created directly."
      />
    </div>
  );
}
