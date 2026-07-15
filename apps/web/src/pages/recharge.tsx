import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import AuthGuard from '@/shared/components/AuthGuard';
import { useI18n } from '../i18n';

interface Operator {
  id: string;
  name: string;
  shortName: string;
  color: string;
  bg: string;
}

const operators: Operator[] = [
  { id: 'gp', name: 'GrameenPhone', shortName: 'GP', color: '#ffffff', bg: '#00a651' },
  { id: 'bl', name: 'Banglalink', shortName: 'BL', color: '#ffffff', bg: '#f7941d' },
  { id: 'rb', name: 'Robi', shortName: 'RB', color: '#ffffff', bg: '#e40000' },
  { id: 'al', name: 'Airtel', shortName: 'AL', color: '#ffffff', bg: '#e4002b' },
  { id: 'tt', name: 'Teletalk', shortName: 'TT', color: '#ffffff', bg: '#0057b8' },
  { id: 'st', name: 'Skitto', shortName: 'ST', color: '#ffffff', bg: '#ff5c26' },
];

const OPERATOR_NAMES: Record<string, string> = {
  gp: 'GrameenPhone',
  bl: 'Banglalink',
  rb: 'Robi',
  al: 'Airtel',
  tt: 'Teletalk',
  st: 'Skitto',
};

const quickAmounts = [20, 50, 100, 500, 1000, 1500, 2000, 2500];

