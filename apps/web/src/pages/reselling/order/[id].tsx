import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import AuthGuard from '@/shared/components/AuthGuard';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

const STATUS_STEPS = ['pending', 'confirmed', 'shipped', 'delivered'];

export default function ResellerOrderDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const { accessToken } = useAuthStore();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!accessToken) return;
    if (id) loadOrder();
  }, [accessToken, id]);

  const loadOrder = async () => {
    try {
      const res = await fetch(`${API_URL}/reselling/orders/${id}`, { headers: { Authorization: `Bearer ${accessToken}` } });
      if (res.ok) { const data = await res.json(); setOrder(data.data); }
    } catch { /* error */ }
    finally { setLoading(false); }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fcf9f8] flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-[#5d5e64] border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-[#fcf9f8] flex flex-col items-center justify-center gap-4">
        <span className="material-symbols-outlined text-6xl text-[#5d5e64]/30">error</span>
        <h2 className="text-xl font-bold text-[#1c1b1b]">Order Not Found</h2>
      </div>
    );
  }

  const currentStep = STATUS_STEPS.indexOf(order.status);

  return (
    <AuthGuard>
      <Head><title>Order #{order.id?.slice(0, 8)} - Dreamy Life</title></Head>
      <div className="min-h-screen bg-[#fcf9f8]">
        <div className="fixed inset-0 z-[-1] pointer-events-none">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_50%,rgba(226,226,233,0.4)_0%,transparent_50%),radial-gradient(circle_at_85%_30%,rgba(255,217,226,0.4)_0%,transparent_50%),radial-gradient(circle_at_50%_80%,rgba(179,236,243,0.4)_0%,transparent_50%)] bg-fixed" />
        </div>

        <header className="fixed top-0 w-full z-50 backdrop-blur-xl bg-white/40 border-b border-white/30 shadow-[0_20px_40px_rgba(0,0,0,0.04)]">
          <div className="flex items-center justify-between px-6 w-full max-w-[1280px] mx-auto h-20">
            <button onClick={() => router.back()} className="text-[#5d5e64] hover:bg-white/20 p-2 rounded-full">
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
            <h1 className="text-[24px] font-bold text-[#1c1b1b] tracking-tight">Order Details</h1>
            <div className="w-10" />
          </div>
        </header>

        <main className="pt-28 pb-20 px-6 w-full max-w-[800px] mx-auto space-y-6">
          {/* Order Info Card */}
          <div className="bg-white/40 backdrop-blur-[20px] rounded-2xl p-6 border border-white/30 shadow-[0_20px_40px_rgba(0,0,0,0.04)]">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-[#1c1b1b]">{order.productName}</h2>
                <p className="text-sm text-[#45474b]">from {order.shopName}</p>
              </div>
              <span className={`text-xs font-semibold px-3 py-1 rounded-full ${order.status === 'delivered' ? 'bg-[#e8f5e9] text-[#2e7d32]' : order.status === 'cancelled' ? 'bg-[#ffdad6] text-[#93000a]' : 'bg-[#e9fdff] text-[#2d666d]'}`}>
                {order.status}
              </span>
            </div>

            {/* Tracking Progress */}
            <div className="flex items-center justify-between my-6 px-4">
              {STATUS_STEPS.map((step, i) => (
                <div key={step} className="flex items-center flex-1">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                    i <= currentStep ? 'bg-[#2d666d] text-white' : 'bg-[#eae7e7] text-[#45474b]'
                  }`}>
                    {i < currentStep ? '✓' : i + 1}
                  </div>
                  {i < STATUS_STEPS.length - 1 && (
                    <div className={`flex-1 h-1 mx-2 rounded ${i < currentStep ? 'bg-[#2d666d]' : 'bg-[#eae7e7]'}`} />
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-between text-xs text-[#45474b] px-2">
              {STATUS_STEPS.map(s => <span key={s} className="capitalize">{s}</span>)}
            </div>
          </div>

          {/* Customer Details */}
          <div className="bg-white/40 backdrop-blur-[20px] rounded-2xl p-6 border border-white/30 shadow-[0_20px_40px_rgba(0,0,0,0.04)]">
            <h3 className="text-sm font-semibold text-[#5d5e64] mb-4">Customer Details</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-[#45474b]">Name</span><span className="font-semibold text-[#1c1b1b]">{order.customerName}</span></div>
              <div className="flex justify-between"><span className="text-[#45474b]">Phone</span><span className="font-semibold text-[#1c1b1b]">{order.customerPhone}</span></div>
              {order.customerAltPhone && <div className="flex justify-between"><span className="text-[#45474b]">Alt Phone</span><span className="font-semibold text-[#1c1b1b]">{order.customerAltPhone}</span></div>}
              <div className="flex justify-between"><span className="text-[#45474b]">Address</span><span className="font-semibold text-[#1c1b1b] text-right max-w-[60%]">{order.customerAddress}</span></div>
              <div className="flex justify-between"><span className="text-[#45474b]">Payment</span><span className="font-semibold text-[#1c1b1b] capitalize">{order.paymentMethod?.replace('_', ' ')}</span></div>
            </div>
          </div>

          {/* Pricing */}
          <div className="bg-white/40 backdrop-blur-[20px] rounded-2xl p-6 border border-white/30 shadow-[0_20px_40px_rgba(0,0,0,0.04)]">
            <h3 className="text-sm font-semibold text-[#5d5e64] mb-4">Pricing</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-[#45474b]">Vendor Price</span><span className="font-semibold text-[#1c1b1b]">${order.vendorPrice?.toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-[#45474b]">Your Price</span><span className="font-semibold text-[#1c1b1b]">${order.resellerPrice?.toFixed(2)}</span></div>
              <div className="flex justify-between pt-2 border-t border-white/20"><span className="text-[#2d666d] font-bold">Your Profit</span><span className="font-bold text-[#2d666d]">${order.profit?.toFixed(2)}</span></div>
            </div>
          </div>

          {/* Shipment Tracking */}
          {order.shipments?.length > 0 && (
            <div className="bg-white/40 backdrop-blur-[20px] rounded-2xl p-6 border border-white/30 shadow-[0_20px_40px_rgba(0,0,0,0.04)]">
              <h3 className="text-sm font-semibold text-[#5d5e64] mb-4">Shipment</h3>
              <div className="space-y-3 text-sm">
                {order.shipments[0].trackingNumber && (
                  <div className="flex justify-between"><span className="text-[#45474b]">Tracking #</span><span className="font-semibold text-[#1c1b1b]">{order.shipments[0].trackingNumber}</span></div>
                )}
                <div className="flex justify-between"><span className="text-[#45474b]">Carrier</span><span className="font-semibold text-[#1c1b1b] capitalize">{order.shipments[0].carrier}</span></div>
                <div className="flex justify-between"><span className="text-[#45474b]">Status</span><span className="font-semibold text-[#1c1b1b] capitalize">{order.shipments[0].status?.replace('_', ' ')}</span></div>
              </div>
            </div>
          )}

          <Link href="/reselling/orders" className="block text-center text-sm font-semibold text-[#2d666d] hover:opacity-80">
            ← Back to Orders
          </Link>
        </main>
      </div>
    </AuthGuard>
  );
}
