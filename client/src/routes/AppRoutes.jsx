import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute.jsx';
import { useAuth } from '../context/AuthContext.jsx';

// Layouts
import AdminLayout from '../layouts/AdminLayout.jsx';
import StaffLayout from '../layouts/StaffLayout.jsx';
import CustomerLayout from '../layouts/CustomerLayout.jsx';

// Auth Pages
import LoginPage from '../pages/auth/LoginPage.jsx';
import RegisterPage from '../pages/auth/RegisterPage.jsx';
import ForgotPasswordPage from '../pages/auth/ForgotPasswordPage.jsx';
import ResetPasswordPage from '../pages/auth/ResetPasswordPage.jsx';

// Dashboard Pages
import AdminDashboardPage from '../pages/dashboard/AdminDashboardPage.jsx';
import CustomerDashboardPage from '../pages/dashboard/CustomerDashboardPage.jsx';

// Products & Plans
import ProductsListPage from '../pages/products/ProductsListPage.jsx';
import PlansListPage from '../pages/plans/PlansListPage.jsx';

// Users
import StaffListPage from '../pages/users/StaffListPage.jsx';
import CustomersListPage from '../pages/users/CustomersListPage.jsx';

// Quotations
import QuotationsListPage from '../pages/quotations/QuotationsListPage.jsx';
import QuotationCreatePage from '../pages/quotations/QuotationCreatePage.jsx';
import QuotationDetailPage from '../pages/quotations/QuotationDetailPage.jsx';

// Subscriptions
import SubscriptionsListPage from '../pages/subscriptions/SubscriptionsListPage.jsx';
import SubscriptionDetailPage from '../pages/subscriptions/SubscriptionDetailPage.jsx';

// Invoices & Payments
import InvoicesListPage from '../pages/invoices/InvoicesListPage.jsx';
import InvoiceDetailPage from '../pages/invoices/InvoiceDetailPage.jsx';
import PaymentsListPage from '../pages/payments/PaymentsListPage.jsx';

// Discounts
import DiscountsListPage from '../pages/discounts/DiscountsListPage.jsx';

// Profile & 404
import ProfilePage from '../pages/profile/ProfilePage.jsx';
import NotFoundPage from '../pages/NotFoundPage.jsx';

// Helper Root Redirector
const RootRedirect = () => {
  const { isAuthenticated, role, loading } = useAuth();
  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (role === 'admin') return <Navigate to="/admin/dashboard" replace />;
  if (role === 'staff') return <Navigate to="/staff/dashboard" replace />;
  return <Navigate to="/portal/dashboard" replace />;
};

export default function AppRoutes() {
  return (
    <Routes>
      {/* Root */}
      <Route path="/" element={<RootRedirect />} />

      {/* Public Auth Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      {/* =================================================== */}
      {/* ADMIN CONSOLE ROUTES                                */}
      {/* =================================================== */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboardPage />} />
        <Route path="products" element={<ProductsListPage />} />
        <Route path="plans" element={<PlansListPage />} />
        <Route path="quotations" element={<QuotationsListPage />} />
        <Route path="quotations/new" element={<QuotationCreatePage />} />
        <Route path="quotations/:id" element={<QuotationDetailPage />} />
        <Route path="subscriptions" element={<SubscriptionsListPage />} />
        <Route path="subscriptions/:id" element={<SubscriptionDetailPage />} />
        <Route path="invoices" element={<InvoicesListPage />} />
        <Route path="invoices/:id" element={<InvoiceDetailPage />} />
        <Route path="payments" element={<PaymentsListPage />} />
        <Route path="discounts" element={<DiscountsListPage />} />
        <Route path="staff" element={<StaffListPage />} />
        <Route path="customers" element={<CustomersListPage />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>

      {/* =================================================== */}
      {/* STAFF WORKSPACE ROUTES                             */}
      {/* =================================================== */}
      <Route
        path="/staff"
        element={
          <ProtectedRoute allowedRoles={['staff']}>
            <StaffLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboardPage />} />
        <Route path="quotations" element={<QuotationsListPage />} />
        <Route path="quotations/new" element={<QuotationCreatePage />} />
        <Route path="quotations/:id" element={<QuotationDetailPage />} />
        <Route path="subscriptions" element={<SubscriptionsListPage />} />
        <Route path="subscriptions/:id" element={<SubscriptionDetailPage />} />
        <Route path="invoices" element={<InvoicesListPage />} />
        <Route path="invoices/:id" element={<InvoiceDetailPage />} />
        <Route path="payments" element={<PaymentsListPage />} />
        <Route path="customers" element={<CustomersListPage />} />
        <Route path="products" element={<ProductsListPage />} />
        <Route path="plans" element={<PlansListPage />} />
        <Route path="discounts" element={<DiscountsListPage />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>

      {/* =================================================== */}
      {/* CUSTOMER PORTAL ROUTES                             */}
      {/* =================================================== */}
      <Route
        path="/portal"
        element={
          <ProtectedRoute allowedRoles={['customer']}>
            <CustomerLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<CustomerDashboardPage />} />
        <Route path="subscriptions" element={<SubscriptionsListPage />} />
        <Route path="subscriptions/:id" element={<SubscriptionDetailPage />} />
        <Route path="quotations" element={<QuotationsListPage />} />
        <Route path="quotations/:id" element={<QuotationDetailPage />} />
        <Route path="invoices" element={<InvoicesListPage />} />
        <Route path="invoices/:id" element={<InvoiceDetailPage />} />
        <Route path="payments" element={<PaymentsListPage />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>

      {/* 404 Fallback */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
