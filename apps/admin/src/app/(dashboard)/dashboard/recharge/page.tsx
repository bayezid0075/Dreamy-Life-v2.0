'use client';

import { useState, useEffect } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface CommissionTier {
  minAmount: number;
  maxAmount: number;
  rates: number[];
}

interface RechargeConfig {
  id: string;
  apiKey: string;
  apiSecret: string;
  apiBaseUrl: string;
  userCommissionRate: string;
  commissionRates: CommissionTier[] | number[];
  isActive: boolean;
}

const DEFAULT_TIERS: CommissionTier[] = [
  { minAmount: 0, maxAmount: 100, rates: [2, 1, 0.5, 0.3, 0.2, 0.1, 0.1, 0.1, 0.1, 0.1] },
  { minAmount: 101, maxAmount: 500, rates: [1.5, 0.8, 0.4, 0.25, 0.15, 0.1, 0.1, 0.1, 0.1, 0.1] },
  { minAmount: 501, maxAmount: 999999, rates: [1, 0.5, 0.3, 0.2, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1] },
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

export default function RechargeConfigPage() {
  const [config, setConfig] = useState<RechargeConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [balance, setBalance] = useState<any>(null);
  const [balanceLoading, setBalanceLoading] = useState(false);

  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [apiBaseUrl, setApiBaseUrl] = useState('http://118.179.129.98/myportal/api/rechargeapi');
  const [isActive, setIsActive] = useState(false);
  const [userCommissionRate, setUserCommissionRate] = useState('2');
  const [tiers, setTiers] = useState<CommissionTier[]>(DEFAULT_TIERS);

  useEffect(() => {
    fetchConfig();
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
        setConfig(c);
        setApiKey(c.apiKey || '');
        setApiSecret(c.apiSecret || '');
        setApiBaseUrl(c.apiBaseUrl || 'http://118.179.129.98/myportal/api/rechargeapi');
        setIsActive(c.isActive || false);
        setUserCommissionRate(c.userCommissionRate || '2');
        setTiers(normalizeCommissionRates(c.commissionRates));
      }
    } catch (err) {
      console.error('Failed to fetch config', err);
    } finally {
      setLoading(false);
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
          apiKey,
          apiSecret,
          apiBaseUrl,
          isActive,
          userCommissionRate,
          commissionRates: tiers,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage('Configuration saved successfully!');
        setConfig(data.data);
      } else {
        setMessage('Failed to save configuration');
      }
    } catch (err) {
      setMessage('Error saving configuration');
    } finally {
      setSaving(false);
    }
  };

  const checkBalance = async () => {
    setBalanceLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${API_URL}/recharge/admin/balance`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setBalance(data.data);
    } catch (err) {
      console.error('Failed to check balance', err);
    } finally {
      setBalanceLoading(false);
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
      { minAmount: lastMax + 1, maxAmount: lastMax + 500, rates: [1, 0.5, 0.3, 0.2, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1] },
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
        <h1 className="text-2xl font-bold text-on-surface">Mobile Recharge Config</h1>
        <p className="text-on-surface-variant mt-1">ECARE Technology API v2021.11.20.007</p>
      </div>

      {message && (
        <div className={`p-4 rounded-xl ${message.includes('success') ? 'bg-tertiary-container text-tertiary' : 'bg-error-container text-error'}`}>
          {message}
        </div>
      )}

      {/* API Credentials */}
      <div className="glass-panel rounded-xl p-6">
        <h2 className="text-lg font-semibold text-on-surface mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined">key</span>
          API Credentials
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-on-surface-variant mb-1">API Username (access_id)</label>
            <input
              type="text"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-outline-variant bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Enter API username"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-on-surface-variant mb-1">API Password (access_pass)</label>
            <input
              type="password"
              value={apiSecret}
              onChange={(e) => setApiSecret(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-outline-variant bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Enter API password"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-on-surface-variant mb-1">API Base URL</label>
            <input
              type="url"
              value={apiBaseUrl}
              onChange={(e) => setApiBaseUrl(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-outline-variant bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="http://118.179.129.98/myportal/api/rechargeapi"
            />
            <p className="text-xs text-on-surface-variant mt-1">
              Full endpoint: <code className="bg-surface-variant/50 px-1 rounded">{apiBaseUrl}/recharge_api_thirdparty.php</code>
            </p>
          </div>
        </div>
      </div>

      {/* Service Status & Balance */}
      <div className="glass-panel rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined">power_settings_new</span>
            Service Status
          </h2>
          <button
            onClick={checkBalance}
            disabled={balanceLoading}
            className="px-4 py-2 bg-tertiary text-white rounded-lg hover:bg-tertiary/90 transition-colors disabled:opacity-50 flex items-center gap-2 text-sm"
          >
            {balanceLoading ? (
              <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
            ) : (
              <span className="material-symbols-outlined text-[18px]">account_balance_wallet</span>
            )}
            {balanceLoading ? 'Checking...' : 'Check API Balance'}
          </button>
        </div>

        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-on-surface-variant text-sm">Enable or disable mobile recharge for users</p>
          </div>
          <button
            onClick={() => setIsActive(!isActive)}
            className={`relative w-14 h-7 rounded-full transition-colors ${isActive ? 'bg-tertiary' : 'bg-surface-variant'}`}
          >
            <div
              className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform ${isActive ? 'translate-x-7' : 'translate-x-0.5'}`}
            />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-tertiary' : 'bg-error'}`} />
          <span className="text-sm text-on-surface-variant">
            {isActive ? 'Service is active' : 'Service is disabled'}
          </span>
        </div>

        {balance && (
          <div className="mt-4 p-4 rounded-lg bg-surface-variant/30">
            <h3 className="font-semibold text-on-surface mb-2 text-sm">API Provider Balance</h3>
            {balance.error ? (
              <p className="text-error text-sm">{balance.error}</p>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {balance.MAIN_BALANCE && (
                  <div>
                    <span className="text-xs text-on-surface-variant">Main Balance</span>
                    <p className="font-semibold text-on-surface">{balance.MAIN_BALANCE}</p>
                  </div>
                )}
                {balance.STOCK_BALANCE && (
                  <div>
                    <span className="text-xs text-on-surface-variant">Stock Balance</span>
                    <p className="font-semibold text-on-surface">{balance.STOCK_BALANCE}</p>
                  </div>
                )}
                {balance.COMMISSION_TYPE && (
                  <div>
                    <span className="text-xs text-on-surface-variant">Commission Type</span>
                    <p className="font-semibold text-on-surface">{balance.COMMISSION_TYPE}</p>
                  </div>
                )}
                {balance.COMMISSION_RATE && (
                  <div>
                    <span className="text-xs text-on-surface-variant">API Commission Rate</span>
                    <p className="font-semibold text-on-surface">{balance.COMMISSION_RATE}%</p>
                  </div>
                )}
                {balance.STATUS && (
                  <div>
                    <span className="text-xs text-on-surface-variant">Status</span>
                    <p className={`font-semibold ${balance.STATUS === 'OK' ? 'text-tertiary' : 'text-error'}`}>{balance.STATUS}</p>
                  </div>
                )}
                {balance.MESSAGE && (
                  <div>
                    <span className="text-xs text-on-surface-variant">Message</span>
                    <p className="font-semibold text-on-surface">{balance.MESSAGE}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* User Commission Rate */}
      <div className="glass-panel rounded-xl p-6">
        <h2 className="text-lg font-semibold text-on-surface mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined">savings</span>
          User Commission
        </h2>
        <p className="text-on-surface-variant text-sm mb-3">
          Percentage of recharge amount credited back to the user's wallet
        </p>
        <div className="flex items-center gap-2">
          <input
            type="number"
            step="0.1"
            min="0"
            max="100"
            value={userCommissionRate}
            onChange={(e) => setUserCommissionRate(e.target.value)}
            className="w-32 px-4 py-2.5 rounded-lg border border-outline-variant bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <span className="text-on-surface-variant">%</span>
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
          Set commission percentages for each upline referral level. Tiers are matched by recharge amount range.
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

      {/* Operators Reference */}
      <div className="glass-panel rounded-xl p-6">
        <h2 className="text-lg font-semibold text-on-surface mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined">info</span>
          Operator Reference (ECARE API)
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-[#00a651] text-white flex items-center justify-center text-xs font-bold">GP</span>
            <div>
              <p className="font-medium text-on-surface">Grameenphone</p>
              <p className="text-xs text-on-surface-variant">Operator: 3/7</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-[#f7941d] text-white flex items-center justify-center text-xs font-bold">BL</span>
            <div>
              <p className="font-medium text-on-surface">Banglalink</p>
              <p className="text-xs text-on-surface-variant">Operator: 4/9</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-[#e40000] text-white flex items-center justify-center text-xs font-bold">RB</span>
            <div>
              <p className="font-medium text-on-surface">Robi</p>
              <p className="text-xs text-on-surface-variant">Operator: 8</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-[#e4002b] text-white flex items-center justify-center text-xs font-bold">AT</span>
            <div>
              <p className="font-medium text-on-surface">Airtel</p>
              <p className="text-xs text-on-surface-variant">Operator: 6</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-[#0057b8] text-white flex items-center justify-center text-xs font-bold">TT</span>
            <div>
              <p className="font-medium text-on-surface">Teletalk</p>
              <p className="text-xs text-on-surface-variant">Operator: 5</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-[#ff5c26] text-white flex items-center justify-center text-xs font-bold">ST</span>
            <div>
              <p className="font-medium text-on-surface">Skitto</p>
              <p className="text-xs text-on-surface-variant">Type: 3</p>
            </div>
          </div>
        </div>
        <div className="mt-4 p-3 rounded-lg bg-surface-variant/30">
          <p className="text-xs text-on-surface-variant">
            <strong>Number Types:</strong> Prepaid=1, Postpaid=2, Skitto=3, PowerLoad/G.Store/Amar Offer=4
          </p>
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
