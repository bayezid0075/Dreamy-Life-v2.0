'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  getMembershipPlans,
  getMembershipStats,
  createMembershipPlan,
  updateMembershipPlan,
  deleteMembershipPlan,
  type MembershipPlan,
  type MembershipStats,
  type PlanFeature,
  type CreatePlanInput,
  type UpdatePlanInput,
} from './api';

const COLOR_THEMES = [
  { value: 'primary', label: 'Primary (Gray)' },
  { value: 'tertiary', label: 'Tertiary (Teal)' },
  { value: 'secondary', label: 'Secondary (Rose)' },
];

const FEATURE_ICON_OPTIONS = [
  'headset_mic', 'support_agent', 'mail', 'paid', 'star', 'schedule',
  'celebration', 'local_shipping', 'concierge', 'badge', 'workspace_premium',
  'diamond', 'favorite', 'bolt', 'spa', 'card_giftcard', 'local_offer',
  'verified', 'shield', 'speed',
];

const STATUS_COLORS: Record<string, string> = {
  super_admin: 'bg-purple-100 text-purple-700',
  vvip: 'bg-yellow-100 text-yellow-700',
  smart: 'bg-blue-100 text-blue-700',
  standard: 'bg-green-100 text-green-700',
  basic: 'bg-gray-100 text-gray-700',
  user: 'bg-surface-variant text-on-surface-variant',
};

const THEME_PREVIEW: Record<string, string> = {
  primary: 'from-gray-50 to-gray-100 border-gray-200',
  tertiary: 'from-teal-50 to-cyan-50 border-teal-200',
  secondary: 'from-pink-50 to-rose-50 border-rose-200',
};

