'use client';

import { useState, useEffect } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface CommissionTier {
  minAmount: number;
  maxAmount: number;
  rates: number[];
}

interface DrivePackConfig {
  drivePackBuyerCommissionRate: string;
  drivePackCashbackRate: string;
  drivePackCommissionRates: CommissionTier[] | number[];
  drivePackIsActive: boolean;
}

const DEFAULT_TIERS: CommissionTier[] = [
  { minAmount: 0, maxAmount: 100, rates: [3, 2, 1, 0.5, 0.3, 0.2, 0.1, 0.1, 0.1, 0.1] },
  { minAmount: 101, maxAmount: 500, rates: [2.5, 1.5, 0.8, 0.4, 0.25, 0.15, 0.1, 0.1, 0.1, 0.1] },
  { minAmount: 501, maxAmount: 999999, rates: [2, 1, 0.5, 0.3, 0.2, 0.1, 0.1, 0.1, 0.1, 0.1] },
];

function normalizeCommissionRates(raw: CommissionTier[] | number[]): CommissionTier[] {
  if (!raw || !Array.isArray(raw) || raw.length === 0) return DEFAULT_TIERS;
  const first = raw[0];
  if (typeof first === 'number') {
    return [{ minAmount: 0, maxAmount: 999999, rates: raw as number[] }];
  }
  if (typeof first === 'object' && first !== null && 'rates' in first) {
    return raw as CommissionTier[];
  }
  return DEFAULT_TIERS;
}

