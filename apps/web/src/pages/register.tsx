import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState, useEffect, FormEvent } from 'react';
import { useAuthStore } from '@/store/authStore';

export default function RegisterPage() {
  const router = useRouter();
  const { ref } = router.query;
  const { setAuth, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [isAuthenticated, router]);
  const [form, setForm] = useState({
    username: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
    referCode: (ref as string) || '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!form.username.trim()) newErrors.username = 'Username is required';
    if (!form.phoneNumber.trim()) newErrors.phoneNumber = 'Phone number is required';
    if (form.password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    if (form.password !== form.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: form.username,
          phoneNumber: form.phoneNumber,
          password: form.password,
          referCode: form.referCode || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrors({ general: data.error?.message || 'Registration failed' });
        setLoading(false);
        return;
      }

      setAuth(data.data.accessToken, data.data.user);
      router.push('/dashboard');
    } catch (err) {
      setErrors({ general: 'Connection error. Please try again.' });
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Dreamy Life - Sign Up</title>
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      </Head>
      <style jsx>{`
        @keyframes aurora {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>

      <div
        className="min-h-screen flex flex-col items-center justify-center p-6 md:p-20 relative overflow-hidden font-['Plus_Jakarta_Sans']"
        style={{
          backgroundColor: '#f8f8ff',
          backgroundImage: `
            radial-gradient(at 0% 0%, hsla(186,33%,85%,1) 0px, transparent 50%),
            radial-gradient(at 100% 0%, hsla(345,43%,85%,1) 0px, transparent 50%),
            radial-gradient(at 100% 100%, hsla(240,11%,85%,1) 0px, transparent 50%),
            radial-gradient(at 0% 100%, hsla(186,33%,85%,1) 0px, transparent 50%)
          `,
          backgroundSize: '200% 200%',
          animation: 'aurora 15s ease infinite',
        }}
      >
        <div className="w-full max-w-[480px] bg-white/40 backdrop-blur-[20px] rounded-[3rem] p-8 md:p-12 flex flex-col items-center relative z-10 shadow-[0_20px_40px_rgba(0,0,0,0.04)] border border-white/30">
          {/* Logo */}
          <div className="w-20 h-20 mb-8 rounded-full overflow-hidden shadow-[0_10px_20px_rgba(0,0,0,0.05)] bg-white/50 backdrop-blur-md p-1 border border-white/40 flex items-center justify-center">
            <span className="material-symbols-outlined text-[#5d5e64] text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>spa</span>
          </div>

          {/* Header */}
          <div className="text-center mb-8 w-full">
            <h1 className="text-[32px] font-bold text-[#1c1b1b] mb-2">Join Dreamy Life</h1>
            <p className="text-[16px] text-[#45474b]">Create your account to start your journey.</p>
          </div>

          {/* Error Banner */}
          {errors.general && (
            <div className="w-full bg-[#ffdad6] text-[#93000a] p-4 rounded-2xl mb-6 flex items-start gap-3">
              <span className="material-symbols-outlined">error</span>
              <p className="text-sm font-semibold">{errors.general}</p>
            </div>
          )}

          {/* Form */}
          <form className="w-full flex flex-col gap-5" onSubmit={handleSubmit}>
            {/* Username */}
            <div className="flex flex-col gap-1.5">
              <div className={`rounded-full px-6 py-4 flex items-center gap-3 transition-all bg-white/50 backdrop-blur-[10px] border ${errors.username ? 'bg-[#ffdad6]/20 border-[#ba1a1a]/30 ring-1 ring-[#ba1a1a]/20' : 'border-white/40'}`}>
                <span className="material-symbols-outlined text-[#76777b]">person</span>
                <input
                  className="bg-transparent border-none focus:ring-0 p-0 w-full text-[16px] text-[#1c1b1b] placeholder:text-[#c6c6cb] outline-none"
                  placeholder="Username"
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  required
                />
                {errors.username && <span className="material-symbols-outlined text-[#ba1a1a] text-[20px]">error</span>}
              </div>
              {errors.username && <p className="text-[12px] font-semibold text-[#ba1a1a] px-6">{errors.username}</p>}
            </div>

            {/* Phone Number */}
            <div className="flex flex-col gap-1.5">
              <div className={`rounded-full px-6 py-4 flex items-center gap-3 transition-all bg-white/50 backdrop-blur-[10px] border ${errors.phoneNumber ? 'bg-[#ffdad6]/20 border-[#ba1a1a]/30 ring-1 ring-[#ba1a1a]/20' : 'border-white/40'}`}>
                <span className="material-symbols-outlined text-[#76777b]">phone_iphone</span>
                <input
                  className="bg-transparent border-none focus:ring-0 p-0 w-full text-[16px] text-[#1c1b1b] placeholder:text-[#c6c6cb] outline-none"
                  placeholder="Phone Number"
                  type="tel"
                  value={form.phoneNumber}
                  onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
                  required
                />
                {errors.phoneNumber && <span className="material-symbols-outlined text-[#ba1a1a] text-[20px]">error</span>}
              </div>
              {errors.phoneNumber && <p className="text-[12px] font-semibold text-[#ba1a1a] px-6">{errors.phoneNumber}</p>}
            </div>

            {/* Password */}
            <div className="rounded-full px-6 py-4 flex items-center gap-3 relative bg-white/50 backdrop-blur-[10px] border border-white/40 transition-all">
              <span className="material-symbols-outlined text-[#76777b]">lock</span>
              <input
                className="bg-transparent border-none focus:ring-0 p-0 w-full text-[16px] text-[#1c1b1b] placeholder:text-[#c6c6cb] outline-none"
                placeholder="Password"
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
              <button type="button" className="absolute right-6 text-[#76777b] hover:text-[#1c1b1b]" onClick={() => setShowPassword(!showPassword)}>
                <span className="material-symbols-outlined">{showPassword ? 'visibility_off' : 'visibility'}</span>
              </button>
            </div>
            {errors.password && <p className="text-[12px] font-semibold text-[#ba1a1a] px-6 -mt-3">{errors.password}</p>}

            {/* Confirm Password */}
            <div className="flex flex-col gap-1.5">
              <div className={`rounded-full px-6 py-4 flex items-center gap-3 relative bg-white/50 backdrop-blur-[10px] border transition-all ${errors.confirmPassword ? 'bg-[#ffdad6]/20 border-[#ba1a1a]/30 ring-1 ring-[#ba1a1a]/20' : 'border-white/40'}`}>
                <span className="material-symbols-outlined text-[#76777b]">lock</span>
                <input
                  className="bg-transparent border-none focus:ring-0 p-0 w-full text-[16px] text-[#1c1b1b] placeholder:text-[#c6c6cb] outline-none"
                  placeholder="Confirm Password"
                  type={showConfirm ? 'text' : 'password'}
                  value={form.confirmPassword}
                  onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                  required
                />
                <div className="flex items-center gap-2 absolute right-6">
                  {errors.confirmPassword && <span className="material-symbols-outlined text-[#ba1a1a] text-[20px]">error</span>}
                  <button type="button" className="text-[#76777b] hover:text-[#1c1b1b]" onClick={() => setShowConfirm(!showConfirm)}>
                    <span className="material-symbols-outlined">{showConfirm ? 'visibility_off' : 'visibility'}</span>
                  </button>
                </div>
              </div>
              {errors.confirmPassword && <p className="text-[12px] font-semibold text-[#ba1a1a] px-6">{errors.confirmPassword}</p>}
            </div>

            {/* Referral Code */}
            <div className="rounded-full px-6 py-4 flex items-center gap-3 bg-white/50 backdrop-blur-[10px] border border-white/40 transition-all">
              <span className="material-symbols-outlined text-[#76777b]">redeem</span>
              <input
                className="bg-transparent border-none focus:ring-0 p-0 w-full text-[16px] text-[#1c1b1b] placeholder:text-[#c6c6cb] outline-none"
                placeholder="Referral Code (Optional)"
                value={form.referCode}
                onChange={(e) => setForm({ ...form, referCode: e.target.value })}
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="mt-4 w-full bg-[#1c1b1b] text-white rounded-full py-4 px-6 font-semibold text-[14px] tracking-[0.05em] hover:bg-[#313030] transition-all duration-300 shadow-[0_8px_16px_rgba(28,27,27,0.15)] flex items-center justify-center gap-2 group disabled:opacity-60"
            >
              {loading ? 'Creating Account...' : 'Sign Up'}
              {!loading && <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>}
            </button>
          </form>

          {/* Footer Links */}
          <div className="mt-8 text-center">
            <p className="text-[16px] text-[#45474b]">
              Already have an account?{' '}
              <Link href="/login" className="text-[#2d666d] font-semibold text-[14px] tracking-[0.05em] hover:underline decoration-[#2d666d]/50 underline-offset-4">
                Sign in
              </Link>
            </p>
          </div>
        </div>

        <div className="absolute bottom-6 w-full text-center">
          <p className="text-[12px] text-[#c6c6cb]">© 2026 Dreamy Life. All rights reserved.</p>
        </div>
      </div>
    </>
  );
}
