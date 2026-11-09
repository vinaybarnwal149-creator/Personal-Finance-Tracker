import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';
import { apiClient } from '../../api/axiosInstance';
import { useAuth } from '../../context/AuthContext';
import { useDataRefresh } from '../../context/DataRefreshContext';
import { PAYMENT_METHODS } from '../../utils/constants';

export default function TransactionModal({
  isOpen,
  onClose,
  transactionToEdit = null,
  onSuccess,
}) {
  const { user } = useAuth();
  const { triggerRefresh } = useDataRefresh();

  const [type, setType] = useState('expense');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [note, setNote] = useState('');
  const [saveAndAddAnother, setSaveAndAddAnother] = useState(false);

  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  // Reset form when modal opens or transactionToEdit changes
  useEffect(() => {
    if (transactionToEdit) {
      setType(transactionToEdit.type);
      setAmount(String(transactionToEdit.amount));
      setCategoryId(transactionToEdit.category?.id || transactionToEdit.category || '');
      setDate(transactionToEdit.date ? transactionToEdit.date.slice(0, 10) : new Date().toISOString().slice(0, 10));
      setPaymentMethod(transactionToEdit.paymentMethod || 'card');
      setNote(transactionToEdit.note || '');
    } else {
      setType('expense');
      setAmount('');
      setCategoryId('');
      setDate(new Date().toISOString().slice(0, 10));
      setPaymentMethod('card');
      setNote('');
    }
    setErrors({});
  }, [transactionToEdit, isOpen]);

  const handleTypeChange = (newType) => {
    if (newType === type) return;
    setType(newType);
    setCategoryId('');
    setCategories([]);
    setErrors((prev) => ({ ...prev, categoryId: undefined }));
  };

  // Load categories matching current type
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setLoadingCategories(true);

    apiClient
      .get(`/categories?type=${type}`)
      .then(({ data }) => {
        if (isMounted) {
          const list = data.data || [];
          setCategories(list);
          const currentMatches = list.some((c) => c.id === categoryId);
          if (!currentMatches && list.length > 0) {
            setCategoryId(list[0].id);
          }
        }
      })
      .catch(() => {
        toast.error('Failed to load categories');
      })
      .finally(() => {
        if (isMounted) setLoadingCategories(false);
      });

    return () => {
      isMounted = false;
    };
  }, [type, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setErrors((prev) => ({ ...prev, amount: 'Please enter a valid amount greater than 0' }));
      return;
    }

    if (!categoryId) {
      setErrors((prev) => ({ ...prev, categoryId: 'Please select a category' }));
      return;
    }

    setSubmitting(true);

    const payload = {
      type,
      amount: Number(parsedAmount.toFixed(2)),
      category: categoryId,
      date,
      paymentMethod,
      note: note.trim(),
    };

    try {
      let res;
      if (transactionToEdit) {
        res = await apiClient.patch(`/transactions/${transactionToEdit.id}`, payload);
        toast.success('Transaction updated!');
      } else {
        res = await apiClient.post('/transactions', payload);
        toast.success('Transaction added!');
      }

      // Handle budget alerts if returned
      const alerts = res.data?.data?.budgetAlerts || [];
      alerts.forEach((alert) => {
        if (alert.status === 'exceeded') {
          toast.error(`⚠️ Budget exceeded: ${alert.categoryName} is at ${alert.percent}%!`, {
            duration: 6000,
          });
        } else if (alert.status === 'warning') {
          toast(`⚠️ Budget warning: ${alert.categoryName} reached ${alert.percent}%`, {
            icon: '⚠️',
            duration: 5000,
          });
        }
      });

      triggerRefresh();
      if (onSuccess) onSuccess(res.data.data);

      if (saveAndAddAnother && !transactionToEdit) {
        setAmount('');
        setNote('');
      } else {
        onClose();
      }
    } catch (err) {
      const msg = err.response?.data?.error?.message || 'Failed to save transaction';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={transactionToEdit ? 'Edit Transaction' : 'Add Transaction'}
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Type Segmented Toggle */}
        <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl">
          <button
            type="button"
            onClick={() => handleTypeChange('expense')}
            className={`py-2 text-sm font-semibold rounded-lg transition-all ${
              type === 'expense'
                ? 'bg-white text-expense shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Expense
          </button>
          <button
            type="button"
            onClick={() => handleTypeChange('income')}
            className={`py-2 text-sm font-semibold rounded-lg transition-all ${
              type === 'income'
                ? 'bg-white text-income shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Income
          </button>
        </div>

        {/* Amount */}
        <Input
          label="Amount"
          type="number"
          step="0.01"
          placeholder="0.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          error={errors.amount}
          autoFocus
          required
        />

        {/* Category & Date */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Category"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            disabled={loadingCategories}
            error={errors.categoryId}
          >
            {categories.length === 0 ? (
              <option value="" disabled>
                {loadingCategories ? 'Loading categories...' : 'No categories available'}
              </option>
            ) : (
              categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))
            )}
          </Select>

          <Input
            label="Date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </div>

        {/* Payment Method */}
        <Select
          label="Payment Method"
          value={paymentMethod}
          onChange={(e) => setPaymentMethod(e.target.value)}
          options={PAYMENT_METHODS}
        />

        {/* Note with character count */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="text-sm font-medium text-slate-700">Note (Optional)</label>
            <span className="text-xs text-slate-400">{note.length} / 500</span>
          </div>
          <textarea
            rows={2}
            maxLength={500}
            placeholder="Add details (e.g. groceries, cafe, client payout)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full rounded-xl border-slate-300 bg-white text-slate-900 text-sm p-3 focus:border-primary focus:ring-primary transition-colors"
          />
        </div>

        {/* Save & add another checkbox (only when creating) */}
        {!transactionToEdit && (
          <div className="flex items-center gap-2 pt-1">
            <input
              id="saveAndAddAnother"
              type="checkbox"
              checked={saveAndAddAnother}
              onChange={(e) => setSaveAndAddAnother(e.target.checked)}
              className="w-4 h-4 rounded text-primary focus:ring-primary border-slate-300"
            />
            <label htmlFor="saveAndAddAnother" className="text-sm text-slate-600 select-none">
              Save & add another
            </label>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            loading={submitting}
            disabled={loadingCategories || categories.length === 0}
          >
            {transactionToEdit ? 'Save Changes' : 'Add Transaction'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

