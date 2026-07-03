import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useNotificationStore } from '@/store/notificationStore';
import { VendorProfile } from '@/features/vendor/api';
import DesktopHeader from '@/shared/components/DesktopHeader';
import SideDrawer from '@/shared/components/SideDrawer';

interface PlanFeature {
  text: string;
  icon: string;
}

interface MembershipPlan {
  id: string;
  name: string;
  price: string;
  description: string | null;
  level: number;
  features: PlanFeature[];
  buttonText: string;
  isPopular: boolean;
  sortOrder: number;
  colorTheme: string;
  isActive: boolean;
  commissionRates: number[];
}

export default function MembershipPage() {
  const router = useRouter();
  const { accessToken, isAuthenticated, clearAuth } = useAuthStore();
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [myMembership, setMyMembership] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const { unreadCount: unreadNotifCount, setUnreadCount: setUnreadNotifCount } = useNotificationStore();
  const [vendorProfile, setVendorProfile] = useState<VendorProfile | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !accessToken) {
      router.replace('/login');
      return;
    }
    fetchData(accessToken);
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    fetch(`${apiUrl}/auth/profile`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then((res) => res.json())
      .then((data) => { if (data.data?.user) setUser(data.data.user); })
      .catch(() => {});
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
  }, [isAuthenticated, accessToken, router]);

  const fetchData = async (token: string) => {
    try {
      const [plansRes, myRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/membership/plans`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/membership/my`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (plansRes.status === 401 || myRes.status === 401) {
        clearAuth();
        router.replace('/login');
        return;
      }

      if (plansRes.ok) {
        const data = await plansRes.json();
        setPlans(data.data || []);
      }
      if (myRes.ok) {
        const data = await myRes.json();
        setMyMembership(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch', err);
      clearAuth();
      router.replace('/login');
    } finally {
      setLoading(false);
    }
  };

  const purchasePlan = async (planId: string) => {
    if (!accessToken) return;
    setPurchasing(planId);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/membership/purchase`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ planId }),
      });
      if (res.status === 401) {
        clearAuth();
        router.replace('/login');
        return;
      }
      const data = await res.json();
      if (res.ok && data.success && data.data?.paymentUrl) {
        window.location.href = data.data.paymentUrl;
      } else {
        alert(data.error?.message || data.message || 'Payment creation failed');
      }
    } catch (err) {
      alert('Connection error');
    } finally {
      setPurchasing(null);
    }
  };

  const handleLogout = () => {
    clearAuth();
    router.replace('/login');
  };

  const copyReferCode = () => {
    if (user?.ownRefercode) {
      navigator.clipboard.writeText(user.ownRefercode);
    }
  };

  const displayPlans = plans
    .filter((p) => p.name !== 'user' && p.isActive)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f8f8ff' }}>
        <div className="animate-spin h-10 w-10 border-2 border-[#5d5e64] border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Dreamy Life - Membership</title>
        <style>{`
          .glass-panel {
            background: rgba(255, 255, 255, 0.6);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.3);
            box-shadow: 0 20px 40px rgba(0,0,0,0.04);
          }
          .animate-fade-up {
            opacity: 0;
            transform: translateY(20px);
            animation: fadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          }
          @keyframes fadeUp {
            to { opacity: 1; transform: translateY(0); }
          }
          .delay-100 { animation-delay: 100ms; }
          .delay-200 { animation-delay: 200ms; }
          .delay-300 { animation-delay: 300ms; }
          .tier-card {
            transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.3s ease;
          }
          .tier-card:hover {
            transform: translateY(-8px);
            box-shadow: 0 30px 60px rgba(0,0,0,0.08);
          }
          .gradient-text {
            background-clip: text;
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
          }
        `}</style>
      </Head>

      <div
        className="min-h-screen text-[#1c1b1b] font-['Plus_Jakarta_Sans']"
        style={{
          background: `radial-gradient(circle at 15% 50%, rgba(179, 236, 243, 0.4) 0%, transparent 50%),
                       radial-gradient(circle at 85% 30%, rgba(255, 217, 226, 0.4) 0%, transparent 50%)`,
          backgroundColor: '#f8f8ff',
          backgroundAttachment: 'fixed',
        }}
      >
        {/* Desktop Header */}
        <DesktopHeader
          title="Membership"
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
        <header className="md:hidden flex justify-between items-center px-6 py-5 sticky top-0 z-40 bg-white/40 backdrop-blur-xl shadow-[0_20px_40px_rgba(0,0,0,0.04)]">
          <Link href="/dashboard" className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-black/5 transition-colors">
            <span className="material-symbols-outlined text-[#1c1b1b]">arrow_back</span>
          </Link>
          <h1 className="text-lg font-extrabold tracking-tight text-[#1c1b1b]">Membership</h1>
          <div className="w-10"></div>
        </header>

        <main className="max-w-[1280px] mx-auto px-6 pt-20 md:pt-28 pb-24 relative z-10">
          {/* Header Section */}
          <section className="text-center mb-16 animate-fade-up">
            <h2 className="text-[40px] md:text-[64px] leading-[1.2] md:leading-[1.1] tracking-[-0.02em] font-extrabold mb-4">
              Elevate Your Experience
            </h2>
            <p className="text-[18px] leading-[1.6] text-[#45474b] max-w-2xl mx-auto">
              Join the inner circle and unlock a world of exclusive benefits, early access, and premium support tailored just for you.
            </p>
          </section>

          {/* Current Plan */}
          {myMembership?.currentPlan && (
            <section className="glass-panel rounded-2xl p-6 mb-12 animate-fade-up">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-[#45474b] uppercase tracking-[0.05em] font-semibold">Current Plan</p>
                  <h2 className="text-[24px] leading-[1.4] font-bold capitalize mt-1">{myMembership.currentPlan.name}</h2>
                </div>
                <div className="text-right">
                  <p className="text-sm text-[#45474b]">Commission Earned</p>
                  <p className="text-xl font-bold text-[#2d666d]">৳{myMembership.commissionEarned.toFixed(2)}</p>
                </div>
              </div>
            </section>
          )}

          {/* Membership Cards */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-24">
            {displayPlans.map((plan, index) => {
              const isCurrentPlan = myMembership?.currentPlan?.name === plan.name;
              const isLocked = myMembership?.currentPlan?.level >= plan.level;
              const delayClass = index === 0 ? 'delay-100' : index === 1 ? 'delay-200' : 'delay-300';

              const isTertiary = plan.colorTheme === 'tertiary';
              const isSecondary = plan.colorTheme === 'secondary';

              return (
                <div
                  key={plan.id}
                  className={`tier-card glass-panel rounded-3xl p-8 flex flex-col relative overflow-hidden animate-fade-up ${delayClass} ${
                    plan.isPopular ? 'border-[#b3ecf3] shadow-[0_20px_40px_rgba(45,102,109,0.1)]' : ''
                  } ${isCurrentPlan ? 'ring-2 ring-[#5d5e64]' : ''}`}
                >
                  {/* Decorative elements */}
                  {isSecondary && (
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#ffd1dc] rounded-bl-full opacity-50 blur-2xl"></div>
                  )}
                  {plan.isPopular && (
                    <div className="absolute inset-0 bg-gradient-to-br from-[#e9fdff]/30 to-transparent"></div>
                  )}
                  {isTertiary && !plan.isPopular && (
                    <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-[#c5c6cd] rounded-full opacity-40 blur-3xl"></div>
                  )}

                  {/* Popular Badge */}
                  {plan.isPopular && (
                    <div className="absolute top-0 right-0 bg-[#2d666d] text-white text-[11px] font-bold uppercase tracking-wider py-1 px-4 rounded-bl-lg rounded-tr-3xl z-20">
                      Most Popular
                    </div>
                  )}

                  {/* Current Badge */}
                  {isCurrentPlan && !plan.isPopular && (
                    <div className="absolute top-3 right-3 px-3 py-1 bg-[#5d5e64] text-white text-[10px] rounded-full font-semibold z-20">
                      Current
                    </div>
                  )}

                  {/* Plan Name */}
                  <h3 className={`text-[32px] leading-[1.3] font-bold mb-2 relative z-10 ${
                    isSecondary
                      ? 'bg-gradient-to-r from-[#78555e] to-[#5d5e64] gradient-text'
                      : isTertiary
                        ? 'text-[#2d666d]'
                        : 'text-[#5d5e64]'
                  }`}>
                    {plan.name}
                  </h3>

                  {/* Price */}
                  <div className="flex items-baseline mb-6 relative z-10">
                    <span className="text-[32px] leading-[1.3] font-bold">৳{Number(plan.price).toLocaleString()}</span>
                    <span className="text-base text-[#45474b] ml-1">/mo</span>
                  </div>

                  {/* Features */}
                  {plan.features && plan.features.length > 0 && (
                    <ul className="space-y-4 mb-8 flex-grow relative z-10">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start">
                          <span
                            className={`material-symbols-outlined mr-3 text-[20px] ${
                              isSecondary ? 'text-[#78555e]' : isTertiary ? 'text-[#2d666d]' : 'text-[#5d5e64]'
                            }`}
                            style={{ fontVariationSettings: "'FILL' 1" }}
                          >
                            check_circle
                          </span>
                          <span className="text-base leading-[1.6]">{feature.text}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  {/* Action Button */}
                  {isCurrentPlan ? (
                    <div className="w-full py-4 rounded-full bg-white/60 text-[#5d5e64] font-semibold text-sm text-center border border-white/40 relative z-10">
                      Active
                    </div>
                  ) : (
                    <button
                      onClick={() => purchasePlan(plan.id)}
                      disabled={isLocked || purchasing === plan.id}
                      className={`w-full py-4 rounded-full font-semibold text-sm transition-all relative z-10 disabled:opacity-40 disabled:cursor-not-allowed ${
                        plan.isPopular
                          ? 'bg-[#1c1b1b] text-white hover:bg-[#313030]'
                          : isSecondary
                            ? 'bg-[#78555e] text-white hover:bg-[#63464f]'
                            : isTertiary
                              ? 'bg-[#2d666d] text-white hover:bg-[#1a4248]'
                              : 'bg-[#5d5e64] text-white hover:bg-[#484950]'
                      }`}
                    >
                      {purchasing === plan.id
                        ? 'Processing...'
                        : isLocked
                          ? 'Already Upgraded'
                          : plan.buttonText || 'Choose Plan'}
                    </button>
                  )}

                  {isLocked && !isCurrentPlan && (
                    <p className="text-xs text-center text-[#45474b] mt-2 relative z-10">Already have this or higher</p>
                  )}
                </div>
              );
            })}
          </section>

          {/* Commission History */}
          {myMembership?.commissionHistory?.length > 0 && (
            <section className="glass-panel rounded-3xl p-8 animate-fade-up">
              <h2 className="text-[24px] leading-[1.4] font-bold mb-4">Commission History</h2>
              <div className="space-y-2">
                {myMembership.commissionHistory.map((c: any) => (
                  <div key={c.id} className="flex items-center justify-between bg-white/40 p-3 rounded-xl border border-white/30">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#e9fdff] flex items-center justify-center">
                        <span className="material-symbols-outlined text-sm text-[#2d666d]">payments</span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold">Level {c.level} Commission</p>
                        <p className="text-xs text-[#45474b]">{c.percentage}% earned from a referral purchase</p>
                      </div>
                    </div>
                    <span className="font-bold text-[#2d666d]">+৳{c.amount.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </main>
      </div>

      {/* Success Modal */}
      {showSuccess && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="glass-panel rounded-3xl p-10 max-w-[380px] w-full mx-4 text-center animate-fade-up">
            <div className="w-20 h-20 rounded-full bg-[#2d666d]/10 flex items-center justify-center mx-auto mb-6">
              <span className="text-5xl">🎉</span>
            </div>
            <h3 className="text-[24px] font-bold text-[#1c1b1b] mb-3">Purchase Successful!</h3>
            <p className="text-sm text-[#45474b] leading-relaxed mb-8">
              Your account has been verified successfully. You now have access to all membership benefits.
            </p>
            <button
              onClick={() => { setShowSuccess(false); router.push('/dashboard'); }}
              className="w-full py-4 rounded-full bg-[#1c1b1b] text-white font-semibold text-sm hover:bg-[#313030] transition-all"
            >
              Continue to Dashboard
            </button>
          </div>
        </div>
      )}
    </>
  );
}
