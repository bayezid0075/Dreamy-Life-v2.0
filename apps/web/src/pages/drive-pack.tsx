import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState, useEffect, useMemo } from 'react';
import { useAuthStore } from '@/store/authStore';
import AuthGuard from '@/shared/components/AuthGuard';

interface OfferPack {
  _operator: string;
  _number_type: string;
  _offer_type: string;
  _minute_pack: string;
  _internet_pack: string;
  _sms_pack: string;
  _callrate_pack: string;
  _validity: string;
  _amount: string;
  _commission_amount: string;
  _status: string;
  _offer_details: string;
}

interface OperatorFilter {
  id: string;
  name: string;
  color: string;
  bg: string;
}

interface CategoryFilter {
  id: string;
  name: string;
}

const KNOWN_OPERATORS: Record<string, { name: string; color: string; bg: string }> = {
  GP: { name: 'Grameenphone', color: '#ffffff', bg: '#00a651' },
  BL: { name: 'Banglalink', color: '#ffffff', bg: '#f7941d' },
  RB: { name: 'Robi', color: '#ffffff', bg: '#e40000' },
  AL: { name: 'Airtel', color: '#ffffff', bg: '#e4002b' },
  TT: { name: 'Teletalk', color: '#ffffff', bg: '#0057b8' },
  ST: { name: 'Skitto', color: '#ffffff', bg: '#ff5c26' },
};

const KNOWN_CATEGORIES: Record<string, string> = {
  MN: 'Minutes',
  IN: 'Internet',
  BD: 'Combo',
  SM: 'SMS',
};

const CATEGORY_COLORS: Record<string, string> = {
  MN: '#00a651',
  IN: '#1565c0',
  BD: '#f7941d',
  SM: '#7b1fa2',
};

const FALLBACK_COLORS = [
  '#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899',
  '#f43f5e', '#ef4444', '#f97316', '#eab308', '#84cc16',
  '#22c55e', '#14b8a6', '#06b6d4', '#0ea5e9', '#3b82f6',
];

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
    hash |= 0;
  }
  return Math.abs(hash);
}

function getOperatorKey(opName: string): string {
  const upper = opName.toUpperCase();
  if (KNOWN_OPERATORS[upper]) return upper;
  return upper.substring(0, 2);
}

function getOperatorInfo(opKey: string, opName?: string): { name: string; color: string; bg: string } {
  if (KNOWN_OPERATORS[opKey]) return KNOWN_OPERATORS[opKey];
  const display = opName || opKey;
  const colorIdx = hashString(display) % FALLBACK_COLORS.length;
  const bg = FALLBACK_COLORS[colorIdx];
  return { name: display, color: '#ffffff', bg };
}

function getCategoryLabel(type: string): string {
  if (KNOWN_CATEGORIES[type]) return KNOWN_CATEGORIES[type];
  return type;
}

function getCategoryColor(type: string): string {
  if (CATEGORY_COLORS[type]) return CATEGORY_COLORS[type];
  const colorIdx = hashString(type) % FALLBACK_COLORS.length;
  return FALLBACK_COLORS[colorIdx];
}

