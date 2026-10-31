// Utility formatters for Brightloop (Currency INR, Dates, Status Colors)

export const formatCurrency = (amount) => {
  if (amount === undefined || amount === null || isNaN(Number(amount))) {
    return '₹0.00';
  }
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(amount));
};

export const formatDate = (dateString) => {
  if (!dateString) return '—';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
};

export const formatDateTime = (dateString) => {
  if (!dateString) return '—';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateString;
  }
};

export const getStatusBadgeColor = (status) => {
  const s = (status || '').toLowerCase();
  switch (s) {
    case 'active':
    case 'paid':
    case 'accepted':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-emerald-600/20';
    case 'confirmed':
      return 'bg-blue-50 text-blue-700 border-blue-200 ring-blue-600/20';
    case 'draft':
      return 'bg-slate-50 text-slate-700 border-slate-200 ring-slate-600/20';
    case 'quotation':
    case 'sent':
      return 'bg-indigo-50 text-indigo-700 border-indigo-200 ring-indigo-600/20';
    case 'paused':
      return 'bg-amber-50 text-amber-700 border-amber-200 ring-amber-600/20';
    case 'closed':
    case 'cancelled':
    case 'rejected':
      return 'bg-rose-50 text-rose-700 border-rose-200 ring-rose-600/20';
    case 'overdue':
    case 'expired':
      return 'bg-red-50 text-red-700 border-red-200 ring-red-600/20';
    default:
      return 'bg-gray-50 text-gray-700 border-gray-200 ring-gray-600/20';
  }
};
