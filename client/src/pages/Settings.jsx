import React, { useState, useEffect } from 'react';
import {
  User,
  FolderTree,
  Shield,
  AlertTriangle,
  Plus,
  Trash2,
  Edit2,
  Check,
} from 'lucide-react';
import { apiClient } from '../api/axiosInstance';
import { useAuth } from '../context/AuthContext';
import { useDataRefresh } from '../context/DataRefreshContext';
import { SUPPORTED_CURRENCIES, CATEGORY_PALETTE } from '../utils/constants';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import toast from 'react-hot-toast';

export default function Settings() {
  const { user, updateUser, logout } = useAuth();
  const { refreshKey, triggerRefresh } = useDataRefresh();

  const [activeTab, setActiveTab] = useState('profile');

  // --- Profile State ---
  const [name, setName] = useState(user?.name || '');
  const [currency, setCurrency] = useState(user?.currency || 'USD');
  const [timezone, setTimezone] = useState(user?.timezone || 'UTC');
  const [locale, setLocale] = useState(user?.locale || 'en-US');
  const [profileSaving, setProfileSaving] = useState(false);

  // --- Password State ---
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);

  // --- Danger Zone State ---
  const [deletePassword, setDeletePassword] = useState('');
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // --- Categories State ---
  const [categories, setCategories] = useState([]);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [catName, setCatName] = useState('');
  const [catType, setCatType] = useState('expense');
  const [catColor, setCatColor] = useState('#6366F1');
  const [catIcon, setCatIcon] = useState('tag');
  const [catSaving, setCatSaving] = useState(false);

  // Reassignment Modal State (FR-CAT-03)
  const [reassignCategory, setReassignCategory] = useState(null);
  const [targetReassignId, setTargetReassignId] = useState('');
  const [reassignCount, setReassignCount] = useState(0);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setCurrency(user.currency || 'USD');
      setTimezone(user.timezone || 'UTC');
      setLocale(user.locale || 'en-US');
    }
  }, [user]);

  // Load categories
  useEffect(() => {
    apiClient
      .get('/categories')
      .then(({ data }) => setCategories(data.data || []))
      .catch((err) => console.error(err));
  }, [refreshKey]);

  // Save profile
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setProfileSaving(true);
    try {
      const res = await apiClient.patch('/users/me', {
        name,
        currency,
        timezone,
        locale,
      });
      updateUser(res.data.data.user);
      toast.success('Profile updated successfully');
      triggerRefresh();
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to update profile');
    } finally {
      setProfileSaving(false);
    }
  };

  // Change password
  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmNewPassword) {
      toast.error('New passwords do not match');
      return;
    }
    setPasswordSaving(true);
    try {
      await apiClient.patch('/users/me/password', {
        currentPassword,
        newPassword,
      });
      toast.success('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to update password');
    } finally {
      setPasswordSaving(false);
    }
  };

  // Delete account
  const handleDeleteAccount = async () => {
    setIsDeletingAccount(true);
    try {
      await apiClient.delete('/users/me', { data: { password: deletePassword } });
      toast.success('Account deleted');
      logout();
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to delete account');
      setIsDeletingAccount(false);
    }
  };

  // Open add/edit category modal
  const handleOpenCatModal = (cat = null) => {
    if (cat) {
      setEditingCategory(cat);
      setCatName(cat.name);
      setCatType(cat.type);
      setCatColor(cat.color || '#6366F1');
      setCatIcon(cat.icon || 'tag');
    } else {
      setEditingCategory(null);
      setCatName('');
      setCatType('expense');
      setCatColor('#6366F1');
      setCatIcon('tag');
    }
    setIsCategoryModalOpen(true);
  };

  // Save category
  const handleSaveCategory = async (e) => {
    e.preventDefault();
    if (!catName.trim()) {
      toast.error('Category name is required');
      return;
    }

    setCatSaving(true);
    try {
      if (editingCategory) {
        await apiClient.patch(`/categories/${editingCategory.id}`, {
          name: catName.trim(),
          color: catColor,
          icon: catIcon,
        });
        toast.success('Category updated');
      } else {
        await apiClient.post('/categories', {
          name: catName.trim(),
          type: catType,
          color: catColor,
          icon: catIcon,
        });
        toast.success('Category created');
      }
      setIsCategoryModalOpen(false);
      triggerRefresh();
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to save category');
    } finally {
      setCatSaving(false);
    }
  };

  // Delete category with reassign support (FR-CAT-03)
  const handleDeleteCategory = async (cat) => {
    try {
      await apiClient.delete(`/categories/${cat.id}`);
      toast.success('Category removed');
      triggerRefresh();
    } catch (err) {
      if (err.response?.status === 409 && err.response?.data?.error?.code === 'CATEGORY_IN_USE') {
        const count = err.response.data.error.details?.count || 1;
        setReassignCount(count);
        setReassignCategory(cat);
        const candidates = categories.filter((c) => c.id !== cat.id && c.type === cat.type);
        if (candidates.length > 0) {
          setTargetReassignId(candidates[0].id);
        }
      } else {
        toast.error(err.response?.data?.error?.message || 'Failed to delete category');
      }
    }
  };

  const handleConfirmReassignDelete = async () => {
    if (!reassignCategory || !targetReassignId) return;
    try {
      await apiClient.delete(`/categories/${reassignCategory.id}?reassignTo=${targetReassignId}`);
      toast.success(`Category deleted and ${reassignCount} transaction(s) reassigned`);
      setReassignCategory(null);
      triggerRefresh();
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Reassignment failed');
    }
  };

  const tabs = [
    { id: 'profile', name: 'Profile', icon: User },
    { id: 'categories', name: 'Categories', icon: FolderTree },
    { id: 'security', name: 'Security', icon: Shield },
    { id: 'danger', name: 'Danger Zone', icon: AlertTriangle },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Settings</h2>
        <p className="text-sm text-slate-500 mt-0.5">Manage your preferences, custom categories, and credentials</p>
      </div>

      {/* Tabs Layout */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar Nav */}
        <div className="lg:w-60 flex lg:flex-col gap-1 p-1 bg-white rounded-2xl border border-slate-200/80 shadow-sm shrink-0 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors whitespace-nowrap ${
                  isActive
                    ? tab.id === 'danger'
                      ? 'bg-rose-50 text-rose-600'
                      : 'bg-primary/10 text-primary'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{tab.name}</span>
              </button>
            );
          })}
        </div>

        {/* Content Pane */}
        <div className="flex-1 bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-sm">
          {/* TAB 1: Profile */}
          {activeTab === 'profile' && (
            <form onSubmit={handleSaveProfile} className="space-y-5 max-w-lg">
              <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">Personal Profile</h3>
              <Input
                label="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              <Input
                label="Email Address"
                value={user?.email || ''}
                disabled
                className="bg-slate-100 cursor-not-allowed opacity-80"
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select
                  label="Display Currency"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                >
                  {SUPPORTED_CURRENCIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </Select>
                <Input
                  label="Timezone"
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                />
              </div>
              <Button type="submit" loading={profileSaving}>
                Save Profile
              </Button>
            </form>
          )}

          {/* TAB 2: Categories */}
          {activeTab === 'categories' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Custom Categories</h3>
                  <p className="text-xs text-slate-500">Organize and color-code your transactions</p>
                </div>
                <Button size="sm" onClick={() => handleOpenCatModal()} className="flex items-center gap-1.5">
                  <Plus className="w-4 h-4" />
                  <span>New Category</span>
                </Button>
              </div>

              {/* Expense Categories */}
              <div>
                <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-3">Expense Categories</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {categories.filter((c) => c.type === 'expense').map((cat) => (
                    <div key={cat.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: cat.color }} />
                        <span className="text-sm font-semibold text-slate-800">{cat.name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={() => handleOpenCatModal(cat)} className="p-1 text-slate-400 hover:text-primary">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDeleteCategory(cat)} className="p-1 text-slate-400 hover:text-expense">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Income Categories */}
              <div>
                <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-3">Income Categories</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {categories.filter((c) => c.type === 'income').map((cat) => (
                    <div key={cat.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: cat.color }} />
                        <span className="text-sm font-semibold text-slate-800">{cat.name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={() => handleOpenCatModal(cat)} className="p-1 text-slate-400 hover:text-primary">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDeleteCategory(cat)} className="p-1 text-slate-400 hover:text-expense">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Security */}
          {activeTab === 'security' && (
            <form onSubmit={handleChangePassword} className="space-y-4 max-w-lg">
              <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">Change Password</h3>
              <Input
                label="Current Password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
              <Input
                label="New Password"
                type="password"
                placeholder="Min 8 characters with letters & numbers"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
              <Input
                label="Confirm New Password"
                type="password"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                required
              />
              <Button type="submit" loading={passwordSaving}>
                Update Password
              </Button>
            </form>
          )}

          {/* TAB 4: Danger Zone */}
          {activeTab === 'danger' && (
            <div className="space-y-4 max-w-lg">
              <h3 className="text-lg font-bold text-rose-600 border-b border-rose-100 pb-3">Danger Zone</h3>
              <p className="text-sm text-slate-600">
                Permanently delete your account along with all your transactions, custom categories, budgets, and tokens.
                This action is non-reversible.
              </p>
              <Button variant="danger" onClick={() => setIsDeleteModalOpen(true)}>
                Delete My Account
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Category Create/Edit Modal */}
      <Modal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        title={editingCategory ? 'Edit Category' : 'Create Category'}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSaveCategory} className="space-y-4">
          <Input
            label="Category Name"
            value={catName}
            onChange={(e) => setCatName(e.target.value)}
            required
            autoFocus
          />

          {!editingCategory && (
            <Select
              label="Type"
              value={catType}
              onChange={(e) => setCatType(e.target.value)}
            >
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </Select>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Category Color</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORY_PALETTE.map((hex) => (
                <button
                  type="button"
                  key={hex}
                  onClick={() => setCatColor(hex)}
                  className={`w-7 h-7 rounded-full flex items-center justify-center transition-transform ${
                    catColor === hex ? 'scale-110 ring-2 ring-offset-2 ring-primary' : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: hex }}
                >
                  {catColor === hex && <Check className="w-4 h-4 text-white" />}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <Button variant="secondary" onClick={() => setIsCategoryModalOpen(false)} disabled={catSaving}>
              Cancel
            </Button>
            <Button type="submit" loading={catSaving}>
              Save Category
            </Button>
          </div>
        </form>
      </Modal>

      {/* Reassign & Delete Category Modal (FR-CAT-03) */}
      <Modal
        isOpen={!!reassignCategory}
        onClose={() => setReassignCategory(null)}
        title="Reassign Transactions"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            <strong>{reassignCategory?.name}</strong> has <strong>{reassignCount}</strong> associated transaction(s).
            Please select another <strong>{reassignCategory?.type}</strong> category to reassign them to before deleting.
          </p>

          <Select
            label="Reassign to"
            value={targetReassignId}
            onChange={(e) => setTargetReassignId(e.target.value)}
          >
            {categories
              .filter((c) => c.id !== reassignCategory?.id && c.type === reassignCategory?.type)
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
          </Select>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button variant="secondary" onClick={() => setReassignCategory(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleConfirmReassignDelete}>
              Reassign & Delete
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Account Modal (FR-AUTH-10) */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Account"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Please enter your password to confirm permanent account deletion.
          </p>
          <Input
            label="Password Confirmation"
            type="password"
            placeholder="Enter your current password"
            value={deletePassword}
            onChange={(e) => setDeletePassword(e.target.value)}
            required
            autoFocus
          />
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button variant="secondary" onClick={() => setIsDeleteModalOpen(false)} disabled={isDeletingAccount}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDeleteAccount} loading={isDeletingAccount}>
              Confirm Permanent Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

