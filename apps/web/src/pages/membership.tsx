import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';

export default function MembershipPage() {
  const router = useRouter();
  const { accessToken, isAuthenticated, clearAuth } = useAuthStore();
  const [plans, setPlans] = useState<any[]>([]);
  const [myMembership, setMyMembership] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !accessToken) {
      router.replace('/login');
      return;
    }
    fetchData(accessToken);
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
      if (res.ok) {
        alert(`Successfully upgraded to ${data.data.newStatus}!`);
        fetchData(accessToken);
      } else {
        alert(data.error?.message || 'Purchase failed');
      }
    } catch (err) {
      alert('Connection error');
    } finally {
      setPurchasing(null);
    }
  };

  const getPlanColor = (name: string) => {
    const colors: Record<string, string> = {
      user: 'bg-[#f8f8ff] border-[#e5e2e1]',
      basic: 'bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200',
      standard: 'bg-gradient-to-br from-[#e9fdff] to-[#f8f8ff] border-[#b3ecf3]',
      smart: 'bg-gradient-to-br from-[#ffd1dc] to-[#ffd9e2] border-[#e7bbc6]',
      vvip: 'bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-200',
    };
    return colors[name] || 'bg-white border-white/30';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8f8ff] flex items-center justify-center">
        <div className="animate-spin h-10 w-10 border-2 border-[#5d5e64] border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Dreamy Life - Membership</title>
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      </Head>

      <div
        className="min-h-screen text-[#1c1b1b] font-['Plus_Jakarta_Sans'] pb-32"
        style={{
          background: `radial-gradient(circle at 10% 20%, rgba(255, 217, 226, 0.4) 0%, transparent 40%),
                       radial-gradient(circle at 90% 80%, rgba(179, 236, 243, 0.4) 0%, transparent 40%),
                       radial-gradient(circle at 50% 50%, rgba(248, 248, 255, 1) 0%, transparent 100%)`,
          backgroundColor: '#f8f8ff',
        }}
      >
        {/* TopAppBar - Desktop */}
        <header className="fixed top-0 left-0 w-full z-50 bg-white/70 backdrop-blur-[30px] border-b border-white/40 shadow-[0_20px_40px_rgba(0,0,0,0.06)] px-6 py-4 hidden md:flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/40 transition-colors text-[#45474b]">
              <span className="material-symbols-outlined">arrow_back</span>
            </Link>
          </div>
          <div className="text-lg font-extrabold tracking-tight text-[#1c1b1b]">
            Membership
          </div>
          <div className="w-10"></div>
        </header>

        {/* Mobile Top Bar */}
        <header className="md:hidden flex justify-between items-center px-6 py-5 sticky top-0 z-40 bg-white/60 backdrop-blur-xl border-b border-white/30">
          <Link href="/dashboard" className="w-10 h-10 rounded-full flex items-center justify-center bg-white/50 border border-white/40 shadow-sm text-[#45474b]">
            <span className="material-symbols-outlined">arrow_back</span>
          </Link>
          <h1 className="text-lg font-extrabold tracking-tight text-[#1c1b1b]">Membership</h1>
          <div className="w-10"></div>
        </header>

        <main className="max-w-[1280px] mx-auto px-6 pt-20 md:pt-28 pb-24 space-y-6 relative z-10">
          {/* Current Plan */}
          {myMembership?.currentPlan && (
            <section className="bg-white/50 backdrop-blur-[20px] rounded-xl p-6 border border-white/30 shadow-[0_20px_40px_rgba(0,0,0,0.04)]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-[#45474b] uppercase tracking-wider font-semibold">Current Plan</p>
                  <h2 className="text-2xl font-bold capitalize mt-1">{myMembership.currentPlan.name}</h2>
                </div>
                <div className="text-right">
                  <p className="text-sm text-[#45474b]">Commission Earned</p>
                  <p className="text-xl font-bold text-[#2d666d]">${myMembership.commissionEarned.toFixed(2)}</p>
                </div>
              </div>
            </section>
          )}

          {/* Plans Grid */}
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {plans.filter((p: any) => p.name !== 'user').map((plan: any) => {
              const isCurrentPlan = myMembership?.currentPlan?.name === plan.name;
              const isLocked = myMembership?.currentPlan?.level >= plan.level;

              return (
                <div
                  key={plan.id}
                  className={`rounded-2xl p-6 border-2 shadow-[0_20px_40px_rgba(0,0,0,0.04)] flex flex-col ${getPlanColor(plan.name)} ${isCurrentPlan ? 'ring-2 ring-[#5d5e64]' : ''}`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold capitalize">{plan.name}</h3>
                    {isCurrentPlan && (
                      <span className="px-2 py-0.5 bg-[#5d5e64] text-white text-[10px] rounded-full font-semibold">Current</span>
                    )}
                  </div>
                  <p className="text-3xl font-bold mb-2">${plan.price}</p>
                  <p className="text-sm text-[#45474b] mb-6 flex-1">{plan.description}</p>
                  {isCurrentPlan ? (
                    <div className="w-full py-3 rounded-full bg-[#f8f8ff] text-[#5d5e64] font-semibold text-sm text-center">
                      Active
                    </div>
                  ) : (
                    <button
                      onClick={() => purchasePlan(plan.id)}
                      disabled={isLocked || purchasing === plan.id}
                      className="w-full py-3 rounded-full bg-[#1c1b1b] text-white font-semibold text-sm hover:bg-[#313030] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {purchasing === plan.id ? 'Processing...' : isLocked ? 'Already Upgraded' : 'Upgrade'}
                    </button>
                  )}
                  {isLocked && !isCurrentPlan && (
                    <p className="text-xs text-center text-[#45474b] mt-2">Already have this or higher</p>
                  )}
                </div>
              );
            })}
          </section>

          {/* Commission History */}
          {myMembership?.commissionHistory?.length > 0 && (
            <section className="bg-white/50 backdrop-blur-[20px] rounded-xl p-6 border border-white/30 shadow-[0_20px_40px_rgba(0,0,0,0.04)]">
              <h2 className="text-lg font-bold mb-4">Commission History</h2>
              <div className="space-y-2">
                {myMembership.commissionHistory.map((c: any) => (
                  <div key={c.id} className="flex items-center justify-between bg-white/40 p-3 rounded-lg border border-white/30">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#e9fdff] flex items-center justify-center">
                        <span className="material-symbols-outlined text-sm text-[#2d666d">payments</span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold">Level {c.level} Commission</p>
                        <p className="text-xs text-[#45474b]">{c.percentage}% · {new Date(c.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <span className="font-bold text-[#2d666d]">+${c.amount.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </main>
      </div>
    </>
  );
}
