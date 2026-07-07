import Head from 'next/head';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useI18n, Locale } from '@/i18n';
import AuthGuard from '@/shared/components/AuthGuard';

export default function SettingsLanguagePage() {
  const router = useRouter();
  const { accessToken } = useAuthStore();
  const { locale, t, setLocale } = useI18n();
  const [selectedLang, setSelectedLang] = useState<Locale>(locale);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  useEffect(() => {
    setSelectedLang(locale);
  }, [locale]);

  const handleSave = async () => {
    setSaving(true);
    try {
      setLocale(selectedLang);
      if (accessToken) {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
        await fetch(`${apiUrl}/auth/profile`, {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ preferredLanguage: selectedLang }),
        });
      }
      setToast({ type: 'success', msg: t('languageSaved') });
      setTimeout(() => setToast(null), 3000);
    } finally {
      setSaving(false);
    }
  };

  const languages: { code: Locale; label: string; sub: string; flag: string }[] = [
    { code: 'en', label: t('english'), sub: t('englishSub'), flag: 'EN' },
    { code: 'bn', label: t('bengali'), sub: t('bengaliSub'), flag: 'BN' },
  ];

  return (
    <AuthGuard>
      <Head>
        <title>Dreamy Life - {t('languageSelection')}</title>
      </Head>
      <style>{`
        body { background-color: #F8F8FF; position: relative; overflow-x: hidden; min-height: max(884px, 100dvh); }
        .aurora-bg { background: radial-gradient(circle at 10% 20%, rgba(255, 209, 220, 0.6) 0%, transparent 40%), radial-gradient(circle at 90% 80%, rgba(179, 236, 243, 0.6) 0%, transparent 40%), radial-gradient(circle at 50% 50%, rgba(231, 187, 198, 0.5) 0%, transparent 50%), #f8f8ff; background-size: 200% 200%; animation: aurora-shift 15s ease infinite; position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; z-index: -1; pointer-events: none; }
        @keyframes aurora-shift { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
        .glass-panel { background: rgba(255, 255, 255, 0.6); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.3); }
        @keyframes toast-in { 0% { transform: translateY(-20px); opacity: 0; } 100% { transform: translateY(0); opacity: 1; } }
        .toast-anim { animation: toast-in 0.3s ease-out; }
      `}</style>

      <div className="aurora-bg"></div>

      {toast && (
        <div className={`fixed top-6 right-6 z-50 px-6 py-3 rounded-full shadow-lg toast-anim ${toast.type === 'success' ? 'bg-[#2d666d] text-white' : 'bg-[#ba1a1a] text-white'}`}>
          <span className="text-sm font-semibold">{toast.msg}</span>
        </div>
      )}

      <header className="sticky top-0 w-full z-50 bg-white/40 backdrop-blur-xl border-b border-white/30 shadow-[0_20px_40px_rgba(0,0,0,0.04)] flex items-center justify-between px-6 h-16">
        <button onClick={() => router.back()} className="text-[#5d5e64] hover:opacity-80 transition-opacity p-2 -ml-2 rounded-full">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="text-xl font-extrabold tracking-tight text-[#1c1b1b]">{t('settingsTitle')}</h1>
        <div className="w-10"></div>
      </header>

      <main className="w-full max-w-2xl mx-auto px-6 pt-12 pb-32 flex flex-col gap-8">
        <div className="text-center mb-4">
          <h2 className="text-[32px] font-bold text-[#1c1b1b] mb-2">{t('languageSelection')}</h2>
          <p className="text-base text-[#45474b]">{t('languageDescription')}</p>
        </div>

        <div className="flex flex-col gap-4">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => setSelectedLang(lang.code)}
              className={`glass-panel rounded-xl p-6 flex items-center justify-between cursor-pointer transition-colors ${selectedLang === lang.code ? 'bg-white/80' : 'hover:bg-white/70'}`}
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-[#f0eded] flex items-center justify-center text-[#1c1b1b] text-xs font-bold">{lang.flag}</div>
                <div className="text-left">
                  <span className="block text-lg font-bold text-[#1c1b1b]">{lang.label}</span>
                  <span className="block text-sm text-[#45474b]">{lang.sub}</span>
                </div>
              </div>
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${selectedLang === lang.code ? 'border-[#5d5e64] bg-[#5d5e64]' : 'border-[#76777b]'}`}>
                {selectedLang === lang.code && (
                  <span className="material-symbols-outlined text-white text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check</span>
                )}
              </div>
            </button>
          ))}
        </div>

        <div className="mt-8 flex justify-end">
          <button onClick={handleSave} disabled={saving} className="bg-[#1A1A1A] text-white text-sm font-semibold py-4 px-8 rounded-full hover:bg-opacity-90 transition-all shadow-[0_20px_40px_rgba(0,0,0,0.1)] active:scale-95 disabled:opacity-50">
            {saving ? t('loading') : t('save')}
          </button>
        </div>
      </main>
    </AuthGuard>
  );
}
