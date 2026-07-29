import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

interface VerificationModalProps {
  isOpen: boolean;
}

export default function VerificationModal({ isOpen }: VerificationModalProps) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setMounted(true);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-md animate-fadeIn"
        onClick={(e) => e.preventDefault()}
        onContextMenu={(e) => e.preventDefault()}
      />

      {/* Modal */}
      <div className="relative w-full max-w-sm animate-slideUp">
        {/* Glow effect behind card */}
        <div className="absolute -inset-4 bg-gradient-to-r from-[#ffd1dc] via-[#b3ecf3] to-[#ffd1dc] rounded-3xl blur-2xl opacity-50 animate-pulse" />

        {/* Card */}
        <div className="relative bg-white/80 backdrop-blur-2xl rounded-3xl border border-white/60 shadow-[0_30px_60px_rgba(0,0,0,0.15)] overflow-hidden">
          {/* Top gradient accent */}
          <div className="h-1.5 w-full bg-gradient-to-r from-[#ffd1dc] via-[#b3ecf3] to-[#e0f7fa]" />

          {/* Decorative circles */}
          <div className="absolute top-8 right-8 w-32 h-32 bg-[#ffd1dc]/20 rounded-full blur-3xl" />
          <div className="absolute bottom-12 left-8 w-24 h-24 bg-[#b3ecf3]/20 rounded-full blur-3xl" />

          <div className="relative px-8 pt-10 pb-8 flex flex-col items-center text-center">
            {/* Icon with animated ring */}
            <div className="relative mb-6">
              <div className="absolute inset-0 w-20 h-20 rounded-full border-2 border-dashed border-[#ba1a1a]/30 animate-spin-slow" />
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#fce4ec] to-[#ffcdd2] flex items-center justify-center shadow-lg">
                <span className="material-symbols-outlined text-[40px] text-[#ba1a1a]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  lock
                </span>
              </div>
            </div>

            {/* Title */}
            <h2 className="text-xl font-bold text-[#1c1b1b] mb-3 tracking-tight" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
              Verification Required
            </h2>

            {/* Subtitle */}
            <p className="text-[15px] text-[#45474b] leading-relaxed mb-2">
              You are not a verified member yet.
            </p>
            <p className="text-[14px] text-[#5d5e64] leading-relaxed mb-8">
              Verify your account to unlock all features and start earning.
            </p>

            {/* Verify Button */}
            <button
              onClick={() => {
                document.body.style.overflow = '';
                router.push('/membership');
              }}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#1c1b1b] to-[#2d3a3f] text-white font-semibold text-[15px] tracking-wide shadow-[0_8px_30px_rgba(28,27,27,0.3)] hover:shadow-[0_12px_40px_rgba(28,27,27,0.4)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-3"
            >
              <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
              Verify Your Account
            </button>

            {/* Bottom hint */}
            <p className="mt-5 text-[12px] text-[#9e9e9e] flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm">info</span>
              Any paid membership plan will verify your account
            </p>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(30px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out forwards;
        }
        .animate-slideUp {
          animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-spin-slow {
          animation: spin-slow 12s linear infinite;
        }
      `}</style>
    </div>
  );
}
