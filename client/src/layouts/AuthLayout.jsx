import React from 'react';
import { Link } from 'react-router-dom';
import { Layers, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

export default function AuthLayout({ children, title, subtitle }) {
  const { loginAsDemo, demoModeEnabled } = useAuth();

  return (
    <div className="min-h-screen flex flex-col justify-between bg-slate-950 text-slate-100 selection:bg-indigo-500 selection:text-white">
      {/* Top Demo Shortcut Banner */}
      {demoModeEnabled && <div className="bg-indigo-950/80 border-b border-indigo-900/50 px-4 py-2 text-center text-xs text-indigo-200 flex flex-wrap items-center justify-center gap-3">
        <span className="font-semibold flex items-center gap-1.5 text-indigo-300">
          <ShieldCheck className="w-3.5 h-3.5" /> Hackathon Demo Quick Switcher:
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => loginAsDemo('admin')}
            className="px-2.5 py-0.5 rounded bg-indigo-600/60 hover:bg-indigo-600 text-white font-medium transition-colors text-[11px]"
          >
            Login as Admin
          </button>
          <button
            onClick={() => loginAsDemo('staff')}
            className="px-2.5 py-0.5 rounded bg-blue-600/60 hover:bg-blue-600 text-white font-medium transition-colors text-[11px]"
          >
            Login as Staff
          </button>
          <button
            onClick={() => loginAsDemo('customer')}
            className="px-2.5 py-0.5 rounded bg-emerald-600/60 hover:bg-emerald-600 text-white font-medium transition-colors text-[11px]"
          >
            Login as Customer
          </button>
        </div>
      </div>}

      {/* Main Container */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md">
          {/* Logo & Headline */}
          <div className="text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30 group-hover:scale-105 transition-transform">
                <Layers className="w-5 h-5" />
              </div>
              <span className="text-2xl font-black tracking-tight text-white">
                Brightloop
              </span>
            </Link>
            {title && (
              <h2 className="text-xl font-bold text-white mt-4 tracking-tight">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                {subtitle}
              </p>
            )}
          </div>

          {/* Form Card */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
            {children}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-slate-500 border-t border-slate-900">
        Brightloop Subscription Management System • Hackathon 2026
      </footer>
    </div>
  );
}
