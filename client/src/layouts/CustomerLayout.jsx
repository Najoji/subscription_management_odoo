import React from 'react';
import { Outlet } from 'react-router-dom';
import AppShell from './AppShell.jsx';
import {
  LayoutDashboard,
  Repeat,
  FileText,
  Receipt,
  CreditCard,
  User,
} from 'lucide-react';

const CUSTOMER_NAV_ITEMS = [
  { path: '/portal/dashboard', label: 'My Overview', icon: LayoutDashboard },
  { path: '/portal/subscriptions', label: 'My Subscriptions', icon: Repeat },
  { path: '/portal/quotations', label: 'My Quotations', icon: FileText },
  { path: '/portal/invoices', label: 'My Invoices', icon: Receipt },
  { path: '/portal/payments', label: 'Payment History', icon: CreditCard },
  { path: '/portal/profile', label: 'My Account', icon: User },
];

export default function CustomerLayout() {
  return (
    <AppShell navItems={CUSTOMER_NAV_ITEMS} roleTitle="Customer Portal">
      <Outlet />
    </AppShell>
  );
}
