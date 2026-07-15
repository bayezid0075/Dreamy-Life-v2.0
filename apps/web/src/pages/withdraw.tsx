import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import AuthGuard from '@/shared/components/AuthGuard';
import { useI18n } from '../i18n';

const METHOD_ICONS: Record<string, string> = {
  bkash: 'bKash',
  nagad: 'Nagad',
  rocket: 'Rocket',
};

const METHOD_COLORS: Record<string, { gradient: string; shadow: string }> = {
  bkash: { gradient: 'linear-gradient(135deg, #e2136e, #f04d8b)', shadow: 'rgba(226, 19, 110, 0.4)' },
  nagad: { gradient: 'linear-gradient(135deg, #f58220, #f9a825)', shadow: 'rgba(245, 130, 32, 0.4)' },
  rocket: { gradient: 'linear-gradient(135deg, #ec1c24, #ff6b6b)', shadow: 'rgba(236, 28, 36, 0.4)' },
};

const METHOD_LOGOS: Record<string, string> = {
  bkash: '/bkash.png',
  nagad: '/nagad.png',
  rocket: '/rocket.png',
};

export default function WithdrawPage() {
  const router = useRouter();
  const { accessToken, logout } = useAuthStore();
  const [amount, setAmount] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [method, setMethod] = useState('bkash');
  const [loading, setLoading] = useState(false);
  const [balance, setBalance] = useState<number>(0);
  const [balanceLoading, setBalanceLoading] = useState(true);
  const [config, setConfig] = useState<{ minimumBalance: number; chargePercent: number; isActive: boolean } | null>(null);
  const [configLoading, setConfigLoading] = useState(true);

  const [modalVisible, setModalVisible] = useState(false);
  const [modalSuccess, setModalSuccess] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [modalAmount, setModalAmount] = useState(0);
  const [modalMethod, setModalMethod] = useState('');
  const [modalPhone, setModalPhone] = useState('');
  const { t } = useI18n();

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

  useEffect(() => {
    if (accessToken) {
      fetchBalance();
      fetchConfig();
    }
  }, [accessToken]);

  const fetchBalance = async () => {
    setBalanceLoading(true);
    try {
      const res = await fetch(`${apiUrl}/wallet`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setBalance(data.data?.wallet?.fundsBalance || 0);
      } else if (res.status === 401) { logout(); router.push('/auth/login'); }
    } catch { }
    setBalanceLoading(false);
  };

  const fetchConfig = async () => {
    setConfigLoading(true);
    try {
      const res = await fetch(`${apiUrl}/withdraw/config`);
      if (res.ok) {
        const data = await res.json();
        setConfig(data);
      }
    } catch { }
    setConfigLoading(false);
  };

  const chargePercent = config?.chargePercent || 0;
  const numAmount = parseFloat(amount) || 0;
  const chargeAmount = (numAmount * chargePercent) / 100;
  const totalDeducted = numAmount + chargeAmount;

  const handleSubmit = async () => {
    if (!amount || parseFloat(amount) <= 0) return;
    if (!phoneNumber || phoneNumber.length < 11) return;
    if (!method) return;
    if (config && !config.isActive) return;
    if (config && numAmount < config.minimumBalance) return;
    if (totalDeducted > balance) return;

    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/withdraw/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ amount: numAmount, method, phoneNumber }),
      });
      const data = await res.json();
      if (res.ok) {
        setModalSuccess(true);
        setModalMessage(t('yourWithdrawalRequestSubmitted'));
        setModalAmount(totalDeducted);
        setModalMethod(METHOD_ICONS[method] || method);
        setModalPhone(phoneNumber);
        setAmount('');
        setPhoneNumber('');
        fetchBalance();
      } else {
        setModalSuccess(false);
        setModalMessage(data.message || t('failedToSubmitWithdrawal'));
        setModalAmount(0);
        setModalMethod('');
        setModalPhone('');
      }
    } catch {
      setModalSuccess(false);
      setModalMessage(t('networkErrorCheckConnection'));
      setModalAmount(0);
      setModalMethod('');
      setModalPhone('');
    }
    setModalVisible(true);
    setLoading(false);
  };

  const quickAmounts = [100, 200, 500, 1000, 2000, 5000];

  const formatAmount = (val: number) => new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val);

  return (
    <AuthGuard>
      <Head>
        <title>{t('withdrawTitle')}</title>
        <style>{`
          .popup-overlay {
            position: fixed; inset: 0; z-index: 9999;
            display: flex; align-items: center; justify-content: center;
            background: rgba(0,0,0,0.5); backdrop-filter: blur(8px);
            animation: fadeInOverlay 0.3s ease;
          }
          @keyframes fadeInOverlay { from { opacity: 0; } to { opacity: 1; } }
          .popup-card {
            background: white; border-radius: 24px; padding: 40px 32px 32px;
            width: 90%; max-width: 400px; text-align: center;
            box-shadow: 0 25px 60px rgba(0,0,0,0.25);
            animation: popIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            position: relative;
          }
          @keyframes popIn { from { transform: scale(0.6) translateY(30px); opacity: 0; } to { transform: scale(1) translateY(0); opacity: 1; } }
          .popup-close { position: absolute; top: 12px; right: 16px; background: none; border: none; font-size: 24px; color: #999; cursor: pointer; }
          .popup-icon { width: 72px; height: 72px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; font-size: 36px; }
          .popup-icon.success { background: #e8fdf5; animation: bounceIn 0.6s ease 0.2s both; }
          .popup-icon.error { background: #ffeaeb; animation: shake 0.5s ease 0.2s both; }
          @keyframes bounceIn { 0% { transform: scale(0); } 50% { transform: scale(1.2); } 100% { transform: scale(1); } }
          @keyframes shake { 0%,100% { transform: translateX(0); } 20%,60% { transform: translateX(-6px); } 40%,80% { transform: translateX(6px); } }
          .popup-title { font-size: 20px; font-weight: 700; margin-bottom: 8px; }
          .popup-message { font-size: 14px; color: #666; margin-bottom: 20px; line-height: 1.5; }
          .popup-details { background: #f8f9fa; border-radius: 12px; padding: 16px; margin-bottom: 24px; text-align: left; }
          .popup-details .row { display: flex; justify-content: space-between; align-items: center; padding: 6px 0; }
          .popup-details .label { color: #888; font-size: 13px; }
          .popup-details .value { font-weight: 600; font-size: 14px; color: #1a1a2e; }
          .popup-btn { width: 100%; padding: 14px; border-radius: 12px; border: none; font-size: 15px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
          .popup-btn.success { background: linear-gradient(135deg, #0d9488, #2dd4bf); color: white; }
          .popup-btn.error { background: linear-gradient(135deg, #ef4444, #f87171); color: white; }
          .popup-btn:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
        `}</style>
      </Head>

      <div className="min-h-screen" style={{ background: '#f8f8ff' }}>
        {/* Mobile Header */}
        <header className="md:hidden sticky top-0 z-40 border-b px-4 py-3 flex items-center gap-3" style={{ background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(20px)', borderColor: '#e5e5ea' }}>
          <Link href="/wallet/history" className="p-2 -ml-2 rounded-xl hover:bg-black/5 transition-colors">
            <span className="material-symbols-outlined text-[#1a1a2e]" style={{ fontSize: 22 }}>arrow_back_ios_new</span>
          </Link>
          <h1 className="text-[17px] font-semibold text-[#1a1a2e]">{t('withdrawFunds')}</h1>
        </header>

        {/* Desktop Header */}
        <header className="hidden md:block sticky top-0 z-40 border-b px-6 py-4" style={{ background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(20px)', borderColor: '#e5e5ea' }}>
          <div className="max-w-[1280px] mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/wallet/history" className="p-2 -ml-2 rounded-xl hover:bg-black/5 transition-colors">
                <span className="material-symbols-outlined text-[#1a1a2e]" style={{ fontSize: 22 }}>arrow_back_ios_new</span>
              </Link>
              <h1 className="text-xl font-semibold text-[#1a1a2e]">{t('withdrawFunds')}</h1>
            </div>
          </div>
        </header>

        <main className="max-w-[640px] mx-auto px-4 md:px-6 py-4 md:py-6">
          {/* Balance Card */}
          <div className="rounded-2xl p-5 mb-5" style={{ background: 'linear-gradient(135deg, #1a1a2e, #2d2d4e)', boxShadow: '0 8px 32px rgba(26,26,46,0.2)' }}>
            <div className="mb-3">
              <span className="text-white/60 text-xs font-medium uppercase tracking-wider">{t('availableBalance')}</span>
            </div>
            {balanceLoading ? (
              <div className="h-8 w-32 bg-white/10 rounded-lg animate-pulse" />
            ) : (
              <span className="text-white text-3xl font-bold">৳ {formatAmount(balance)}</span>
            )}
          </div>

          {/* Form Card */}
          <div className="rounded-2xl p-5 mb-5" style={{ background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            <h2 className="text-[15px] font-semibold text-[#1a1a2e] mb-4">{t('withdrawalDetails')}</h2>

            {/* Amount */}
            <div className="mb-4">
              <label className="text-xs text-[#888] font-medium mb-1.5 block">{t('amountBdt')}</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder={t('enterAmount')}
                className="w-full px-4 py-3 rounded-xl border text-[15px] font-medium focus:outline-none focus:ring-2 focus:ring-[#2d666d] transition-all"
                style={{ borderColor: '#e5e5ea' }}
                min="0"
              />
              {config && (
                <p className="text-xs text-[#888] mt-1">{t('minimum')} ৳{formatAmount(config.minimumBalance)}</p>
              )}
              {/* Quick amounts */}
              <div className="flex gap-2 mt-2 flex-wrap">
                {quickAmounts.map((qa) => (
                  <button
                    key={qa}
                    onClick={() => setAmount(String(qa))}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium border transition-all"
                    style={{
                      borderColor: amount === String(qa) ? '#2d666d' : '#e5e5ea',
                      background: amount === String(qa) ? '#e9fdff' : 'transparent',
                      color: amount === String(qa) ? '#2d666d' : '#888',
                    }}
                  >
                    ৳{qa}
                  </button>
                ))}
              </div>
            </div>

            {/* Phone Number */}
            <div className="mb-4">
              <label className="text-xs text-[#888] font-medium mb-1.5 block">{t('withdrawToPhoneNumber')}</label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="01XXXXXXXXX"
                className="w-full px-4 py-3 rounded-xl border text-[15px] font-medium focus:outline-none focus:ring-2 focus:ring-[#2d666d] transition-all"
                style={{ borderColor: '#e5e5ea' }}
                maxLength={11}
              />
            </div>

            {/* Method */}
            <div className="mb-5">
              <label className="text-xs text-[#888] font-medium mb-2 block">{t('paymentMethod')}</label>
              <div className="grid grid-cols-3 gap-3">
                {(['bkash', 'nagad', 'rocket'] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setMethod(m)}
                    className="relative rounded-xl p-3 border-2 transition-all flex flex-col items-center gap-2"
                    style={{
                      borderColor: method === m ? METHOD_COLORS[m].gradient.includes('#e2136e') ? '#e2136e' : METHOD_COLORS[m].gradient.includes('#f58220') ? '#f58220' : '#ec1c24' : '#e5e5ea',
                      background: method === m ? 'white' : '#fafafa',
                      boxShadow: method === m ? `0 4px 16px ${METHOD_COLORS[m].shadow}` : 'none',
                    }}
                  >
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
                      style={{ background: METHOD_COLORS[m].gradient }}
                    >
                      {m === 'bkash' ? 'bK' : m === 'nagad' ? 'Ng' : 'Rk'}
                    </div>
                    <span className="text-xs font-semibold capitalize" style={{ color: method === m ? '#1a1a2e' : '#888' }}>{t(m)}</span>
                    {method === m && (
                      <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: METHOD_COLORS[m].gradient }}>
                        <span className="material-symbols-outlined text-white" style={{ fontSize: 12 }}>check</span>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Summary */}
            {numAmount > 0 && (
              <div className="rounded-xl p-4 mb-5" style={{ background: '#f8f9fa' }}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-[#888]">{t('withdrawalAmount')}</span>
                  <span className="text-sm font-semibold">৳ {formatAmount(numAmount)}</span>
                </div>
                {chargePercent > 0 && (
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-[#888]">{t('charge')} ({chargePercent}%)</span>
                    <span className="text-sm font-semibold text-[#ef4444]">+ ৳{formatAmount(chargeAmount)}</span>
                  </div>
                )}
                <div className="border-t border-[#e5e5ea] mt-2 pt-2 flex justify-between items-center">
                  <span className="text-xs font-semibold text-[#1a1a2e]">{t('totalDeducted')}</span>
                  <span className="text-base font-bold text-[#1a1a2e]">৳ {formatAmount(totalDeducted)}</span>
                </div>
              </div>
            )}

            {/* Error */}
            {config && !config.isActive && (
              <div className="rounded-xl p-3 mb-4 text-sm" style={{ background: '#ffeaeb', color: '#ba1a1a' }}>
                {t('withdrawalServiceDisabled')}
              </div>
            )}
            {config && numAmount > 0 && numAmount < config.minimumBalance && (
              <div className="rounded-xl p-3 mb-4 text-sm" style={{ background: '#ffeaeb', color: '#ba1a1a' }}>
                {t('minimumWithdrawalAmount')} ৳{formatAmount(config.minimumBalance)}
              </div>
            )}
            {numAmount > 0 && totalDeducted > balance && (
              <div className="rounded-xl p-3 mb-4 text-sm" style={{ background: '#ffeaeb', color: '#ba1a1a' }}>
                {t('insufficientBalance')} ৳{formatAmount(totalDeducted)}
              </div>
            )}

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={loading || !amount || !phoneNumber || phoneNumber.length < 11 || !method || (config !== null && !config.isActive) || (config !== null && numAmount < config.minimumBalance) || totalDeducted > balance || numAmount <= 0}
              className="w-full py-3.5 rounded-xl text-white font-semibold text-[15px] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: 'linear-gradient(135deg, #2d666d, #0d9488)' }}
            >
              {loading ? t('processing') : t('submitWithdrawal')}
            </button>
          </div>

          {/* Info Section */}
          <div className="rounded-2xl p-5" style={{ background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            <h3 className="text-[15px] font-semibold text-[#1a1a2e] mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-[#2d666d]" style={{ fontSize: 20 }}>info</span>
               {t('withdrawalInformation')}
            </h3>
            <div className="space-y-3 text-sm text-[#666] leading-relaxed">
              <div className="flex gap-2">
                <span className="text-[#2d666d] mt-0.5"><span className="material-symbols-outlined" style={{ fontSize: 16 }}>check_circle</span></span>
                <span>{t('withdrawalsProcessedWithin')}</span>
              </div>
              <div className="flex gap-2">
                <span className="text-[#2d666d] mt-0.5"><span className="material-symbols-outlined" style={{ fontSize: 16 }}>check_circle</span></span>
                <span>{t('makeSurePhoneNumberCorrect')}</span>
              </div>
              <div className="flex gap-2">
                <span className="text-[#2d666d] mt-0.5"><span className="material-symbols-outlined" style={{ fontSize: 16 }}>check_circle</span></span>
                <span>{t('serviceChargeApplies').replace('{percent}', String(chargePercent))}</span>
              </div>
              <div className="flex gap-2">
                <span className="text-[#2d666d] mt-0.5"><span className="material-symbols-outlined" style={{ fontSize: 16 }}>check_circle</span></span>
                <span>{t('minimumWithdrawalAmount')} <strong className="text-[#1a1a2e]">৳{config ? formatAmount(config.minimumBalance) : '100'}</strong>.</span>
              </div>
              <div className="flex gap-2">
                <span className="text-[#2d666d] mt-0.5"><span className="material-symbols-outlined" style={{ fontSize: 16 }}>check_circle</span></span>
                <span>{t('rejectedWithdrawalsRefunded')}</span>
              </div>
            </div>
          </div>

          {/* History Link */}
          <Link href="/withdraw/history" className="block mt-5">
            <div className="rounded-2xl p-4 flex items-center justify-between transition-all hover:shadow-md" style={{ background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#e9fdff' }}>
                  <span className="material-symbols-outlined text-[#2d666d]" style={{ fontSize: 20 }}>receipt_long</span>
                </div>
                <div>
                  <span className="text-sm font-semibold text-[#1a1a2e] block">{t('withdrawalHistory')}</span>
                   <span className="text-xs text-[#888]">{t('viewPastWithdrawalRequests')}</span>
                </div>
              </div>
              <span className="material-symbols-outlined text-[#ccc]" style={{ fontSize: 20 }}>chevron_right</span>
            </div>
          </Link>
        </main>
      </div>

      {/* Animated Popup Modal */}
      {modalVisible && (
        <div className="popup-overlay" onClick={() => setModalVisible(false)}>
          <div className="popup-card" onClick={(e) => e.stopPropagation()}>
            <button className="popup-close" onClick={() => setModalVisible(false)}>&times;</button>
            <div className={`popup-icon ${modalSuccess ? 'success' : 'error'}`}>
              {modalSuccess ? (
                <span className="material-symbols-outlined" style={{ fontSize: 36, color: '#0d9488' }}>check_circle</span>
              ) : (
                <span className="material-symbols-outlined" style={{ fontSize: 36, color: '#ef4444' }}>cancel</span>
              )}
            </div>
            <h3 className="popup-title" style={{ color: modalSuccess ? '#0d9488' : '#ef4444' }}>
               {modalSuccess ? t('requestSubmitted') : t('requestFailed')}
            </h3>
            <p className="popup-message">{modalMessage}</p>
            {modalSuccess && modalAmount > 0 && (
              <div className="popup-details">
                <div className="row">
                   <span className="label">{t('amount')}</span>
                   <span className="value">৳ {formatAmount(modalAmount)}</span>
                 </div>
                 <div className="row">
                   <span className="label">{t('method')}</span>
                   <span className="value">{modalMethod}</span>
                 </div>
                 <div className="row">
                   <span className="label">{t('phone')}</span>
                   <span className="value">{modalPhone}</span>
                 </div>
                 <div className="row">
                   <span className="label">{t('status')}</span>
                   <span className="value" style={{ color: '#f59e0b' }}>Pending</span>
                 </div>
              </div>
            )}
            <button
              className={`popup-btn ${modalSuccess ? 'success' : 'error'}`}
              onClick={() => setModalVisible(false)}
            >
               {modalSuccess ? t('done') : t('retry')}
            </button>
          </div>
        </div>
      )}
    </AuthGuard>
  );
}
