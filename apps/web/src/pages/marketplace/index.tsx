import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/store/authStore';
import AuthGuard from '@/shared/components/AuthGuard';
import VerificationGuard from '@/shared/components/VerificationGuard';
import { useI18n } from '../../i18n';
import AdSenseBannerAd from '@/shared/components/ads/AdSenseBannerAd';
import { resolveMediaUrl } from '@/shared/utils/resolveMediaUrl';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface Job {
  id: string;
  posterId: string;
  title: string;
  description: string;
  type: 'single' | 'multiple';
  amount: string;
  unitPay: string;
  totalUnits: number;
  filledUnits: number;
  status: string;
  mediaUrls: string[];
  createdAt: string;
  posterUsername: string;
  posterFullName?: string;
  posterAvatarUrl?: string;
}

export default function MarketplacePage() {
  const { t } = useI18n();
  const router = useRouter();
  const { accessToken, logout } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'browse' | 'posted' | 'assigned' | 'submissions'>('browse');
  const [allJobs, setAllJobs] = useState<Job[]>([]);
  const [postedJobs, setPostedJobs] = useState<any[]>([]);
  const [mySubmissions, setMySubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    if (!accessToken) return;
    fetchAll();
  }, [accessToken]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const endpoints = [
        fetch(`${API_URL}/marketplace/jobs`, { headers: { Authorization: `Bearer ${accessToken}` } }),
        fetch(`${API_URL}/marketplace/jobs/posted`, { headers: { Authorization: `Bearer ${accessToken}` } }),
        fetch(`${API_URL}/marketplace/jobs/my-submissions`, { headers: { Authorization: `Bearer ${accessToken}` } }),
      ];

      const [jobsRes, postedRes, submissionsRes] = await Promise.all(endpoints);

      if (jobsRes.ok) {
        const data = await jobsRes.json();
        setAllJobs(data.jobs || data || []);
      }
      if (postedRes.ok) {
        const data = await postedRes.json();
        setPostedJobs(data.jobs || []);
      }
      if (submissionsRes.ok) {
        const data = await submissionsRes.json();
        setMySubmissions(data || []);
      }
    } catch (err) {
      console.error('Failed to fetch marketplace data', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredJobs = allJobs.filter((j) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return j.title.toLowerCase().includes(q) || j.description.toLowerCase().includes(q);
  });

  const tabs = [
    { key: 'browse', label: t('browseJobs'), count: allJobs.length },
    { key: 'posted', label: t('myJobs'), count: postedJobs.length },
    { key: 'submissions', label: 'My Submissions', count: mySubmissions.length },
  ];

  return (
    <AuthGuard>
      <VerificationGuard>
      <Head>
        <title>{t('jobMarketplace')}</title>
      </Head>

      {/* Atmospheric Background */}
      <div className="aurora-mesh" />
      <div className="aurora-orb-1" />
      <div className="aurora-orb-2" />

      {/* Mobile Header */}
      <header className="md:hidden fixed top-0 w-full z-50 bg-white/40 backdrop-blur-xl border-b border-white/30 shadow-[0_20px_40px_rgba(0,0,0,0.04)] h-16 flex items-center justify-between px-6">
        <button onClick={() => router.push('/dashboard')} className="text-[#45474b] hover:opacity-80 transition-opacity">
          <span className="material-symbols-outlined">menu</span>
        </button>
        <div className="text-[#1c1b1b] tracking-tighter text-2xl font-extrabold">Dreamy Life</div>
        <button onClick={() => router.push('/notifications')} className="text-[#45474b] hover:opacity-80 transition-opacity relative">
          <span className="material-symbols-outlined">notifications</span>
        </button>
      </header>

      {/* Desktop Navigation */}
      <div className="mb-8 hidden md:flex items-center justify-between glass-card p-4 rounded-full max-w-[1280px] mx-auto mt-6 px-6">
        <Link href="/dashboard" className="font-bold text-2xl tracking-tighter text-[#1c1b1b]">Dreamy Life</Link>
        <div className="flex space-x-8">
          <Link href="/dashboard" className="font-semibold text-sm text-[#45474b] hover:opacity-80 transition-opacity flex flex-col items-center gap-1">
            <span className="material-symbols-outlined">home</span>
            {t('home')}
          </Link>
          <Link href="/marketplace" className="font-semibold text-sm text-[#2d666d] flex flex-col items-center gap-1">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>search</span>
            {t('jobs')}
          </Link>
          <Link href="/cart" className="font-semibold text-sm text-[#45474b] hover:opacity-80 transition-opacity flex flex-col items-center gap-1">
            <span className="material-symbols-outlined">shopping_bag</span>
            {t('bag')}
          </Link>
          <Link href="/profile" className="font-semibold text-sm text-[#45474b] hover:opacity-80 transition-opacity flex flex-col items-center gap-1">
            <span className="material-symbols-outlined">person</span>
            {t('profile')}
          </Link>
        </div>
      </div>

      <main className="max-w-[1280px] mx-auto px-6 pt-24 md:pt-12 pb-20">
        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6 overflow-x-auto hide-scrollbar pb-2">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as typeof activeTab)}
              className={`px-6 py-2 rounded-full font-semibold text-sm transition-all whitespace-nowrap flex items-center gap-2 ${
                activeTab === tab.key
                  ? 'bg-[#1c1b1b] text-white shadow-lg shadow-black/10'
                  : 'glass-card text-[#45474b] hover:opacity-80 transition-opacity'
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className={`text-[11px] px-1.5 py-0.5 rounded-full font-bold ${
                  activeTab === tab.key ? 'bg-white/20' : 'bg-[#e5e2e1]'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Browse Tab */}
        {activeTab === 'browse' && (
          <div>
            {/* Search Bar */}
            <div className="relative w-full md:w-2/3 lg:w-1/2 mx-auto mb-8">
              <span className="material-symbols-outlined absolute left-4 top-1/2 transform -translate-y-1/2 text-[#45474b]">search</span>
              <input
                type="text"
                placeholder={t('searchJobs')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full glass-input rounded-full py-4 pl-12 pr-4 text-base text-[#1c1b1b] placeholder-[#45474b] transition-shadow"
              />
            </div>

            {/* Ad Banner */}
            <div className="my-8">
              <AdSenseBannerAd adSlot="3051399239" format="auto" />
            </div>

            {/* Job Cards Grid */}
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin h-10 w-10 border-2 border-[#5d5e64] border-t-transparent rounded-full" />
              </div>
            ) : filteredJobs.length === 0 ? (
              <div className="glass-card rounded-2xl p-12 text-center">
                <span className="material-symbols-outlined text-5xl text-[#5d5e64] mb-4 block">work</span>
                <p className="text-[#45474b] text-lg font-semibold">{t('noJobsFound')}</p>
                <p className="text-[#45474b]/60 text-sm mt-2">{t('tryDifferentSearch')}</p>
              </div>
            ) : (
              <>
                {/* Mobile Cards - Visual Shop Style */}
                <div className="grid grid-cols-2 gap-3 md:hidden">
                  {filteredJobs.map((job) => {
                    const remainingUnits = job.totalUnits - job.filledUnits;
                    return (
                      <Link key={job.id} href={`/marketplace/jobs/${job.id}`}>
                        <article className="glass-card rounded-2xl overflow-hidden hover:scale-[1.02] transition-transform duration-300 h-full flex flex-col">
                          {/* Image Section */}
                          <div className="relative aspect-square bg-gradient-to-br from-[#e9fdff] to-[#ffd1dc] flex items-center justify-center overflow-hidden">
                            {job.mediaUrls?.[0] ? (
                              <img alt={job.title} className="w-full h-full object-cover" src={resolveMediaUrl(job.mediaUrls[0]) || job.posterAvatarUrl || undefined} />
                            ) : job.posterAvatarUrl ? (
                              <img alt={job.title} className="w-full h-full object-cover" src={job.posterAvatarUrl} />
                            ) : (
                              <span className="material-symbols-outlined text-5xl text-[#2d666d]">work</span>
                            )}
                            {/* Remaining Units Overlay */}
                            {remainingUnits > 0 && (
                              <div className="absolute top-2 right-2 bg-[#1c1b1b]/80 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 rounded-full">
                                {remainingUnits} {t('left')}
                              </div>
                            )}
                          </div>
                          {/* Content Section */}
                          <div className="p-3 flex-1 flex flex-col">
                            <h3 className="font-bold text-sm text-[#1c1b1b] leading-tight line-clamp-2 mb-1">{job.title}</h3>
                            <p className="text-[11px] text-[#45474b] mb-2">@{job.posterUsername}</p>
                            <div className="mt-auto">
                              <div className="text-base font-bold text-[#2d666d]">
                                ৳{Number(job.unitPay).toFixed(0)}
                                <span className="text-[10px] font-normal text-[#45474b] ml-0.5">/ {t('unit')}</span>
                              </div>
                            </div>
                          </div>
                        </article>
                      </Link>
                    );
                  })}
                </div>

                {/* Desktop Cards - Original Layout */}
                <div className="hidden md:grid grid-cols-2 lg:grid-cols-3 gap-8">
                  {filteredJobs.map((job) => (
                    <Link key={job.id} href={`/marketplace/jobs/${job.id}`}>
                      <article className="glass-card rounded-2xl p-6 flex flex-col justify-between hover:scale-[1.02] transition-transform duration-300 h-full">
                        <div>
                          {/* Job Image */}
                          {job.mediaUrls?.[0] && (
                            <div className="w-full h-40 rounded-xl overflow-hidden mb-4 bg-gradient-to-br from-[#e9fdff] to-[#ffd1dc]">
                              <img alt={job.title} className="w-full h-full object-cover" src={resolveMediaUrl(job.mediaUrls[0]) || undefined} />
                            </div>
                          )}
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-full bg-[#e5e2e1] flex items-center justify-center overflow-hidden flex-shrink-0">
                                {job.posterAvatarUrl ? (
                                  <img alt="Company Logo" className="w-full h-full object-cover" src={job.posterAvatarUrl} />
                                ) : (
                                  <span className="material-symbols-outlined text-[#5d5e64]">business</span>
                                )}
                              </div>
                              <div>
                                <h3 className="font-bold text-lg text-[#1c1b1b] leading-tight">{job.title}</h3>
                                <p className="text-sm text-[#45474b]">@{job.posterUsername}</p>
                              </div>
                            </div>
                            <button className="text-[#45474b] hover:text-[#78555e] transition-colors">
                              <span className="material-symbols-outlined">bookmark_border</span>
                            </button>
                          </div>
                          <div className="text-lg font-bold text-[#2d666d] mb-3">
                            ৳{Number(job.unitPay).toFixed(0)}
                            {job.type === 'multiple' && (
                              <span className="text-xs font-normal text-[#45474b] ml-1">/ {job.totalUnits} {t('units')}</span>
                            )}
                          </div>
                          <p className="text-sm text-[#45474b] mb-6 line-clamp-3 leading-relaxed">
                            {job.description}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-auto">
                          <span className="px-3 py-1 rounded-full text-xs font-semibold glass-card text-[#45474b]">
                            {job.filledUnits}/{job.totalUnits} {t('filled')}
                          </span>
                          {job.status === 'active' && (
                            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#e9fdff] text-[#2d666d]">
                              {t('open')}
                            </span>
                          )}
                        </div>
                      </article>
                    </Link>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Posted Jobs Tab */}
        {activeTab === 'posted' && (
          <div className="space-y-4">
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin h-10 w-10 border-2 border-[#5d5e64] border-t-transparent rounded-full" />
              </div>
            ) : postedJobs.length === 0 ? (
              <div className="glass-card rounded-2xl p-12 text-center">
                <span className="material-symbols-outlined text-5xl text-[#5d5e64] mb-4 block">add_circle</span>
                <p className="text-[#45474b] text-lg font-semibold">{t('noJobsPostedYet')}</p>
                <Link href="/marketplace/post" className="mt-6 inline-block px-6 py-3 rounded-full bg-[#2d666d] text-white text-sm font-semibold hover:opacity-90 transition-opacity">
                  {t('postJob')}
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {postedJobs.map((job) => (
                  <Link key={job.id} href={`/marketplace/jobs/${job.id}`}>
                    <div className="glass-card rounded-2xl p-5 flex items-center gap-4 hover:scale-[1.01] transition-transform duration-300">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                            job.status === 'active' ? 'bg-[#e9fdff] text-[#2d666d]' :
                            job.status === 'completed' ? 'bg-[#e9fdff] text-[#2d666d]' :
                            job.status === 'pending_approval' ? 'bg-[#ffd1dc] text-[#78555e]' :
                            'bg-[#e5e2e1] text-[#45474b]'
                          }`}>
                            {job.status?.replace('_', ' ')}
                          </span>
                        </div>
                        <h3 className="text-[15px] font-bold text-[#1c1b1b] truncate">{job.title}</h3>
                        <p className="text-[13px] text-[#45474b] truncate mt-0.5">{job.description}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-[18px] font-bold text-[#1c1b1b]">৳{Number(job.unitPay).toFixed(0)}<span className="text-[11px] font-normal text-[#76777b]">/unit</span></p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
            {!loading && postedJobs.length > 0 && (
              <div className="flex justify-center pt-4">
                <Link href="/marketplace/post" className="px-6 py-3 rounded-full bg-[#2d666d] text-white text-sm font-semibold hover:opacity-90 transition-opacity">
                  {t('postNewJob')}
                </Link>
              </div>
            )}
          </div>
        )}

        {/* My Submissions Tab */}
        {activeTab === 'submissions' && (
          <div className="space-y-4">
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin h-10 w-10 border-2 border-[#5d5e64] border-t-transparent rounded-full" />
              </div>
            ) : mySubmissions.length === 0 ? (
              <div className="glass-card rounded-2xl p-12 text-center">
                <span className="material-symbols-outlined text-5xl text-[#5d5e64] mb-4 block">assignment</span>
                <p className="text-[#45474b] text-lg font-semibold">No submissions yet</p>
                <p className="text-[#45474b]/60 text-sm mt-2">Submit proof on jobs to see them here</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {mySubmissions.map((sub: any) => (
                  <Link key={sub.id} href={`/marketplace/jobs/${sub.jobId}`}>
                    <div className="glass-card rounded-2xl p-5 flex items-center gap-4 hover:scale-[1.01] transition-transform duration-300">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                            sub.status === 'approved' ? 'bg-[#e9fdff] text-[#2d666d]' :
                            sub.status === 'rejected' ? 'bg-[#ffd1dc] text-[#78555e]' :
                            'bg-[#e5e2e1] text-[#45474b]'
                          }`}>
                            {sub.status}
                          </span>
                          <span className="text-[13px] text-[#45474b]">৳{Number(sub.jobUnitPay).toFixed(2)}/unit</span>
                        </div>
                        <h3 className="text-[15px] font-bold text-[#1c1b1b] truncate">{sub.jobTitle}</h3>
                        <p className="text-[13px] text-[#45474b] truncate mt-0.5">@{sub.posterUsername}</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
      </VerificationGuard>
    </AuthGuard>
  );
}
