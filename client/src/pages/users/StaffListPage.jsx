import React, { useState, useEffect } from 'react';
import DataTable from '../../components/tables/DataTable.jsx';
import Button from '../../components/common/Button.jsx';
import Badge from '../../components/common/Badge.jsx';
import StaffCreateModal from './StaffCreateModal.jsx';
import { authApi } from '../../api/authApi.js';
import { useToast } from '../../context/ToastContext.jsx';
import { formatDate } from '../../utils/formatters.js';
import { Plus, UserCheck, ShieldCheck, Mail, Phone } from 'lucide-react';

export default function StaffListPage() {
  const [staffUsers, setStaffUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const { error } = useToast();

  const loadStaffUsers = async () => {
    setIsLoading(true);
    try {
      const res = await authApi.getUsers({ role: 'staff' });
      if (res?.data) {
        setStaffUsers(res.data);
      }
    } catch (err) {
      error(err.message || 'Failed to load staff accounts');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStaffUsers();
  }, []);

  const columns = [
    {
      key: 'fullName',
      label: 'Staff Member',
      render: (_, row) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-950/60 border border-blue-800/40 text-blue-400 flex items-center justify-center font-bold text-xs">
            {(row.fullName || row.full_name || 'S')[0].toUpperCase()}
          </div>
          <div>
            <p className="font-bold text-white">{row.fullName || row.full_name || 'Staff User'}</p>
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
      label: 'Assigned Role',
      align: 'center',
      render: (val) => <Badge status="Confirmed" label={val || 'Staff'} />,
    },
    {
      key: 'createdAt',
      label: 'Joined Date',
      render: (val, row) => formatDate(val || row.created_at),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white">
            Staff Members
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage operational team members who handle quotations, billing, and payments.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          icon={Plus}
          onClick={() => setCreateModalOpen(true)}
        >
          Add Staff Member
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={staffUsers}
        isLoading={isLoading}
        searchPlaceholder="Search staff by name or email..."
        searchField={['fullName', 'full_name', 'email']}
        emptyTitle="No staff members found"
        emptyDescription="Only system administrators can create staff accounts."
      />

      <StaffCreateModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSuccess={() => loadStaffUsers()}
      />
    </div>
  );
}
