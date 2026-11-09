import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { formatCurrency, formatSignedCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';
import { useAuth } from '../../context/AuthContext';
import Skeleton from '../ui/Skeleton';
import EmptyState from '../ui/EmptyState';

export default function RecentTransactions({ transactions = [], loading = false }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const currency = user?.currency || 'USD';
  const locale = user?.locale || 'en-US';

  if (loading) {
    return (
      <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-3">
        <Skeleton className="h-6 w-44 mb-2" />
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-12 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  const recent = transactions.slice(0, 5);

  return (
    <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-slate-900">Recent Transactions</h3>
        <Link
          to="/transactions"
          className="flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary-hover"
        >
          <span>View all</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {recent.length === 0 ? (
        <EmptyState
          title="No recent transactions"
          description="Your latest income and expenses will show up here."
          actionLabel="Add Transaction"
          onAction={() => navigate('/transactions')}
        />
      ) : (
        <div className="divide-y divide-slate-100 flex-1">
          {recent.map((txn) => {
            const isIncome = txn.type === 'income';
            return (
              <div
                key={txn.id}
                className="py-3 flex items-center justify-between gap-3 hover:bg-slate-50/50 px-1 rounded-xl transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs shrink-0"
                    style={{
                      backgroundColor: `${txn.category?.color || '#6366F1'}15`,
                      color: txn.category?.color || '#6366F1',
                    }}
                  >
                    {txn.category?.name?.slice(0, 2).toUpperCase() || 'TX'}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">
                      {txn.note || txn.category?.name || 'Transaction'}
                    </p>
                    <p className="text-xs text-slate-400">
                      {formatDate(txn.date)} • {txn.category?.name || txn.paymentMethod}
                    </p>
                  </div>
                </div>

                <div
                  className={`text-sm font-bold tabular-nums whitespace-nowrap ${
                    isIncome ? 'text-income' : 'text-slate-900'
                  }`}
                >
                  {formatSignedCurrency(txn.amount, txn.type, currency, locale)}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