export default function DrivePackConfigPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const [drivePackIsActive, setDrivePackIsActive] = useState(false);
  const [buyerCommissionRate, setBuyerCommissionRate] = useState('5');
  const [cashbackRate, setCashbackRate] = useState('0');
  const [tiers, setTiers] = useState<CommissionTier[]>(DEFAULT_TIERS);

  const [stats, setStats] = useState<{ totalOrders: number; totalCommission: number } | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    fetchConfig();
    fetchStats();
  }, []);

  const fetchConfig = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${API_URL}/recharge/admin/config`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success && data.data) {
        const c = data.data;
        setDrivePackIsActive(c.drivePackIsActive || false);
        setBuyerCommissionRate(c.drivePackBuyerCommissionRate || '5');
        setCashbackRate(c.drivePackCashbackRate || '0');
        setTiers(normalizeCommissionRates(c.drivePackCommissionRates));
      }
    } catch (err) {
      console.error('Failed to fetch config', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${API_URL}/recharge/admin/orders?page=1&limit=1`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success && data.data) {
        const allOrders = data.data.orders || [];
        const drivePackOrders = allOrders.filter((o: any) => o.source === 'drive_pack');
        const totalCommission = drivePackOrders.reduce((sum: number, o: any) => sum + (parseFloat(o.userCommission) || 0), 0);
        setStats({ totalOrders: data.data.total || 0, totalCommission });
      }
    } catch (err) {
      console.error('Failed to fetch stats', err);
    } finally {
      setStatsLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${API_URL}/recharge/admin/config`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          drivePackIsActive,
          drivePackBuyerCommissionRate: buyerCommissionRate,
          drivePackCashbackRate: cashbackRate,
          drivePackCommissionRates: tiers,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage('Drive Pack configuration saved successfully!');
      } else {
        setMessage('Failed to save configuration');
      }
    } catch (err) {
      setMessage('Error saving configuration');
    } finally {
      setSaving(false);
    }
  };

  const updateTierRate = (tierIndex: number, levelIndex: number, value: string) => {
    const newTiers = [...tiers];
    newTiers[tierIndex] = {
      ...newTiers[tierIndex],
      rates: [...newTiers[tierIndex].rates],
    };
    newTiers[tierIndex].rates[levelIndex] = parseFloat(value) || 0;
    setTiers(newTiers);
  };

  const updateTierRange = (tierIndex: number, field: 'minAmount' | 'maxAmount', value: string) => {
    const newTiers = [...tiers];
    newTiers[tierIndex] = { ...newTiers[tierIndex], [field]: parseInt(value) || 0 };
    setTiers(newTiers);
  };

  const addTier = () => {
    const lastMax = tiers[tiers.length - 1]?.maxAmount || 0;
    setTiers([
      ...tiers,
      { minAmount: lastMax + 1, maxAmount: lastMax + 500, rates: [2, 1, 0.5, 0.3, 0.2, 0.1, 0.1, 0.1, 0.1, 0.1] },
    ]);
  };

  const removeTier = (index: number) => {
    if (tiers.length <= 1) return;
    setTiers(tiers.filter((_, i) => i !== index));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="material-symbols-outlined animate-spin text-primary text-4xl">progress_activity</span>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-on-surface">Drive Pack Configuration</h1>
        <p className="text-on-surface-variant mt-1">Configure buyer commission, cashback, and upline commission rates for Drive Pack purchases</p>
      </div>

      {message && (
        <div className={`p-4 rounded-xl ${message.includes('success') ? 'bg-tertiary-container text-tertiary' : 'bg-error-container text-error'}`}>
          {message}
        </div>
      )}

      {/* Service Status */}
      <div className="glass-panel rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined">power_settings_new</span>
              Drive Pack Service
            </h2>
            <p className="text-on-surface-variant text-sm mt-1">Enable or disable Drive Pack purchases for users</p>
          </div>
          <button
            onClick={() => setDrivePackIsActive(!drivePackIsActive)}
            className={`relative w-14 h-7 rounded-full transition-colors ${drivePackIsActive ? 'bg-tertiary' : 'bg-surface-variant'}`}
          >
            <div
              className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform ${drivePackIsActive ? 'translate-x-7' : 'translate-x-0.5'}`}
            />
          </button>
        </div>
        <div className="flex items-center gap-2 mt-3">
          <div className={`w-2 h-2 rounded-full ${drivePackIsActive ? 'bg-tertiary' : 'bg-error'}`} />
          <span className="text-sm text-on-surface-variant">
            {drivePackIsActive ? 'Drive Pack is active' : 'Drive Pack is disabled'}
          </span>
        </div>
      </div>

      {/* Buyer Commission */}
      <div className="glass-panel rounded-xl p-6">
        <h2 className="text-lg font-semibold text-on-surface mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined">savings</span>
          Buyer Commission (Cashback)
        </h2>
        <p className="text-on-surface-variant text-sm mb-4">
          Percentage of drive pack amount credited back to the buyer's wallet after successful purchase
        </p>
        <div className="flex items-center gap-3">
          <input
            type="number"
            step="0.1"
            min="0"
            max="100"
            value={buyerCommissionRate}
            onChange={(e) => setBuyerCommissionRate(e.target.value)}
            className="w-32 px-4 py-2.5 rounded-lg border border-outline-variant bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <span className="text-on-surface-variant font-medium">%</span>
        </div>
        <div className="mt-3 p-3 rounded-lg bg-surface-variant/30">
          <p className="text-xs text-on-surface-variant">
            Example: If a user buys a ৳500 drive pack with {buyerCommissionRate}% buyer commission, they get ৳{(500 * parseFloat(buyerCommissionRate || '0') / 100).toFixed(2)} credited to their wallet.
          </p>
        </div>
      </div>

      {/* Cashback Rate */}
      <div className="glass-panel rounded-xl p-6">
        <h2 className="text-lg font-semibold text-on-surface mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined">redeem</span>
          Cashback Rate
        </h2>
        <p className="text-on-surface-variant text-sm mb-4">
          Additional cashback percentage applied on drive pack purchases (optional)
        </p>
        <div className="flex items-center gap-3">
          <input
            type="number"
            step="0.1"
            min="0"
            max="100"
            value={cashbackRate}
            onChange={(e) => setCashbackRate(e.target.value)}
            className="w-32 px-4 py-2.5 rounded-lg border border-outline-variant bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <span className="text-on-surface-variant font-medium">% cashback</span>
        </div>
        <div className="mt-3 p-3 rounded-lg bg-surface-variant/30">
          <p className="text-xs text-on-surface-variant">
            {parseFloat(cashbackRate || '0') > 0
              ? `Users will receive ${cashbackRate}% cashback on every drive pack purchase.`
              : 'Cashback is currently disabled. Set a percentage to enable it.'}
          </p>
        </div>
      </div>

      {/* Upline Commission Tiers */}
      <div className="glass-panel rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined">group</span>
            Upline Commission Tiers
          </h2>
          <button
            onClick={addTier}
            className="px-3 py-1.5 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors text-sm flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            Add Tier
          </button>
        </div>
        <p className="text-on-surface-variant text-sm mb-4">
          Set commission percentages for each upline referral level (L1-L10). Tiers are matched by drive pack amount range.
        </p>

        <div className="space-y-6">
          {tiers.map((tier, ti) => (
            <div key={ti} className="border border-outline-variant rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-on-surface">Tier {ti + 1}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-on-surface-variant">৳</span>
                    <input
                      type="number"
                      value={tier.minAmount}
                      onChange={(e) => updateTierRange(ti, 'minAmount', e.target.value)}
                      className="w-24 px-2 py-1.5 rounded border border-outline-variant bg-surface text-on-surface text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    <span className="text-xs text-on-surface-variant">to ৳</span>
                    <input
                      type="number"
                      value={tier.maxAmount}
                      onChange={(e) => updateTierRange(ti, 'maxAmount', e.target.value)}
                      className="w-24 px-2 py-1.5 rounded border border-outline-variant bg-surface text-on-surface text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>
                {tiers.length > 1 && (
                  <button
                    onClick={() => removeTier(ti)}
                    className="text-error/70 hover:text-error transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-5 md:grid-cols-10 gap-2">
                {tier.rates.map((rate, li) => (
                  <div key={li}>
                    <label className="block text-[10px] font-medium text-on-surface-variant mb-0.5">
                      L{li + 1}
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={rate}
                      onChange={(e) => updateTierRate(ti, li, e.target.value)}
                      className="w-full px-2 py-1.5 rounded border border-outline-variant bg-surface text-on-surface text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-on-surface-variant mt-2">
                Total: {tier.rates.reduce((a, b) => a + b, 0).toFixed(1)}%
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* How it Works */}
      <div className="glass-panel rounded-xl p-6">
        <h2 className="text-lg font-semibold text-on-surface mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined">info</span>
          How Drive Pack Commission Works
        </h2>
        <div className="space-y-3 text-sm text-on-surface-variant">
          <div className="flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 text-xs font-bold">1</span>
            <p>User purchases a Drive Pack from the offer catalog</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 text-xs font-bold">2</span>
            <p>Buyer receives <strong className="text-on-surface">{buyerCommissionRate}%</strong> cashback credited to their wallet</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 text-xs font-bold">3</span>
            <p>Upline referral chain (up to 10 levels) receives commission based on the tier matching the pack amount</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 text-xs font-bold">4</span>
            <p>All commissions are credited instantly to respective wallets</p>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {saving ? (
            <span className="material-symbols-outlined animate-spin">progress_activity</span>
          ) : (
            <span className="material-symbols-outlined">save</span>
          )}
          {saving ? 'Saving...' : 'Save Configuration'}
        </button>
      </div>
    </div>
  );
}
