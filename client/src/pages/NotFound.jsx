import React from 'react';
import { Link } from 'react-router-dom';
import { Wallet, Home } from 'lucide-react';
import Button from '../components/ui/Button';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-primary flex items-center justify-center mb-6 shadow-sm">
        <Wallet className="w-8 h-8" />
      </div>
      <span className="text-sm font-extrabold text-primary tracking-widest uppercase">
        404 Error
      </span>
      <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-2">
        Page Not Found
      </h1>
      <p className="text-slate-500 max-w-sm mt-3 mb-8 text-sm">
        The page you are looking for doesn't exist or has been moved to another URL.
      </p>
      <Link to="/dashboard">
        <Button className="flex items-center gap-2">
          <Home className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </Button>
      </Link>
    </div>
  );
}

