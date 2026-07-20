import Head from 'next/head';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useNotificationStore } from '@/store/notificationStore';
import { VendorProfile } from '@/features/vendor/api';
import DesktopHeader from '@/shared/components/DesktopHeader';
import SideDrawer from '@/shared/components/SideDrawer';
import AuthGuard from '@/shared/components/AuthGuard';
import { useI18n } from '../i18n';

const telegramGroups = [
  {
    id: 1,
    nameKey: 'officialGroup' as const,
    descKey: 'officialGroupDesc' as const,
    url: 'https://t.me/dreamylife_official',
    icon: 'campaign',
    color: 'from-[#0088cc] to-[#005f8f]',
    members: '50K+',
  },
  {
    id: 2,
    nameKey: 'supportGroup' as const,
    descKey: 'supportGroupDesc' as const,
    url: 'https://t.me/dreamylife_support',
    icon: 'support_agent',
    color: 'from-[#2d666d] to-[#1a3d42]',
    members: '25K+',
  },
  {
    id: 3,
    nameKey: 'dealsGroup' as const,
    descKey: 'dealsGroupDesc' as const,
    url: 'https://t.me/dreamylife_deals',
    icon: 'local_offer',
    color: 'from-[#e8590c] to-[#c2410c]',
    members: '35K+',
  },
  {
    id: 4,
    nameKey: 'communityGroup' as const,
    descKey: 'communityGroupDesc' as const,
    url: 'https://t.me/dreamylife_community',
    icon: 'forum',
    color: 'from-[#7c3aed] to-[#5b21b6]',
    members: '40K+',
  },
];

