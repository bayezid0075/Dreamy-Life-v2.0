import Head from 'next/head';
import { useRouter } from 'next/router';
import { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '@/store/authStore';
import AuthGuard from '@/shared/components/AuthGuard';
import { resolveMediaUrl, isImageUrl, fileNameFromUrl } from '@/shared/utils/resolveMediaUrl';
import { useMarketplaceSocket } from '@/hooks/useMarketplaceSocket';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface Job {
  id: string;
  posterId: string;
  title: string;
  description: string;
  type: string;
  amount: string;
  unitPay: string;
  totalUnits: number;
  filledUnits: number;
  status: string;
  adminApproved: boolean;
  mediaUrls: string[];
  link?: string;
  posterUsername: string;
  posterFullName?: string;
  posterAvatarUrl?: string;
  escrow?: any;
  submissions: any[];
  mySubmissions: any[];
  mySubmissionCount: number;
  maxSubmissions: number;
  platformFeePercent: string;
  createdAt: string;
}

export default function JobDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const { accessToken, user } = useAuthStore();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [proof, setProof] = useState('');
  const [proofFiles, setProofFiles] = useState<File[]>([]);
  const [proofPreviews, setProofPreviews] = useState<string[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [lightbox, setLightbox] = useState<{ images: string[]; index: number } | null>(null);
  const [rejectModal, setRejectModal] = useState<{ open: boolean; submissionId: string | null }>({ open: false, submissionId: null });
  const [rejectComment, setRejectComment] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { subscribeToJob, unsubscribeFromJob } = useMarketplaceSocket(accessToken, {
    onJobUpdated: (data: any) => {
      if (data.job?.id === id) {
        setJob((prev) => prev ? { ...prev, ...data.job } : prev);
      }
    },
    onNewSubmission: (data: any) => {
      if (data.submission?.jobId === id) {
        fetchJob();
      }
    },
    onSubmissionApproved: (data: any) => {
      if (data.submission?.jobId === id) {
        fetchJob();
      }
    },
    onSubmissionRejected: (data: any) => {
      if (data.submission?.jobId === id) {
        fetchJob();
      }
    },
    onJobCancelled: (data: any) => {
      if (data.job?.id === id) {
        fetchJob();
      }
    },
    onJobDeleted: (data: any) => {
      if (data.jobId === id) {
        setJob(null);
      }
    },
  });

  useEffect(() => {
    if (id && accessToken) {
      fetchJob();
      subscribeToJob(id as string);
    }
    return () => {
      if (id) unsubscribeFromJob(id as string);
    };
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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (proofFiles.length + files.length > 10) {
      alert('Maximum 10 files allowed');
      return;
    }
    setProofFiles((prev) => [...prev, ...files]);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setProofPreviews((prev) => [...prev, ev.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeProofFile = (index: number) => {
    setProofFiles((prev) => prev.filter((_, i) => i !== index));
    setProofPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const openLightbox = (urls: string[], url: string) => {
    const images = urls.filter(isImageUrl);
    const index = images.indexOf(url);
    if (index >= 0) setLightbox({ images, index });
  };

  const openFile = (url: string) => {
    const resolved = resolveMediaUrl(url) || url;
    window.open(resolved, '_blank', 'noopener,noreferrer');
  };

  const uploadFiles = async (files: File[]): Promise<string[]> => {
    const urls: string[] = [];
    for (const file of files) {
      const formData = new FormData();
      formData.append('file', file);
      try {
        const res = await fetch(`${API_URL}/media/upload`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${accessToken}` },
          body: formData,
        });
        if (res.ok) {
          const data = await res.json();
          urls.push(data.url);
        }
      } catch (err) {
        console.error('Failed to upload file', err);
      }
    }
    return urls;
  };

  const handleSubmitWork = async () => {
    if (!job || !proof.trim()) return;
    setActionLoading('submit');
    try {
      let proofMediaUrls: string[] = [];
      if (proofFiles.length > 0) {
        proofMediaUrls = await uploadFiles(proofFiles);
      }

      const res = await fetch(`${API_URL}/marketplace/jobs/${job.id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ proof: proof.trim(), proofMediaUrls }),
      });
      if (res.ok) {
        setProof('');
        setProofFiles([]);
        setProofPreviews([]);
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

  const handleRejectSubmission = async () => {
    if (!job || !rejectModal.submissionId) return;
    setActionLoading(rejectModal.submissionId);
    try {
      const res = await fetch(`${API_URL}/marketplace/jobs/${job.id}/submissions/${rejectModal.submissionId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ comment: rejectComment || undefined }),
      });
      if (res.ok) {
        setRejectModal({ open: false, submissionId: null });
        setRejectComment('');
        fetchJob();
      } else {
        const err = await res.json();
        alert(err.message || 'Failed to reject');
      }
    } catch (err) {
      alert('Failed to reject');
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
  const canSubmit = !isPoster && job.status === 'active' && job.adminApproved && job.mySubmissionCount < job.maxSubmissions && !job.mySubmissions?.some((s: any) => s.status === 'pending');
  const hasApprovedSubmission = job.mySubmissions?.some((s: any) => s.status === 'approved');
  const pendingSubmissions = job.submissions?.filter((s: any) => s.status === 'pending') || [];

  return (
    <AuthGuard>
      <Head>
        <title>{job.title} - Dreamy Life Marketplace</title>
      </Head>

      <div className="aurora-mesh" />
      <div className="aurora-orb-1" />
      <div className="aurora-orb-2" />

      <header className="fixed top-0 w-full z-50 bg-white/40 backdrop-blur-xl border-b border-white/30 shadow-[0_20px_40px_rgba(0,0,0,0.04)] h-16 flex items-center px-4">
        <div className="flex items-center gap-3 max-w-[1280px] mx-auto w-full">
          <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/40 transition-colors active:scale-95 text-[#5d5e64]">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <h1 className="text-[18px] font-bold text-[#1c1b1b] tracking-tight truncate">{job.title}</h1>
        </div>
      </header>

      <main className="pt-20 pb-20 px-4 md:px-6 max-w-[600px] mx-auto w-full">
        {/* Job Images */}
        {job.mediaUrls && job.mediaUrls.length > 0 && (
          <div className="mb-4">
            <div className="relative rounded-2xl overflow-hidden bg-white/30 border border-white/30">
              <div className="flex transition-transform duration-300 ease-in-out" style={{ transform: `translateX(-${currentSlide * 100}%)` }}>
                {job.mediaUrls.map((url, i) => (
                  <div key={i} className="min-w-full aspect-video flex items-center justify-center">
                    <img
                      src={resolveMediaUrl(url) || url}
                      alt={`Job image ${i + 1}`}
                      className="w-full h-full object-cover cursor-pointer"
                      onClick={() => openLightbox(job.mediaUrls, url)}
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

        {/* Title */}
        <h2 className="text-[22px] font-bold text-[#1c1b1b] mb-2">{job.title}</h2>

        {/* Description */}
        <p className="text-[14px] text-[#45474b] leading-relaxed mb-4">{job.description}</p>

        {/* Link Button */}
        {job.link && (
          <a
            href={job.link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#e9fdff] text-[#2d666d] text-[13px] font-semibold mb-4 hover:bg-[#d4f5f8] transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">link</span>
            Visit Link
          </a>
        )}

        {/* Unit Price */}
        <div className="glass-card rounded-xl p-4 border border-white/30 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[13px] text-[#76777b]">Per Unit Price</p>
              <p className="text-[24px] font-bold text-[#2d666d]">৳{Number(job.unitPay).toFixed(2)}</p>
            </div>
            <div className="text-right">
              <p className="text-[13px] text-[#76777b]">Total Units</p>
              <p className="text-[18px] font-bold text-[#1c1b1b]">{job.totalUnits}</p>
            </div>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <div className="flex-1 h-2 bg-[#e5e2e1] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#2d666d] rounded-full transition-all"
                style={{ width: `${Math.min((job.filledUnits / job.totalUnits) * 100, 100)}%` }}
              />
            </div>
            <span className="text-[12px] text-[#76777b]">{job.filledUnits}/{job.totalUnits} submitted</span>
          </div>
        </div>

        {/* Submit Proof Section - for workers */}
        {canSubmit && (
          <div className="glass-card rounded-xl p-4 border border-white/30 mb-4">
            <h3 className="text-[15px] font-bold text-[#1c1b1b] mb-3">Submit Proof</h3>
            <textarea
              placeholder="Describe your work completion..."
              value={proof}
              onChange={(e) => setProof(e.target.value)}
              rows={3}
              className="w-full glass-input rounded-lg px-3 py-2 text-[14px] text-[#1c1b1b] placeholder:text-[#45474b]/50 outline-none resize-none mb-3"
            />

            {/* File Upload */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,.pdf,.doc,.docx"
              className="hidden"
              onChange={handleFileSelect}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#e5e2e1] text-[#45474b] text-[12px] font-semibold mb-3 hover:bg-[#d8d5d3] transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">attach_file</span>
              Attach Files ({proofFiles.length}/10)
            </button>

            {/* File Previews */}
            {proofPreviews.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {proofPreviews.map((preview, i) => (
                  <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden border border-white/30">
                    <img src={preview} alt="" className="w-full h-full object-cover" />
                    <button
                      onClick={() => removeProofFile(i)}
                      className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-red-500 text-white flex items-center justify-center text-[10px]"
                    >
                      x
                    </button>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={handleSubmitWork}
              disabled={actionLoading === 'submit' || !proof.trim()}
              className="w-full py-2.5 rounded-xl bg-[#2d666d] text-white text-[13px] font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {actionLoading === 'submit' ? 'Submitting...' : 'Submit Proof'}
            </button>
          </div>
        )}

        {/* My Submissions - for workers */}
        {job.mySubmissions && job.mySubmissions.length > 0 && (
          <div className="mb-4">
            <h3 className="text-[15px] font-bold text-[#1c1b1b] mb-3">My Submissions</h3>
            {job.mySubmissions.map((s: any) => (
              <div key={s.id} className="glass-card rounded-xl p-4 border border-white/30 mb-2">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[12px] text-[#76777b]">{new Date(s.createdAt).toLocaleDateString()}</span>
                  <span className={`text-[11px] font-semibold capitalize px-2 py-0.5 rounded-full ${
                    s.status === 'approved' ? 'bg-[#e9fdff] text-[#2d666d]' :
                    s.status === 'rejected' ? 'bg-[#ffd1dc] text-[#78555e]' :
                    'bg-[#e5e2e1] text-[#45474b]'
                  }`}>{s.status}</span>
                </div>
                <p className="text-[13px] text-[#45474b]">{s.proof}</p>
                {s.proofMediaUrls && s.proofMediaUrls.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {s.proofMediaUrls.map((url: string, i: number) =>
                      isImageUrl(url) ? (
                        <img key={i} src={resolveMediaUrl(url) || url} alt="" onClick={() => openLightbox(s.proofMediaUrls, url)} className="w-12 h-12 rounded-lg object-cover cursor-pointer" />
                      ) : (
                        <button key={i} type="button" onClick={() => openFile(url)} className="inline-flex items-center gap-1.5 max-w-[160px] px-2.5 py-1.5 rounded-lg bg-[#e5e2e1] text-[#45474b] text-[11px] font-semibold hover:bg-[#d8d5d3] transition-colors">
                          <span className="material-symbols-outlined text-[14px]">description</span>
                          <span className="truncate">{fileNameFromUrl(url)}</span>
                        </button>
                      )
                    )}
                  </div>
                )}
                {s.status === 'rejected' && s.posterComment && (
                  <div className="mt-2 p-2 rounded-lg bg-[#ffd1dc]/30 text-[12px] text-[#78555e]">
                    <span className="font-semibold">Feedback:</span> {s.posterComment}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Submission limit info */}
        {!isPoster && job.status === 'active' && (
          <p className="text-[11px] text-[#76777b] mb-4">
            Submissions: {job.mySubmissionCount}/{job.maxSubmissions}
          </p>
        )}

        {/* Pending Submissions - for poster */}
        {isPoster && pendingSubmissions.length > 0 && (
          <div className="mb-4">
            <h3 className="text-[15px] font-bold text-[#1c1b1b] mb-3">Pending Submissions ({pendingSubmissions.length})</h3>
            {pendingSubmissions.map((s: any) => (
              <div key={s.id} className="glass-card rounded-xl p-4 border border-white/30 mb-2">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-[#e5e2e1] flex items-center justify-center overflow-hidden">
                      {s.workerAvatarUrl ? (
                        <img alt="" className="w-full h-full object-cover" src={s.workerAvatarUrl} />
                      ) : (
                        <span className="material-symbols-outlined text-[#5d5e64] text-sm">person</span>
                      )}
                    </div>
                    <span className="text-[13px] font-semibold text-[#1c1b1b]">@{s.workerUsername}</span>
                  </div>
                  <span className="text-[12px] text-[#76777b]">{new Date(s.createdAt).toLocaleDateString()}</span>
                </div>
                <p className="text-[13px] text-[#45474b] mb-2">{s.proof}</p>
                {s.proofMediaUrls && s.proofMediaUrls.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {s.proofMediaUrls.map((url: string, i: number) =>
                      isImageUrl(url) ? (
                        <img key={i} src={resolveMediaUrl(url) || url} alt="" onClick={() => openLightbox(s.proofMediaUrls, url)} className="w-16 h-16 rounded-lg object-cover cursor-pointer" />
                      ) : (
                        <button key={i} type="button" onClick={() => openFile(url)} className="inline-flex items-center gap-1.5 max-w-[200px] px-2.5 py-1.5 rounded-lg bg-[#e5e2e1] text-[#45474b] text-[11px] font-semibold hover:bg-[#d8d5d3] transition-colors">
                          <span className="material-symbols-outlined text-[14px]">description</span>
                          <span className="truncate">{fileNameFromUrl(url)}</span>
                        </button>
                      )
                    )}
                  </div>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleApproveSubmission(s.id)}
                    disabled={actionLoading === s.id}
                    className="flex-1 py-2 rounded-lg bg-[#2d666d] text-white text-[13px] font-semibold hover:opacity-90 disabled:opacity-50"
                  >
                    {actionLoading === s.id ? '...' : `Approve (৳${Number(job.unitPay).toFixed(2)})`}
                  </button>
                  <button
                    onClick={() => setRejectModal({ open: true, submissionId: s.id })}
                    disabled={actionLoading === s.id}
                    className="flex-1 py-2 rounded-lg border border-[#ba1a1a] text-[#ba1a1a] text-[13px] font-semibold hover:bg-[#ffd1dc]/30 disabled:opacity-50"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Cancel Job - for poster */}
        {isPoster && (job.status === 'active' || job.status === 'pending_approval') && (
          <button
            onClick={handleCancelJob}
            disabled={actionLoading === 'cancel'}
            className="w-full py-3 rounded-xl border border-[#ba1a1a] text-[#ba1a1a] text-[14px] font-semibold hover:bg-[#ffd1dc]/30 transition-colors disabled:opacity-50"
          >
            {actionLoading === 'cancel' ? 'Cancelling...' : 'Cancel Job'}
          </button>
        )}
      </main>

      {/* Reject Modal */}
      {rejectModal.open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm" onClick={() => setRejectModal({ open: false, submissionId: null })}>
          <div className="w-full max-w-[600px] bg-white rounded-t-2xl p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-[18px] font-bold text-[#1c1b1b] mb-3">Reject Submission</h3>
            <p className="text-[13px] text-[#76777b] mb-3">Provide feedback to help the worker improve.</p>
            <textarea
              placeholder="Feedback (optional)..."
              value={rejectComment}
              onChange={(e) => setRejectComment(e.target.value)}
              rows={3}
              className="w-full glass-input rounded-lg px-3 py-2 text-[14px] text-[#1c1b1b] placeholder:text-[#45474b]/50 outline-none resize-none mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setRejectModal({ open: false, submissionId: null })}
                className="flex-1 py-2.5 rounded-xl border border-[#e5e2e1] text-[#45474b] text-[13px] font-semibold hover:bg-[#f5f5f5] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectSubmission}
                disabled={actionLoading === rejectModal.submissionId}
                className="flex-1 py-2.5 rounded-xl bg-[#ba1a1a] text-white text-[13px] font-semibold hover:opacity-90 disabled:opacity-50"
              >
                {actionLoading === rejectModal.submissionId ? '...' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md"
          onClick={() => setLightbox(null)}
        >
          <img
            src={resolveMediaUrl(lightbox.images[lightbox.index]) || lightbox.images[lightbox.index]}
            alt="Full size"
            className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl"
          />
          {lightbox.images.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); setLightbox((l) => l ? { ...l, index: (l.index - 1 + l.images.length) % l.images.length } : l); }}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors"
              >
                <span className="material-symbols-outlined">chevron_left</span>
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setLightbox((l) => l ? { ...l, index: (l.index + 1) % l.images.length } : l); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors"
              >
                <span className="material-symbols-outlined">chevron_right</span>
              </button>
              <div className="absolute bottom-5 left-1/2 -translate-x-1/2 text-white/80 text-sm font-semibold bg-black/30 px-3 py-1 rounded-full">
                {lightbox.index + 1} / {lightbox.images.length}
              </div>
            </>
          )}
          <button
            onClick={() => setLightbox(null)}
            className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
      )}
    </AuthGuard>
  );
}
