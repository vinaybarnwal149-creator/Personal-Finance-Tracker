import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, AlertCircle } from 'lucide-react';
import ProgressBar from '../ui/ProgressBar';
import { formatCurrency } from '../../utils/formatCurrency';
import { useAuth } from '../../context/AuthContext';
import Skeleton from '../ui/Skeleton';
import EmptyState from '../ui/EmptyState';

export default function BudgetSnapshot({ budgets = [], loading = false }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const currency = user?.currency || 'USD';
  const locale = user?.locale || 'en-US';

  if (loading) {
    return (
      <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-4">
        <Skeleton className="h-6 w-36" />
        <Skeleton className="h-16 w-full rounded-xl" />
        <Skeleton className="h-16 w-full rounded-xl" />
      </div>
    );
  }

  // Sort top 3 by usage percent descending
  const topBudgets = [...budgets]
    .sort((a, b) => b.percent - a.percent)
    .slice(0, 3);

  return (
    <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-slate-900">Budget Snapshot</h3>
        <Link
          to="/budgets"
          className="flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary-hover"
        >
          <span>View all</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {topBudgets.length === 0 ? (
        <EmptyState
          title="No budgets set"
          description="Plan your spending limits to keep track of your goals."
          actionLabel="Set Budget"
          onAction={() => navigate('/budgets')}
        />
      ) : (
        <div className="space-y-4 flex-1">
          {topBudgets.map((b) => (
            <div key={b.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-slate-800">
                  {b.category?.name || 'Overall Monthly Budget'}
                </span>
                <span className="text-xs font-bold tabular-nums text-slate-700">
                  {b.percent}%
                </span>
              </div>
              <ProgressBar percent={b.percent} status={b.status} className="mb-2" />
              <div className="flex items-center justify-between text-xs text-slate-500 tabular-nums">
                <span>{formatCurrency(b.spent, currency, locale)} spent</span>
                <span>Limit: {formatCurrency(b.limit, currency, locale)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

