import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { formatCurrency, formatCompactCurrency } from '../../utils/formatCurrency';
import { useAuth } from '../../context/AuthContext';
import Skeleton from '../ui/Skeleton';
import EmptyState from '../ui/EmptyState';

export default function MonthlyBarChart({ data = [], loading = false }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const currency = user?.currency || 'USD';
  const locale = user?.locale || 'en-US';

  if (loading) {
    return (
      <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-4">
        <Skeleton className="h-6 w-52" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  const hasData = data && data.some((d) => (d.income || 0) > 0 || (d.expense || 0) > 0);

  // Format month label: '2025-05' -> 'May'
  const formattedData = data.map((d) => {
    let label = d.month;
    try {
      const [year, month] = d.month.split('-');
      const date = new Date(Date.UTC(Number(year), Number(month) - 1, 1));
      label = date.toLocaleDateString(locale, { month: 'short' });
    } catch (e) {
      // fallback
    }
    return { ...d, label };
  });

  return (
    <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-slate-900">Income vs Expenses (Monthly)</h3>
      </div>

      {!hasData ? (
        <EmptyState
          title="No history yet"
          description="Your monthly cashflow comparisons will appear here."
          actionLabel="Add Transaction"
          onAction={() => navigate('/transactions')}
        />
      ) : (
        <div className="h-64 sm:h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={formattedData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
              <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#64748B' }} />
              <YAxis
                tickLine={false}
                axisLine={false}
                width={65}
                tick={{ fontSize: 12, fill: '#64748B' }}
                tickFormatter={(val) => formatCompactCurrency(val, currency, locale)}
              />
              <Tooltip
                formatter={(value) => [formatCurrency(value, currency, locale)]}
                contentStyle={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '12px',
                  border: '1px solid #E2E8F0',
                  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                }}
              />
              <Legend
                verticalAlign="bottom"
                wrapperStyle={{ paddingTop: '16px', fontSize: '12px' }}
              />
              <Bar dataKey="income" name="Income" fill="#10B981" radius={[4, 4, 0, 0]} maxBarSize={40} />
              <Bar dataKey="expense" name="Expense" fill="#F43F5E" radius={[4, 4, 0, 0]} maxBarSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

