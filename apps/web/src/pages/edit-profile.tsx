import Head from 'next/head';
import { useRouter } from 'next/router';
import { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useI18n } from '@/i18n';
import AuthGuard from '@/shared/components/AuthGuard';

export default function EditProfilePage() {
  const router = useRouter();
  const { accessToken, logout } = useAuthStore();
  const { t } = useI18n();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    phoneNumber: '',
    dateOfBirth: '',
    gender: 'female',
    address: '',
    fatherName: '',
    motherName: '',
  });

  useEffect(() => {
    if (accessToken) {
      fetchProfile(accessToken);
    }
  }, [accessToken]);

  const fetchProfile = async (token: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/auth/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) {
        await logout();
        return;
      }
      if (res.ok) {
        const data = await res.json();
        const u = data.data.user;
        setUser(u);
        const info = u.info || {};
        const nameParts = (info.fullName || '').split(' ');
        setForm({
          firstName: nameParts[0] || '',
          lastName: nameParts.slice(1).join(' ') || '',
          phoneNumber: u.phoneNumber || '',
          dateOfBirth: info.dateOfBirth ? info.dateOfBirth.split('T')[0] : '',
          gender: info.gender || 'female',
          address: info.address || '',
          fatherName: info.fatherName || '',
          motherName: info.motherName || '',
        });
      }
    } catch (err) {
      console.error('Failed to fetch profile', err);
      await logout();
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !accessToken) return;
    const formData = new FormData();
    formData.append('file', file);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const uploadRes = await fetch(`${apiUrl}/media/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
        body: formData,
      });
      if (uploadRes.ok) {
        const uploadData = await uploadRes.json();
        const avatarUrl = uploadData.url;
        await fetch(`${apiUrl}/auth/profile`, {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ avatarUrl }),
        });
        setUser((prev: any) => ({ ...prev, info: { ...prev.info, avatarUrl } }));
        showToast(t('profileSaved'), 'success');
      }
    } catch (err) {
      console.error('Avatar upload failed', err);
      showToast(t('profileSaveError'), 'error');
    }
  };

  const handleSave = async () => {
    if (!accessToken) return;
    setSaving(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const fullName = [form.firstName, form.lastName].filter(Boolean).join(' ');
      const res = await fetch(`${apiUrl}/auth/profile`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName,
          dateOfBirth: form.dateOfBirth || undefined,
          gender: form.gender,
          address: form.address,
          fatherName: form.fatherName,
          motherName: form.motherName,
        }),
      });
      if (res.ok) {
        showToast(t('profileSaved'), 'success');
        fetchProfile(accessToken);
      } else {
        showToast(t('profileSaveError'), 'error');
      }
    } catch (err) {
      showToast(t('profileSaveError'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const showToast = (msg: string, type: 'success' | 'error') => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#F8F8FF' }}>
        <div className="animate-spin h-10 w-10 border-2 border-[#5d5e64] border-t-transparent rounded-full"></div>
      </div>
    );
  }

  const displayName = user?.info?.fullName || user?.username || 'User';
  const displayEmail = user?.info?.email || 'No email set';
  const avatarUrl = user?.info?.avatarUrl;

  const completeness = (() => {
    let filled = 0;
    let total = 8;
    if (avatarUrl) filled++;
    if (form.firstName) filled++;
    if (form.lastName) filled++;
    if (form.dateOfBirth) filled++;
    if (form.address) filled++;
    if (form.fatherName) filled++;
    if (form.motherName) filled++;
    if (displayEmail && displayEmail !== 'No email set') filled++;
    return Math.round((filled / total) * 100);
  })();

  return (
    <AuthGuard>
      <Head>
        <title>Dreamy Life - {t('personalInformation')}</title>
      </Head>
      <style>{`
        body { background-color: #F8F8FF; position: relative; overflow-x: hidden; min-height: max(884px, 100dvh); }
        .aurora-bg { background: radial-gradient(circle at 10% 20%, rgba(255, 209, 220, 0.6) 0%, transparent 40%), radial-gradient(circle at 90% 80%, rgba(179, 236, 243, 0.6) 0%, transparent 40%), radial-gradient(circle at 50% 50%, rgba(231, 187, 198, 0.5) 0%, transparent 50%), #f8f8ff; background-size: 200% 200%; animation: aurora-shift 15s ease infinite; position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; z-index: -1; pointer-events: none; }
        @keyframes aurora-shift { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
        .glass-panel { background: rgba(255, 255, 255, 0.4); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.3); box-shadow: 0 20px 40px rgba(0,0,0,0.04); }
        .glass-input { background: rgba(240, 240, 245, 0.5); backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.5); }
        .glass-input:focus { outline: none; box-shadow: 0 0 0 2px rgba(179, 236, 243, 0.5); border-color: rgba(179, 236, 243, 0.8); }
        @keyframes toast-in { 0% { transform: translateY(-20px); opacity: 0; } 100% { transform: translateY(0); opacity: 1; } }
        .toast-anim { animation: toast-in 0.3s ease-out; }
      `}</style>

      <div className="aurora-bg"></div>

      {toast && (
        <div className={`fixed top-6 right-6 z-50 px-6 py-3 rounded-full shadow-lg toast-anim ${toast.type === 'success' ? 'bg-[#2d666d] text-white' : 'bg-[#ba1a1a] text-white'}`}>
          <span className="text-sm font-semibold">{toast.msg}</span>
        </div>
      )}

      {/* Header Section */}
      <header className="pt-10 md:pt-20 pb-2 px-6 max-w-[1280px] mx-auto">
        <div className="flex items-center mb-8">
          <button onClick={() => router.push('/profile')} className="w-10 h-10 rounded-full glass-panel flex items-center justify-center hover:bg-white/60 transition-colors mr-4">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <h1 className="text-[32px] font-bold text-[#1c1b1b]">{t('profileTitle')}</h1>
        </div>

        {/* Profile Header Card */}
        <div className="glass-panel rounded-xl p-6 md:p-8 flex flex-col md:flex-row items-center gap-6 relative overflow-hidden">
          <div className="relative">
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
            <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-sm cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              {avatarUrl ? (
                <img alt="Profile Picture" className="w-full h-full object-cover" src={avatarUrl} />
              ) : (
                <div className="w-full h-full bg-[#e5e2e1] flex items-center justify-center">
                  <span className="material-symbols-outlined text-[#5d5e64] text-4xl">person</span>
                </div>
              )}
            </div>
            <div className="absolute bottom-0 right-0 bg-[#2d666d] text-white rounded-full w-8 h-8 flex items-center justify-center border-2 border-white shadow-sm cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>photo_camera</span>
            </div>
          </div>
          <div className="text-center md:text-left flex-1">
            <h2 className="text-xl font-bold text-[#1c1b1b] mb-1">{displayName}</h2>
            <p className="text-sm text-[#45474b] mb-3">{displayEmail}</p>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#ffd1dc]/30 text-[#7a5761] text-xs font-semibold border border-[#ffd1dc]/50">
              <span className="material-symbols-outlined text-[14px]">shield_person</span>
              <span>{t('identityVerified')}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Grid */}
      <main className="max-w-[1280px] mx-auto px-6 pb-20 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Personal Information */}
        <div className="lg:col-span-7 space-y-6">
          {/* Basic Information */}
          <div className="glass-panel rounded-xl p-6 md:p-8">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-[#2d666d]">person</span>
              {t('basicInfo')}
            </h3>
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[#45474b] tracking-wider ml-2">{t('firstName')}</label>
                  <input className="glass-input w-full px-5 py-3.5 rounded-full text-sm text-[#1c1b1b] transition-all" type="text" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[#45474b] tracking-wider ml-2">{t('lastName')}</label>
                  <input className="glass-input w-full px-5 py-3.5 rounded-full text-sm text-[#1c1b1b] transition-all" type="text" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#45474b] tracking-wider ml-2">{t('phoneNumber')}</label>
                <div className="relative">
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 text-[#45474b] material-symbols-outlined text-xl">call</span>
                  <input className="glass-input w-full pl-12 pr-5 py-3.5 rounded-full text-sm text-[#1c1b1b] transition-all" type="tel" value={form.phoneNumber} disabled />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[#45474b] tracking-wider ml-2">{t('dateOfBirth')}</label>
                  <div className="relative">
                    <span className="absolute left-5 top-1/2 -translate-y-1/2 text-[#45474b] material-symbols-outlined text-xl">calendar_today</span>
                    <input className="glass-input w-full pl-12 pr-5 py-3.5 rounded-full text-sm text-[#1c1b1b] transition-all appearance-none" type="date" value={form.dateOfBirth} onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })} />
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[#45474b] tracking-wider ml-2">{t('gender')}</label>
                  <div className="relative">
                    <select className="glass-input w-full px-5 pr-10 py-3.5 rounded-full text-sm text-[#1c1b1b] transition-all appearance-none bg-transparent" value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
                      <option value="female">{t('female')}</option>
                      <option value="male">{t('male')}</option>
                      <option value="non-binary">{t('nonBinary')}</option>
                      <option value="prefer-not">{t('preferNotToSay')}</option>
                    </select>
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#45474b] material-symbols-outlined pointer-events-none">expand_more</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-1.5 pt-2">
                <label className="text-xs font-semibold text-[#45474b] tracking-wider ml-2">{t('address')}</label>
                <textarea className="glass-input w-full px-5 py-3.5 rounded-2xl text-sm text-[#1c1b1b] transition-all resize-none" rows={3} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
              </div>
            </div>
          </div>

          {/* Parent Information */}
          <div className="glass-panel rounded-xl p-6 md:p-8">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-[#2d666d]">family_history</span>
              {t('parentInfo')}
            </h3>
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[#45474b] tracking-wider ml-2">{t('fatherName')}</label>
                  <input className="glass-input w-full px-5 py-3.5 rounded-full text-sm text-[#1c1b1b] transition-all" type="text" placeholder={t('fatherNamePlaceholder')} value={form.fatherName} onChange={(e) => setForm({ ...form, fatherName: e.target.value })} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[#45474b] tracking-wider ml-2">{t('motherName')}</label>
                  <input className="glass-input w-full px-5 py-3.5 rounded-full text-sm text-[#1c1b1b] transition-all" type="text" placeholder={t('motherNamePlaceholder')} value={form.motherName} onChange={(e) => setForm({ ...form, motherName: e.target.value })} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: eKYC Management */}
        <div className="lg:col-span-5 space-y-6">
          <div className="glass-panel rounded-xl p-6 md:p-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <span className="material-symbols-outlined text-[#2d666d]">how_to_reg</span>
                Identity (eKYC)
              </h3>
              <span className="text-xs font-semibold text-[#2d666d] bg-[#e9fdff] px-3 py-1 rounded-full">Level 2 Verified</span>
            </div>

            {/* Verification Progress */}
            <div className="mb-8">
              <div className="flex justify-between text-xs font-semibold mb-2">
                <span className="text-[#45474b]">Profile Completeness</span>
                <span className="text-[#2d666d]">{completeness}%</span>
              </div>
              <div className="w-full h-2 bg-[#e5e2e1] rounded-full overflow-hidden">
                <div className="h-full bg-[#2d666d] rounded-full transition-all duration-500" style={{ width: `${completeness}%` }}></div>
              </div>
            </div>

            {/* Document List */}
            <div className="space-y-4 mb-8">
              <h4 className="text-xs font-semibold text-[#45474b] uppercase tracking-wider ml-1">Verified Documents</h4>

              {/* Doc Item 1 */}
              <div className="bg-white/50 rounded-lg p-4 flex items-center justify-between border border-white/40 hover:bg-white/70 transition-colors group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#e9fdff] text-[#2d666d] flex items-center justify-center">
                    <span className="material-symbols-outlined">badge</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#1c1b1b]">National ID</p>
                    <p className="text-xs text-[#45474b]">Uploaded Oct 12, 2023</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="flex items-center gap-1 px-3 py-1 rounded-full border border-[#2d666d]/40 text-[#2d666d] text-xs font-semibold hover:bg-[#e9fdff]/20 transition-colors">
                    <span className="material-symbols-outlined text-[16px]">edit</span>
                    <span>Update</span>
                  </button>
                  <span className="material-symbols-outlined text-[#2d666d]" title="Verified">check_circle</span>
                </div>
              </div>

              {/* Doc Item 2 */}
              <div className="bg-white/50 rounded-lg p-4 flex items-center justify-between border border-white/40 hover:bg-white/70 transition-colors group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#e9fdff] text-[#2d666d] flex items-center justify-center">
                    <span className="material-symbols-outlined">flight_takeoff</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#1c1b1b]">Passport</p>
                    <p className="text-xs text-[#45474b]">Uploaded Jan 05, 2024</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="flex items-center gap-1 px-3 py-1 rounded-full border border-[#2d666d]/40 text-[#2d666d] text-xs font-semibold hover:bg-[#e9fdff]/20 transition-colors">
                    <span className="material-symbols-outlined text-[16px]">edit</span>
                    <span>Update</span>
                  </button>
                  <span className="material-symbols-outlined text-[#2d666d]" title="Verified">check_circle</span>
                </div>
              </div>

              {/* Doc Item 3 */}
              <div className="bg-white/50 rounded-lg p-4 flex items-center justify-between border border-white/40 hover:bg-white/70 transition-colors group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#e9fdff] text-[#2d666d] flex items-center justify-center">
                    <span className="material-symbols-outlined">child_care</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#1c1b1b]">Birth Certificate</p>
                    <p className="text-xs text-[#45474b]">Not uploaded yet</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="flex items-center gap-1 px-3 py-1 rounded-full bg-[#2d666d] text-white text-xs font-semibold hover:opacity-90 transition-opacity">
                    <span className="material-symbols-outlined text-[16px]">upload</span>
                    <span>Upload</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Upload New Action */}
            <button className="w-full py-4 rounded-lg border-2 border-dashed border-[#2d666d]/40 bg-[#e9fdff]/20 hover:bg-[#e9fdff]/40 text-[#2d666d] flex flex-col items-center justify-center gap-2 transition-colors">
              <span className="material-symbols-outlined text-3xl">upload_file</span>
              <span className="text-sm font-semibold">Upload Additional Document</span>
            </button>

            <div className="mt-6 p-4 rounded-lg bg-[#e5e2e1]/30 text-sm text-[#45474b] flex items-start gap-3">
              <span className="material-symbols-outlined text-[20px] text-[#5d5e64]">info</span>
              <p>Your data is encrypted and securely stored. We only use this information to verify your identity as required by law.</p>
            </div>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="lg:col-span-12 mt-4 flex justify-end gap-4">
          <button onClick={() => router.push('/profile')} className="px-8 py-3.5 rounded-full text-sm font-semibold border border-[#76777b]/30 hover:bg-[#e5e2e1]/50 transition-colors text-[#1c1b1b]">
            {t('cancel')}
          </button>
          <button onClick={handleSave} disabled={saving} className="px-8 py-3.5 rounded-full text-sm font-semibold bg-[#1A1A1A] text-white hover:opacity-90 transition-opacity shadow-lg disabled:opacity-50">
            {saving ? t('loading') : t('save')}
          </button>
        </div>
      </main>
    </AuthGuard>
  );
}
