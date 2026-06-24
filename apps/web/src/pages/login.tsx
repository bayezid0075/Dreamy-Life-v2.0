import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState, useEffect, FormEvent } from 'react';
import { useAuthStore } from '@/store/authStore';

export default function LoginPage() {
  const router = useRouter();
  const { setAuth, isAuthenticated } = useAuthStore();
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [isAuthenticated, router]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4080'}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error?.message || 'Invalid credentials');
        setLoading(false);
        return;
      }

      setAuth(data.data.accessToken, data.data.user);
      router.push('/dashboard');
    } catch (err) {
      setError('Connection error. Please try again.');
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Dreamy Life - Sign In</title>
      </Head>
      <style jsx>{`
        .aurora-blob {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          opacity: 0.6;
          animation: float 20s infinite ease-in-out alternate;
        }
        @keyframes float {
          0% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0, 0) scale(1); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden bg-[#fcf9f8] font-['Plus_Jakarta_Sans']">
        {/* Aurora Background */}
        <div className="aurora-bg pointer-events-none fixed inset-0">
          <div className="aurora-blob" style={{ width: 600, height: 600, background: '#e9fdff', top: -200, left: -100 }}></div>
          <div className="aurora-blob" style={{ width: 500, height: 500, background: '#ffd1dc', bottom: -150, right: -100, animationDelay: '-5s' }}></div>
          <div className="aurora-blob" style={{ width: 400, height: 400, background: '#f8f8ff', top: '30%', left: '20%', animationDelay: '-10s' }}></div>
        </div>

        {/* Header */}
        <header className="w-full max-w-md flex justify-between items-center mb-8 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-sm border border-white/50">
              <span className="material-symbols-outlined text-[#5d5e64]" style={{ fontVariationSettings: "'FILL' 1" }}>spa</span>
            </div>
            <h1 className="text-[32px] font-bold text-[#1c1b1b] tracking-tight">Dreamy Life</h1>
          </div>
        </header>

        {/* Main Card */}
        <main className="w-full max-w-md bg-white/70 backdrop-blur-[24px] rounded-[2.5rem] p-8 md:p-10 relative z-10 flex flex-col items-center animate-fade-in-up shadow-[0_8px_32px_rgba(0,0,0,0.05)] border border-white/80">
          {/* Avatar */}
          <div className="w-20 h-20 rounded-full bg-[#f8f8ff] flex items-center justify-center mb-6 shadow-sm -translate-y-2 border border-white">
            <span className="material-symbols-outlined text-[#5d5e64] text-4xl">person</span>
          </div>

          {/* Typography */}
          <div className="text-center mb-8 w-full">
            <h2 className="text-[24px] font-bold text-[#1c1b1b] mb-2">Welcome Back</h2>
            <p className="text-[16px] text-[#45474b] px-4 leading-relaxed">Enter your credentials to access your account</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="w-full bg-[#ffdad6] text-[#93000a] p-4 rounded-2xl mb-4 flex items-start gap-3">
              <span className="material-symbols-outlined text-sm">error</span>
              <p className="text-sm font-semibold">{error}</p>
            </div>
          )}

          {/* Form */}
          <form className="w-full space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="text-[14px] font-semibold tracking-[0.05em] text-[#1c1b1b] block ml-1" htmlFor="username">
                Username or Phone
              </label>
              <div className="relative">
                <input
                  id="username"
                  type="text"
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  className="w-full h-[56px] px-5 rounded-full text-[16px] text-[#1c1b1b] bg-white/50 border border-[rgba(118,119,123,0.2)] focus:bg-white focus:border-[#5d5e64] focus:shadow-[0_0_0_2px_rgba(93,94,100,0.1)] outline-none transition-all placeholder:text-[#45474b]/50"
                  placeholder="Enter username or phone"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[14px] font-semibold tracking-[0.05em] text-[#1c1b1b] block ml-1" htmlFor="password">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full h-[56px] px-5 rounded-full text-[16px] text-[#1c1b1b] bg-white/50 border border-[rgba(118,119,123,0.2)] focus:bg-white focus:border-[#5d5e64] focus:shadow-[0_0_0_2px_rgba(93,94,100,0.1)] outline-none transition-all placeholder:text-[#45474b]/50"
                  placeholder="Enter your password"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-[56px] mt-6 rounded-full bg-[#5d5e64] text-white font-semibold text-[16px] tracking-wide shadow-sm hover:shadow-md hover:bg-[#45474c] hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Sign Up Link */}
          <div className="mt-8 text-center w-full">
            <p className="text-[16px] text-[#45474b]">
              Don't have an account?{' '}
              <Link href="/register" className="font-semibold text-[#2d666d] hover:text-[#437b81] transition-colors ml-1">
                Sign up
              </Link>
            </p>
          </div>
        </main>

        {/* Footer */}
        <footer className="mt-8 relative z-10 text-center w-full max-w-md">
          <p className="text-[14px] text-[#45474b] tracking-wide">© 2026 Dreamy Life. All rights reserved.</p>
        </footer>
      </div>
    </>
  );
}