export default function MembershipManager() {
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [stats, setStats] = useState<MembershipStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'plans' | 'stats'>('plans');
  const [showModal, setShowModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<MembershipPlan | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState<CreatePlanInput>({
    name: '',
    price: '',
    description: '',
    level: 0,
    features: [],
    buttonText: 'Choose Plan',
    isPopular: false,
    sortOrder: 0,
    colorTheme: 'primary',
    commissionRates: [10, 5, 3, 2, 1, 0.5, 0.5, 0.5, 0.5, 0.5],
    isActive: true,
  });

  const loadPlans = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getMembershipPlans();
      setPlans(data.sort((a, b) => a.sortOrder - b.sortOrder));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadStats = useCallback(async () => {
    try {
      const data = await getMembershipStats();
      setStats(data);
    } catch (err: any) {
      setError(err.message);
    }
  }, []);

  useEffect(() => {
    loadPlans();
    if (activeTab === 'stats') loadStats();
  }, [activeTab, loadPlans, loadStats]);

  const normalizeCommissionRates = (rates: any): number[] => {
    const defaults = [10, 5, 3, 2, 1, 0.5, 0.5, 0.5, 0.5, 0.5];
    if (!rates) return defaults;
    let arr: number[];
    if (Array.isArray(rates)) {
      arr = rates.map(Number);
    } else if (typeof rates === 'object') {
      arr = Object.values(rates).map(Number);
    } else {
      return defaults;
    }
    while (arr.length < 10) arr.push(0);
    return arr.slice(0, 10);
  };

  const openCreateModal = () => {
    setEditingPlan(null);
    setForm({
      name: '',
      price: '',
      description: '',
      level: plans.length > 0 ? Math.max(...plans.map(p => p.level)) + 1 : 1,
      features: [],
      buttonText: 'Choose Plan',
      isPopular: false,
      sortOrder: plans.length,
      colorTheme: 'primary',
      commissionRates: [10, 5, 3, 2, 1, 0.5, 0.5, 0.5, 0.5, 0.5],
      isActive: true,
    });
    setError('');
    setShowModal(true);
  };

  const openEditModal = (plan: MembershipPlan) => {
    setEditingPlan(plan);
    setForm({
      name: plan.name,
      price: plan.price,
      description: plan.description || '',
      level: plan.level,
      features: plan.features || [],
      buttonText: plan.buttonText,
      isPopular: plan.isPopular,
      sortOrder: plan.sortOrder,
      colorTheme: plan.colorTheme,
      commissionRates: normalizeCommissionRates(plan.commissionRates),
      isActive: plan.isActive,
    });
    setError('');
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.price.trim()) {
      setError('Name and price are required');
      return;
    }
    const rates = normalizeCommissionRates(form.commissionRates);
    const saveData = { ...form, commissionRates: rates };
    setSaving(true);
    setError('');
    try {
      if (editingPlan) {
        await updateMembershipPlan(editingPlan.id, saveData as UpdatePlanInput);
        setPlans((prev) =>
          prev.map((p) =>
            p.id === editingPlan.id
              ? { ...p, ...saveData, commissionRates: rates }
              : p
          ).sort((a, b) => a.sortOrder - b.sortOrder)
        );
      } else {
        const created = await createMembershipPlan(saveData);
        setPlans((prev) => [...prev, created].sort((a, b) => a.sortOrder - b.sortOrder));
      }
      setShowModal(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (planId: string) => {
    if (!confirm('Are you sure you want to delete this plan?')) return;
    setDeleting(planId);
    try {
      await deleteMembershipPlan(planId);
      setPlans((prev) => prev.filter((p) => p.id !== planId));
    } catch (err: any) {
      alert(err.message);
    } finally {
      setDeleting(null);
    }
  };

  const handleToggleActive = async (plan: MembershipPlan) => {
    try {
      await updateMembershipPlan(plan.id, { isActive: !plan.isActive });
      setPlans((prev) =>
        prev.map((p) =>
          p.id === plan.id ? { ...p, isActive: !p.isActive } : p
        )
      );
    } catch (err: any) {
      alert(err.message);
    }
  };

  const addFeature = () => {
    setForm({
      ...form,
      features: [...(form.features || []), { text: '', icon: 'star' }],
    });
  };

  const updateFeature = (index: number, field: keyof PlanFeature, value: string) => {
    const newFeatures = [...(form.features || [])];
    newFeatures[index] = { ...newFeatures[index], [field]: value };
    setForm({ ...form, features: newFeatures });
  };

  const removeFeature = (index: number) => {
    setForm({
      ...form,
      features: (form.features || []).filter((_, i) => i !== index),
    });
  };

  return (
    <div className="space-y-lg">
      {/* Tab Bar */}
      <div className="flex gap-sm">
        {[
          { key: 'plans' as const, label: 'Plans', icon: 'workspace_premium' },
          { key: 'stats' as const, label: 'Stats', icon: 'monitoring' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-sm px-md py-sm rounded-lg transition-colors font-body-sm text-body-sm ${
              activeTab === tab.key
                ? 'bg-primary text-on-primary'
                : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-variant'
            }`}
          >
            <span className="material-symbols-outlined text-lg">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Plans Tab */}
      {activeTab === 'plans' && (
        <div className="space-y-md">
          <div className="flex justify-between items-center">
            <h2 className="font-headline-lg text-headline-lg text-on-surface font-bold">
              Membership Plans
            </h2>
            <button
              onClick={openCreateModal}
              className="flex items-center gap-sm px-md py-sm rounded-lg bg-primary text-on-primary hover:bg-primary/90 transition-colors font-body-sm text-body-sm font-medium"
            >
              <span className="material-symbols-outlined text-lg">add</span>
              Create Plan
            </button>
          </div>

          {error && (
            <div className="bg-error/10 text-error px-md py-sm rounded-lg text-body-sm flex items-center gap-2">
              <span className="material-symbols-outlined">error</span>
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-xl">
              <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full"></div>
            </div>
          ) : plans.length === 0 ? (
            <div className="glass-panel rounded-xl p-xl text-center">
              <span className="material-symbols-outlined text-5xl text-on-surface-variant mb-sm block">workspace_premium</span>
              <p className="text-on-surface-variant">No membership plans yet. Create your first plan!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-md">
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  className={`glass-panel rounded-xl p-md relative overflow-hidden ${
                    plan.isPopular ? 'ring-2 ring-tertiary' : ''
                  } ${!plan.isActive ? 'opacity-60' : ''}`}
                >
                  {plan.isPopular && (
                    <div className="absolute top-0 right-0 bg-tertiary text-on-tertiary text-[10px] font-bold uppercase tracking-wider py-1 px-3 rounded-bl-lg">
                      Popular
                    </div>
                  )}
                  {!plan.isActive && (
                    <div className="absolute top-0 left-0 bg-error text-on-error text-[10px] font-bold uppercase tracking-wider py-1 px-3 rounded-br-lg">
                      Inactive
                    </div>
                  )}
                  <div className="flex items-start justify-between mb-sm">
                    <div>
                      <h3 className="font-headline-md text-headline-md text-on-surface font-bold capitalize">
                        {plan.name}
                      </h3>
                      <p className="text-on-surface-variant text-body-sm">Level {plan.level}</p>
                    </div>
                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${THEME_PREVIEW[plan.colorTheme] || THEME_PREVIEW.primary} flex items-center justify-center`}>
                      <span className="material-symbols-outlined text-on-surface">workspace_premium</span>
                    </div>
                  </div>

                  <div className="mb-sm">
                    <span className="text-headline-md font-headline-md text-on-surface font-bold">
                      ৳{Number(plan.price).toLocaleString()}
                    </span>
                  </div>

                  {plan.description && (
                    <p className="text-on-surface-variant text-body-sm mb-sm line-clamp-2">
                      {plan.description}
                    </p>
                  )}

                  {plan.features && plan.features.length > 0 && (
                    <div className="mb-sm space-y-1">
                      {plan.features.map((f, i) => (
                        <div key={i} className="flex items-center gap-2 text-body-sm text-on-surface-variant">
                          <span className="material-symbols-outlined text-[16px] text-primary">{f.icon}</span>
                          {f.text}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-sm text-body-sm text-on-surface-variant mb-sm">
                    <span>Button: &ldquo;{plan.buttonText}&rdquo;</span>
                  </div>

                  <div className="flex items-center gap-sm text-body-sm text-on-surface-variant mb-sm">
                    <span>Order: {plan.sortOrder}</span>
                    <span>|</span>
                    <span className="capitalize">{plan.colorTheme}</span>
                  </div>

                  {plan.commissionRates && plan.commissionRates.length > 0 && (
                    <div className="mb-md p-sm rounded-lg bg-surface-container-high/30">
                      <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">Commission Rates (10 Levels)</p>
                      <div className="grid grid-cols-5 gap-1">
                        {plan.commissionRates.map((rate, i) => (
                          <span key={i} className={`px-1.5 py-0.5 text-[10px] rounded font-medium text-center ${rate > 0 ? 'bg-primary/10 text-primary' : 'bg-surface-variant/50 text-on-surface-variant/50'}`}>
                            L{i+1}: {rate}%
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-sm border-t border-outline-variant/30 pt-sm">
                    <button
                      onClick={() => handleToggleActive(plan)}
                      className={`p-2 rounded-lg transition-colors ${
                        plan.isActive
                          ? 'hover:bg-green-100 text-green-600'
                          : 'hover:bg-surface-variant text-on-surface-variant'
                      }`}
                      title={plan.isActive ? 'Deactivate' : 'Activate'}
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        {plan.isActive ? 'toggle_on' : 'toggle_off'}
                      </span>
                    </button>
                    <button
                      onClick={() => openEditModal(plan)}
                      className="p-2 rounded-lg hover:bg-primary/10 text-primary transition-colors"
                      title="Edit"
                    >
                      <span className="material-symbols-outlined text-[20px]">edit</span>
                    </button>
                    <button
                      onClick={() => handleDelete(plan.id)}
                      disabled={deleting === plan.id}
                      className="p-2 rounded-lg hover:bg-error/10 text-error transition-colors disabled:opacity-50"
                      title="Delete"
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        {deleting === plan.id ? 'progress_activity' : 'delete'}
                      </span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Stats Tab */}
      {activeTab === 'stats' && (
        <div className="space-y-md">
          {stats ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-md">
                {[
                  { label: 'Total Purchases', value: stats.totalPurchases, icon: 'shopping_cart', color: 'bg-blue-100 text-blue-700' },
                  { label: 'Total Revenue', value: `৳${stats.totalRevenue.toLocaleString()}`, icon: 'payments', color: 'bg-green-100 text-green-700' },
                  { label: 'Total Commissions', value: `৳${stats.totalCommissions.toLocaleString()}`, icon: 'account_balance', color: 'bg-purple-100 text-purple-700' },
                  { label: 'Active Plans', value: plans.filter(p => p.isActive).length, icon: 'check_circle', color: 'bg-teal-100 text-teal-700' },
                ].map((stat) => (
                  <div key={stat.label} className="glass-panel rounded-xl p-md">
                    <div className="flex items-center gap-sm mb-sm">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${stat.color}`}>
                        <span className="material-symbols-outlined text-sm">{stat.icon}</span>
                      </div>
                      <span className="text-on-surface-variant text-body-sm">{stat.label}</span>
                    </div>
                    <div className="font-title-lg text-title-lg text-on-surface font-bold">{stat.value}</div>
                  </div>
                ))}
              </div>

              {/* Plan Breakdown */}
              <div className="glass-panel rounded-xl p-md">
                <h3 className="font-body-lg text-body-lg text-on-surface font-bold mb-md">Plan Breakdown</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left font-body-sm text-body-sm">
                    <thead>
                      <tr className="border-b border-outline-variant/50">
                        <th className="py-3 px-2 font-bold">Plan</th>
                        <th className="py-3 px-2 font-bold">Price</th>
                        <th className="py-3 px-2 font-bold">Purchases</th>
                        <th className="py-3 px-2 font-bold">Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.planBreakdown.map((p) => (
                        <tr key={p.planId} className="border-b border-outline-variant/30">
                          <td className="py-3 px-2 font-bold capitalize">{p.planName}</td>
                          <td className="py-3 px-2 text-on-surface-variant">৳{p.price.toLocaleString()}</td>
                          <td className="py-3 px-2 text-on-surface-variant">{p.purchaseCount}</td>
                          <td className="py-3 px-2 font-bold">৳{p.revenue.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Users by Status */}
              <div className="glass-panel rounded-xl p-md">
                <h3 className="font-body-lg text-body-lg text-on-surface font-bold mb-md">Users by Status</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-sm">
                  {stats.usersByStatus.map((u) => (
                    <div key={u.status} className="p-sm rounded-lg bg-surface-container-high/30 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${STATUS_COLORS[u.status] || 'bg-surface-variant text-on-surface-variant'}`}>
                        {u.status}
                      </span>
                      <p className="text-on-surface font-bold text-lg mt-1">{u.count}</p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="flex justify-center py-xl">
              <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full"></div>
            </div>
          )}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="glass-panel rounded-xl p-lg w-full max-w-2xl my-8">
            <div className="flex justify-between items-center mb-md">
              <h3 className="font-headline-md text-headline-md text-on-surface font-bold">
                {editingPlan ? 'Edit Plan' : 'Create Plan'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-on-surface-variant hover:text-primary">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {error && (
              <div className="bg-error/10 text-error px-md py-sm rounded-lg text-body-sm mb-md">{error}</div>
            )}

            <div className="space-y-md max-h-[75vh] overflow-y-auto pr-2">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-md">
                <div className="space-y-sm">
                  <label className="text-on-surface-variant font-body-sm text-body-sm font-medium">Name *</label>
                  <input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. basic, premium"
                    className="w-full bg-surface-container-high/50 border border-outline-variant rounded-lg px-md py-sm text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  />
                </div>
                <div className="space-y-sm">
                  <label className="text-on-surface-variant font-body-sm text-body-sm font-medium">Price *</label>
                  <input
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    placeholder="e.g. 500"
                    className="w-full bg-surface-container-high/50 border border-outline-variant rounded-lg px-md py-sm text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  />
                </div>
              </div>

              <div className="space-y-sm">
                <label className="text-on-surface-variant font-body-sm text-body-sm font-medium">Description</label>
                <textarea
                  value={form.description || ''}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Brief description of this plan"
                  rows={2}
                  className="w-full bg-surface-container-high/50 border border-outline-variant rounded-lg px-md py-sm text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all resize-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-md">
                <div className="space-y-sm">
                  <label className="text-on-surface-variant font-body-sm text-body-sm font-medium">Level</label>
                  <input
                    type="number"
                    value={form.level}
                    onChange={(e) => setForm({ ...form, level: parseInt(e.target.value) || 0 })}
                    min={0}
                    className="w-full bg-surface-container-high/50 border border-outline-variant rounded-lg px-md py-sm text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  />
                </div>
                <div className="space-y-sm">
                  <label className="text-on-surface-variant font-body-sm text-body-sm font-medium">Sort Order</label>
                  <input
                    type="number"
                    value={form.sortOrder}
                    onChange={(e) => setForm({ ...form, sortOrder: parseInt(e.target.value) || 0 })}
                    min={0}
                    className="w-full bg-surface-container-high/50 border border-outline-variant rounded-lg px-md py-sm text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  />
                </div>
                <div className="space-y-sm">
                  <label className="text-on-surface-variant font-body-sm text-body-sm font-medium">Color Theme</label>
                  <select
                    value={form.colorTheme}
                    onChange={(e) => setForm({ ...form, colorTheme: e.target.value })}
                    className="w-full bg-surface-container-high/50 border border-outline-variant rounded-lg px-md py-sm text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  >
                    {COLOR_THEMES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-md">
                <div className="space-y-sm">
                  <label className="text-on-surface-variant font-body-sm text-body-sm font-medium">Button Text</label>
                  <input
                    value={form.buttonText}
                    onChange={(e) => setForm({ ...form, buttonText: e.target.value })}
                    placeholder="Choose Plan"
                    className="w-full bg-surface-container-high/50 border border-outline-variant rounded-lg px-md py-sm text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  />
                </div>
                <div className="flex items-end gap-md">
                  <label className="flex items-center gap-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.isPopular}
                      onChange={(e) => setForm({ ...form, isPopular: e.target.checked })}
                      className="w-4 h-4 rounded border-outline-variant text-primary focus:ring-primary"
                    />
                    <span className="text-on-surface-variant font-body-sm text-body-sm">Most Popular</span>
                  </label>
                  <label className="flex items-center gap-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.isActive}
                      onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                      className="w-4 h-4 rounded border-outline-variant text-primary focus:ring-primary"
                    />
                    <span className="text-on-surface-variant font-body-sm text-body-sm">Active</span>
                  </label>
                </div>
              </div>

              {/* Features */}
              <div className="space-y-sm">
                <div className="flex items-center justify-between">
                  <label className="text-on-surface-variant font-body-sm text-body-sm font-medium">Features</label>
                  <button
                    onClick={addFeature}
                    className="flex items-center gap-1 text-primary text-body-sm font-medium hover:underline"
                  >
                    <span className="material-symbols-outlined text-[16px]">add</span>
                    Add Feature
                  </button>
                </div>
                {(form.features || []).length === 0 && (
                  <p className="text-on-surface-variant text-body-sm italic">No features added yet</p>
                )}
                <div className="space-y-2">
                  {(form.features || []).map((feature, index) => (
                    <div key={index} className="flex items-center gap-sm">
                      <select
                        value={feature.icon}
                        onChange={(e) => updateFeature(index, 'icon', e.target.value)}
                        className="bg-surface-container-high/50 border border-outline-variant rounded-lg px-sm py-sm text-on-surface focus:outline-none focus:border-primary text-sm w-32"
                      >
                        {FEATURE_ICON_OPTIONS.map((icon) => (
                          <option key={icon} value={icon}>{icon}</option>
                        ))}
                      </select>
                      <input
                        value={feature.text}
                        onChange={(e) => updateFeature(index, 'text', e.target.value)}
                        placeholder="Feature text"
                        className="flex-1 bg-surface-container-high/50 border border-outline-variant rounded-lg px-md py-sm text-on-surface focus:outline-none focus:border-primary text-sm"
                      />
                      <button
                        onClick={() => removeFeature(index)}
                        className="p-2 rounded-lg hover:bg-error/10 text-error transition-colors"
                      >
                        <span className="material-symbols-outlined text-[18px]">close</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Commission Rates (10 levels) */}
              <div className="space-y-sm border-t border-outline-variant/30 pt-md">
                <label className="text-on-surface font-body-sm text-body-sm font-bold">
                  Commission Rates (% per upline level)
                </label>
                <p className="text-on-surface-variant text-body-sm">
                  Set the percentage of plan price distributed to each upline referrer (Level 1 = direct referrer). Must total 100% or less.
                </p>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-sm">
                  {Array.from({ length: 10 }, (_, index) => {
                    const rate = (form.commissionRates || [])[index] ?? 0;
                    return (
                      <div key={index} className="space-y-1">
                        <label className="text-on-surface text-[11px] font-bold">Level {index + 1}</label>
                        <input
                          type="number"
                          value={rate}
                          onChange={(e) => {
                            const currentRates = Array.isArray(form.commissionRates) ? [...form.commissionRates] : Array(10).fill(0);
                            while (currentRates.length < 10) currentRates.push(0);
                            currentRates[index] = parseFloat(e.target.value) || 0;
                            setForm({ ...form, commissionRates: currentRates });
                          }}
                          min={0}
                          max={100}
                          step={0.5}
                          className="w-full bg-surface-container-high/50 border border-outline-variant rounded-lg px-sm py-sm text-on-surface focus:outline-none focus:border-primary text-sm text-center"
                        />
                      </div>
                    );
                  })}
                </div>
                <div className="flex items-center gap-sm">
                  <span className="text-on-surface-variant text-body-sm">Total:</span>
                  <span className={`font-bold text-body-sm ${
                    (form.commissionRates || []).reduce((sum, r) => sum + r, 0) > 100
                      ? 'text-error'
                      : 'text-on-surface'
                  }`}>
                    {(form.commissionRates || []).reduce((sum, r) => sum + r, 0).toFixed(1)}%
                  </span>
                  {(form.commissionRates || []).reduce((sum, r) => sum + r, 0) > 100 && (
                    <span className="text-error text-body-sm">Cannot exceed 100%</span>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-sm mt-md pt-md border-t border-outline-variant/30">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 p-sm rounded-lg border border-outline-variant text-on-surface-variant hover:bg-surface-variant/50 transition-colors font-label-md"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 p-sm rounded-lg bg-primary text-on-primary font-bold hover:bg-primary/90 transition-colors font-label-md disabled:opacity-50"
              >
                {saving ? 'Saving...' : editingPlan ? 'Update Plan' : 'Create Plan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
