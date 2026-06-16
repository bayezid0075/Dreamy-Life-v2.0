import Head from 'next/head';
import Link from 'next/link';
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuthStore } from '@/store/authStore';

export default function HomePage() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [isAuthenticated, router]);

  return (
    <>
      <Head>
        <title>Dreamy Life - Welcome</title>
        <meta name="description" content="Your personal wellness journey" />
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
        <header className="w-full max-w-md flex justify-between items-center mb-12 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-sm border border-white/50">
              <span className="material-symbols-outlined text-[#5d5e64]" style={{ fontVariationSettings: "'FILL' 1" }}>spa</span>
            </div>
            <h1 className="text-[32px] font-bold text-[#1c1b1b] tracking-tight">Dreamy Life</h1>
          </div>
        </header>

        {/* Main Content */}
        <main className="w-full max-w-md bg-white/70 backdrop-blur-[24px] rounded-[2.5rem] p-8 md:p-10 relative z-10 flex flex-col items-center shadow-[0_8px_32px_rgba(0,0,0,0.05)] border border-white/80 animate-fade-in-up">
          {/* Hero Icon */}
          <div className="w-24 h-24 rounded-full bg-[#f8f8ff] flex items-center justify-center mb-6 shadow-sm border border-white">
            <span
              className="material-symbols-outlined text-[#5d5e64] text-5xl"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              spa
            </span>
          </div>

          {/* Typography */}
          <div className="text-center mb-10 w-full">
            <h2 className="text-[28px] font-bold text-[#1c1b1b] mb-3">
              Welcome to Dreamy Life
            </h2>
            <p className="text-[16px] text-[#45474b] px-2 leading-relaxed">
              Your personal wellness journey starts here. Join our community and unlock exclusive benefits, referrals, and membership rewards.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="w-full space-y-4">
            <Link
              href="/login"
              className="w-full h-[56px] rounded-full bg-[#5d5e64] text-white font-semibold text-[16px] tracking-wide shadow-sm hover:shadow-md hover:bg-[#45474c] hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2"
            >
              Sign In
              <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
            </Link>

            <Link
              href="/register"
              className="w-full h-[56px] rounded-full bg-white/60 backdrop-blur-[10px] border border-[rgba(118,119,123,0.2)] text-[#1c1b1b] font-semibold text-[16px] tracking-wide hover:bg-white/80 hover:shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2"
            >
              Create Account
              <span className="material-symbols-outlined text-[20px]">person_add</span>
            </Link>
          </div>

          {/* Features */}
          <div className="w-full mt-10 pt-8 border-t border-[rgba(118,119,123,0.1)]">
            <div className="grid grid-cols-3 gap-4">
              {[
                { icon: 'share', label: 'Referral Program', desc: 'Earn rewards' },
                { icon: 'card_membership', label: 'Membership', desc: 'Exclusive perks' },
                { icon: 'group', label: 'Community', desc: 'Join the network' },
              ].map((feature) => (
                <div key={feature.label} className="text-center">
                  <div className="w-10 h-10 rounded-full bg-[#f8f8ff] mx-auto mb-2 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[#5d5e64] text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
                      {feature.icon}
                    </span>
                  </div>
                  <p className="text-[13px] font-bold text-[#1c1b1b]">{feature.label}</p>
                  <p className="text-[11px] text-[#45474b]">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="mt-8 relative z-10 text-center w-full max-w-md">
          <p className="text-[14px] text-[#45474b] tracking-wide">
            &copy; 2026 Dreamy Life. All rights reserved.
          </p>
        </footer>
      </div>
    </>
  );
}
