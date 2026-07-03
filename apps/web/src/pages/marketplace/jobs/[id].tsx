import Head from 'next/head';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';

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
  adminApproved: boolean;
  mediaUrls: string[];
  posterUsername: string;
  posterFullName?: string;
  bids: any[];
  assignments: any[];
  submissions: any[];
}

export default function JobDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const { accessToken, user } = useAuthStore();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [bidAmount, setBidAmount] = useState('');
  const [bidMessage, setBidMessage] = useState('');
  const [proof, setProof] = useState('');
  const [currentSlide, setCurrentSlide] = useState(0);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  useEffect(() => {
    if (id && accessToken) fetchJob();
  }, [id, accessToken]);

  const fetchJob = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/marketplace/jobs/${id}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setJob(data);
      }
    } catch (err) {
      console.error('Failed to fetch job', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePlaceBid = async () => {
    if (!job || !bidAmount) return;
    setActionLoading('bid');
    try {
      const res = await fetch(`${API_URL}/marketplace/jobs/${job.id}/bids`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ amount: parseFloat(bidAmount), message: bidMessage }),
      });
      if (res.ok) {
        setBidAmount('');
        setBidMessage('');
        fetchJob();
      } else {
        const err = await res.json();
        alert(err.message || 'Failed to place bid');
      }
    } catch (err) {
      alert('Failed to place bid');
    } finally {
      setActionLoading(null);
    }
  };

  const handleAcceptBid = async (bidId: string) => {
    if (!job) return;
    setActionLoading(bidId);
    try {
      const res = await fetch(`${API_URL}/marketplace/jobs/${job.id}/bids/${bidId}/accept`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) fetchJob();
      else {
        const err = await res.json();
        alert(err.message || 'Failed to accept');
      }
    } catch (err) {
      alert('Failed to accept');
    } finally {
      setActionLoading(null);
    }
  };

  const handleSubmitWork = async () => {
    if (!job || !proof.trim()) return;
    setActionLoading('submit');
    try {
      const res = await fetch(`${API_URL}/marketplace/jobs/${job.id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ proof: proof.trim() }),
      });
      if (res.ok) {
        setProof('');
        fetchJob();
      } else {
        const err = await res.json();
        alert(err.message || 'Failed to submit');
      }
    } catch (err) {
      alert('Failed to submit');
    } finally {
      setActionLoading(null);
    }
  };

  const handleApproveSubmission = async (submissionId: string) => {
    if (!job) return;
    setActionLoading(submissionId);
    try {
      const res = await fetch(`${API_URL}/marketplace/jobs/${job.id}/submissions/${submissionId}/approve`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        alert('Work approved! Payment released.');
        fetchJob();
      } else {
        const err = await res.json();
        alert(err.message || 'Failed to approve');
      }
    } catch (err) {
      alert('Failed to approve');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancelJob = async () => {
    if (!job) return;
    if (!confirm('Are you sure? Funds will be refunded.')) return;
    setActionLoading('cancel');
    try {
      const res = await fetch(`${API_URL}/marketplace/jobs/${job.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        alert('Job cancelled. Funds refunded.');
        router.push('/marketplace');
      } else {
        const err = await res.json();
        alert(err.message || 'Failed to cancel');
      }
    } catch (err) {
      alert('Failed to cancel');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-aurora flex items-center justify-center">
        <div className="animate-spin h-10 w-10 border-2 border-[#5d5e64] border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-aurora flex items-center justify-center">
        <p className="text-[#45474b]">Job not found</p>
      </div>
    );
  }

  const isPoster = job.posterId === user?.id;
  const hasPendingBid = job.bids?.some((b) => b.bidderId === user?.id && b.status === 'pending');
  const hasAcceptedBid = job.bids?.some((b) => b.bidderId === user?.id && b.status === 'accepted');
  const myAssignment = job.assignments?.find((a) => a.workerId === user?.id);
  const hasPendingSubmission = job.submissions?.some((s) => s.workerId === user?.id && s.status === 'pending');

  return (
    <>
      <Head>
        <title>{job.title} - Dreamy Life Marketplace</title>
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      </Head>

      <div className="aurora-mesh" />
      <div className="aurora-orb-1" />
      <div className="aurora-orb-2" />

      <header className="fixed top-0 w-full z-50 bg-white/40 backdrop-blur-xl border-b border-white/30 shadow-[0_20px_40px_rgba(0,0,0,0.04)] h-20 flex items-center px-6">
        <div className="flex items-center gap-4 max-w-[1280px] mx-auto w-full">
          <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/40 transition-colors active:scale-95 text-[#5d5e64]">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <h1 className="text-[24px] font-bold text-[#5d5e64] tracking-tight">Job Details</h1>
        </div>
      </header>

      <main className="pt-28 pb-20 px-4 md:px-6 max-w-[600px] mx-auto w-full">
        <div className="glass-card rounded-2xl p-6 border border-white/30 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="px-2.5 py-1 rounded-full bg-[#e9fdff] text-[#2d666d] text-[12px] font-semibold">
              {job.type === 'single' ? 'Single Unit' : 'Multiple Unit'}
            </span>
            <span className={`px-2.5 py-1 rounded-full text-[12px] font-semibold ${
              job.status === 'active' ? 'bg-[#e9fdff] text-[#2d666d]' :
              job.status === 'completed' ? 'bg-[#e9fdff] text-[#2d666d]' :
              'bg-[#e5e2e1] text-[#45474b]'
            }`}>
              {job.status.replace('_', ' ')}
            </span>
          </div>
          <h2 className="text-[20px] font-bold text-[#1c1b1b] mb-2">{job.title}</h2>
          <p className="text-[14px] text-[#45474b] leading-relaxed mb-4">{job.description}</p>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[28px] font-bold text-[#1c1b1b]">৳{Number(job.amount).toFixed(2)}</p>
              <p className="text-[13px] text-[#76777b]">৳{Number(job.unitPay).toFixed(2)}/unit</p>
            </div>
            <p className="text-[13px] text-[#76777b]">by @{job.posterUsername}</p>
          </div>
        </div>

        {/* Job Images Slider */}
        {job.mediaUrls && job.mediaUrls.length > 0 && (
          <div className="mb-6">
            <div className="relative rounded-2xl overflow-hidden bg-white/30 border border-white/30">
              <div className="flex transition-transform duration-300 ease-in-out" style={{ transform: `translateX(-${currentSlide * 100}%)` }}>
                {job.mediaUrls.map((url, i) => (
                  <div key={i} className="min-w-full aspect-video flex items-center justify-center">
                    <img
                      src={url.startsWith('/') ? `${API_URL}${url}` : url}
                      alt={`Job image ${i + 1}`}
                      className="w-full h-full object-cover cursor-pointer"
                      onClick={() => setLightboxImage(url)}
                    />
                  </div>
                ))}
              </div>
              {job.mediaUrls.length > 1 && (
                <>
                  <button
                    onClick={() => setCurrentSlide((prev) => (prev > 0 ? prev - 1 : job.mediaUrls.length - 1))}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/60 transition-colors"
                  >
                    <span className="material-symbols-outlined text-lg">chevron_left</span>
                  </button>
                  <button
                    onClick={() => setCurrentSlide((prev) => (prev < job.mediaUrls.length - 1 ? prev + 1 : 0))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/60 transition-colors"
                  >
                    <span className="material-symbols-outlined text-lg">chevron_right</span>
                  </button>
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {job.mediaUrls.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setCurrentSlide(i)}
                        className={`w-2 h-2 rounded-full transition-all ${i === currentSlide ? 'bg-white w-5' : 'bg-white/50'}`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {job.type === 'single' && (
          <div className="mb-6">
            <h3 className="text-[16px] font-bold text-[#1c1b1b] mb-3">Bids ({job.bids?.length || 0})</h3>
            {!isPoster && !hasPendingBid && !hasAcceptedBid && job.status === 'active' && (
              <div className="glass-card rounded-xl p-4 border border-white/30 mb-3">
                <input
                  type="number"
                  placeholder="Your bid amount (৳)"
                  value={bidAmount}
                  onChange={(e) => setBidAmount(e.target.value)}
                  className="w-full glass-input rounded-lg px-3 py-2 text-[14px] text-[#1c1b1b] placeholder:text-[#45474b]/50 outline-none mb-2"
                />
                <input
                  type="text"
                  placeholder="Message (optional)"
                  value={bidMessage}
                  onChange={(e) => setBidMessage(e.target.value)}
                  className="w-full glass-input rounded-lg px-3 py-2 text-[14px] text-[#1c1b1b] placeholder:text-[#45474b]/50 outline-none mb-2"
                />
                <button
                  onClick={handlePlaceBid}
                  disabled={actionLoading === 'bid'}
                  className="w-full py-2 rounded-lg bg-[#2d666d] text-white text-[13px] font-semibold hover:opacity-90 disabled:opacity-50"
                >
                  {actionLoading === 'bid' ? 'Placing...' : 'Place Bid'}
                </button>
              </div>
            )}
            {job.bids?.map((bid) => (
              <div key={bid.id} className="glass-card rounded-xl p-4 border border-white/30 mb-2">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[14px] font-semibold text-[#1c1b1b]">@{bid.bidderUsername}</span>
                  <span className="text-[16px] font-bold text-[#1c1b1b]">৳{Number(bid.amount).toFixed(2)}</span>
                </div>
                {bid.message && <p className="text-[13px] text-[#45474b] mb-1">{bid.message}</p>}
                <p className="text-[11px] text-[#76777b] capitalize">{bid.status}</p>
                {isPoster && bid.status === 'pending' && (
                  <button
                    onClick={() => handleAcceptBid(bid.id)}
                    disabled={actionLoading === bid.id}
                    className="mt-2 w-full py-2 rounded-lg bg-[#2d666d] text-white text-[13px] font-semibold hover:opacity-90 disabled:opacity-50"
                  >
                    {actionLoading === bid.id ? '...' : 'Accept Bid'}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {job.type === 'multiple' && (
          <div className="mb-6">
            <h3 className="text-[16px] font-bold text-[#1c1b1b] mb-3">Workers ({job.filledUnits}/{job.totalUnits})</h3>
            {job.assignments?.map((a) => (
              <div key={a.id} className="glass-card rounded-xl p-4 border border-white/30 mb-2">
                <div className="flex justify-between items-center">
                  <span className="text-[14px] font-semibold text-[#1c1b1b]">@{a.workerUsername}</span>
                  <span className="text-[13px] text-[#76777b]">{a.units} units - {a.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {job.submissions?.length > 0 && (
          <div className="mb-6">
            <h3 className="text-[16px] font-bold text-[#1c1b1b] mb-3">Submissions</h3>
            {job.submissions.map((s) => (
              <div key={s.id} className="glass-card rounded-xl p-4 border border-white/30 mb-2">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[14px] font-semibold text-[#1c1b1b]">@{s.workerUsername}</span>
                  <span className={`text-[11px] font-semibold capitalize ${
                    s.status === 'approved' ? 'text-[#2d666d]' : 'text-[#76777b]'
                  }`}>{s.status}</span>
                </div>
                <p className="text-[13px] text-[#45474b]">{s.proof}</p>
                {isPoster && s.status === 'pending' && (
                  <button
                    onClick={() => handleApproveSubmission(s.id)}
                    disabled={actionLoading === s.id}
                    className="mt-2 w-full py-2 rounded-lg bg-[#2d666d] text-white text-[13px] font-semibold hover:opacity-90 disabled:opacity-50"
                  >
                    {actionLoading === s.id ? '...' : 'Approve & Pay'}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {(hasAcceptedBid || myAssignment) && job.status === 'in_progress' && !hasPendingSubmission && (
          <div className="mb-6">
            <h3 className="text-[16px] font-bold text-[#1c1b1b] mb-3">Submit Work</h3>
            <div className="glass-card rounded-xl p-4 border border-white/30">
              <textarea
                placeholder="Describe your work completion..."
                value={proof}
                onChange={(e) => setProof(e.target.value)}
                rows={4}
                className="w-full glass-input rounded-lg px-3 py-2 text-[14px] text-[#1c1b1b] placeholder:text-[#45474b]/50 outline-none resize-none mb-2"
              />
              <button
                onClick={handleSubmitWork}
                disabled={actionLoading === 'submit'}
                className="w-full py-2 rounded-lg bg-[#2d666d] text-white text-[13px] font-semibold hover:opacity-90 disabled:opacity-50"
              >
                {actionLoading === 'submit' ? 'Submitting...' : 'Submit Work'}
              </button>
            </div>
          </div>
        )}

        {isPoster && (job.status === 'active' || job.status === 'pending_approval') && (
          <button
            onClick={handleCancelJob}
            disabled={actionLoading === 'cancel'}
            className="w-full py-3 rounded-xl border border-[#ba1a1a] text-[#ba1a1a] text-[14px] font-semibold hover:bg-[#ffdad6]/30 transition-colors disabled:opacity-50"
          >
            {actionLoading === 'cancel' ? 'Cancelling...' : 'Cancel Job'}
          </button>
        )}
      </main>

      {/* Image Lightbox */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md"
          onClick={() => setLightboxImage(null)}
        >
          <img
            src={lightboxImage.startsWith('/') ? `${API_URL}${lightboxImage}` : lightboxImage}
            alt="Full size"
            className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl"
          />
          <button
            onClick={() => setLightboxImage(null)}
            className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
      )}
    </>
  );
}
