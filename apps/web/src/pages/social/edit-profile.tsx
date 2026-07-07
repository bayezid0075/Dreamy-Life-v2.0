import Head from 'next/head';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import AuthGuard from '@/shared/components/AuthGuard';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export default function EditProfilePage() {
  const router = useRouter();
  const { accessToken } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fullName, setFullName] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');

  useEffect(() => {
    if (!accessToken) return;
    fetchProfile();
  }, [accessToken]);

  const fetchProfile = async () => {
    try {
      const res = await fetch(`${API_URL}/auth/profile`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        const info = data.data.user?.info;
        if (info) {
          setFullName(info.fullName || '');
          setBio(info.bio || '');
          setAvatarUrl(info.avatarUrl || '');
          setCoverImage(info.coverImage || '');
          setEmail(info.email || '');
          setCity(info.city || '');
          setCountry(info.country || '');
        }
      }
    } catch (err) {
      console.error('Failed to fetch profile', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/auth/profile`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ fullName, bio, avatarUrl, coverImage, email, city, country }),
      });
      if (res.ok) {
        router.push('/social/profile');
      }
    } catch (err) {
      console.error('Failed to update profile', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-aurora">
        <div className="animate-spin h-10 w-10 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <AuthGuard>
      <Head>
        <title>Dreamy Life - Edit Profile</title>
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      </Head>

      <body className="bg-aurora text-on-surface min-h-screen font-['Plus_Jakarta_Sans',sans-serif] antialiased">
        {/* TopAppBar */}
        <header className="fixed top-0 w-full z-50 bg-white/40 backdrop-blur-xl border-b border-white/30 shadow-[0_20px_40px_rgba(0,0,0,0.04)]">
          <div className="flex justify-between items-center px-6 w-full h-16 max-w-[1280px] mx-auto">
            <button
              onClick={() => router.back()}
              className="hover:bg-white/20 transition-colors duration-300 p-2 rounded-full flex items-center justify-center"
            >
              <span className="material-symbols-outlined text-primary">arrow_back</span>
            </button>
            <h1 className="text-[24px] font-bold text-primary tracking-tight">Edit Profile</h1>
            <button
              onClick={handleSave}
              disabled={saving}
              className="text-[14px] font-semibold text-[#2d666d] hover:opacity-80 transition-opacity disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </header>

        <main className="max-w-2xl mx-auto px-4 sm:px-6 pt-24 pb-12">
          {/* Avatar Preview */}
          <div className="flex flex-col items-center mb-10">
            <div className="w-24 h-24 rounded-full p-1 bg-white/60 backdrop-blur-md shadow-[0_20px_40px_rgba(0,0,0,0.08)] mb-4">
              {avatarUrl ? (
                <img alt="Avatar" className="w-full h-full rounded-full object-cover" src={avatarUrl} />
              ) : (
                <div className="w-full h-full rounded-full bg-[#e5e2e1] flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary text-4xl">person</span>
                </div>
              )}
            </div>
          </div>

          {/* Form */}
          <div className="glass-panel rounded-2xl p-6 space-y-6">
            <div>
              <label className="block text-[14px] font-semibold text-on-surface-variant mb-2">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your full name"
                className="w-full bg-white/50 border border-white/40 rounded-xl px-4 py-3 text-[16px] text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-[#2d666d]/30"
              />
            </div>

            <div>
              <label className="block text-[14px] font-semibold text-on-surface-variant mb-2">Bio</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell people about yourself..."
                rows={3}
                className="w-full bg-white/50 border border-white/40 rounded-xl px-4 py-3 text-[16px] text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-[#2d666d]/30 resize-none"
              />
            </div>

            <div>
              <label className="block text-[14px] font-semibold text-on-surface-variant mb-2">Avatar URL</label>
              <input
                type="url"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://example.com/avatar.jpg"
                className="w-full bg-white/50 border border-white/40 rounded-xl px-4 py-3 text-[16px] text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-[#2d666d]/30"
              />
            </div>

            <div>
              <label className="block text-[14px] font-semibold text-on-surface-variant mb-2">Cover Image URL</label>
              <input
                type="url"
                value={coverImage}
                onChange={(e) => setCoverImage(e.target.value)}
                placeholder="https://example.com/cover.jpg"
                className="w-full bg-white/50 border border-white/40 rounded-xl px-4 py-3 text-[16px] text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-[#2d666d]/30"
              />
            </div>

            <div>
              <label className="block text-[14px] font-semibold text-on-surface-variant mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full bg-white/50 border border-white/40 rounded-xl px-4 py-3 text-[16px] text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-[#2d666d]/30"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[14px] font-semibold text-on-surface-variant mb-2">City</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="City"
                  className="w-full bg-white/50 border border-white/40 rounded-xl px-4 py-3 text-[16px] text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-[#2d666d]/30"
                />
              </div>
              <div>
                <label className="block text-[14px] font-semibold text-on-surface-variant mb-2">Country</label>
                <input
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="Country"
                  className="w-full bg-white/50 border border-white/40 rounded-xl px-4 py-3 text-[16px] text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-[#2d666d]/30"
                />
              </div>
            </div>
          </div>

          {/* Save Button (Mobile) */}
          <div className="mt-8 md:hidden">
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full bg-[#1A1A1A] text-white py-4 rounded-full text-[14px] font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </main>
      </body>
    </AuthGuard>
  );
}
