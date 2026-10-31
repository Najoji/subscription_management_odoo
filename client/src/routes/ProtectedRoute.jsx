import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import LoadingSpinner from '../components/common/LoadingSpinner.jsx';

export default function ProtectedRoute({ children, allowedRoles = [] }) {
  const { isAuthenticated, role, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <LoadingSpinner size="lg" message="Authenticating session..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    // Redirect unauthorized role to their respective landing portal
    if (role === 'admin') return <Navigate to="/admin/dashboard" replace />;
    if (role === 'staff') return <Navigate to="/staff/dashboard" replace />;
    if (role === 'customer') return <Navigate to="/portal/dashboard" replace />;
    return <Navigate to="/login" replace />;
  }

  return children;
}
