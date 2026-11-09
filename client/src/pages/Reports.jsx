import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../api/axiosInstance';
import { useAuth } from '../context/AuthContext';
import { useDataRefresh } from '../context/DataRefreshContext';
import { getPeriodDates } from '../utils/periods';
import { PERIOD_PRESETS } from '../utils/constants';
import { formatCurrency, formatSignedCurrency } from '../utils/formatCurrency';
import { formatDate } from '../utils/formatDate';
import CategoryDonutChart from '../components/charts/CategoryDonutChart';
import MonthlyBarChart from '../components/charts/MonthlyBarChart';
import TrendLineChart from '../components/charts/TrendLineChart';
import Select from '../components/ui/Select';
import Skeleton from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import { Calendar, TrendingUp, Award, DollarSign } from 'lucide-react';

export default function Reports() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { refreshKey } = useDataRefresh();

  const currency = user?.currency || 'USD';
  const locale = user?.locale || 'en-US';

  const [periodPreset, setPeriodPreset] = useState('this_year');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');

  const [categoryData, setCategoryData] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  const [dailyData, setDailyData] = useState([]);
  const [topTxns, setTopTxns] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchReportData = useCallback(async () => {
    setLoading(true);
    const { from, to } = getPeriodDates(periodPreset, customFrom, customTo);

    try {
      const [catRes, monthRes, dailyRes, topRes] = await Promise.all([
        apiClient.get(`/stats/by-category?from=${from}&to=${to}&type=expense`),
        apiClient.get('/stats/monthly?months=12'),
        apiClient.get(`/stats/daily?from=${from}&to=${to}`),
        apiClient.get(`/stats/top-transactions?from=${from}&to=${to}&limit=5&type=expense`),
      ]);

      setCategoryData(catRes.data.data || []);
      setMonthlyData(monthRes.data.data || []);
      setDailyData(dailyRes.data.data || []);
      setTopTxns(topRes.data.data || []);
    } catch (err) {
      console.error('Failed to load reports data', err);
    } finally {
      setLoading(false);
    }
  }, [periodPreset, customFrom, customTo]);

  useEffect(() => {
    fetchReportData();
  }, [fetchReportData, refreshKey]);

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Reports & Analytics
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Deep dive into your annual trends, daily cashflow, and spending patterns
          </p>
        </div>

        {/* Period Selector */}
        <div className="flex items-center gap-2 self-start sm:self-auto bg-white px-3 py-1.5 rounded-xl border border-slate-200/80 shadow-sm text-xs font-medium text-slate-600">
          <Calendar className="w-4 h-4 text-primary shrink-0" />
          <select
            value={periodPreset}
            onChange={(e) => setPeriodPreset(e.target.value)}
            className="bg-transparent border-none p-0 pr-4 text-xs font-semibold text-slate-800 focus:ring-0 cursor-pointer"
          >
            {PERIOD_PRESETS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6">
          <CategoryDonutChart data={categoryData} loading={loading} />
        </div>
        <div className="lg:col-span-6">
          <MonthlyBarChart data={monthlyData} loading={loading} />
        </div>
      </div>

      {/* Daily Cashflow Trend */}
      <TrendLineChart data={dailyData} loading={loading} />

      {/* Two-Column Lists: Top Categories & Largest Expenses */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Expense Categories */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Award className="w-5 h-5 text-primary" />
            <h3 className="text-base font-semibold text-slate-900">Top Expense Categories</h3>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-10 w-full rounded-xl" />
              ))}
            </div>
          ) : categoryData.length === 0 ? (
            <EmptyState
              title="No category data"
              description="No expenses recorded for this period."
              actionLabel="Add Expense"
              onAction={() => navigate('/transactions')}
            />
          ) : (
            <div className="space-y-3">
              {categoryData.slice(0, 5).map((cat, idx) => (
                <div key={cat.categoryId} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-white text-xs font-bold flex items-center justify-center text-slate-600 shadow-sm">
                      {idx + 1}
                    </span>
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                    <span className="text-sm font-semibold text-slate-800">{cat.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-slate-900 tabular-nums">
                      {formatCurrency(cat.total, currency, locale)}
                    </span>
                    <span className="text-xs text-slate-500 block tabular-nums">{cat.percent}%</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Largest Transactions */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="w-5 h-5 text-expense" />
            <h3 className="text-base font-semibold text-slate-900">Largest Expenses</h3>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-10 w-full rounded-xl" />
              ))}
            </div>
          ) : topTxns.length === 0 ? (
            <EmptyState
              title="No transactions"
              description="No expenses recorded for this period."
              actionLabel="Add Expense"
              onAction={() => navigate('/transactions')}
            />
          ) : (
            <div className="space-y-3">
              {topTxns.map((txn, idx) => (
                <div key={txn.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="min-w-0 flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-white text-xs font-bold flex items-center justify-center text-slate-600 shadow-sm shrink-0">
                      {idx + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">
                        {txn.note || txn.category?.name || 'Expense'}
                      </p>
                      <p className="text-xs text-slate-400">
                        {formatDate(txn.date)} • {txn.category?.name}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-rose-600 tabular-nums whitespace-nowrap">
                    -{formatCurrency(txn.amount, currency, locale)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

