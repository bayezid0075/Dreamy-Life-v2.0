import Head from 'next/head';
import { useRouter } from 'next/router';
import { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '@/store/authStore';
import { uploadMedia } from '@/features/media/upload';
import AuthGuard from '@/shared/components/AuthGuard';
import VerificationGuard from '@/shared/components/VerificationGuard';
import { useI18n } from '../../i18n';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

const VENDOR_TERMS_KEYS = [
  {
    titleKey: 'shopResponsibilities',
    items: [
      'Maintain accurate product listings with up-to-date inventory',
      'Provide honest and detailed product descriptions',
      'Set fair and competitive pricing for all listed items',
      'Respond to customer inquiries within 24 hours',
    ],
  },
  {
    titleKey: 'productQualityStandards',
    items: [
      'All products must meet Dreamy Life quality guidelines',
      'No counterfeit, prohibited, or restricted items allowed',
      'Proper packaging and labeling is required for all orders',
      'Product images must accurately represent the actual item',
    ],
  },
  {
    titleKey: 'paymentFees',
    items: [
      'One-time vendorship fee: Tk 700 (free for VVIP members)',
      'Platform commission applies on each completed sale',
      'Payments are processed securely via UddoktaPay',
      'Payouts are transferred to your registered account',
    ],
  },
  {
    titleKey: 'orderFulfillment',
    items: [
      'Process and ship orders within the stated delivery timeframe',
      'Handle returns and refunds according to platform policy',
      'Maintain responsive communication with buyers',
      'Provide tracking information for all shipped orders',
    ],
  },
  {
    titleKey: 'termination',
    items: [
      'Dreamy Life reserves the right to suspend vendors violating terms',
      'Vendors may voluntarily deactivate their shop at any time',
      'Upon termination, pending orders must be fulfilled or refunded',
      'Repeated policy violations will result in permanent ban',
    ],
  },
];

export default function VendorApplyPage() {
  const router = useRouter();
  const { accessToken } = useAuthStore();
  const { t } = useI18n();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<'terms' | 'form'>('terms');
  const [agreed, setAgreed] = useState(false);
  const [shopName, setShopName] = useState('');
  const [address, setAddress] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [vvipStatus, setVvipStatus] = useState<boolean | null>(null);

  useEffect(() => {
    if (accessToken) {
      fetch(`${API_URL}/vendor/me`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
        .then(r => r.json())
        .then(data => {
          if (data.data || data.ok) {
            router.replace('/vendor/dashboard');
          }
        })
        .catch(() => {});
    }
  }, [accessToken]);

  useEffect(() => {
    if (step === 'form' && accessToken) {
      checkVvipStatus();
    }
  }, [accessToken, step]);

  const checkVvipStatus = async () => {
    try {
      const res = await fetch(`${API_URL}/auth/profile`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setVvipStatus(data.data.user.memberStatus === 'vvip');
      }
    } catch {
      setVvipStatus(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError(t('pleaseSelectImageFile'));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError(t('imageMustBeLessThan5MB'));
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setError('');

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const result = await uploadMedia(file);

      clearInterval(progressInterval);
      setUploadProgress(100);
      setBannerUrl(result.url);
    } catch (err) {
      setError(t('failedToUploadImage'));
      setBannerUrl('');
    } finally {
      setUploading(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${API_URL}/vendor/apply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ shopName, address, bannerUrl: bannerUrl || undefined }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error?.message || t('failedToApply'));
        return;
      }

      if (data.data.paymentUrl) {
        window.location.href = data.data.paymentUrl;
      } else {
        router.push('/vendor/dashboard');
      }
    } catch {
      setError(t('connectionFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthGuard>
      <VerificationGuard>
      <Head>
        <title>{t('titleVendorApply')}</title>
      </Head>
      <div className="min-h-screen" style={{ backgroundColor: '#F8F8FF', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
        {/* Aurora Background Orbs */}
        <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
          <div className="absolute w-[400px] h-[400px] rounded-full blur-[80px] opacity-60 top-[-100px] left-[-100px]" style={{ background: '#FFE5D9' }} />
          <div className="absolute w-[350px] h-[350px] rounded-full blur-[80px] opacity-60 top-[20%] right-[-50px]" style={{ background: '#FFF3B0' }} />
          <div className="absolute w-[500px] h-[500px] rounded-full blur-[80px] opacity-60 bottom-[-150px] left-[10%]" style={{ background: '#D8F3DC' }} />
        </div>

        {/* Header */}
        <header className="sticky top-0 z-40 backdrop-blur-xl border-b border-white/30 shadow-[0_20px_40px_rgba(0,0,0,0.04)] w-full" style={{ backgroundColor: 'rgba(255,255,255,0.4)' }}>
          <div className="flex items-center gap-4 max-w-[1280px] mx-auto w-full px-6 py-4">
            <button onClick={() => (step === 'form' ? setStep('terms') : router.back())} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/40 transition-colors active:scale-95 text-[#5d5e64]">
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
            <h1 className="text-[24px] font-extrabold text-[#1c1b1b] tracking-tight">{t('becomeAVendor')}</h1>
          </div>
        </header>

        {/* Main Content */}
        <main className="relative z-10 pt-8 pb-20 px-6 max-w-[900px] mx-auto w-full">
          {/* Vendor Icon */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-20 h-20 rounded-full flex items-center justify-center mb-4 shadow-lg" style={{ background: 'rgba(233,253,255,0.8)', backdropFilter: 'blur(20px)', boxShadow: '0 10px 30px rgba(45,102,109,0.15)' }}>
              <span className="material-symbols-outlined text-[#2d666d] text-4xl">storefront</span>
            </div>
            <h2 className="text-2xl font-extrabold text-[#1c1b1b]">
              {step === 'terms' ? t('vendorAgreement') : t('applicationForm')}
            </h2>
            <p className="text-sm text-[#45474b] mt-1 text-center">
              {step === 'terms'
                ? t('reviewAndAcceptTerms')
                : t('fillShopDetails')}
            </p>
          </div>

          {/* Step 1: Terms */}
          {step === 'terms' && (
            <div className="space-y-6">
              <div className="rounded-[2rem] p-8 border border-white/30 shadow-[0_20px_40px_rgba(0,0,0,0.04)]" style={{ background: 'rgba(255,255,255,0.5)', backdropFilter: 'blur(24px)' }}>
                <div className="max-h-[420px] overflow-y-auto pr-2 space-y-6" style={{ scrollbarWidth: 'thin', scrollbarColor: '#c6c6cb40 transparent' }}>
                  {VENDOR_TERMS_KEYS.map((section, idx) => (
                    <div key={idx}>
                      <h3 className="text-base font-bold text-[#1c1b1b] mb-3 flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-[#2d666d] text-white text-xs flex items-center justify-center font-bold shrink-0">
                          {idx + 1}
                        </span>
                        {t(section.titleKey as any)}
                      </h3>
                      <ul className="space-y-2 ml-8">
                        {section.items.map((item, i) => (
                          <li key={i} className="text-sm text-[#45474b] leading-relaxed flex items-start gap-2">
                            <span className="text-[#2d666d] mt-0.5 shrink-0">•</span>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>

              {/* Checkbox */}
              <label className="flex items-start gap-3 cursor-pointer group">
                <div className="relative mt-0.5">
                  <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="sr-only peer" />
                  <div className="w-5 h-5 rounded-md border-2 border-[#c6c6cb] peer-checked:border-[#2d666d] peer-checked:bg-[#2d666d] transition-all flex items-center justify-center group-hover:border-[#2d666d]/50">
                    {agreed && (
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </div>
                <span className="text-sm text-[#45474b] leading-relaxed">
                  {t('agreedToTerms')}
                </span>
              </label>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row justify-end items-center gap-4 pt-6">
                <button type="button" onClick={() => router.back()}
                  className="w-full sm:w-auto px-8 py-4 rounded-full text-[#1c1b1b] text-sm font-semibold hover:bg-white/60 transition-all active:scale-95"
                  style={{ background: 'rgba(255,255,255,0.5)', backdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.3)' }}>
                  {t('cancel')}
                </button>
                <button type="button" disabled={!agreed} onClick={() => setStep('form')}
                  className="w-full sm:w-auto px-8 py-4 rounded-full bg-[#1c1b1b] text-white text-sm font-semibold hover:opacity-90 transition-all active:scale-95 shadow-lg shadow-black/10 disabled:opacity-40 disabled:cursor-not-allowed">
                  {t('continue')}
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Form */}
          {step === 'form' && (
            <form onSubmit={handleApply} className="space-y-8">
              {/* Status Card */}
              <div className="rounded-[2rem] p-8 border border-white/30 shadow-[0_20px_40px_rgba(0,0,0,0.04)]" style={{ background: 'rgba(255,255,255,0.5)', backdropFilter: 'blur(24px)' }}>
                <div className="flex items-center gap-4 mb-2">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: 'rgba(233,253,255,0.8)' }}>
                    <span className="material-symbols-outlined text-[#2d666d]">storefront</span>
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-[#1c1b1b]">{t('vendorApplication')}</h2>
                    <p className="text-sm text-[#45474b]">
                      {vvipStatus === null
                        ? t('checkingMembership')
                        : vvipStatus
                        ? t('vvipFreeVendorship')
                        : t('feeOneTime')}
                    </p>
                  </div>
                </div>
                <button type="button" onClick={() => setStep('terms')} className="text-xs text-[#2d666d] font-semibold hover:underline mt-2">
                  {t('reviewTermsAndConditions')}
                </button>
              </div>

              {/* Form Fields */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                {/* Banner Upload Zone */}
                <div className="md:col-span-5 min-h-[300px]">
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileInput} className="hidden" />
                  <div
                    className="h-full rounded-[2rem] flex flex-col items-center justify-center p-8 border-2 border-dashed transition-all cursor-pointer relative overflow-hidden"
                    style={{
                      background: dragActive ? 'rgba(233,253,255,0.8)' : 'rgba(255,255,255,0.5)',
                      backdropFilter: 'blur(24px)',
                      borderColor: dragActive ? '#2d666d' : 'rgba(255,255,255,0.5)',
                    }}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => !uploading && fileInputRef.current?.click()}
                  >
                    {uploading ? (
                      <div className="flex flex-col items-center gap-4">
                        <div className="w-16 h-16 rounded-full border-4 border-[#e9fdff] border-t-[#2d666d] animate-spin" />
                        <p className="text-sm font-semibold text-[#5d5e64]">{t('uploading')} {uploadProgress}%</p>
                        <div className="w-48 h-2 bg-white/40 rounded-full overflow-hidden">
                          <div className="h-full bg-[#2d666d] rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                        </div>
                      </div>
                    ) : bannerUrl ? (
                      <div className="relative w-full h-full">
                        <img src={bannerUrl} alt="Banner preview" className="w-full h-full object-cover rounded-[20px]" />
                        <div className="absolute inset-0 bg-black/40 rounded-[20px] opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                          <span className="text-white font-semibold text-sm">{t('changeImage')}</span>
                        </div>
                        <button type="button" onClick={(e) => { e.stopPropagation(); setBannerUrl(''); }}
                          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/80 flex items-center justify-center hover:bg-white transition-colors shadow-sm">
                          <span className="material-symbols-outlined text-[18px] text-[#ba1a1a]">close</span>
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ background: 'rgba(255,255,255,0.6)' }}>
                          <span className="material-symbols-outlined text-[#2d666d] text-3xl">add_a_photo</span>
                        </div>
                        <p className="text-sm font-semibold text-[#5d5e64] text-center">{t('uploadShopBanner')}</p>
                        <p className="text-xs text-[#45474b] mt-2 text-center opacity-70">{t('dragDropOrClick')}</p>
                        <p className="text-xs text-[#45474b] mt-1 text-center opacity-50">{t('jpgPngUpTo5MB')}</p>
                      </>
                    )}
                  </div>
                </div>

                {/* Form Fields */}
                <div className="md:col-span-7 space-y-6">
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold text-[#5d5e64] px-1">{t('shopName')}</label>
                    <input type="text" value={shopName} onChange={(e) => setShopName(e.target.value)} placeholder={t('shopNamePlaceholder')} required
                      className="w-full rounded-full px-6 py-4 text-[#1c1b1b] placeholder:text-[#45474b]/50 outline-none transition-all"
                      style={{ background: 'rgba(255,255,255,0.5)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.4)' }}
                      onFocus={(e) => { e.target.style.background = 'rgba(255,255,255,0.8)'; e.target.style.borderColor = '#98d0d7'; e.target.style.boxShadow = '0 0 0 4px rgba(152,208,215,0.2)'; }}
                      onBlur={(e) => { e.target.style.background = 'rgba(255,255,255,0.5)'; e.target.style.borderColor = 'rgba(255,255,255,0.4)'; e.target.style.boxShadow = 'none'; }}
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold text-[#5d5e64] px-1">{t('shopAddress')}</label>
                    <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} placeholder={t('shopAddressPlaceholder')} required
                      className="w-full rounded-full px-6 py-4 text-[#1c1b1b] placeholder:text-[#45474b]/50 outline-none transition-all"
                      style={{ background: 'rgba(255,255,255,0.5)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.4)' }}
                      onFocus={(e) => { e.target.style.background = 'rgba(255,255,255,0.8)'; e.target.style.borderColor = '#98d0d7'; e.target.style.boxShadow = '0 0 0 4px rgba(152,208,215,0.2)'; }}
                      onBlur={(e) => { e.target.style.background = 'rgba(255,255,255,0.5)'; e.target.style.borderColor = 'rgba(255,255,255,0.4)'; e.target.style.boxShadow = 'none'; }}
                    />
                  </div>

                  {bannerUrl && (
                    <div className="flex items-center gap-2 p-3 rounded-xl" style={{ background: 'rgba(233,253,255,0.6)' }}>
                      <span className="material-symbols-outlined text-[#2d666d] text-[18px]">check_circle</span>
                      <span className="text-sm text-[#2d666d] font-semibold">{t('bannerUploadedSuccessfully')}</span>
                    </div>
                  )}
                </div>
              </div>

              {error && (
                <div className="rounded-xl p-4 text-sm text-[#93000a] flex items-center gap-2" style={{ background: 'rgba(255,218,214,0.5)', border: '1px solid #ffdad6' }}>
                  <span className="material-symbols-outlined text-[18px]">error</span>
                  {error}
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-col sm:flex-row justify-end items-center gap-4 pt-8 mt-8 border-t border-white/20">
                <button type="button" onClick={() => router.back()}
                  className="w-full sm:w-auto px-8 py-4 rounded-full text-[#1c1b1b] text-sm font-semibold hover:bg-white/60 transition-all active:scale-95"
                  style={{ background: 'rgba(255,255,255,0.5)', backdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.3)' }}>
                  {t('cancel')}
                </button>
                <button type="submit" disabled={loading || vvipStatus === null || uploading}
                  className="w-full sm:w-auto px-8 py-4 rounded-full bg-[#1c1b1b] text-white text-sm font-semibold hover:opacity-90 transition-all active:scale-95 shadow-lg shadow-black/10 disabled:opacity-60 disabled:cursor-not-allowed">
                  {loading ? t('processing') : uploading ? t('uploading') : vvipStatus ? t('createVendorProfileFree') : t('payAndCreateVendorProfile')}
                </button>
              </div>
            </form>
          )}
        </main>
      </div>
      </VerificationGuard>
    </AuthGuard>
  );
}
