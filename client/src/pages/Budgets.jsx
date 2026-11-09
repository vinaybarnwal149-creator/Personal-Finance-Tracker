import React, { useState, useEffect, useCallback } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Copy,
  Trash2,
  Edit2,
  PieChart,
  CheckCircle2,
  AlertTriangle,
  XCircle,
} from 'lucide-react';
import { apiClient } from '../api/axiosInstance';
import { useAuth } from '../context/AuthContext';
import { useDataRefresh } from '../context/DataRefreshContext';
import { formatCurrency } from '../utils/formatCurrency';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import ProgressBar from '../components/ui/ProgressBar';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import Skeleton from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import toast from 'react-hot-toast';

export default function Budgets() {
  const { user } = useAuth();
  const { refreshKey, triggerRefresh } = useDataRefresh();

  const currency = user?.currency || 'USD';
  const locale = user?.locale || 'en-US';

  // Month navigation: default to current YYYY-MM
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  const [budgets, setBudgets] = useState([]);
  const [expenseCategories, setExpenseCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Set / Edit Budget Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(''); // '' means Overall
  const [limitAmount, setLimitAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Delete modal state
  const [deletingBudget, setDeletingBudget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch expense categories
  useEffect(() => {
    apiClient
      .get('/categories?type=expense')
      .then(({ data }) => setExpenseCategories(data.data || []))
      .catch((err) => console.error('Failed to load categories', err));
  }, [refreshKey]);

  // Fetch budgets for currentMonth
  const fetchBudgets = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get(`/budgets?month=${currentMonth}`);
      setBudgets(res.data.data || []);
    } catch (err) {
      toast.error('Failed to load budgets');
    } finally {
      setLoading(false);
    }
  }, [currentMonth]);

  useEffect(() => {
    fetchBudgets();
  }, [fetchBudgets, refreshKey]);

  // Month navigation helpers
  const handlePrevMonth = () => {
    const [year, month] = currentMonth.split('-').map(Number);
    const date = new Date(Date.UTC(year, month - 2, 1));
    setCurrentMonth(`${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`);
  };

  const handleNextMonth = () => {
    const [year, month] = currentMonth.split('-').map(Number);
    const date = new Date(Date.UTC(year, month, 1));
    setCurrentMonth(`${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`);
  };

  // Formatted display of month: "May 2025"
  const formattedMonth = (() => {
    try {
      const [year, month] = currentMonth.split('-').map(Number);
      return new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString(locale, {
        month: 'long',
        year: 'numeric',
      });
    } catch (e) {
      return currentMonth;
    }
  })();

  // Separate overall budget and category budgets
  const overallBudget = budgets.find((b) => !b.category);
  const categoryBudgets = budgets.filter((b) => b.category);

  // Upsert budget
  const handleSaveBudget = async (e) => {
    e.preventDefault();
    const parsedLimit = parseFloat(limitAmount);
    if (isNaN(parsedLimit) || parsedLimit <= 0) {
      toast.error('Please enter a valid budget limit greater than 0');
      return;
    }

    setSubmitting(true);
    try {
      await apiClient.put('/budgets', {
        month: currentMonth,
        category: selectedCategory || null,
        limit: Number(parsedLimit.toFixed(2)),
      });
      toast.success('Budget saved successfully');
      setIsModalOpen(false);
      setSelectedCategory('');
      setLimitAmount('');
      fetchBudgets();
      triggerRefresh();
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to save budget');
    } finally {
      setSubmitting(false);
    }
  };

  // Copy last month's budgets
  const handleCopyLastMonth = async () => {
    const [year, month] = currentMonth.split('-').map(Number);
    const prevDate = new Date(Date.UTC(year, month - 2, 1));
    const prevMonth = `${prevDate.getUTCFullYear()}-${String(prevDate.getUTCMonth() + 1).padStart(2, '0')}`;

    try {
      const res = await apiClient.post('/budgets/copy', {
        fromMonth: prevMonth,
        toMonth: currentMonth,
      });
      const count = res.data.data.copiedCount;
      if (count > 0) {
        toast.success(`Copied ${count} budget(s) from last month!`);
        fetchBudgets();
        triggerRefresh();
      } else {
        toast('No new budgets to copy from previous month', { icon: 'ℹ️' });
      }
    } catch (err) {
      toast.error('Failed to copy budgets');
    }
  };

  // Delete budget
  const handleDeleteBudget = async () => {
    if (!deletingBudget) return;
    setIsDeleting(true);
    try {
      await apiClient.delete(`/budgets/${deletingBudget.id}`);
      toast.success('Budget removed');
      setDeletingBudget(null);
      fetchBudgets();
      triggerRefresh();
    } catch (err) {
      toast.error('Failed to delete budget');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Budgets</h2>
          <p className="text-sm text-slate-500 mt-0.5">Control and monitor your spending limits per month</p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button variant="outline" size="sm" onClick={handleCopyLastMonth} className="flex items-center gap-1.5">
            <Copy className="w-4 h-4" />
            <span className="hidden sm:inline">Copy Last Month</span>
          </Button>
          <Button size="sm" onClick={() => { setSelectedCategory(''); setLimitAmount(''); setIsModalOpen(true); }} className="flex items-center gap-1.5">
            <Plus className="w-4 h-4" />
            <span>Set Budget</span>
          </Button>
        </div>
      </div>

      {/* Month Selector Bar */}
      <div className="flex items-center justify-between p-3 sm:p-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm">
        <button
          onClick={handlePrevMonth}
          className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          title="Previous Month"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <span className="text-base sm:text-lg font-bold text-slate-900">{formattedMonth}</span>
        <button
          onClick={handleNextMonth}
          className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          title="Next Month"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-32 w-full rounded-2xl" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-44 w-full rounded-2xl" />
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* Overall Monthly Budget Card (if exists) */}
          {overallBudget && (
            <div className="p-6 bg-gradient-to-br from-indigo-900 to-primary text-white rounded-3xl shadow-md space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs uppercase tracking-wider font-semibold text-indigo-200">
                    Overall Monthly Limit
                  </span>
                  <h3 className="text-2xl font-bold mt-0.5">
                    {formatCurrency(overallBudget.spent, currency, locale)} / {formatCurrency(overallBudget.limit, currency, locale)}
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2.5 py-1 rounded-full bg-white/20 font-bold backdrop-blur-sm">
                    {overallBudget.percent}% Used
                  </span>
                  <button
                    onClick={() => setDeletingBudget(overallBudget)}
                    className="p-1.5 text-indigo-200 hover:text-white rounded-lg transition-colors"
                    title="Remove overall budget"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Progress bar with light track */}
              <div className="w-full h-3 rounded-full bg-white/20 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    overallBudget.percent >= 100 ? 'bg-rose-400' : overallBudget.percent >= 80 ? 'bg-amber-400' : 'bg-emerald-400'
                  }`}
                  style={{ width: `${Math.min(100, overallBudget.percent)}%` }}
                />
              </div>

              <div className="flex justify-between text-xs text-indigo-100">
                <span>Remaining: {formatCurrency(overallBudget.remaining, currency, locale)}</span>
                <span>
                  {overallBudget.status === 'exceeded'
                    ? '⚠️ Budget limit exceeded'
                    : overallBudget.status === 'warning'
                    ? '⚠️ Approaching limit'
                    : '✓ Within safe limit'}
                </span>
              </div>
            </div>
          )}

          {/* Category Budgets Grid */}
          {categoryBudgets.length === 0 && !overallBudget ? (
            <div className="p-12 bg-white rounded-2xl border border-slate-200/80 shadow-sm text-center">
              <EmptyState
                icon={PieChart}
                title={`No budgets set for ${formattedMonth}`}
                description="Set monthly spending limits for categories like Groceries, Dining, or Rent."
                actionLabel="Set First Budget"
                onAction={() => { setSelectedCategory(''); setLimitAmount(''); setIsModalOpen(true); }}
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categoryBudgets.map((b) => (
                <div
                  key={b.id}
                  className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2.5">
                        <span
                          className="w-3.5 h-3.5 rounded-full"
                          style={{ backgroundColor: b.category?.color || '#6366F1' }}
                        />
                        <h4 className="font-bold text-slate-900">{b.category?.name}</h4>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => { setSelectedCategory(b.category?.id); setLimitAmount(String(b.limit)); setIsModalOpen(true); }}
                          className="p-1 text-slate-400 hover:text-primary rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeletingBudget(b)}
                          className="p-1 text-slate-400 hover:text-expense rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-baseline justify-between mb-2">
                      <span className="text-xl font-bold text-slate-900 tabular-nums">
                        {formatCurrency(b.spent, currency, locale)}
                      </span>
                      <span className="text-xs text-slate-500 tabular-nums">
                        of {formatCurrency(b.limit, currency, locale)}
                      </span>
                    </div>

                    <ProgressBar percent={b.percent} status={b.status} className="mb-2" />
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
                    <span className="font-medium">
                      {b.remaining > 0 ? `${formatCurrency(b.remaining, currency, locale)} left` : 'Exceeded'}
                    </span>
                    <span
                      className={`font-semibold flex items-center gap-1 ${
                        b.status === 'exceeded'
                          ? 'text-rose-600'
                          : b.status === 'warning'
                          ? 'text-amber-600'
                          : 'text-emerald-600'
                      }`}
                    >
                      {b.percent}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Set / Edit Budget Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Set Budget"
        description={`Set spending limit for ${formattedMonth}`}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSaveBudget} className="space-y-4">
          <Select
            label="Budget Target"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="">Overall Monthly Budget (All Expenses)</option>
            {expenseCategories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>

          <Input
            label="Monthly Limit Amount"
            type="number"
            step="0.01"
            placeholder="e.g. 500.00"
            value={limitAmount}
            onChange={(e) => setLimitAmount(e.target.value)}
            required
            autoFocus
          />

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" loading={submitting}>
              Save Budget
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={!!deletingBudget}
        onClose={() => setDeletingBudget(null)}
        onConfirm={handleDeleteBudget}
        loading={isDeleting}
        title="Delete Budget"
        message="Are you sure you want to remove this budget limit?"
      />
    </div>
  );
}