export default function RechargePage() {
  const router = useRouter();
  const { t } = useI18n();
  const { accessToken, logout } = useAuthStore();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedOperator, setSelectedOperator] = useState<string>('');
  const [connectionType, setConnectionType] = useState<'prepaid' | 'postpaid'>('prepaid');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [source, setSource] = useState<string>('recharge');

  const [modalVisible, setModalVisible] = useState(false);
  const [modalSuccess, setModalSuccess] = useState(false);
  const [modalPhoneNumber, setModalPhoneNumber] = useState('');
  const [modalOperator, setModalOperator] = useState('');
  const [modalAmount, setModalAmount] = useState(0);
  const [modalRemainingBalance, setModalRemainingBalance] = useState(0);

  useEffect(() => {
    const { operator, amount: queryAmount, source: querySource } = router.query;
    if (operator && typeof operator === 'string') {
      const normalized = operator.toLowerCase();
      if (operators.some(op => op.id === normalized)) {
        setSelectedOperator(normalized);
      }
    }
    if (queryAmount && typeof queryAmount === 'string') {
      setAmount(queryAmount);
    }
    if (querySource && typeof querySource === 'string') {
      setSource(querySource);
    }
  }, [router.query]);

  const handleRecharge = async () => {
    if (!phoneNumber || phoneNumber.length !== 11) {
      setMessage({ type: 'error', text: t('pleaseEnterValidPhoneNumber') });
      return;
    }
    if (!selectedOperator) {
      setMessage({ type: 'error', text: t('pleaseSelectOperator') });
      return;
    }
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) {
      setMessage({ type: 'error', text: t('pleaseEnterValidAmount') });
      return;
    }
    if (!accessToken) return;

    setLoading(true);
    setMessage(null);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const res = await fetch(`${apiUrl}/recharge/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          phoneNumber,
          operator: selectedOperator,
          connectionType,
          amount: amt,
          source,
        }),
      });
      const data = await res.json();

      if (res.status === 401) {
        await logout();
        router.push('/login');
        return;
      }

      if (res.ok) {
        const orderStatus = data.data?.status;
        const remaining = data.data?.remainingBalance ?? 0;

        setModalPhoneNumber(phoneNumber);
        setModalOperator(selectedOperator);
        setModalAmount(amt);
        setModalRemainingBalance(remaining);
        setModalSuccess(orderStatus === 'success');
        setModalVisible(true);

        if (orderStatus === 'success') {
          setPhoneNumber('');
          setSelectedOperator('');
          setAmount('');
        }
      } else {
        setModalPhoneNumber(phoneNumber);
        setModalOperator(selectedOperator);
        setModalAmount(amt);
        setModalRemainingBalance(0);
        setModalSuccess(false);
        setModalVisible(true);
      }
    } catch (err) {
      setMessage({ type: 'error', text: t('connectionError') });
    } finally {
      setLoading(false);
    }
  };

  const closeModal = () => {
    setModalVisible(false);
  };

  const goToHistory = () => {
    setModalVisible(false);
    router.push('/recharge/history');
  };

  return (
    <AuthGuard>
      <Head>
        <title>{t('rechargeTitle')}</title>
      </Head>
      <style>{`
        body { min-height: max(884px, 100dvh); }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fadeIn 0.3s ease-out; }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .animate-slide-up { animation: slideUp 0.4s ease-out; }
        @keyframes modalFadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes modalSlideUp { from { opacity: 0; transform: scale(0.95) translateY(20px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        .modal-overlay { animation: modalFadeIn 0.2s ease-out; }
        .modal-content { animation: modalSlideUp 0.3s ease-out; }
      `}</style>

      <div
        className="min-h-screen overflow-x-hidden pb-32 selection:bg-[#ffd1dc] selection:text-[#1c1b1b]"
        style={{
          background: `radial-gradient(circle at 10% 20%, rgba(255, 217, 226, 0.4) 0%, transparent 40%),
                       radial-gradient(circle at 90% 80%, rgba(179, 236, 243, 0.4) 0%, transparent 40%),
                       radial-gradient(circle at 50% 50%, rgba(248, 248, 255, 1) 0%, transparent 100%)`,
          backgroundColor: '#f8f8ff',
          color: '#1c1b1b',
          fontFamily: 'Plus Jakarta Sans, sans-serif',
        }}
      >
        {/* Mobile Top Bar */}
        <header className="md:hidden flex justify-between items-center px-6 py-5 sticky top-0 z-40 bg-white/60 backdrop-blur-xl border-b border-white/30">
          <Link href="/dashboard" className="w-10 h-10 rounded-full flex items-center justify-center bg-white/50 border border-white/40 shadow-sm text-[#45474b]">
            <span className="material-symbols-outlined">arrow_back</span>
          </Link>
          <h1 className="text-lg font-extrabold tracking-tight text-[#1c1b1b]">{t('mobileRecharge')}</h1>
          <Link href="/recharge/history" className="w-10 h-10 rounded-full flex items-center justify-center bg-white/50 border border-white/40 shadow-sm text-[#45474b]">
            <span className="material-symbols-outlined">history</span>
          </Link>
        </header>

        {/* Desktop Header */}
        <header className="hidden md:flex fixed top-0 left-0 w-full z-50 bg-white/70 backdrop-blur-[30px] border-b border-white/40 shadow-[0_20px_40px_rgba(0,0,0,0.06)] px-6 py-4 justify-between items-center">
          <Link href="/dashboard" className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/40 transition-colors text-[#45474b]">
            <span className="material-symbols-outlined">arrow_back</span>
          </Link>
          <div className="text-lg font-extrabold tracking-tight text-[#1c1b1b]">{t('mobileRecharge')}</div>
          <Link href="/recharge/history" className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/40 transition-colors text-[#45474b]">
            <span className="material-symbols-outlined">history</span>
          </Link>
        </header>

        <main className="max-w-[480px] mx-auto px-4 md:px-6 pt-20 space-y-6">
          {/* Phone Number Input */}
          <div className="bg-white/50 backdrop-blur-[20px] rounded-2xl p-5 border border-white/30 shadow-[0_20px_40px_rgba(0,0,0,0.04)] animate-fade-in">
            <label className="text-xs font-bold text-[#45474b] uppercase tracking-wider mb-3 block">{t('phoneNumber')}</label>
            <div className="bg-white/40 backdrop-blur-md rounded-full px-5 py-3.5 border border-white/30 flex items-center">
              <span className="text-[#ff5c26] font-bold text-lg mr-3">+880</span>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 11))}
                placeholder="01XXX XXXXXX"
                className="bg-transparent border-none focus:ring-0 flex-1 text-lg font-semibold text-[#1c1b1b] outline-none placeholder:text-[#45474b]/40 tracking-wider"
              />
            </div>
          </div>

          {/* Operator Selection */}
          <div className="bg-white/50 backdrop-blur-[20px] rounded-2xl p-5 border border-white/30 shadow-[0_20px_40px_rgba(0,0,0,0.04)] animate-fade-in" style={{ animationDelay: '0.05s' }}>
            <label className="text-xs font-bold text-[#45474b] uppercase tracking-wider mb-3 block">{t('selectOperator')}</label>
            <div className="grid grid-cols-6 gap-3">
              {operators.map((op) => (
                <button
                  key={op.id}
                  onClick={() => setSelectedOperator(op.id)}
                  className={`relative flex flex-col items-center gap-2 p-3 rounded-2xl transition-all duration-200 ${
                    selectedOperator === op.id
                      ? 'scale-95 ring-2 ring-[#ff5c26] ring-offset-2 ring-offset-transparent'
                      : 'hover:scale-105'
                  }`}
                >
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-extrabold shadow-md transition-all"
                    style={{
                      backgroundColor: op.bg,
                      color: op.color,
                      boxShadow: selectedOperator === op.id ? `0 4px 14px ${op.bg}66` : 'none',
                    }}
                  >
                    {op.shortName}
                  </div>
                  <span className="text-[10px] font-bold text-[#45474b] leading-none">{op.name}</span>
                  {selectedOperator === op.id && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#ff5c26] flex items-center justify-center">
                      <span className="material-symbols-outlined text-white text-[12px]">check</span>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Connection Type Toggle */}
          <div className="bg-white/50 backdrop-blur-[20px] rounded-2xl p-5 border border-white/30 shadow-[0_20px_40px_rgba(0,0,0,0.04)] animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <label className="text-xs font-bold text-[#45474b] uppercase tracking-wider mb-3 block">{t('connectionType')}</label>
            <div className="bg-white/40 backdrop-blur-md rounded-full p-1 flex border border-white/30">
              <button
                onClick={() => setConnectionType('prepaid')}
                className={`flex-1 py-2.5 text-center rounded-full text-sm font-bold transition-all ${
                  connectionType === 'prepaid'
                    ? 'bg-[#ff5c26] text-white shadow-md'
                    : 'text-[#45474b] hover:text-[#1c1b1b]'
                }`}
              >
                {t('prepaid')}
              </button>
              <button
                onClick={() => setConnectionType('postpaid')}
                className={`flex-1 py-2.5 text-center rounded-full text-sm font-bold transition-all ${
                  connectionType === 'postpaid'
                    ? 'bg-[#ff5c26] text-white shadow-md'
                    : 'text-[#45474b] hover:text-[#1c1b1b]'
                }`}
              >
                {t('postpaid')}
              </button>
            </div>
          </div>

          {/* Amount Input */}
          <div className="bg-white/50 backdrop-blur-[20px] rounded-2xl p-5 border border-white/30 shadow-[0_20px_40px_rgba(0,0,0,0.04)] animate-fade-in" style={{ animationDelay: '0.15s' }}>
            <label className="text-xs font-bold text-[#45474b] uppercase tracking-wider mb-3 block">{t('amount')}</label>
            <div className="bg-white/40 backdrop-blur-md rounded-full px-5 py-3.5 border border-white/30 flex items-center">
              <span className="text-[#ff5c26] font-bold text-lg mr-2">৳</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                min="1"
                className="bg-transparent border-none focus:ring-0 flex-1 text-lg font-bold text-[#1c1b1b] outline-none placeholder:text-[#45474b]/40"
              />
            </div>
            <div className="grid grid-cols-4 gap-2 mt-4">
              {quickAmounts.map((amt) => (
                <button
                  key={amt}
                  onClick={() => setAmount(String(amt))}
                  className={`py-2 rounded-full text-sm font-bold transition-all ${
                    parseFloat(amount) === amt
                      ? 'bg-[#ff5c26] text-white shadow-md'
                      : 'bg-white/40 hover:bg-white/60 border border-white/30 text-[#45474b]'
                  }`}
                >
                  ৳{amt.toLocaleString()}
                </button>
              ))}
            </div>
          </div>

          {/* Message */}
          {message && (
            <div
              className={`rounded-2xl px-5 py-3 text-sm font-semibold animate-slide-up ${
                message.type === 'success'
                  ? 'bg-[#e9fdff] text-[#2d666d] border border-[#2d666d]/20'
                  : 'bg-[#ffdad6] text-[#93000a] border border-[#93000a]/20'
              }`}
            >
              {message.text}
            </div>
          )}

          {/* Confirm Button */}
          <button
            onClick={handleRecharge}
            disabled={loading || !phoneNumber || !selectedOperator || !amount}
            className="w-full py-4 rounded-full bg-[#ff5c26] text-white font-bold text-base hover:bg-[#e8521e] transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_8px_24px_rgba(255,92,38,0.25)] hover:shadow-[0_12px_32px_rgba(255,92,38,0.35)] active:scale-[0.98]"
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                {t('processing')}
              </div>
            ) : (
              t('confirmRecharge')
            )}
          </button>

          {/* History Link */}
          <Link
            href="/recharge/history"
            className="flex items-center justify-center gap-2 py-3 rounded-full bg-white/40 backdrop-blur-md border border-white/30 text-sm font-semibold text-[#45474b] hover:bg-white/60 transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">history</span>
            {t('viewRechargeHistory')}
          </Link>
        </main>

        {/* Result Modal */}
        {modalVisible && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-6 modal-overlay" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="bg-white rounded-3xl p-8 w-full max-w-sm shadow-2xl modal-content">
              {/* Icon */}
              <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5 ${modalSuccess ? 'bg-green-100' : 'bg-red-100'}`}>
                <span className={`text-4xl font-black ${modalSuccess ? 'text-green-600' : 'text-red-600'}`}>
                  {modalSuccess ? '✓' : '✕'}
                </span>
              </div>

              {/* Title */}
              <h2 className={`text-2xl font-extrabold text-center mb-6 ${modalSuccess ? 'text-green-600' : 'text-red-600'}`}>
                {modalSuccess ? t('rechargeSuccessful') : t('rechargeFailed')}
              </h2>

              {/* Details */}
              <div className="bg-gray-50 rounded-2xl p-5 mb-6 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500 font-medium">{t('phoneNumber')}</span>
                  <span className="text-sm font-bold text-gray-900">+880{modalPhoneNumber}</span>
                </div>
                <div className="border-t border-gray-200" />
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500 font-medium">{t('operator')}</span>
                  <span className="text-sm font-bold text-gray-900">{OPERATOR_NAMES[modalOperator] || modalOperator}</span>
                </div>
                <div className="border-t border-gray-200" />
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500 font-medium">{t('amount')}</span>
                  <span className="text-sm font-bold text-gray-900">৳{modalAmount.toFixed(2)}</span>
                </div>
                {modalSuccess && (
                  <>
                    <div className="border-t border-gray-200" />
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500 font-medium">{t('remainingFunds')}</span>
                      <span className="text-base font-extrabold text-teal-600">৳{modalRemainingBalance.toFixed(2)}</span>
                    </div>
                  </>
                )}
              </div>

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={goToHistory}
                  className="flex-1 py-3.5 rounded-full border-2 border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  {t('viewHistory')}
                </button>
                <button
                  onClick={closeModal}
                  className={`flex-1 py-3.5 rounded-full text-sm font-bold text-white transition-colors ${
                    modalSuccess ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {t('done')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AuthGuard>
  );
}
