import React from 'react';
import { Outlet } from 'react-router-dom';
import AppShell from './AppShell.jsx';
import {
  LayoutDashboard,
  FileText,
  Repeat,
  Receipt,
  CreditCard,
  Users,
  Package,
  CalendarDays,
  Percent,
} from 'lucide-react';

const STAFF_NAV_ITEMS = [
  { path: '/staff/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/staff/quotations', label: 'Quotations', icon: FileText },
  { path: '/staff/subscriptions', label: 'Subscriptions', icon: Repeat },
  { path: '/staff/invoices', label: 'Invoices & Billing', icon: Receipt },
  { path: '/staff/payments', label: 'Payments', icon: CreditCard },
  { path: '/staff/customers', label: 'Customers', icon: Users },
  { path: '/staff/products', label: 'Products Catalog', icon: Package },
  { path: '/staff/plans', label: 'Subscription Plans', icon: CalendarDays },
  { path: '/staff/discounts', label: 'Discounts', icon: Percent },
];

export default function StaffLayout() {
  return (
    <AppShell navItems={STAFF_NAV_ITEMS} roleTitle="Staff Workspace">
      <Outlet />
    </AppShell>
  );
}
