import React from 'react';
import { Outlet } from 'react-router-dom';
import AppShell from './AppShell.jsx';
import {
  LayoutDashboard,
  Package,
  CalendarDays,
  FileText,
  Repeat,
  Receipt,
  CreditCard,
  Percent,
  Users,
  UserCheck,
} from 'lucide-react';

const ADMIN_NAV_ITEMS = [
  { path: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/admin/products', label: 'Products & Variants', icon: Package },
  { path: '/admin/plans', label: 'Subscription Plans', icon: CalendarDays },
  { path: '/admin/quotations', label: 'Quotations', icon: FileText },
  { path: '/admin/subscriptions', label: 'Subscriptions', icon: Repeat },
  { path: '/admin/invoices', label: 'Invoices & Billing', icon: Receipt },
  { path: '/admin/payments', label: 'Payments', icon: CreditCard },
  { path: '/admin/discounts', label: 'Discounts', icon: Percent },
  { path: '/admin/staff', label: 'Staff Accounts', icon: UserCheck },
  { path: '/admin/customers', label: 'Customers', icon: Users },
];

export default function AdminLayout() {
  return (
    <AppShell navItems={ADMIN_NAV_ITEMS} roleTitle="Admin Console">
      <Outlet />
    </AppShell>
  );
}
