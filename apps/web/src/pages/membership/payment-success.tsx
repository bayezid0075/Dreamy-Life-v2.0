import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';

export default function MembershipPaymentSuccessPage() {
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [invoiceId, setInvoiceId] = useState('');

  useEffect(() => {
    const processPayment = async () => {
      const id = router.query.invoice_id as string;
      if (!id) {
        setStatus('error');
        setMessage('No invoice ID found');
        return;
      }

      setInvoiceId(id);

      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4080'}/membership/payment-success`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ invoice_id: id }),
        });

        const data = await res.json();

        if (res.ok && data.success) {
          setStatus('success');
          setMessage('Your membership has been activated successfully!');
          setTimeout(() => {
            router.replace('/membership');
          }, 5000);
        } else {
          setStatus('error');
          setMessage(data.data?.message || 'Payment processing failed');
        }
      } catch (err) {
        setStatus('error');
        setMessage('Failed to process payment. Please try again.');
      }
    };

    if (router.isReady) {
      processPayment();
    }
  }, [router.isReady, router.query.invoice_id]);

  return (
    <>
      <Head>
        <title>Membership Payment {status === 'success' ? 'Successful' : status === 'error' ? 'Failed' : 'Processing'} - Dreamy Life</title>
      </Head>
      <style>{`
        @keyframes checkmark-scale {
          0% { transform: scale(0); opacity: 0; }
          50% { transform: scale(1.2); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes checkmark-draw {
          0% { stroke-dashoffset: 50; }
          100% { stroke-dashoffset: 0; }
        }
        @keyframes circle-draw {
          0% { stroke-dashoffset: 314; }
          100% { stroke-dashoffset: 0; }
        }
        @keyframes fade-in-up {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes confetti-fall {
          0% { transform: translateY(-100vh) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 20px rgba(45, 102, 109, 0.3); }
          50% { box-shadow: 0 0 40px rgba(45, 102, 109, 0.6); }
        }
        @keyframes error-shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-10px); }
          75% { transform: translateX(10px); }
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .checkmark-circle {
          stroke-dasharray: 314;
          stroke-dashoffset: 314;
          animation: circle-draw 0.6s ease-out 0.2s forwards;
        }
        .checkmark-check {
          stroke-dasharray: 50;
          stroke-dashoffset: 50;
          animation: checkmark-draw 0.4s ease-out 0.6s forwards;
        }
        .success-icon {
          animation: checkmark-scale 0.5s ease-out 0.1s both;
        }
        .fade-in-up {
          animation: fade-in-up 0.5s ease-out 0.8s both;
        }
        .fade-in-up-delay {
          animation: fade-in-up 0.5s ease-out 1s both;
        }
        .fade-in-up-delay-2 {
          animation: fade-in-up 0.5s ease-out 1.2s both;
        }
        .pulse-glow {
          animation: pulse-glow 2s ease-in-out infinite;
        }
        .shimmer-text {
          background: linear-gradient(90deg, #2d666d 0%, #5d5e64 25%, #ffffff 50%, #5d5e64 75%, #2d666d 100%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: shimmer 3s linear infinite;
        }
        .error-shake {
          animation: error-shake 0.5s ease-out;
        }
        .spin {
          animation: spin 1s linear infinite;
        }
        .confetti {
          position: fixed;
          width: 10px;
          height: 10px;
          top: -10px;
          animation: confetti-fall 3s ease-in-out forwards;
        }
      `}</style>

      <div
        className="min-h-screen flex items-center justify-center p-4"
        style={{
          background: `radial-gradient(circle at 10% 20%, rgba(255, 217, 226, 0.4) 0%, transparent 40%),
                       radial-gradient(circle at 90% 80%, rgba(179, 236, 243, 0.4) 0%, transparent 40%),
                       radial-gradient(circle at 50% 50%, rgba(248, 248, 255, 1) 0%, transparent 100%)`,
          backgroundColor: '#f8f8ff',
          fontFamily: 'Plus Jakarta Sans, sans-serif',
        }}
      >
        {status === 'success' && (
          <>
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="confetti"
                style={{
                  left: `${Math.random() * 100}%`,
                  backgroundColor: ['#2d666d', '#5d5e64', '#a855f7', '#ec4899', '#14b8a6', '#f97316'][i % 6],
                  borderRadius: Math.random() > 0.5 ? '50%' : '0',
                  animationDelay: `${Math.random() * 2}s`,
                  animationDuration: `${2 + Math.random() * 2}s`,
                }}
              />
            ))}
          </>
        )}

        <div className="bg-white/80 backdrop-blur-3xl rounded-[2rem] p-8 w-full max-w-md border border-white/40 shadow-2xl text-center">
          {status === 'loading' && (
            <div className="py-8">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full border-4 border-[#e9fdff] border-t-[#2d666d] spin"></div>
              <h2 className="text-xl font-bold text-[#1c1b1b] mb-2">Processing Payment</h2>
              <p className="text-[#45474b] text-sm">Please wait while we verify your payment...</p>
            </div>
          )}

          {status === 'success' && (
            <div className="py-4">
              <div className="success-icon mx-auto mb-6 pulse-glow w-24 h-24 rounded-full bg-[#e9fdff] flex items-center justify-center">
                <svg className="w-16 h-16" viewBox="0 0 52 52">
                  <circle
                    className="checkmark-circle"
                    cx="26"
                    cy="26"
                    r="25"
                    fill="none"
                    stroke="#2d666d"
                    strokeWidth="2"
                  />
                  <path
                    className="checkmark-check"
                    fill="none"
                    stroke="#2d666d"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M14 27l7 7 16-16"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-extrabold text-[#1c1b1b] mb-2 fade-in-up shimmer-text">
                Membership Activated!
              </h2>
              <p className="text-[#45474b] text-sm mb-4 fade-in-up-delay">
                {message}
              </p>
              <div className="bg-[#e9fdff]/60 rounded-2xl p-4 mb-6 fade-in-up-delay-2">
                <p className="text-xs text-[#45474b] uppercase tracking-wider font-bold mb-1">Invoice ID</p>
                <p className="text-sm font-mono font-bold text-[#1c1b1b] break-all">{invoiceId}</p>
              </div>
              <div className="fade-in-up-delay-2">
                <p className="text-xs text-[#45474b] mb-4">Redirecting to membership in 5 seconds...</p>
                <Link
                  href="/membership"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#2d666d] text-white font-semibold text-sm hover:bg-[#1a4248] transition-all shadow-lg shadow-[#2d666d]/30"
                >
                  <span className="material-symbols-outlined text-[18px]">workspace_premium</span>
                  Go to Membership
                </Link>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="py-4">
              <div className="error-shake mx-auto mb-6 w-24 h-24 rounded-full bg-[#ffdad6] flex items-center justify-center">
                <span className="material-symbols-outlined text-[48px] text-[#ba1a1a]">error</span>
              </div>
              <h2 className="text-2xl font-extrabold text-[#1c1b1b] mb-2">Payment Failed</h2>
              <p className="text-[#45474b] text-sm mb-6">{message}</p>
              <div className="flex gap-3 justify-center">
                <Link
                  href="/membership"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white/60 backdrop-blur-md border border-white/40 text-[#1c1b1b] font-semibold text-sm hover:bg-white/80 transition-all"
                >
                  <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                  Back to Membership
                </Link>
                <button
                  onClick={() => router.replace('/membership')}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#2d666d] text-white font-semibold text-sm hover:bg-[#1a4248] transition-all"
                >
                  <span className="material-symbols-outlined text-[18px]">refresh</span>
                  Try Again
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
