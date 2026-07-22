import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState, FormEvent } from 'react';
import { useI18n } from '../../i18n';

export default function ResetPasswordPage() {
  const router = useRouter();
  const { phone, otp } = router.query;
  const phoneNumber = (phone as string) || '';
  const otpCode = (otp as string) || '';
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const { t } = useI18n();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError(t('passwordsDoNotMatch'));
      return;
    }

    if (newPassword.length < 6) {
      setError(t('passwordMinLength'));
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/auth/forgot-password/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber, otpCode, newPassword }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error?.message || t('failedToResetPassword'));
        setLoading(false);
        return;
      }

      setSuccess(true);
    } catch (err) {
      setError(t('connectionError'));
      setLoading(false);
    }
  };

  if (success) {
    return (
      <>
        <Head>
          <title>{t('passwordReset')}</title>
        </Head>

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
          }}
        >
          <div className="w-full max-w-[480px] bg-white/40 backdrop-blur-[20px] rounded-[3rem] p-8 md:p-12 flex flex-col items-center relative z-10 shadow-[0_20px_40px_rgba(0,0,0,0.04)] border border-white/30">
            {/* Success Icon */}
            <div className="w-20 h-20 mb-8 rounded-full overflow-hidden shadow-[0_10px_20px_rgba(0,0,0,0.05)] bg-[#e9fdff] backdrop-blur-md p-1 border border-white/40 flex items-center justify-center">
              <span className="material-symbols-outlined text-[#2d666d] text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
            </div>

            <div className="text-center mb-8 w-full">
              <h1 className="text-[32px] font-bold text-[#1c1b1b] mb-2">{t('passwordReset')}</h1>
              <p className="text-[16px] text-[#45474b]">{t('passwordResetSuccess')}</p>
            </div>

            <Link
              href="/login"
              className="mt-4 w-full bg-[#1c1b1b] text-white rounded-full py-4 px-6 font-semibold text-[14px] tracking-[0.05em] hover:bg-[#313030] transition-all duration-300 shadow-[0_8px_16px_rgba(28,27,27,0.15)] flex items-center justify-center gap-2 text-center"
            >
              {t('signIn')}
              <span className="material-symbols-outlined">arrow_forward</span>
            </Link>
          </div>

          <div className="absolute bottom-6 w-full text-center">
            <p className="text-[12px] text-[#c6c6cb]">© 2026 Dreamy Life. All rights reserved.</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>{t('resetPassword')}</title>
      </Head>

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
        }}
      >
        <div className="w-full max-w-[480px] bg-white/40 backdrop-blur-[20px] rounded-[3rem] p-8 md:p-12 flex flex-col items-center relative z-10 shadow-[0_20px_40px_rgba(0,0,0,0.04)] border border-white/30">
          {/* Logo */}
          <div className="w-20 h-20 mb-8 rounded-full overflow-hidden shadow-[0_10px_20px_rgba(0,0,0,0.05)] bg-white/50 backdrop-blur-md p-1 border border-white/40 flex items-center justify-center">
            <span className="material-symbols-outlined text-[#5d5e64] text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>lock</span>
          </div>

          {/* Header */}
          <div className="text-center mb-8 w-full">
            <h1 className="text-[32px] font-bold text-[#1c1b1b] mb-2">{t('resetPassword')}</h1>
            <p className="text-[16px] text-[#45474b]">{t('enterNewPassword')}</p>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="w-full bg-[#ffdad6] text-[#93000a] p-4 rounded-2xl mb-6 flex items-start gap-3">
              <span className="material-symbols-outlined">error</span>
              <p className="text-sm font-semibold">{error}</p>
            </div>
          )}

          {/* Form */}
          <form className="w-full flex flex-col gap-5" onSubmit={handleSubmit}>
            {/* New Password */}
            <div className="flex flex-col gap-1.5">
              <div className="rounded-full px-6 py-4 flex items-center gap-3 transition-all bg-white/50 backdrop-blur-[10px] border border-white/40">
                <span className="material-symbols-outlined text-[#76777b]">lock</span>
                <input
                  className="bg-transparent border-none focus:ring-0 p-0 w-full text-[16px] text-[#1c1b1b] placeholder:text-[#c6c6cb] outline-none"
                  placeholder={t('newPassword')}
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Confirm Password */}
            <div className="flex flex-col gap-1.5">
              <div className="rounded-full px-6 py-4 flex items-center gap-3 transition-all bg-white/50 backdrop-blur-[10px] border border-white/40">
                <span className="material-symbols-outlined text-[#76777b]">lock</span>
                <input
                  className="bg-transparent border-none focus:ring-0 p-0 w-full text-[16px] text-[#1c1b1b] placeholder:text-[#c6c6cb] outline-none"
                  placeholder={t('confirmPassword')}
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="mt-4 w-full bg-[#1c1b1b] text-white rounded-full py-4 px-6 font-semibold text-[14px] tracking-[0.05em] hover:bg-[#313030] transition-all duration-300 shadow-[0_8px_16px_rgba(28,27,27,0.15)] flex items-center justify-center gap-2 group disabled:opacity-60"
            >
              {loading ? t('resetting') : t('resetPassword')}
              {!loading && <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>}
            </button>
          </form>

          {/* Back to Login */}
          <div className="mt-8 text-center">
            <p className="text-[16px] text-[#45474b]">
              <Link href="/login" className="text-[#2d666d] font-semibold text-[14px] tracking-[0.05em] hover:underline decoration-[#2d666d]/50 underline-offset-4">
                {t('backToLogin')}
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
