import React from 'react';
import { ArrowUpRight, ArrowDownRight, Wallet, TrendingUp, PiggyBank, ArrowDownLeft } from 'lucide-react';
import { formatCurrency } from '../../utils/formatCurrency';
import { useAuth } from '../../context/AuthContext';
import Skeleton from '../ui/Skeleton';

export default function SummaryCards({ summary, loading = false }) {
  const { user } = useAuth();
  const currency = user?.currency || 'USD';
  const locale = user?.locale || 'en-US';

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-36" />
            <Skeleton className="h-3 w-20" />
          </div>
        ))}
      </div>
    );
  }

  const income = summary?.income || 0;
  const expense = summary?.expense || 0;
  const balance = summary?.balance || 0;
  const savingsRate = summary?.savingsRate || 0;
  const changePct = summary?.changePct || { income: 0, expense: 0, balance: 0 };

  const cards = [
    {
      title: 'Total Balance',
      amount: formatCurrency(balance, currency, locale),
      change: changePct.balance,
      icon: Wallet,
      color: balance >= 0 ? 'text-primary' : 'text-expense',
      iconBg: 'bg-primary/10 text-primary',
    },
    {
      title: 'Total Income',
      amount: `+${formatCurrency(income, currency, locale)}`,
      change: changePct.income,
      icon: ArrowDownLeft,
      color: 'text-income',
      iconBg: 'bg-emerald-50 text-emerald-600',
    },
    {
      title: 'Total Expenses',
      amount: `-${formatCurrency(expense, currency, locale)}`,
      change: changePct.expense,
      icon: ArrowUpRight,
      color: 'text-expense',
      iconBg: 'bg-rose-50 text-rose-600',
    },
    {
      title: 'Savings Rate',
      amount: `${savingsRate}%`,
      subtitle: `${income > 0 ? (savingsRate >= 20 ? 'Healthy savings' : 'Needs attention') : 'No income'}`,
      icon: PiggyBank,
      color: savingsRate >= 20 ? 'text-emerald-600' : 'text-amber-600',
      iconBg: 'bg-amber-50 text-amber-600',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((c) => {
        const Icon = c.icon;
        return (
          <div
            key={c.title}
            className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm transition-all hover:shadow-md"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-slate-500">{c.title}</span>
              <div className={`p-2 rounded-xl ${c.iconBg}`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>
            <div className={`text-2xl font-bold tabular-nums tracking-tight ${c.color}`}>
              {c.amount}
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
              {c.change !== undefined ? (
                <>
                  <span
                    className={`inline-flex items-center font-medium ${
                      c.change >= 0 ? 'text-emerald-600' : 'text-rose-600'
                    }`}
                  >
                    {c.change >= 0 ? '+' : ''}
                    {c.change}%
                  </span>
                  <span>vs last period</span>
                </>
              ) : (
                <span>{c.subtitle}</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

