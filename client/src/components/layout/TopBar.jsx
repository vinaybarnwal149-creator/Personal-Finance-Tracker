import React from 'react';
import { useLocation } from 'react-router-dom';
import { Plus, Wallet, LogOut } from 'lucide-react';
import Button from '../ui/Button';
import { useAuth } from '../../context/AuthContext';

const PAGE_TITLES = {
  '/dashboard': 'Dashboard',
  '/transactions': 'Transactions',
  '/budgets': 'Budgets',
  '/reports': 'Reports & Analytics',
  '/settings': 'Settings',
};

export default function TopBar({ onOpenAddTransaction }) {
  const location = useLocation();
  const { user, logout } = useAuth();
  const pageTitle = PAGE_TITLES[location.pathname] || 'FinTrack';

  return (
    <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Mobile Logo */}
        <div className="flex items-center gap-2.5 lg:hidden">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white shadow-sm">
            <Wallet className="w-4 h-4" />
          </div>
          <span className="text-lg font-bold text-slate-900 tracking-tight">FinTrack</span>
        </div>

        {/* Desktop Page Title */}
        <div className="hidden lg:block">
          <h1 className="text-xl font-bold text-slate-900">{pageTitle}</h1>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <Button
            size="sm"
            onClick={onOpenAddTransaction}
            className="flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Transaction</span>
            <span className="sm:hidden">Add</span>
          </Button>

          {/* Mobile logout */}
          <button
            onClick={logout}
            aria-label="Log out"
            className="p-2 text-slate-500 hover:text-expense lg:hidden"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
}

