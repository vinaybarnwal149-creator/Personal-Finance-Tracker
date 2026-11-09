import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Receipt,
  Plus,
  PieChart,
  Settings,
} from 'lucide-react';

export default function BottomTabBar({ onOpenAddTransaction }) {
  const navClass = ({ isActive }) =>
    `flex flex-col items-center justify-center flex-1 py-1 text-xs font-medium transition-colors ${
      isActive ? 'text-primary' : 'text-slate-400 hover:text-slate-600'
    }`;

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 px-2 py-1 shadow-lg">
      <div className="flex items-center justify-around max-w-md mx-auto relative h-14">
        <NavLink to="/dashboard" className={navClass}>
          <LayoutDashboard className="w-5 h-5 mb-0.5" />
          <span>Home</span>
        </NavLink>

        <NavLink to="/transactions" className={navClass}>
          <Receipt className="w-5 h-5 mb-0.5" />
          <span>History</span>
        </NavLink>

        {/* Center Floating Action Button */}
        <div className="flex flex-col items-center justify-center flex-1">
          <button
            type="button"
            onClick={onOpenAddTransaction}
            aria-label="Add transaction"
            className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center shadow-md shadow-primary/30 -mt-6 active:scale-95 transition-transform"
          >
            <Plus className="w-6 h-6" />
          </button>
        </div>

        <NavLink to="/budgets" className={navClass}>
          <PieChart className="w-5 h-5 mb-0.5" />
          <span>Budgets</span>
        </NavLink>

        <NavLink to="/settings" className={navClass}>
          <Settings className="w-5 h-5 mb-0.5" />
          <span>Settings</span>
        </NavLink>
      </div>
    </div>
  );
}