export default function TelegramGroupsPage() {
  const { t } = useI18n();
  const { accessToken, logout } = useAuthStore();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { unreadCount: unreadNotifCount, setUnreadCount: setUnreadNotifCount } = useNotificationStore();
  const [vendorProfile, setVendorProfile] = useState<VendorProfile | null>(null);

  useEffect(() => {
    if (accessToken) {
      fetchProfile(accessToken);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      fetch(`${apiUrl}/notifications/unread-count`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
        .then((res) => res.json())
        .then((data) => { if (data.count !== undefined) setUnreadNotifCount(data.count); })
        .catch(() => {});
      fetch(`${apiUrl}/vendor/me`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
        .then((res) => res.json())
        .then((data) => { setVendorProfile(data.data || null); })
        .catch(() => { setVendorProfile(null); });
    }
  }, [accessToken]);

  const fetchProfile = async (token: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/auth/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) { await logout(); return; }
      if (res.ok) {
        const data = await res.json();
        setUser(data.data.user);
      }
    } catch (err) {
      console.error('Failed to fetch profile', err);
    } finally {
      setLoading(false);
    }
  };

  const copyReferCode = () => {
    if (user?.ownRefercode) {
      navigator.clipboard.writeText(user.ownRefercode);
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8f8ff] flex items-center justify-center">
        <div className="animate-spin h-10 w-10 border-2 border-[#5d5e64] border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <AuthGuard>
      <Head>
        <title>{t('titleTelegramGroups')}</title>
      </Head>

      <div
        className="min-h-screen text-[#1c1b1b] font-['Plus_Jakarta_Sans'] pb-24"
        style={{
          background: `radial-gradient(circle at 10% 20%, rgba(255, 217, 226, 0.4) 0%, transparent 40%),
                       radial-gradient(circle at 90% 80%, rgba(179, 236, 243, 0.4) 0%, transparent 40%),
                       radial-gradient(circle at 50% 50%, rgba(248, 248, 255, 1) 0%, transparent 100%)`,
          backgroundColor: '#f8f8ff',
        }}
      >
        {/* Desktop Header */}
        <DesktopHeader
          title={t('telegramGroup')}
          onMenuClick={() => setDrawerOpen(true)}
          avatarUrl={user?.info?.avatarUrl || ''}
          unreadNotifCount={unreadNotifCount}
        />

        {/* Side Drawer */}
        <SideDrawer
          isOpen={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          user={user}
          vendorProfile={vendorProfile}
          handleLogout={handleLogout}
          copyReferCode={copyReferCode}
        />

        {/* Mobile Top Bar */}
        <header className="md:hidden flex justify-between items-center px-6 py-5 sticky top-0 z-40 bg-white/60 backdrop-blur-xl border-b border-white/30">
          <Link href="/dashboard" className="w-10 h-10 rounded-full flex items-center justify-center bg-white/50 border border-white/40 shadow-sm text-[#45474b]">
            <span className="material-symbols-outlined">arrow_back</span>
          </Link>
          <h1 className="text-lg font-extrabold tracking-tight text-[#1c1b1b]">{t('telegramGroup')}</h1>
          <div className="w-10"></div>
        </header>

        <main className="max-w-[1280px] mx-auto px-6 pt-20 md:pt-28 space-y-6 relative z-10">
          {/* Hero Section */}
          <section className="text-center space-y-4 mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#0088cc]/10 rounded-full border border-[#0088cc]/20">
              <svg className="w-5 h-5 text-[#0088cc]" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/>
              </svg>
              <span className="text-sm font-bold text-[#0088cc]">{telegramGroups.length} {t('officialGroup')}</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-[#1c1b1b] leading-tight">
              {t('telegramGroupsTitle')}
            </h1>
            <p className="text-[#45474b] text-lg max-w-xl mx-auto leading-relaxed">
              {t('telegramGroupsSubtitle')}
            </p>
          </section>

          {/* Groups Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {telegramGroups.map((group) => (
              <a
                key={group.id}
                href={group.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative overflow-hidden rounded-2xl bg-white/50 backdrop-blur-[20px] border border-white/30 shadow-[0_20px_40px_rgba(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)] transition-all duration-300 hover:scale-[1.02]"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${group.color} opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-300`}></div>
                <div className="relative p-6">
                  <div className="flex items-start gap-4">
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${group.color} flex items-center justify-center shadow-lg flex-shrink-0`}>
                      <span className="material-symbols-outlined text-white text-2xl">{group.icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-black text-[#1c1b1b] tracking-tight">{t(group.nameKey)}</h3>
                        <span className="px-2 py-0.5 bg-[#f8f8ff] text-[#5d5e64] rounded-full text-[10px] font-bold">{group.members}</span>
                      </div>
                      <p className="text-sm text-[#45474b] leading-relaxed mb-4">{t(group.descKey)}</p>
                      <div className="flex items-center gap-2">
                        <div className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r ${group.color} text-white text-sm font-bold shadow-lg group-hover:shadow-xl transition-shadow`}>
                          <span>{t('joinNow')}</span>
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M7 17L17 7M17 7H7M17 7V17"/>
                          </svg>
                        </div>
                        <span className="text-xs text-[#45474b]/40 font-medium">{t('openInTelegram')}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </a>
            ))}
          </div>

          {/* Contact Section */}
          <section className="bg-white/50 backdrop-blur-[20px] rounded-2xl p-6 border border-white/30 shadow-[0_20px_40px_rgba(0,0,0,0.04)]">
            <h3 className="text-xl font-black mb-4 tracking-tight text-[#1c1b1b]">{t('contactUs')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <a href="mailto:support@dreamylife.com" className="flex items-center gap-3 p-4 rounded-xl bg-white/40 hover:bg-white/60 border border-white/30 transition-all">
                <span className="material-symbols-outlined text-[#e8590c]">mail</span>
                <div>
                  <p className="text-sm font-bold text-[#1c1b1b]">{t('emailUs')}</p>
                  <p className="text-xs text-[#45474b]">support@dreamylife.com</p>
                </div>
              </a>
              <a href="https://t.me/dreamylife_support" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-4 rounded-xl bg-white/40 hover:bg-white/60 border border-white/30 transition-all">
                <span className="material-symbols-outlined text-[#0088cc]">send</span>
                <div>
                  <p className="text-sm font-bold text-[#1c1b1b]">{t('supportGroup')}</p>
                  <p className="text-xs text-[#45474b]">@dreamylife_support</p>
                </div>
              </a>
              <a href="https://facebook.com/dreamylife" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-4 rounded-xl bg-white/40 hover:bg-white/60 border border-white/30 transition-all">
                <span className="material-symbols-outlined text-[#1877f2]">public</span>
                <div>
                  <p className="text-sm font-bold text-[#1c1b1b]">{t('followUs')}</p>
                  <p className="text-xs text-[#45474b]">Facebook</p>
                </div>
              </a>
            </div>
          </section>
        </main>
      </div>
    </AuthGuard>
  );
}
