import React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/common/Button.jsx';
import { AlertCircle, Home } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

export default function NotFoundPage() {
  const navigate = useNavigate();
  const { role } = useAuth();

  const handleGoHome = () => {
    if (role === 'admin') navigate('/admin/dashboard');
    else if (role === 'staff') navigate('/staff/dashboard');
    else if (role === 'customer') navigate('/portal/dashboard');
    else navigate('/login');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-950 text-white text-center">
      <div className="w-16 h-16 rounded-2xl bg-indigo-950/60 border border-indigo-800/40 text-indigo-400 flex items-center justify-center mb-4">
        <AlertCircle className="w-8 h-8" />
      </div>
      <h1 className="text-4xl font-black tracking-tight mb-2">404</h1>
      <h2 className="text-lg font-bold text-slate-200 mb-2">Page Not Found</h2>
      <p className="text-xs text-slate-400 max-w-sm mb-6">
        The requested screen does not exist or you do not have authorization to view it.
      </p>
      <Button variant="primary" icon={Home} onClick={handleGoHome}>
        Return to Safe Ground
      </Button>
    </div>
  );
}
