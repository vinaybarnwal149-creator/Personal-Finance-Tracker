import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Loader2 } from 'lucide-react';

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading, isServerWaking } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4">
        <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
        <h3 className="text-base font-semibold text-slate-800">Loading FinTrack...</h3>
        {isServerWaking && (
          <p className="text-xs text-slate-500 mt-2 max-w-xs text-center animate-pulse">
            Waking up server from idle sleep... (this can take up to 30s on free hosting)
          </p>
        )}
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

