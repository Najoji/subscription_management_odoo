import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  Layers,
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
  LogOut,
  Zap,
  Menu,
  X,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import Badge from '../components/common/Badge.jsx';
import Button from '../components/common/Button.jsx';
import RunBillingModal from '../components/billing/RunBillingModal.jsx';

export default function AppShell({ navItems = [], roleTitle = 'Portal', children }) {
  const { profile, role, logout, loginAsDemo } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [billingModalOpen, setBillingModalOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased">
      {/* Top Demo Shortcut Banner for quick evaluation */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-1.5 text-xs flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-slate-400">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-semibold text-slate-300">Brightloop Subscription System</span>
          <span className="hidden sm:inline text-slate-500">|</span>
          <span className="hidden sm:inline text-slate-400">Current Role:</span>
          <Badge status={role} />
        </div>

        {/* Quick Demo Switcher */}
        <div className="flex items-center gap-1.5 text-[11px]">
          <span className="text-slate-500 hidden md:inline">Switch Role:</span>
          <button
            onClick={() => { loginAsDemo('admin'); navigate('/admin/dashboard'); }}
            className={`px-2 py-0.5 rounded transition-colors ${role === 'admin' ? 'bg-indigo-600 text-white font-bold' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
          >
            Admin
          </button>
          <button
            onClick={() => { loginAsDemo('staff'); navigate('/staff/dashboard'); }}
            className={`px-2 py-0.5 rounded transition-colors ${role === 'staff' ? 'bg-blue-600 text-white font-bold' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
          >
            Staff
          </button>
          <button
            onClick={() => { loginAsDemo('customer'); navigate('/portal/dashboard'); }}
            className={`px-2 py-0.5 rounded transition-colors ${role === 'customer' ? 'bg-emerald-600 text-white font-bold' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
          >
            Customer
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Mobile Backdrop */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between transform transition-transform duration-200 ease-in-out lg:translate-x-0 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-0 -translate-x-full lg:translate-x-0'
          }`}
        >
          {/* Brand Header */}
          <div>
            <div className="h-16 px-6 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white tracking-tight">Brightloop</h2>
                  <span className="text-[10px] text-indigo-400 font-semibold tracking-wider uppercase block -mt-0.5">
                    {roleTitle}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Action Button for Admin & Staff: Run Billing */}
            {(role === 'admin' || role === 'staff') && (
              <div className="p-3">
                <button
                  onClick={() => setBillingModalOpen(true)}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-all group"
                >
                  <Zap className="w-4 h-4 text-amber-300 group-hover:scale-110 transition-transform" />
                  <span>Run Billing Engine</span>
                </button>
              </div>
            )}

            {/* Navigation List */}
            <nav className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-250px)]">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-bold'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    }`}
                  >
                    {Icon && <Icon className="w-4 h-4 flex-shrink-0" />}
                    <span className="flex-1">{item.label}</span>
                    {item.badge && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-800 text-indigo-400 font-bold">
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </nav>
          </div>

          {/* User Profile & Logout in Sidebar Footer */}
          <div className="p-4 border-t border-slate-800 bg-slate-900/60">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-full bg-indigo-900/60 border border-indigo-700/60 flex items-center justify-center text-sm font-bold text-indigo-300">
                {(profile?.fullName || profile?.email || 'U')[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-white truncate">
                  {profile?.fullName || 'User'}
                </p>
                <p className="text-[11px] text-slate-400 truncate">
                  {profile?.email || 'user@brightloop.com'}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold text-slate-400 hover:text-rose-400 hover:bg-rose-950/20 border border-slate-800 hover:border-rose-900/40 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log out</span>
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          {/* Top Bar */}
          <header className="h-16 px-4 sm:px-8 border-b border-slate-800 bg-slate-900/40 backdrop-blur-md flex items-center justify-between sticky top-0 z-30">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden text-slate-400 hover:text-white p-2 rounded-lg"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
                <span className="text-slate-500">Brightloop</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
                <span className="text-slate-200 capitalize font-semibold">
                  {location.pathname.split('/')[2] || 'Dashboard'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {(role === 'admin' || role === 'staff') && (
                <Button
                  size="sm"
                  variant="primary"
                  icon={Zap}
                  onClick={() => setBillingModalOpen(true)}
                  className="hidden sm:inline-flex"
                >
                  Run Billing
                </Button>
              )}
            </div>
          </header>

          {/* Page Content */}
          <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto">
            {children}
          </main>
        </div>
      </div>

      {/* Global Run Billing Modal */}
      <RunBillingModal
        isOpen={billingModalOpen}
        onClose={() => setBillingModalOpen(false)}
        onSuccess={() => {
          // Trigger refresh event for any open lists
          window.dispatchEvent(new CustomEvent('billing-run-completed'));
        }}
      />
    </div>
  );
}
