import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export default function PaymentSuccessPage() {
  const router = useRouter();
  const { invoice_id } = router.query;
  const { accessToken, isAuthenticated } = useAuthStore();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!router.isReady) return;
    if (!invoice_id) {
      setStatus('error');
      setMessage('No invoice ID found in URL');
      return;
    }
    verifyPayment();
  }, [router.isReady, invoice_id]);

  const verifyPayment = async () => {
    setStatus('loading');
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }

      const res = await fetch(`${API_URL}/vendor/payment-success`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ invoiceId: invoice_id }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setStatus('success');
        setMessage(data.data.message);
      } else {
        setStatus('error');
        setMessage(data.error?.message || data.message || 'Payment verification failed');
      }
    } catch {
      setStatus('error');
      setMessage('Connection failed. Please try again.');
    }
  };

  return (
    <>
      <Head><title>Payment Status - Dreamy Life</title></Head>
      <style>{`
        @keyframes checkmark-scale { 0% { transform: scale(0); opacity: 0; } 50% { transform: scale(1.2); } 100% { transform: scale(1); opacity: 1; } }
        @keyframes checkmark-draw { 0% { stroke-dashoffset: 50; } 100% { stroke-dashoffset: 0; } }
        @keyframes circle-draw { 0% { stroke-dashoffset: 314; } 100% { stroke-dashoffset: 0; } }
        @keyframes fade-in-up { 0% { opacity: 0; transform: translateY(20px); } 100% { opacity: 1; transform: translateY(0); } }
        @keyframes pulse-glow { 0%, 100% { box-shadow: 0 0 20px rgba(45,102,109,0.3); } 50% { box-shadow: 0 0 40px rgba(45,102,109,0.6); } }
        @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        @keyframes error-shake { 0%,100% { transform: translateX(0); } 25% { transform: translateX(-10px); } 75% { transform: translateX(10px); } }
        .checkmark-circle { stroke-dasharray: 314; stroke-dashoffset: 314; animation: circle-draw 0.6s ease-out 0.2s forwards; }
        .checkmark-check { stroke-dasharray: 50; stroke-dashoffset: 50; animation: checkmark-draw 0.4s ease-out 0.6s forwards; }
        .success-icon { animation: checkmark-scale 0.5s ease-out 0.1s both; }
        .fade-in-up { animation: fade-in-up 0.5s ease-out 0.8s both; }
        .fade-in-up-delay { animation: fade-in-up 0.5s ease-out 1s both; }
        .fade-in-up-delay-2 { animation: fade-in-up 0.5s ease-out 1.2s both; }
        .pulse-glow { animation: pulse-glow 2s ease-in-out infinite; }
        .shimmer-text { background: linear-gradient(90deg, #2d666d 0%, #98d0d7 25%, #ffffff 50%, #98d0d7 75%, #2d666d 100%); background-size: 200% auto; -webkit-background-clip: text; -webkit-text-fill-color: transparent; animation: shimmer 3s linear infinite; }
        .error-shake { animation: error-shake 0.5s ease-out; }
      `}</style>
      <div className="min-h-screen bg-[#fcf9f8] flex items-center justify-center px-6"
        style={{
          background: `radial-gradient(circle at 10% 20%, rgba(255, 217, 226, 0.4) 0%, transparent 40%),
                       radial-gradient(circle at 90% 80%, rgba(179, 236, 243, 0.4) 0%, transparent 40%),
                       radial-gradient(circle at 50% 50%, rgba(248, 248, 255, 1) 0%, transparent 100%)`,
          backgroundColor: '#f8f8ff',
        }}
      >
        <div className="bg-white/80 backdrop-blur-3xl rounded-[2rem] p-8 max-w-md w-full text-center border border-white/40 shadow-2xl">
          {status === 'loading' && (
            <div className="py-4">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full border-4 border-[#e9fdff] border-t-[#2d666d] animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
              <h2 className="text-xl font-bold text-[#1c1b1b]">Verifying Payment...</h2>
              <p className="text-[#45474b] mt-2 text-sm">Please wait while we confirm your payment.</p>
            </div>
          )}
          {status === 'success' && (
            <div className="py-4">
              <div className="success-icon mx-auto mb-6 pulse-glow w-24 h-24 rounded-full bg-[#e9fdff] flex items-center justify-center">
                <svg className="w-16 h-16" viewBox="0 0 52 52">
                  <circle className="checkmark-circle" cx="26" cy="26" r="25" fill="none" stroke="#2d666d" strokeWidth="2" />
                  <path className="checkmark-check" fill="none" stroke="#2d666d" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" d="M14 27l7 7 16-16" />
                </svg>
              </div>
              <h2 className="text-2xl font-extrabold text-[#1c1b1b] mb-2 fade-in-up shimmer-text">Payment Successful!</h2>
              <p className="text-[#45474b] text-sm mb-6 fade-in-up-delay">{message}</p>
              <div className="fade-in-up-delay-2">
                <Link href="/vendor/dashboard" className="inline-flex items-center gap-2 px-8 py-3 rounded-full bg-[#2d666d] text-white font-semibold text-sm hover:opacity-90 transition-all shadow-lg shadow-[#2d666d]/30">
                  <span className="material-symbols-outlined text-[18px]">storefront</span>
                  Go to Vendor Dashboard
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
                <Link href="/vendor/apply" className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white/60 backdrop-blur-md border border-white/40 text-[#1c1b1b] font-semibold text-sm hover:bg-white/80 transition-all">
                  <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                  Try Again
                </Link>
                <button onClick={verifyPayment} className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#2d666d] text-white font-semibold text-sm hover:opacity-90 transition-all">
                  <span className="material-symbols-outlined text-[18px]">refresh</span>
                  Retry
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
