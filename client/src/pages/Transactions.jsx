import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Search,
  Plus,
  Trash2,
  Edit2,
  ArrowUpDown,
  Filter,
  X,
  CreditCard,
  DollarSign,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { apiClient } from '../api/axiosInstance';
import { useAuth } from '../context/AuthContext';
import { useDataRefresh } from '../context/DataRefreshContext';
import { formatCurrency, formatSignedCurrency } from '../utils/formatCurrency';
import { formatDate } from '../utils/formatDate';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import TransactionModal from '../components/features/TransactionModal';
import Skeleton from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import toast from 'react-hot-toast';

export default function Transactions() {
  const { user } = useAuth();
  const { refreshKey, triggerRefresh } = useDataRefresh();
  const [searchParams, setSearchParams] = useSearchParams();

  const currency = user?.currency || 'USD';
  const locale = user?.locale || 'en-US';

  // Filters state mirrored in URL query params
  const [search, setSearch] = useState(searchParams.get('q') || '');
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const [type, setType] = useState(searchParams.get('type') || '');
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [from, setFrom] = useState(searchParams.get('from') || '');
  const [to, setTo] = useState(searchParams.get('to') || '');
  const [sort, setSort] = useState(searchParams.get('sort') || '-date');
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1);
  const [limit, setLimit] = useState(20);

  // Data state
  const [transactions, setTransactions] = useState([]);
  const [meta, setMeta] = useState({ page: 1, limit: 20, total: 0, totalPages: 1, totals: { income: 0, expense: 0, net: 0, count: 0 } });
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isAddEditOpen, setIsAddEditOpen] = useState(false);
  const [editingTxn, setEditingTxn] = useState(null);
  const [deletingTxn, setDeletingTxn] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  // Load user categories for filter dropdown
  useEffect(() => {
    apiClient
      .get('/categories')
      .then(({ data }) => setCategories(data.data || []))
      .catch((err) => console.error('Failed to load categories', err));
  }, [refreshKey]);

  // Fetch transactions
  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (page > 1) params.set('page', String(page));
    if (limit && limit !== 20) params.set('limit', String(limit));
    if (type && type.trim() !== '') params.set('type', type.trim());
    if (category && category.trim() !== '') params.set('category', category.trim());
    if (debouncedSearch && debouncedSearch.trim() !== '') params.set('q', debouncedSearch.trim());
    if (from && from.trim() !== '') params.set('from', from.trim());
    if (to && to.trim() !== '') params.set('to', to.trim());
    if (sort && sort.trim() !== '' && sort !== '-date') params.set('sort', sort.trim());

    // Update browser URL
    setSearchParams(params, { replace: true });

    try {
      const queryString = params.toString();
      const url = queryString ? `/transactions?${queryString}` : '/transactions';
      const res = await apiClient.get(url);
      setTransactions(res.data.data || []);
      setMeta(res.data.meta || { page: 1, limit: 20, total: 0, totalPages: 1, totals: { income: 0, expense: 0, net: 0, count: 0 } });
    } catch (err) {
      toast.error('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  }, [page, limit, type, category, debouncedSearch, from, to, sort, setSearchParams]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions, refreshKey]);

  // Optimistic delete with rollback on error (AC-5)
  const handleDelete = async () => {
    if (!deletingTxn) return;

    const targetId = deletingTxn.id;
    const backupTxns = [...transactions];
    const backupMeta = { ...meta };

    // Optimistically remove from state
    setTransactions((prev) => prev.filter((t) => t.id !== targetId));
    setIsDeleting(true);

    try {
      await apiClient.delete(`/transactions/${targetId}`);
      toast.success('Transaction deleted');
      setDeletingTxn(null);
      triggerRefresh();
    } catch (err) {
      // Rollback on failure
      setTransactions(backupTxns);
      setMeta(backupMeta);
      toast.error('Failed to delete transaction. Rolled back.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClearFilters = () => {
    setSearch('');
    setType('');
    setCategory('');
    setFrom('');
    setTo('');
    setSort('-date');
    setPage(1);
  };

  const hasActiveFilters = search || type || category || from || to || sort !== '-date';

  return (
    <div className="space-y-6">
      {/* Title + Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Transactions</h2>
          <p className="text-sm text-slate-500 mt-0.5">Manage, filter, and review all your financial records</p>
        </div>
        <Button onClick={() => { setEditingTxn(null); setIsAddEditOpen(true); }} className="flex items-center gap-2 self-start sm:self-auto">
          <Plus className="w-4 h-4" />
          <span>Add Transaction</span>
        </Button>
      </div>

      {/* Toolbar / Filters */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search */}
          <Input
            placeholder="Search notes or details..."
            leftIcon={Search}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          {/* Type Filter */}
          <Select value={type} onChange={(e) => { setType(e.target.value); setPage(1); }}>
            <option value="">All Types (Income & Expense)</option>
            <option value="expense">Expenses Only</option>
            <option value="income">Income Only</option>
          </Select>

          {/* Category Filter */}
          <Select value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }}>
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.type})
              </option>
            ))}
          </Select>

          {/* Sort */}
          <Select value={sort} onChange={(e) => { setSort(e.target.value); setPage(1); }}>
            <option value="-date">Newest First</option>
            <option value="date">Oldest First</option>
            <option value="-amount">Highest Amount</option>
            <option value="amount">Lowest Amount</option>
          </Select>
        </div>

        {/* Date range + Clear filters */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-slate-500 font-medium">Dates:</span>
            <input
              type="date"
              value={from}
              onChange={(e) => { setFrom(e.target.value); setPage(1); }}
              className="px-2.5 py-1 rounded-lg border border-slate-300 text-xs text-slate-700 bg-white"
            />
            <span className="text-slate-400">to</span>
            <input
              type="date"
              value={to}
              onChange={(e) => { setTo(e.target.value); setPage(1); }}
              className="px-2.5 py-1 rounded-lg border border-slate-300 text-xs text-slate-700 bg-white"
            />
          </div>

          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              className="flex items-center gap-1 text-slate-500 hover:text-expense font-medium transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              <span>Clear all filters</span>
            </button>
          )}
        </div>
      </div>

      {/* Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm text-sm">
        <div>
          <span className="text-xs text-slate-500">Filtered Count</span>
          <p className="text-lg font-bold text-slate-900 tabular-nums">{meta?.totals?.count || 0}</p>
        </div>
        <div>
          <span className="text-xs text-slate-500">Total Income</span>
          <p className="text-lg font-bold text-income tabular-nums">+{formatCurrency(meta?.totals?.income || 0, currency, locale)}</p>
        </div>
        <div>
          <span className="text-xs text-slate-500">Total Expenses</span>
          <p className="text-lg font-bold text-expense tabular-nums">-{formatCurrency(meta?.totals?.expense || 0, currency, locale)}</p>
        </div>
        <div>
          <span className="text-xs text-slate-500">Net Balance</span>
          <p className={`text-lg font-bold tabular-nums ${(meta?.totals?.net || 0) >= 0 ? 'text-primary' : 'text-expense'}`}>
            {formatCurrency(meta?.totals?.net || 0, currency, locale)}
          </p>
        </div>
      </div>

      {/* Transactions Table (Desktop) & Cards (Mobile) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : transactions.length === 0 ? (
          <div className="p-12">
            <EmptyState
              title="No transactions found"
              description={hasActiveFilters ? "Try adjusting or clearing your active filters." : "Add your first transaction to get started."}
              actionLabel="Add Transaction"
              onAction={() => { setEditingTxn(null); setIsAddEditOpen(true); }}
            />
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-medium border-b border-slate-100">
                  <tr>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Note / Details</th>
                    <th className="py-3 px-4">Payment</th>
                    <th className="py-3 px-4 text-right">Amount</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {transactions.map((txn) => (
                    <tr key={txn.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4 text-xs font-medium text-slate-600 whitespace-nowrap">
                        {formatDate(txn.date)}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-800">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: txn.category?.color || '#6366F1' }} />
                          {txn.category?.name || 'Category'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-800 max-w-xs truncate font-medium">
                        {txn.note || '—'}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-500 capitalize">
                        {txn.paymentMethod?.replace('_', ' ') || 'card'}
                      </td>
                      <td className={`py-3.5 px-4 text-right font-bold tabular-nums whitespace-nowrap ${txn.type === 'income' ? 'text-income' : 'text-slate-900'}`}>
                        {formatSignedCurrency(txn.amount, txn.type, currency, locale)}
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() => { setEditingTxn(txn); setIsAddEditOpen(true); }}
                            className="p-1.5 text-slate-400 hover:text-primary hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeletingTxn(txn)}
                            className="p-1.5 text-slate-400 hover:text-expense hover:bg-rose-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card List View */}
            <div className="md:hidden divide-y divide-slate-100">
              {transactions.map((txn) => (
                <div key={txn.id} className="p-4 flex items-center justify-between gap-3">
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
                      <p className="text-sm font-semibold text-slate-900 truncate">{txn.note || txn.category?.name}</p>
                      <p className="text-xs text-slate-400">
                        {formatDate(txn.date)} • {txn.category?.name}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className={`text-sm font-bold tabular-nums ${txn.type === 'income' ? 'text-income' : 'text-slate-900'}`}>
                      {formatSignedCurrency(txn.amount, txn.type, currency, locale)}
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => { setEditingTxn(txn); setIsAddEditOpen(true); }} className="p-1 text-slate-400 hover:text-primary">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => setDeletingTxn(txn)} className="p-1 text-slate-400 hover:text-expense">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>
                Showing {((meta.page - 1) * meta.limit) + 1}–{Math.min(meta.page * meta.limit, meta.total)} of {meta.total}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={meta.page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </Button>
                <span className="font-semibold text-slate-800">
                  {meta.page} / {meta.totalPages}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={meta.page >= meta.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Add / Edit Transaction Modal */}
      <TransactionModal
        isOpen={isAddEditOpen}
        onClose={() => setIsAddEditOpen(false)}
        transactionToEdit={editingTxn}
        onSuccess={() => fetchTransactions()}
      />

      {/* Delete Confirmation Modal (AC-5) */}
      <ConfirmDialog
        isOpen={!!deletingTxn}
        onClose={() => setDeletingTxn(null)}
        onConfirm={handleDelete}
        loading={isDeleting}
        title="Delete Transaction"
        message="Are you sure you want to delete this transaction? This action cannot be undone."
      />
    </div>
  );
}