export default function DrivePackPage() {
  const router = useRouter();
  const { accessToken, logout } = useAuthStore();
  const [packs, setPacks] = useState<OfferPack[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOperator, setSelectedOperator] = useState('ALL');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  useEffect(() => {
    if (accessToken) fetchPacks();
  }, [accessToken]);

  const fetchPacks = async () => {
    setLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const res = await fetch(`${apiUrl}/recharge/offer-packs`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.status === 401) { await logout(); router.push('/login'); return; }
      const data = await res.json();
      if (data.success && data.data?.packs) {
        setPacks(data.data.packs);
      }
    } catch (err) {
      console.error('Failed to load packs', err);
    } finally {
      setLoading(false);
    }
  };

  const operators = useMemo<OperatorFilter[]>(() => {
    const seen = new Map<string, string>();
    packs.forEach((pack) => {
      const key = getOperatorKey(pack._operator);
      if (!seen.has(key)) seen.set(key, pack._operator);
    });
    const list: OperatorFilter[] = [{ id: 'ALL', name: 'All Operators', color: '#45474b', bg: '#e5e2e9' }];
    seen.forEach((name, id) => {
      const info = getOperatorInfo(id, name);
      list.push({ id, name: info.name, color: info.color, bg: info.bg });
    });
    return list;
  }, [packs]);

  const categories = useMemo<CategoryFilter[]>(() => {
    const seen = new Set<string>();
    packs.forEach((pack) => {
      if (pack._offer_type) seen.add(pack._offer_type);
    });
    const list: CategoryFilter[] = [{ id: 'ALL', name: 'All Packs' }];
    seen.forEach((id) => {
      list.push({ id, name: getCategoryLabel(id) });
    });
    return list;
  }, [packs]);

  const filteredPacks = useMemo(() => {
    return packs.filter((pack) => {
      if (selectedOperator !== 'ALL') {
        const packOpKey = getOperatorKey(pack._operator);
        if (packOpKey !== selectedOperator) return false;
      }
      if (selectedCategory !== 'ALL') {
        if (pack._offer_type !== selectedCategory) return false;
      }
      return true;
    });
  }, [packs, selectedOperator, selectedCategory]);

  const handleBuyPack = (pack: OfferPack) => {
    const opKey = getOperatorKey(pack._operator);
    router.push({
      pathname: '/recharge',
      query: { operator: opKey, amount: pack._amount, source: 'drive_pack' },
    });
  };

  return (
    <AuthGuard>
      <Head>
        <title>Drive Pack - Dreamy Life</title>
      </Head>
      <style>{`
        body { min-height: max(884px, 100dvh); }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fadeIn 0.3s ease-out; }
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
          <h1 className="text-lg font-extrabold tracking-tight text-[#1c1b1b]">Drive Pack</h1>
          <Link href="/drive-pack/history" className="w-10 h-10 rounded-full flex items-center justify-center bg-white/50 border border-white/40 shadow-sm text-[#45474b]">
            <span className="material-symbols-outlined">history</span>
          </Link>
        </header>

        {/* Desktop Header */}
        <header className="hidden md:flex fixed top-0 left-0 w-full z-50 bg-white/70 backdrop-blur-[30px] border-b border-white/40 shadow-[0_20px_40px_rgba(0,0,0,0.06)] px-6 py-4 justify-between items-center">
          <Link href="/dashboard" className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/40 transition-colors text-[#45474b]">
            <span className="material-symbols-outlined">arrow_back</span>
          </Link>
          <div className="text-lg font-extrabold tracking-tight text-[#1c1b1b]">Drive Pack</div>
          <Link href="/drive-pack/history" className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/40 transition-colors text-[#45474b]">
            <span className="material-symbols-outlined">history</span>
          </Link>
        </header>

        <main className="max-w-[480px] mx-auto px-4 md:px-6 pt-20 space-y-5">
          {/* Operator Filter */}
          {operators.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2 hide-scrollbar">
              {operators.map((op) => {
                const isActive = selectedOperator === op.id;
                return (
                  <button
                    key={op.id}
                    onClick={() => setSelectedOperator(op.id)}
                    className={`flex flex-col items-center gap-2 min-w-[60px] transition-all ${
                      isActive ? 'scale-95' : 'hover:scale-105'
                    }`}
                  >
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center text-sm font-extrabold shadow-md transition-all"
                      style={{
                        backgroundColor: isActive ? op.bg : op.bg + '33',
                        color: op.color,
                        boxShadow: isActive ? `0 4px 14px ${op.bg}66` : 'none',
                      }}
                    >
                      {op.id === 'ALL' ? '🌐' : op.id}
                    </div>
                    <span className={`text-[10px] font-bold ${isActive ? 'text-[#ff5c26]' : 'text-[#45474b]'}`}>
                      {op.id === 'ALL' ? 'All' : op.id}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Category Filter */}
          {categories.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
              {categories.map((cat) => {
                const isActive = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-5 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all ${
                      isActive
                        ? 'bg-[#ff5c26] text-white shadow-md'
                        : 'bg-white/40 border border-white/30 text-[#45474b] hover:bg-white/60'
                    }`}
                  >
                    {cat.name}
                  </button>
                );
              })}
            </div>
          )}

          {/* Pack Count */}
          <p className="text-xs font-semibold text-[#45474b]/60">{filteredPacks.length} packs found</p>

          {/* Pack Cards */}
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin h-8 w-8 border-2 border-[#ff5c26] border-t-transparent rounded-full"></div>
            </div>
          ) : filteredPacks.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-4xl mb-4">📭</p>
              <p className="text-lg font-bold text-[#45474b] mb-2">No Packs Found</p>
              <p className="text-sm text-[#45474b]/50">Try a different operator or category filter.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredPacks.map((pack, index) => {
                const catColor = getCategoryColor(pack._offer_type);
                return (
                  <div
                    key={index}
                    className="bg-white/50 backdrop-blur-[20px] rounded-2xl p-5 border border-white/30 shadow-[0_20px_40px_rgba(0,0,0,0.04)] animate-fade-in"
                    style={{ animationDelay: `${Math.min(index * 0.03, 0.3)}s` }}
                  >
                    {/* Header */}
                    <div className="flex justify-between items-center mb-3">
                      <div className="flex gap-2">
                        <span
                          className="px-2.5 py-1 rounded-lg text-xs font-bold"
                          style={{ backgroundColor: catColor + '15', color: catColor }}
                        >
                          {pack._operator}
                        </span>
                        {pack._offer_type && (
                          <span
                            className="px-2.5 py-1 rounded-lg text-xs font-bold"
                            style={{ backgroundColor: catColor + '15', color: catColor }}
                          >
                            {getCategoryLabel(pack._offer_type)}
                          </span>
                        )}
                      </div>
                      {pack._validity && (
                        <span className="text-xs font-semibold text-[#45474b]/50">{pack._validity}</span>
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex flex-wrap gap-4 mb-2">
                      {pack._minute_pack && pack._minute_pack !== '0' && pack._minute_pack !== '' && (
                        <div className="flex items-center gap-1.5">
                          <span>📞</span>
                          <span className="text-sm font-semibold text-[#1c1b1b]">{pack._minute_pack} Min</span>
                        </div>
                      )}
                      {pack._internet_pack && pack._internet_pack !== '0' && pack._internet_pack !== '' && (
                        <div className="flex items-center gap-1.5">
                          <span>📶</span>
                          <span className="text-sm font-semibold text-[#1c1b1b]">{pack._internet_pack}</span>
                        </div>
                      )}
                      {pack._sms_pack && pack._sms_pack !== '0' && pack._sms_pack !== '' && (
                        <div className="flex items-center gap-1.5">
                          <span>💬</span>
                          <span className="text-sm font-semibold text-[#1c1b1b]">{pack._sms_pack} SMS</span>
                        </div>
                      )}
                    </div>

                    {pack._offer_details && (
                      <p className="text-xs text-[#45474b]/50 mb-3 line-clamp-2">{pack._offer_details}</p>
                    )}

                    {/* Footer */}
                    <div className="flex justify-between items-center pt-3 border-t border-[#45474b]/8">
                      <div>
                        <span className="text-xl font-extrabold text-[#1c1b1b]">৳{pack._amount}</span>
                        {pack._commission_amount && pack._commission_amount !== '0' && (
                          <span className="ml-2 text-xs font-semibold text-[#0d9488]">Earn ৳{pack._commission_amount}</span>
                        )}
                      </div>
                      <button
                        onClick={() => handleBuyPack(pack)}
                        className="px-6 py-2.5 rounded-full bg-[#ff5c26] text-white text-sm font-bold hover:bg-[#e8521e] transition-all shadow-[0_4px_14px_rgba(255,92,38,0.3)] hover:shadow-[0_6px_20px_rgba(255,92,38,0.4)] active:scale-95"
                      >
                        Get Pack
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </AuthGuard>
  );
}
