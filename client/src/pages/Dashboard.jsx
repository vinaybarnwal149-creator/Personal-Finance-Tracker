import React, { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../api/axiosInstance';
import { useAuth } from '../context/AuthContext';
import { useDataRefresh } from '../context/DataRefreshContext';
import { getPeriodDates } from '../utils/periods';
import { PERIOD_PRESETS } from '../utils/constants';
import SummaryCards from '../components/features/SummaryCards';
import CategoryDonutChart from '../components/charts/CategoryDonutChart';
import MonthlyBarChart from '../components/charts/MonthlyBarChart';
import BudgetSnapshot from '../components/features/BudgetSnapshot';
import RecentTransactions from '../components/features/RecentTransactions';
import Select from '../components/ui/Select';
import { Calendar } from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  const { refreshKey } = useDataRefresh();

  const [periodPreset, setPeriodPreset] = useState('this_month');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');

  const [summary, setSummary] = useState(null);
  const [categoryData, setCategoryData] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [recentTxns, setRecentTxns] = useState([]);

  const [loading, setLoading] = useState(true);

  // Time-appropriate greeting (doc 01 FR-UX-01)
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const firstName = user?.name ? user.name.split(' ')[0] : 'there';

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { from, to } = getPeriodDates(periodPreset, customFrom, customTo);

    try {
      const [sumRes, catRes, monthRes, budRes, txnRes] = await Promise.all([
        apiClient.get(`/stats/summary?from=${from}&to=${to}`),
        apiClient.get(`/stats/by-category?from=${from}&to=${to}&type=expense`),
        apiClient.get('/stats/monthly?months=6'),
        apiClient.get('/budgets'),
        apiClient.get('/transactions?limit=5&sort=-date'),
      ]);

      setSummary(sumRes.data.data);
      setCategoryData(catRes.data.data);
      setMonthlyData(monthRes.data.data);
      setBudgets(budRes.data.data);
      setRecentTxns(txnRes.data.data);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }, [periodPreset, customFrom, customTo]);

  useEffect(() => {
    fetchData();
  }, [fetchData, refreshKey]);

  return (
    <div className="space-y-6">
      {/* Header with Greeting & Period Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {getGreeting()}, {firstName} 👋
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Here is your financial activity and overview
          </p>
        </div>

        {/* Period Selector Controls */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200/80 shadow-sm text-xs font-medium text-slate-600">
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
      </div>

      {/* Summary Cards */}
      <SummaryCards summary={summary} loading={loading} />

      {/* Charts Row: Category Donut (col-span-5) + Monthly Bar (col-span-7) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5">
          <CategoryDonutChart data={categoryData} loading={loading} />
        </div>
        <div className="lg:col-span-7">
          <MonthlyBarChart data={monthlyData} loading={loading} />
        </div>
      </div>

      {/* Lower Row: Budget Snapshot (col-span-5) + Recent Transactions (col-span-7) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5">
          <BudgetSnapshot budgets={budgets} loading={loading} />
        </div>
        <div className="lg:col-span-7">
          <RecentTransactions transactions={recentTxns} loading={loading} />
        </div>
      </div>
    </div>
  );
}

