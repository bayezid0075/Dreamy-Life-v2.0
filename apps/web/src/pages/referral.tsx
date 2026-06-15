import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';

export default function ReferralPage() {
  const router = useRouter();
  const { accessToken, isAuthenticated, clearAuth } = useAuthStore();
  const [user, setUser] = useState<any>(null);
  const [downline, setDownline] = useState<any[]>([]);
  const [tree, setTree] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [expandedLevels, setExpandedLevels] = useState<Record<number, boolean>>({});

  const toggleLevel = (level: number) => {
    setExpandedLevels(prev => ({ ...prev, [level]: !prev[level] }));
  };

  useEffect(() => {
    if (!isAuthenticated || !accessToken) {
      router.replace('/login');
      return;
    }
    fetchData(accessToken);
  }, [isAuthenticated, accessToken, router]);

  const fetchData = async (token: string) => {
    try {
      const [profileRes, statsRes, downlineRes, treeRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/auth/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/referral/stats`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/referral/downline`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/referral/downline/tree`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (profileRes.status === 401 || statsRes.status === 401) {
        clearAuth();
        router.replace('/login');
        return;
      }

      if (profileRes.ok) {
        const profileData = await profileRes.json();
        setUser(profileData.data.user);
      }
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData.data);
      }
      if (downlineRes.ok) {
        const downlineData = await downlineRes.json();
        setDownline(downlineData.data.members || []);
      }
      if (treeRes.ok) {
        const treeData = await treeRes.json();
        setTree(treeData.data);
      }
    } catch (err) {
      console.error('Failed to fetch data', err);
      clearAuth();
      router.replace('/login');
    } finally {
      setLoading(false);
    }
  };

  const copyReferralLink = () => {
    if (user?.ownRefercode) {
      const link = `${window.location.origin}/register?ref=${user.ownRefercode}`;
      navigator.clipboard.writeText(link);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      super_admin: 'bg-purple-100 text-purple-700',
      vvip: 'bg-yellow-100 text-yellow-700',
      smart: 'bg-blue-100 text-blue-700',
      standard: 'bg-green-100 text-green-700',
      basic: 'bg-gray-100 text-gray-700',
      user: 'bg-[#f8f8ff] text-[#5d5e64]',
    };
    return colors[status] || 'bg-gray-100 text-gray-600';
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
        <title>Dreamy Life - Referrals</title>
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
            Referral
          </div>
          <div className="w-10"></div>
        </header>

        {/* Mobile Top Bar */}
        <header className="md:hidden flex justify-between items-center px-6 py-5 sticky top-0 z-40 bg-white/60 backdrop-blur-xl border-b border-white/30">
          <Link href="/dashboard" className="w-10 h-10 rounded-full flex items-center justify-center bg-white/50 border border-white/40 shadow-sm text-[#45474b]">
            <span className="material-symbols-outlined">arrow_back</span>
          </Link>
          <h1 className="text-lg font-extrabold tracking-tight text-[#1c1b1b]">Referral</h1>
          <div className="w-10"></div>
        </header>

        <main className="max-w-[1280px] mx-auto px-6 pt-20 md:pt-28 pb-24 space-y-6 relative z-10">
          {/* Referral Link Card */}
          <section className="bg-white/50 backdrop-blur-[20px] rounded-xl p-6 border border-white/30 shadow-[0_20px_40px_rgba(0,0,0,0.04)]">
            <h2 className="text-lg font-bold mb-3">Your Referral Link</h2>
            <div className="flex items-center gap-3 bg-white/40 p-3 rounded-xl border border-white/50">
              <span className="material-symbols-outlined text-[#5d5e64]">link</span>
              <input
                readOnly
                value={user ? `${typeof window !== 'undefined' ? window.location.origin : ''}/register?ref=${user.ownRefercode}` : ''}
                className="flex-1 bg-transparent text-sm text-[#45474b] outline-none"
              />
              <button onClick={copyReferralLink} className="px-4 py-2 bg-[#5d5e64] text-white rounded-full text-xs font-semibold hover:bg-[#45474c] transition-colors">
                Copy Link
              </button>
            </div>
          </section>

          {/* Stats Grid */}
          {stats && (
            <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {[
                { label: 'Total', value: stats.totalReferrals, color: 'text-[#5d5e64]' },
                { label: 'Level 1', value: stats.level1Count, color: 'text-[#2d666d]' },
                { label: 'Level 2', value: stats.level2Count, color: 'text-[#78555e]' },
                { label: 'Level 3', value: stats.level3Count, color: 'text-[#5d5e64]' },
                { label: 'Level 4', value: stats.level4Count, color: 'text-[#2d666d]' },
                { label: 'Level 5+', value: stats.level6To10Count, color: 'text-[#78555e]' },
              ].map((stat) => (
                <div key={stat.label} className="bg-white/50 backdrop-blur-[20px] rounded-xl p-4 text-center border border-white/30 shadow-[0_20px_40px_rgba(0,0,0,0.04)]">
                  <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                  <p className="text-xs text-[#45474b] mt-1">{stat.label}</p>
                </div>
              ))}
            </section>
          )}

          {/* Referral Tree Visualization */}
          <section className="bg-white/50 backdrop-blur-[20px] rounded-xl p-6 border border-white/30 shadow-[0_20px_40px_rgba(0,0,0,0.04)]">
            <h2 className="text-lg font-bold mb-4">Downline Tree</h2>
            {tree && tree.tree && tree.tree.length > 0 ? (
              <div className="space-y-2">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((level) => {
                  const levelMembers = downline.filter((m: any) => m.level === level);
                  if (levelMembers.length === 0) return null;
                  const isExpanded = expandedLevels[level] !== false;

                  return (
                    <div key={level} className="border border-white/30 rounded-xl overflow-hidden">
                      <button
                        onClick={() => toggleLevel(level)}
                        className="w-full flex items-center justify-between px-4 py-3 bg-white/30 hover:bg-white/50 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-[#f8f8ff] flex items-center justify-center text-xs font-bold text-[#5d5e64]">
                            {level}
                          </div>
                          <span className="font-semibold text-sm">Level {level}</span>
                          <span className="text-xs text-[#45474b]">({levelMembers.length})</span>
                        </div>
                        <span className="material-symbols-outlined text-sm transition-transform" style={{ transform: isExpanded ? 'rotate(180deg)' : '' }}>
                          expand_more
                        </span>
                      </button>
                      {isExpanded && (
                        <div className="px-4 pb-3 space-y-2">
                          {levelMembers.map((member: any) => (
                            <div key={member.userId} className="flex items-center justify-between bg-white/40 p-3 rounded-lg border border-white/30">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-[#f8f8ff] flex items-center justify-center">
                                  <span className="material-symbols-outlined text-sm text-[#5d5e64]">person</span>
                                </div>
                                <div>
                                  <p className="text-sm font-semibold">{member.username}</p>
                                  <p className="text-xs text-[#45474b]">{member.phoneNumber}</p>
                                </div>
                              </div>
                              <span className={`px-2 py-0.5 text-[10px] rounded-full font-semibold ${getStatusColor(member.memberStatus)}`}>
                                {member.memberStatus}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-10">
                <span className="material-symbols-outlined text-5xl text-[#45474b]/30 mb-3" style={{ fontVariationSettings: "'FILL' 1" }}>group</span>
                <p className="text-[#45474b]">No referrals yet. Share your referral link to start building your team!</p>
              </div>
            )}
          </section>

          {/* Downline Table */}
          {downline.length > 0 && (
            <section className="bg-white/50 backdrop-blur-[20px] rounded-xl p-6 border border-white/30 shadow-[0_20px_40px_rgba(0,0,0,0.04)]">
              <h2 className="text-lg font-bold mb-4">All Downline Members</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/30">
                      <th className="text-left py-3 px-2 text-[#45474b] font-semibold">Username</th>
                      <th className="text-left py-3 px-2 text-[#45474b] font-semibold">Phone</th>
                      <th className="text-left py-3 px-2 text-[#45474b] font-semibold">Level</th>
                      <th className="text-left py-3 px-2 text-[#45474b] font-semibold">Status</th>
                      <th className="text-left py-3 px-2 text-[#45474b] font-semibold">Downline</th>
                    </tr>
                  </thead>
                  <tbody>
                    {downline.map((member: any) => (
                      <tr key={member.userId} className="border-b border-white/10 hover:bg-white/20 transition-colors">
                        <td className="py-3 px-2 font-semibold">{member.username}</td>
                        <td className="py-3 px-2 text-[#45474b]">{member.phoneNumber}</td>
                        <td className="py-3 px-2">
                          <span className="px-2 py-0.5 bg-[#f8f8ff] text-[#5d5e64] rounded-full text-xs font-semibold">
                            L{member.level}
                          </span>
                        </td>
                        <td className="py-3 px-2">
                          <span className={`px-2 py-0.5 text-[10px] rounded-full font-semibold ${getStatusColor(member.memberStatus)}`}>
                            {member.memberStatus}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-[#45474b]">{member.totalDownline}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </main>
      </div>
    </>
  );
}
