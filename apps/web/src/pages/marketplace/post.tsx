import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '@/store/authStore';
import AuthGuard from '@/shared/components/AuthGuard';
import VerificationGuard from '@/shared/components/VerificationGuard';
import { uploadMedia } from '@/features/media/upload';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export default function PostJobPage() {
  const router = useRouter();
  const { accessToken } = useAuthStore();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [unitPay, setUnitPay] = useState('');
  const [unitCount, setUnitCount] = useState('');
  const [link, setLink] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [fundsBalance, setFundsBalance] = useState(0);
  const [descriptionLength, setDescriptionLength] = useState(0);
  const [platformFeePercent, setPlatformFeePercent] = useState(5);

  const unitPayNum = parseFloat(unitPay) || 0;
  const unitCountNum = parseInt(unitCount) || 0;
  const baseAmount = unitPayNum * unitCountNum;
  const feeAmount = baseAmount * (platformFeePercent / 100);
  const totalCost = baseAmount + feeAmount;

  useEffect(() => {
    if (!accessToken) return;
    fetchWallet();
    fetchSettings();
  }, [accessToken]);

  const fetchWallet = async () => {
    try {
      const res = await fetch(`${API_URL}/wallet`, { headers: { Authorization: `Bearer ${accessToken}` } });
      if (res.ok) {
        const data = await res.json();
        setFundsBalance(data.data?.wallet?.fundsBalance || 0);
      }
    } catch (err) {
      console.error('Failed to fetch wallet', err);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await fetch(`${API_URL}/marketplace/settings`);
      if (res.ok) {
        const data = await res.json();
        setPlatformFeePercent(Number(data.platformFeePercent) || 5);
      }
    } catch (err) {
      console.error('Failed to fetch settings', err);
    }
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    if (val.length <= 2000) {
      setDescription(val);
      setDescriptionLength(val.length);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).filter(f => f.size <= 10 * 1024 * 1024);
      setImages(prev => [...prev, ...newFiles].slice(0, 5));
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handlePost = async () => {
    if (!title.trim()) return alert('Title is required');
    if (!description.trim()) return alert('Description is required');
    if (!unitPay || unitPayNum <= 0) return alert('Valid per unit price is required');
    if (!unitCount || unitCountNum <= 0) return alert('Unit count is required');
    if (totalCost > fundsBalance) return alert(`Insufficient funds. Required: ৳${totalCost.toFixed(2)}`);

    setLoading(true);
    try {
      const mediaUrls: string[] = [];
      const uploadErrors: string[] = [];
      for (const file of images) {
        try {
          const result = await uploadMedia(file);
          mediaUrls.push(result.url);
        } catch (err) {
          uploadErrors.push(file.name);
        }
      }
      if (uploadErrors.length > 0) {
        alert(`Failed to upload: ${uploadErrors.join(', ')}. Other images were uploaded successfully.`);
      }

      const payload = {
        title: title.trim(),
        description: description.trim(),
        unitPay: unitPayNum,
        totalUnits: unitCountNum,
        mediaUrls,
        link: link.trim() || undefined,
      };

      const res = await fetch(`${API_URL}/marketplace/jobs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        alert('Job posted successfully! Waiting for admin approval.');
        router.push('/marketplace');
      } else {
        const err = await res.json();
        alert(err.message || 'Failed to post job');
      }
    } catch (err) {
      alert('Failed to post job');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthGuard>
      <VerificationGuard>
      <Head>
        <title>Create Job Post - Dreamy Life</title>
      </Head>

      <div className="aurora-mesh" />
      <div className="aurora-orb-1" />
      <div className="aurora-orb-2" />

      <header className="w-full sticky top-0 z-50 px-6 py-4 flex justify-between items-center bg-white/30 backdrop-blur-md border-b border-white/40">
        <button onClick={() => router.back()} aria-label="Go back" className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-white/60 transition-colors">
          <span className="material-symbols-outlined text-[#1c1b1b] text-2xl">arrow_back</span>
        </button>
        <h1 className="text-lg font-bold text-[#1c1b1b] text-center flex-1 tracking-tight">
          Create Job Post
        </h1>
        <div className="w-10" />
      </header>

      <main className="w-full max-w-[800px] px-6 py-10 md:py-16 flex flex-col gap-8 mx-auto">
        <form className="flex flex-col gap-8 w-full" onSubmit={(e) => { e.preventDefault(); handlePost(); }}>

          {/* The Basics Section */}
          <section className="glass-card rounded-[2rem] p-6 md:p-8 flex flex-col gap-6 opacity-0 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <h2 className="text-xl font-bold text-[#1c1b1b]">The Basics</h2>
            <div className="relative glass-input rounded-3xl p-5 flex flex-col justify-center group">
              <label className="text-xs font-semibold text-[#45474b] mb-2 ml-1 transition-colors group-focus-within:text-[#2d666d]" htmlFor="job-title">Job Title</label>
              <input
                className="bg-transparent border-none outline-none text-lg text-[#1c1b1b] placeholder-[#c6c6cb] w-full"
                id="job-title"
                placeholder="e.g. Senior Brand Designer"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className="relative glass-input rounded-3xl p-5 flex flex-col justify-center group">
              <label className="text-xs font-semibold text-[#45474b] mb-2 ml-1 transition-colors group-focus-within:text-[#2d666d]" htmlFor="job-link">Link (optional)</label>
              <input
                className="bg-transparent border-none outline-none text-lg text-[#1c1b1b] placeholder-[#c6c6cb] w-full"
                id="job-link"
                placeholder="https://example.com"
                type="text"
                value={link}
                onChange={(e) => setLink(e.target.value)}
              />
            </div>
          </section>

          {/* Description Section */}
          <section className="glass-card rounded-[2rem] p-6 md:p-8 flex flex-col gap-6 opacity-0 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            <div className="flex justify-between items-end px-1">
              <h2 className="text-xl font-bold text-[#1c1b1b]">Description</h2>
              <span className="text-xs font-semibold text-[#45474b]">{descriptionLength}/2000</span>
            </div>
            <div className="glass-input rounded-3xl overflow-hidden flex flex-col">
              <div className="flex items-center gap-1 p-3 border-b border-white/40 bg-white/30 backdrop-blur-sm">
                <button aria-label="Bold" className="toolbar-btn" type="button">
                  <span className="material-symbols-outlined text-xl">format_bold</span>
                </button>
                <button aria-label="Italic" className="toolbar-btn" type="button">
                  <span className="material-symbols-outlined text-xl">format_italic</span>
                </button>
                <button aria-label="Underline" className="toolbar-btn" type="button">
                  <span className="material-symbols-outlined text-xl">format_underlined</span>
                </button>
                <div className="w-px h-6 bg-[#c6c6cb]/40 mx-2" />
                <button aria-label="Bullet List" className="toolbar-btn" type="button">
                  <span className="material-symbols-outlined text-xl">format_list_bulleted</span>
                </button>
                <button aria-label="Numbered List" className="toolbar-btn" type="button">
                  <span className="material-symbols-outlined text-xl">format_list_numbered</span>
                </button>
              </div>
              <textarea
                className="bg-transparent border-none outline-none text-base text-[#1c1b1b] placeholder-[#c6c6cb] p-6 resize-y w-full min-h-[160px]"
                id="job-description"
                placeholder="Describe the role, responsibilities, and requirements in detail..."
                rows={6}
                value={description}
                onChange={handleDescriptionChange}
              />
            </div>
          </section>

          {/* Media Upload Section */}
          <section className="glass-card rounded-[2rem] p-6 md:p-8 flex flex-col gap-6 opacity-0 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
            <h2 className="text-xl font-bold text-[#1c1b1b]">Visuals</h2>
            <p className="text-base text-[#45474b] px-1">Add images to help candidates understand the project context.</p>

            {images.length > 0 && (
              <div className="flex flex-wrap gap-3">
                {images.map((img, i) => (
                  <div key={i} className="relative w-20 h-20 rounded-2xl overflow-hidden bg-white/50 border border-white/40">
                    <img src={URL.createObjectURL(img)} alt="" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(i)}
                      className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#ba1a1a] text-white flex items-center justify-center text-xs"
                    >
                      x
                    </button>
                  </div>
                ))}
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleImageUpload}
            />
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-[#2d666d]/40 rounded-3xl p-10 flex flex-col items-center justify-center gap-5 bg-white/20 hover:bg-white/40 hover:border-[#2d666d] transition-all duration-300 cursor-pointer group"
            >
              <div className="w-16 h-16 rounded-full bg-[#e9fdff] shadow-sm flex items-center justify-center text-[#2d666d] group-hover:scale-110 transition-transform duration-300">
                <span className="material-symbols-outlined text-2xl">add_photo_alternate</span>
              </div>
              <div className="text-center">
                <p className="text-sm font-bold text-[#1c1b1b] mb-2">Click to upload or drag and drop</p>
                <p className="text-xs text-[#45474b] tracking-wide">PNG, JPG, GIF up to 10MB (max 5 files)</p>
              </div>
            </div>
          </section>

          {/* Compensation Section */}
          <section className="glass-card rounded-[2rem] p-6 md:p-8 flex flex-col gap-6 opacity-0 animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
            <h2 className="text-xl font-bold text-[#1c1b1b]">Compensation</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="glass-input rounded-3xl p-5 flex flex-col justify-center group">
                <label className="text-xs font-semibold text-[#45474b] mb-2 ml-1 transition-colors group-focus-within:text-[#2d666d]" htmlFor="unit-pay">Per Unit Price</label>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-bold text-[#5d5e64]">৳</span>
                  <input
                    className="bg-transparent border-none outline-none text-xl font-bold text-[#1c1b1b] w-full placeholder-[#c6c6cb]/50"
                    id="unit-pay"
                    min="0"
                    placeholder="0.00"
                    step="0.01"
                    type="number"
                    value={unitPay}
                    onChange={(e) => setUnitPay(e.target.value)}
                  />
                </div>
              </div>
              <div className="glass-input rounded-3xl p-5 flex flex-col justify-center group">
                <label className="text-xs font-semibold text-[#45474b] mb-2 ml-1 transition-colors group-focus-within:text-[#2d666d]" htmlFor="unit-count">Unit Count</label>
                <input
                  className="bg-transparent border-none outline-none text-lg text-[#1c1b1b] w-full placeholder-[#c6c6cb]/50"
                  id="unit-count"
                  min="1"
                  placeholder="e.g. 50"
                  type="number"
                  value={unitCount}
                  onChange={(e) => setUnitCount(e.target.value)}
                />
              </div>
            </div>

            {/* Funds Summary */}
            <div className="flex items-center justify-between bg-white/30 rounded-2xl p-4 border border-white/30">
              <div>
                <p className="text-xs font-semibold text-[#45474b]">Available Funds</p>
                <p className="text-lg font-bold text-[#1c1b1b]">৳{fundsBalance.toFixed(2)}</p>
              </div>
              <Link href="/wallet" className="text-xs font-semibold text-[#2d666d] hover:underline">
                Add Funds
              </Link>
            </div>

            {unitPayNum > 0 && (
              <div className="bg-[#e9fdff]/30 rounded-2xl p-4 border border-[#e9fdff]/30">
                <p className="text-sm font-bold text-[#2d666d] mb-2">Cost Summary</p>
                <div className="flex justify-between text-sm text-[#45474b] mb-1">
                  <span>Per Unit:</span>
                  <span className="font-bold text-[#1c1b1b]">৳{unitPayNum.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-[#45474b] mb-1">
                  <span>Units:</span>
                  <span className="font-bold text-[#1c1b1b]">{unitCountNum}</span>
                </div>
                <div className="flex justify-between text-sm text-[#45474b] mb-1">
                  <span>Subtotal:</span>
                  <span className="font-bold text-[#1c1b1b]">৳{baseAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-[#45474b] mb-2">
                  <span>Platform Fee ({platformFeePercent}%):</span>
                  <span className="font-bold text-[#76777b]">৳{feeAmount.toFixed(2)}</span>
                </div>
                <div className="border-t border-[#2d666d]/20 pt-2 flex justify-between text-sm">
                  <span className="font-bold text-[#1c1b1b]">Total:</span>
                  <span className="font-bold text-[#2d666d]">৳{totalCost.toFixed(2)}</span>
                </div>
              </div>
            )}
          </section>

          {/* Action Buttons */}
          <div className="mt-6 opacity-0 animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
            <button
              className="w-full py-4 px-6 rounded-full bg-gradient-to-r from-[#2d666d] to-[#1a4b52] text-white font-semibold text-sm shadow-[0_8px_20px_rgba(45,102,109,0.3)] hover:shadow-[0_12px_25px_rgba(45,102,109,0.5)] transition-all duration-300 hover:-translate-y-1 text-center relative overflow-hidden group"
              type="submit"
              disabled={loading}
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                {loading ? 'Publishing...' : 'Publish Job'}
                {!loading && (
                  <span className="material-symbols-outlined text-sm transition-transform group-hover:translate-x-1 group-hover:-translate-y-1">
                    rocket_launch
                  </span>
                )}
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out" />
            </button>
          </div>
        </form>
      </main>
      </VerificationGuard>
    </AuthGuard>
  );
}
