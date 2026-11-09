import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { formatCurrency } from '../../utils/formatCurrency';
import { useAuth } from '../../context/AuthContext';
import { Table, Eye } from 'lucide-react';
import Skeleton from '../ui/Skeleton';
import EmptyState from '../ui/EmptyState';

export default function CategoryDonutChart({ data = [], loading = false }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showTable, setShowTable] = useState(false);
  const currency = user?.currency || 'USD';
  const locale = user?.locale || 'en-US';

  if (loading) {
    return (
      <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-4">
        <Skeleton className="h-6 w-44" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  const hasData = data && data.length > 0;

  return (
    <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-slate-900">Spending by Category</h3>
        {hasData && (
          <button
            onClick={() => setShowTable(!showTable)}
            aria-label="Toggle table view"
            className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-primary transition-colors"
          >
            {showTable ? <Eye className="w-4 h-4" /> : <Table className="w-4 h-4" />}
            <span>{showTable ? 'Show Chart' : 'Show Table'}</span>
          </button>
        )}
      </div>

      {!hasData ? (
        <EmptyState
          title="No expenses in this period"
          description="Add your first expense transaction to visualize category breakdown."
          actionLabel="Add Expense"
          onAction={() => navigate('/transactions')}
        />
      ) : showTable ? (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-medium">
              <tr>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3 text-right">Amount</th>
                <th className="py-2.5 px-3 text-right">Share</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.map((cat) => (
                <tr key={cat.categoryId} className="hover:bg-slate-50/50">
                  <td className="py-2.5 px-3 flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span className="font-medium text-slate-800">{cat.name}</span>
                  </td>
                  <td className="py-2.5 px-3 text-right font-medium text-slate-900 tabular-nums">
                    {formatCurrency(cat.total, currency, locale)}
                  </td>
                  <td className="py-2.5 px-3 text-right text-slate-500 tabular-nums">
                    {cat.percent}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="h-64 sm:h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="total"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={85}
                paddingAngle={3}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color || '#6366F1'} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) => [formatCurrency(value, currency, locale), 'Total']}
                contentStyle={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '12px',
                  border: '1px solid #E2E8F0',
                  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                }}
              />
              <Legend
                verticalAlign="bottom"
                iconType="circle"
                wrapperStyle={{ paddingTop: '16px', fontSize: '12px' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

