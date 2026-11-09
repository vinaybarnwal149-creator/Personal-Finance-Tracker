import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { formatCurrency, formatCompactCurrency } from '../../utils/formatCurrency';
import { useAuth } from '../../context/AuthContext';
import Skeleton from '../ui/Skeleton';
import EmptyState from '../ui/EmptyState';

export default function TrendLineChart({ data = [], loading = false }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const currency = user?.currency || 'USD';
  const locale = user?.locale || 'en-US';

  if (loading) {
    return (
      <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-4">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  const hasData = data && data.some((d) => (d.income || 0) > 0 || (d.expense || 0) > 0);

  return (
    <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-slate-900">Daily Cashflow Trend</h3>
      </div>

      {!hasData ? (
        <EmptyState
          title="No daily records"
          description="Daily income and spending timeline will show up here."
          actionLabel="Add Transaction"
          onAction={() => navigate('/transactions')}
        />
      ) : (
        <div className="h-64 sm:h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F43F5E" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#F43F5E" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: '#64748B' }}
                tickFormatter={(val) => val.slice(5)} // 'MM-DD'
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                width={65}
                tick={{ fontSize: 11, fill: '#64748B' }}
                tickFormatter={(val) => formatCompactCurrency(val, currency, locale)}
              />
              <Tooltip
                formatter={(value) => [formatCurrency(value, currency, locale)]}
                labelFormatter={(label) => `Date: ${label}`}
                contentStyle={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '12px',
                  border: '1px solid #E2E8F0',
                  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                }}
              />
              <Area
                type="monotone"
                dataKey="expense"
                name="Expense"
                stroke="#F43F5E"
                fillOpacity={1}
                fill="url(#colorExpense)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="income"
                name="Income"
                stroke="#10B981"
                fillOpacity={1}
                fill="url(#colorIncome)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

