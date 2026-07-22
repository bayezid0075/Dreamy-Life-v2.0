'use client';

import { useState, FormEvent } from 'react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/admin/auth/login`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, accessCode, password }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        setError(data.error?.message || 'Invalid credentials');
        setLoading(false);
        return;
      }

      localStorage.setItem('accessToken', data.data.accessToken);
      document.cookie = `admin_token=${data.data.accessToken}; path=/; max-age=${7 * 24 * 60 * 60}`;
      window.location.href = '/dashboard';
    } catch {
      setError('Connection error. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="aurora-bg min-h-screen flex items-center justify-center p-margin-mobile md:p-margin-desktop font-body-md text-on-background">
      {/* Main Container */}
      <main className="w-full max-w-[480px] z-10">
        {/* Brand Identity */}
        <div className="text-center mb-lg floating">
          <div className="inline-flex items-center justify-center w-20 h-20 mb-md rounded-2xl glass-panel">
            <span
              className="material-symbols-outlined text-primary text-[48px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              auto_awesome
            </span>
          </div>
          <h1 className="font-headline-lg text-headline-lg text-primary tracking-tight mb-xs">
            Dreamy Life
          </h1>
          <p className="font-body-md text-on-surface-variant opacity-80">
            Admin Console Access
          </p>
        </div>

        {/* Login Card */}
        <section className="glass-panel rounded-3xl p-lg space-y-md">
          {/* Error Message */}
          {error && (
            <div className="bg-error-container text-on-error-container p-4 rounded-xl flex items-start gap-3">
              <span className="material-symbols-outlined text-sm">error</span>
              <p className="text-sm font-semibold">{error}</p>
            </div>
          )}

          <form className="space-y-md" onSubmit={handleSubmit}>
            {/* Email Field */}
            <div className="space-y-xs">
              <label
                className="font-label-md text-label-md text-on-surface-variant ml-xs"
                htmlFor="email"
              >
                Email
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-md flex items-center pointer-events-none text-outline">
                  <span className="material-symbols-outlined text-[20px]">mail</span>
                </div>
                <input
                  className="w-full h-[56px] pl-[52px] pr-md rounded-xl input-glass font-body-md text-on-surface placeholder-outline/60 focus:outline-none"
                  id="email"
                  name="email"
                  type="email"
                  placeholder="admin@dreamylife.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Access Code Field */}
            <div className="space-y-xs">
              <label
                className="font-label-md text-label-md text-on-surface-variant ml-xs"
                htmlFor="accessCode"
              >
                Access Code
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-md flex items-center pointer-events-none text-outline">
                  <span className="material-symbols-outlined text-[20px]">vpn_key</span>
                </div>
                <input
                  className="w-full h-[56px] pl-[52px] pr-md rounded-xl input-glass font-body-md text-on-surface placeholder-outline/60 focus:outline-none"
                  id="accessCode"
                  name="accessCode"
                  type="text"
                  placeholder="ADMIN001"
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-xs">
              <div className="flex justify-between items-center px-xs">
                <label
                  className="font-label-md text-label-md text-on-surface-variant"
                  htmlFor="password"
                >
                  Password
                </label>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-md flex items-center pointer-events-none text-outline">
                  <span className="material-symbols-outlined text-[20px]">lock</span>
                </div>
                <input
                  className="w-full h-[56px] pl-[52px] pr-md rounded-xl input-glass font-body-md text-on-surface placeholder-outline/60 focus:outline-none"
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-md flex items-center text-outline hover:text-primary transition-colors"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center space-x-sm px-xs pt-xs">
              <input
                className="w-5 h-5 rounded-md border-outline-variant text-primary focus:ring-primary-container bg-surface/50"
                id="remember"
                name="remember"
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
              />
              <label
                className="font-label-md text-label-md text-on-surface-variant cursor-pointer"
                htmlFor="remember"
              >
                Keep me signed in
              </label>
            </div>

            {/* Action Button */}
            <div className="pt-md">
              <button
                type="submit"
                disabled={loading}
                className="w-full h-[56px] rounded-xl primary-gradient text-on-primary font-label-md text-lg shadow-lg flex items-center justify-center gap-sm disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <span className="material-symbols-outlined animate-spin text-[20px]">
                      progress_activity
                    </span>
                    <span>Authenticating...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <span className="material-symbols-outlined text-[20px]">login</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Divider */}
          <div className="relative py-md">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-outline-variant/30"></div>
            </div>
            <div className="relative flex justify-center text-label-sm uppercase tracking-widest text-on-surface-variant/40 bg-transparent">
              <span className="px-sm glass-panel py-1 rounded-full border-none shadow-none">
                System Authentication
              </span>
            </div>
          </div>

          {/* Footer Links */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-md text-center">
            <p className="font-label-sm text-on-surface-variant">
              Manage session?{' '}
              <a className="text-primary font-bold hover:underline" href="#">
                Help Center
              </a>
            </p>
            <div className="flex items-center space-x-md">
              <button className="p-base rounded-full hover:bg-surface-variant/20 transition-colors text-outline">
                <span className="material-symbols-outlined">help</span>
              </button>
            </div>
          </div>
        </section>

        {/* Decorative Bottom Bar */}
        <div className="fixed bottom-0 left-0 w-full p-lg opacity-30 pointer-events-none select-none">
          <div className="flex justify-between items-end border-t border-outline-variant pt-md">
            <span className="font-label-sm text-outline">Dreamy Life Admin Panel v2.4.0</span>
            <span className="font-label-sm text-outline">© 2026 Dreamy Life</span>
          </div>
        </div>
      </main>

      {/* Background Atmospheric Glows */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-primary-container/20 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-tertiary-container/20 rounded-full blur-[120px]"></div>
      </div>
    </div>
  );
}
