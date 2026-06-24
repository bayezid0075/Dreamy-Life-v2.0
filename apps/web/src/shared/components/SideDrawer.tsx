import Link from 'next/link';
import { useState } from 'react';
import { VendorProfile } from '@/features/vendor/api';

interface SideDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  vendorProfile: VendorProfile | null;
  handleLogout: () => void;
  copyReferCode: () => void;
}

export default function SideDrawer({ isOpen, onClose, user, vendorProfile, handleLogout, copyReferCode }: SideDrawerProps) {
  const [vendorExpanded, setVendorExpanded] = useState(false);
  const hasVendor = !!vendorProfile;

  return (
    <div className={`fixed inset-0 z-[60] transition-all duration-500 ease-in-out ${isOpen ? '' : 'pointer-events-none'}`}>
      <div
        className={`absolute inset-0 bg-black/40 backdrop-blur-sm cursor-pointer transition-opacity duration-500 ${isOpen ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      ></div>
      <div
        className={`absolute top-0 left-0 h-full w-[320px] bg-white/70 backdrop-blur-3xl border-r border-white/30 flex flex-col transition-transform duration-500 ease-out ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="p-6 flex flex-col h-full">
          {/* Drawer Header */}
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-3">
              <span className="text-lg font-bold text-[#5d5e64]">Dreamy Life</span>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-black/5 transition-colors">
              <span className="material-symbols-outlined text-[#45474b]">close</span>
            </button>
          </div>

          {/* User Info Card */}
          <div
            className="rounded-2xl p-5 mb-8 relative overflow-hidden shadow-lg"
            style={{
              background: `radial-gradient(circle at 10% 20%, rgba(255, 217, 226, 0.4) 0%, transparent 40%),
                           radial-gradient(circle at 90% 80%, rgba(179, 236, 243, 0.4) 0%, transparent 40%),
                           radial-gradient(circle at 50% 50%, rgba(248, 248, 255, 1) 0%, transparent 100%)`,
              backgroundColor: '#f8f8ff',
            }}
          >
            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 rounded-full bg-[#f8f8ff] border-2 border-white shadow-md flex items-center justify-center">
                  <span className="material-symbols-outlined text-[#5d5e64] text-3xl">person</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-lg text-[#1c1b1b]">{user?.username}</h3>
                    {user?.isVerified ? (
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-[#e9fdff] text-[#2d666d] text-[9px] rounded-full font-bold uppercase tracking-wider border border-[#2d666d]/20">
                        <span className="material-symbols-outlined text-[10px]" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                        Verified
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-[#ffdad6]/60 text-[#ba1a1a] text-[9px] rounded-full font-bold uppercase tracking-wider border border-[#ba1a1a]/20">
                        <span className="material-symbols-outlined text-[10px]">gpp_maybe</span>
                        Not Verified
                      </span>
                    )}
                  </div>
                  <div className="flex gap-1.5 mt-1">
                    <span className="px-2 py-0.5 bg-[#f8f8ff] text-[#5d5e64] text-[10px] rounded-full flex items-center gap-1">
                      <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>workspace_premium</span>
                      {user?.memberStatus}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between bg-white/40 p-2.5 rounded-xl border border-white/50">
                <span className="text-xs font-semibold text-[#45474b]">
                  Refer: <span className="text-[#5d5e64]">{user?.ownRefercode}</span>
                </span>
                <button onClick={copyReferCode}>
                  <span className="material-symbols-outlined text-sm cursor-pointer">content_copy</span>
                </button>
              </div>
            </div>
          </div>

          {/* Verify Now Button */}
          {!user?.isVerified && (
            <Link
              href="/membership"
              onClick={onClose}
              className="flex items-center gap-3 p-4 mb-6 rounded-2xl border-2 border-dashed border-[#2d666d]/30 bg-[#2d666d]/5 hover:bg-[#2d666d]/10 transition-all group"
            >
              <span className="text-2xl">🔒</span>
              <div className="flex-1">
                <span className="font-bold text-sm text-[#2d666d] block">Verify Now</span>
                <span className="text-[11px] text-[#45474b]">Purchase a membership to verify your account</span>
              </div>
              <span className="material-symbols-outlined text-[#2d666d] font-bold group-hover:translate-x-1 transition-transform">arrow_forward</span>
            </Link>
          )}

          {user?.isVerified && (
            <div className="flex items-center gap-3 p-4 mb-6 rounded-2xl bg-[#2d666d]/5 border border-[#2d666d]/20">
              <span className="text-2xl">✅</span>
              <div className="flex-1">
                <span className="font-bold text-sm text-[#2d666d] block">Account Verified</span>
                <span className="text-[11px] text-[#45474b]">Your account is fully verified</span>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex-1 overflow-y-auto space-y-6 pr-2">
            <div>
              <h4 className="text-xs font-bold text-[#45474b]/50 uppercase tracking-widest px-4 mb-3">Main</h4>
              <div className="space-y-1">
                <Link href="/dashboard" className="flex items-center gap-4 px-4 py-3 rounded-xl bg-[#f8f8ff] text-[#5d5e64] transition-all">
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>dashboard</span>
                  <span className="font-semibold">Dashboard</span>
                </Link>
                <Link href="/social-feed" className="flex items-center gap-4 px-4 py-3 rounded-xl text-[#45474b] hover:bg-black/5 transition-all">
                  <span className="material-symbols-outlined">public</span>
                  <span>Social Feed</span>
                </Link>
                <Link href="/referral" className="flex items-center gap-4 px-4 py-3 rounded-xl text-[#45474b] hover:bg-black/5 transition-all">
                  <span className="material-symbols-outlined">share</span>
                  <span>Referral</span>
                </Link>
                <Link href="/membership" className="flex items-center gap-4 px-4 py-3 rounded-xl text-[#45474b] hover:bg-black/5 transition-all">
                  <span className="material-symbols-outlined">card_membership</span>
                  <span>Membership</span>
                </Link>
                <Link href="/wallet" className="flex items-center gap-4 px-4 py-3 rounded-xl text-[#45474b] hover:bg-black/5 transition-all">
                  <span className="material-symbols-outlined">account_balance_wallet</span>
                  <span>Wallet</span>
                </Link>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold text-[#45474b]/50 uppercase tracking-widest px-4 mb-3">Vendor</h4>
              <div className="space-y-1">
                {!hasVendor ? (
                  <Link href="/vendor/apply" className="flex items-center gap-4 px-4 py-3 rounded-xl text-[#45474b] hover:bg-black/5 transition-all">
                    <span className="material-symbols-outlined">storefront</span>
                    <span>Become a Vendor</span>
                  </Link>
                ) : (
                  <>
                    <button
                      onClick={() => setVendorExpanded(!vendorExpanded)}
                      className="flex items-center gap-4 px-4 py-3 rounded-xl text-[#45474b] hover:bg-black/5 transition-all w-full"
                    >
                      <span className="material-symbols-outlined">storefront</span>
                      <div className="flex-1 text-left">
                        <span className="font-semibold block">{vendorProfile?.shopName || 'Vendor'}</span>
                        {vendorProfile?.isActive && (
                          <span className="text-[10px] text-[#2d666d] font-medium">Active Vendor</span>
                        )}
                      </div>
                      <span className="material-symbols-outlined text-sm">{vendorExpanded ? 'expand_less' : 'expand_more'}</span>
                    </button>
                    {vendorExpanded && (
                      <div className="pl-8 space-y-1">
                        {/* Vendor Stats */}
                        <div className="px-4 py-2.5 mb-2">
                          <div className="grid grid-cols-3 gap-2">
                            <div className="text-center">
                              <p className="text-lg font-bold text-[#1c1b1b]">{vendorProfile?.totalProducts ?? 0}</p>
                              <p className="text-[10px] text-[#45474b] font-medium">Products</p>
                            </div>
                            <div className="text-center">
                              <p className="text-lg font-bold text-[#1c1b1b]">{vendorProfile?.totalOrders ?? 0}</p>
                              <p className="text-[10px] text-[#45474b] font-medium">Orders</p>
                            </div>
                            <div className="text-center">
                              <p className="text-lg font-bold text-[#1c1b1b]">{vendorProfile?.totalRevenue ?? 0}</p>
                              <p className="text-[10px] text-[#45474b] font-medium">Revenue</p>
                            </div>
                          </div>
                        </div>

                        <Link href="/vendor/dashboard" className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-[#5d5e64] hover:bg-black/5 transition-all text-sm">
                          <span className="material-symbols-outlined text-base">analytics</span>
                          <span className="font-semibold">Dashboard</span>
                        </Link>
                        <Link href="/vendor/products" className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-[#5d5e64] hover:bg-black/5 transition-all text-sm">
                          <span className="material-symbols-outlined text-base">inventory_2</span>
                          <span className="font-semibold">Inventory</span>
                          <span className="ml-auto text-[10px] bg-[#f8f8ff] text-[#5d5e64] px-2 py-0.5 rounded-full font-medium">{vendorProfile?.totalProducts ?? 0}</span>
                        </Link>
                        <Link href="/vendor/products/create" className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-[#5d5e64] hover:bg-black/5 transition-all text-sm">
                          <span className="material-symbols-outlined text-base">add_circle</span>
                          <span className="font-semibold">Add Product</span>
                        </Link>
                        <Link href="/reselling/orders" className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-[#5d5e64] hover:bg-black/5 transition-all text-sm">
                          <span className="material-symbols-outlined text-base">receipt_long</span>
                          <span className="font-semibold">My Orders</span>
                          <span className="ml-auto text-[10px] bg-[#f8f8ff] text-[#5d5e64] px-2 py-0.5 rounded-full font-medium">{vendorProfile?.totalOrders ?? 0}</span>
                        </Link>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="mt-auto flex items-center justify-center gap-3 w-full py-4 bg-[#ffdad6]/50 text-[#ba1a1a] rounded-2xl font-bold border border-[#ba1a1a]/10 hover:bg-[#ba1a1a] hover:text-white transition-all"
          >
            <span className="material-symbols-outlined">logout</span>
            Logout
          </button>
          <div className="text-center mt-4 text-[10px] text-[#45474b]/40">v1.0.0</div>
        </div>
      </div>
    </div>
  );
}
