import Link from 'next/link';
import { useState } from 'react';
import { VendorProfile } from '@/features/vendor/api';
import { useI18n } from '../../i18n';

interface SideDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  vendorProfile: VendorProfile | null;
  handleLogout: () => void;
  copyReferCode: () => void;
}

export default function SideDrawer({ isOpen, onClose, user, vendorProfile, handleLogout, copyReferCode }: SideDrawerProps) {
  const [shopExpanded, setShopExpanded] = useState(false);
  const hasVendor = !!vendorProfile;
  const { t } = useI18n();

  return (
    <div className={`fixed inset-0 z-[60] transition-all duration-500 ease-in-out ${isOpen ? '' : 'pointer-events-none'}`}>
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-gradient-to-br from-teal-900/30 via-gray-900/20 to-purple-900/30 backdrop-blur-sm cursor-pointer transition-opacity duration-500 ${isOpen ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      ></div>

      {/* Drawer Panel */}
      <div
        className={`absolute top-0 left-0 h-full w-[85vw] max-w-[340px] flex flex-col transition-transform duration-500 ease-out ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
        style={{
          background: 'linear-gradient(180deg, rgba(240,253,250,0.97) 0%, rgba(255,255,255,0.98) 30%, rgba(248,255,254,0.97) 70%, rgba(245,243,255,0.97) 100%)',
          backdropFilter: 'blur(20px)',
          boxShadow: '4px 0 30px rgba(20,184,166,0.1), 2px 0 10px rgba(0,0,0,0.05)',
          borderRight: '1px solid rgba(20,184,166,0.15)',
        }}
      >
        <div className="p-5 flex flex-col h-full overflow-hidden">

          {/* ===== HEADER ===== */}
          <div className="flex justify-between items-center mb-6 pb-4 border-b border-teal-100/60">
            <div className="flex items-center gap-3">
              <div className="relative">
                <img
                  src="/logo.png"
                  alt="Dreamy Life"
                  className="w-11 h-11 rounded-2xl shadow-lg shadow-teal-200/50 ring-2 ring-teal-400/30 ring-offset-1"
                />
                <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-400 rounded-full border-2 border-white shadow-sm"></div>
              </div>
              <div>
                <h1 className="text-lg font-extrabold text-teal-800 tracking-tight">{t('dreamyLife')}</h1>
                <p className="text-[10px] text-teal-500 font-medium -mt-0.5">Welcome back!</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl flex items-center justify-center bg-rose-50 text-rose-500 border border-rose-100 hover:bg-rose-500 hover:text-white hover:border-rose-500 hover:shadow-lg hover:shadow-rose-200 transition-all duration-200"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          </div>

          {/* ===== USER CARD (Dark Contrast) ===== */}
          <div
            className="rounded-2xl p-4 mb-5 relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #1a1f35 100%)',
              boxShadow: '0 8px 32px rgba(15,23,42,0.3), 0 2px 8px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.05)',
            }}
          >
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-teal-500/20 to-transparent rounded-bl-full"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-purple-500/20 to-transparent rounded-tr-full"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-gradient-to-r from-teal-500/10 to-purple-500/10 rounded-full blur-2xl"></div>

            <div className="relative z-10">
              {/* Avatar & Name */}
              <div className="flex items-center gap-3 mb-3">
                <div className="w-14 h-14 rounded-2xl shadow-lg flex items-center justify-center overflow-hidden ring-2 ring-teal-400/60 ring-offset-2 ring-offset-slate-800 flex-shrink-0" style={{ background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)' }}>
                  {user?.info?.avatarUrl ? (
                    <img alt="Avatar" className="w-full h-full object-cover" src={user.info.avatarUrl} />
                  ) : (
                    <span className="material-symbols-outlined text-teal-400 text-3xl">person</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-extrabold text-base text-white truncate">{user?.username || 'User'}</h3>
                  <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-teal-500/20 text-teal-300 text-[10px] rounded-lg font-bold border border-teal-500/30">
                      <span className="material-symbols-outlined" style={{ fontSize: '10px', fontVariationSettings: "'FILL' 1" }}>person</span>
                      {user?.memberStatus || 'user'}
                    </span>
                    {user?.isVerified ? (
                      <span className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-emerald-500/20 text-emerald-300 text-[10px] rounded-lg font-bold border border-emerald-500/30">
                        <span className="material-symbols-outlined" style={{ fontSize: '10px' }}>verified</span>
                        {t('verified')}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-rose-500/20 text-rose-300 text-[10px] rounded-lg font-bold border border-rose-500/30">
                        <span className="material-symbols-outlined" style={{ fontSize: '10px' }}>gpp_maybe</span>
                        {t('notVerified')}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Verify Now / Verified Button */}
              {!user?.isVerified ? (
                <Link
                  href="/membership"
                  onClick={onClose}
                  className="flex items-center gap-3 p-3 mb-3 rounded-xl text-white font-bold transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
                  style={{
                    background: 'linear-gradient(135deg, #14b8a6 0%, #10b981 50%, #059669 100%)',
                    boxShadow: '0 4px 15px rgba(20,184,166,0.5), 0 2px 4px rgba(0,0,0,0.2)',
                  }}
                >
                  <span className="text-lg">🔒</span>
                  <span className="font-extrabold text-sm flex-1">{t('verifyNow')}</span>
                  <span className="material-symbols-outlined text-sm font-bold">arrow_forward</span>
                </Link>
              ) : (
                <div className="flex items-center gap-3 p-3 mb-3 rounded-xl bg-emerald-500/20 border border-emerald-500/30">
                  <span className="text-lg">✅</span>
                  <span className="font-bold text-sm text-emerald-300">{t('accountVerifiedText')}</span>
                </div>
              )}

              {/* Phone Number */}
              <div className="flex items-center gap-2.5 py-2 px-1">
                <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-sm text-teal-400">smartphone</span>
                </div>
                <span className="text-sm font-semibold text-slate-300">{user?.phoneNumber || '01234567890'}</span>
              </div>

              {/* Referral Code */}
              <div className="flex items-center gap-2.5 py-2 px-1">
                <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-sm text-purple-400">share</span>
                </div>
                <span className="text-xs font-semibold text-slate-400">{t('refer')}</span>
                <span className="text-sm font-bold text-purple-300 tracking-wide flex-1">{user?.ownRefercode || 'N/A'}</span>
                <button
                  onClick={copyReferCode}
                  className="w-7 h-7 rounded-lg bg-white/10 text-slate-300 flex items-center justify-center hover:bg-purple-500 hover:text-white hover:shadow-md hover:shadow-purple-500/30 transition-all duration-200"
                >
                  <span className="material-symbols-outlined text-sm">content_copy</span>
                </button>
              </div>
            </div>
          </div>

          {/* ===== NAVIGATION ===== */}
          <div className="flex-1 overflow-y-auto space-y-5 pr-1 scrollbar-thin scrollbar-thumb-teal-200 scrollbar-track-transparent">

            {/* MAIN Section */}
            <div>
              <div className="flex items-center gap-2 px-4 mb-2">
                <div className="w-1.5 h-1.5 rounded-full bg-teal-500"></div>
                <h4 className="text-[11px] font-extrabold text-teal-600 uppercase tracking-[0.2em]">{t('main')}</h4>
              </div>
              <div className="space-y-1">
                <Link
                  href="/dashboard"
                  onClick={onClose}
                  className="flex items-center gap-3.5 px-4 py-3 rounded-xl text-white font-bold transition-all duration-200 shadow-md"
                  style={{
                    background: 'linear-gradient(135deg, #14b8a6 0%, #10b981 100%)',
                    boxShadow: '0 4px 12px rgba(20,184,166,0.3)',
                  }}
                >
                  <span className="material-symbols-outlined text-white" style={{ fontVariationSettings: "'FILL' 1" }}>dashboard</span>
                  <span className="font-bold text-sm">{t('dashboard')}</span>
                </Link>
                <Link
                  href="/wallet"
                  onClick={onClose}
                  className="flex items-center gap-3.5 px-4 py-3 rounded-xl text-gray-700 hover:bg-teal-50 hover:text-teal-700 transition-all duration-200 group"
                >
                  <div className="w-8 h-8 rounded-lg bg-amber-100 group-hover:bg-amber-200 flex items-center justify-center transition-colors">
                    <span className="material-symbols-outlined text-sm text-amber-600">account_balance_wallet</span>
                  </div>
                  <span className="font-semibold text-sm">{t('wallet')}</span>
                </Link>
                <Link
                  href="/referral"
                  onClick={onClose}
                  className="flex items-center gap-3.5 px-4 py-3 rounded-xl text-gray-700 hover:bg-teal-50 hover:text-teal-700 transition-all duration-200 group"
                >
                  <div className="w-8 h-8 rounded-lg bg-purple-100 group-hover:bg-purple-200 flex items-center justify-center transition-colors">
                    <span className="material-symbols-outlined text-sm text-purple-600">share</span>
                  </div>
                  <span className="font-semibold text-sm">{t('referral')}</span>
                </Link>
                <Link
                  href="/membership"
                  onClick={onClose}
                  className="flex items-center gap-3.5 px-4 py-3 rounded-xl text-gray-700 hover:bg-teal-50 hover:text-teal-700 transition-all duration-200 group"
                >
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 group-hover:bg-emerald-200 flex items-center justify-center transition-colors">
                    <span className="material-symbols-outlined text-sm text-emerald-600">workspace_premium</span>
                  </div>
                  <span className="font-semibold text-sm">{t('membership')}</span>
                </Link>
                <Link
                  href="/withdraw"
                  onClick={onClose}
                  className="flex items-center gap-3.5 px-4 py-3 rounded-xl text-gray-700 hover:bg-teal-50 hover:text-teal-700 transition-all duration-200 group"
                >
                  <div className="w-8 h-8 rounded-lg bg-amber-100 group-hover:bg-amber-200 flex items-center justify-center transition-colors">
                    <span className="material-symbols-outlined text-sm text-amber-600">account_balance_wallet</span>
                  </div>
                  <span className="font-semibold text-sm">{t('withdraw')}</span>
                </Link>
              </div>
            </div>

            {/* SHOP Section */}
            <div>
              <div className="flex items-center gap-2 px-4 mb-2">
                <div className="w-1.5 h-1.5 rounded-full bg-purple-500"></div>
                <h4 className="text-[11px] font-extrabold text-purple-600 uppercase tracking-[0.2em]">{t('shop').toUpperCase()}</h4>
              </div>
              <div className="space-y-1">
                <button
                  onClick={() => setShopExpanded(!shopExpanded)}
                  className="flex items-center gap-3.5 px-4 py-3 rounded-xl text-gray-700 hover:bg-purple-50 hover:text-purple-700 transition-all duration-200 w-full group"
                >
                  <div className="w-8 h-8 rounded-lg bg-purple-100 group-hover:bg-purple-200 flex items-center justify-center transition-colors">
                    <span className="material-symbols-outlined text-sm text-purple-600">storefront</span>
                  </div>
                  <span className="font-semibold text-sm flex-1 text-left">{t('resellerShop')}</span>
                  <div className={`w-6 h-6 rounded-md flex items-center justify-center transition-all duration-200 ${shopExpanded ? 'bg-purple-100 rotate-0' : 'bg-gray-100 rotate-0'}`}>
                    <span className={`material-symbols-outlined text-sm transition-colors ${shopExpanded ? 'text-purple-600' : 'text-gray-400'}`}>
                      {shopExpanded ? 'expand_less' : 'expand_more'}
                    </span>
                  </div>
                </button>

                {shopExpanded && (
                  <div className="ml-6 pl-4 border-l-2 border-purple-200 space-y-1 mt-1">
                    {!hasVendor ? (
                      <Link
                        href="/vendor/apply"
                        onClick={onClose}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-600 hover:bg-purple-50 hover:text-purple-700 hover:border-purple-200 transition-all duration-200 text-sm group"
                      >
                        <div className="w-7 h-7 rounded-lg bg-amber-100 group-hover:bg-amber-200 flex items-center justify-center transition-colors">
                          <span className="material-symbols-outlined text-xs text-amber-600">add_business</span>
                        </div>
                        <span className="font-semibold">{t('becomeAVendor')}</span>
                      </Link>
                    ) : (
                      <>
                        <Link
                          href="/vendor/dashboard"
                          onClick={onClose}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-600 hover:bg-purple-50 hover:text-purple-700 transition-all duration-200 text-sm group"
                        >
                          <div className="w-7 h-7 rounded-lg bg-teal-100 group-hover:bg-teal-200 flex items-center justify-center transition-colors">
                            <span className="material-symbols-outlined text-xs text-teal-600">analytics</span>
                          </div>
                          <span className="font-semibold">{t('vendorDashboard')}</span>
                        </Link>
                        <Link
                          href="/vendor/products"
                          onClick={onClose}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-600 hover:bg-purple-50 hover:text-purple-700 transition-all duration-200 text-sm group"
                        >
                          <div className="w-7 h-7 rounded-lg bg-blue-100 group-hover:bg-blue-200 flex items-center justify-center transition-colors">
                            <span className="material-symbols-outlined text-xs text-blue-600">inventory_2</span>
                          </div>
                          <span className="font-semibold">{t('inventory')}</span>
                        </Link>
                        <Link
                          href="/vendor/products/create"
                          onClick={onClose}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-600 hover:bg-purple-50 hover:text-purple-700 transition-all duration-200 text-sm group"
                        >
                          <div className="w-7 h-7 rounded-lg bg-emerald-100 group-hover:bg-emerald-200 flex items-center justify-center transition-colors">
                            <span className="material-symbols-outlined text-xs text-emerald-600">add_circle</span>
                          </div>
                          <span className="font-semibold">{t('addProduct')}</span>
                        </Link>
                        <Link
                          href="/reseller-shop"
                          onClick={onClose}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-600 hover:bg-purple-50 hover:text-purple-700 transition-all duration-200 text-sm group"
                        >
                          <div className="w-7 h-7 rounded-lg bg-pink-100 group-hover:bg-pink-200 flex items-center justify-center transition-colors">
                            <span className="material-symbols-outlined text-xs text-pink-600">shopping_bag</span>
                          </div>
                          <span className="font-semibold">{t('myShop')}</span>
                        </Link>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* CONTACT & GROUP Section */}
            <div>
              <div className="flex items-center gap-2 px-4 mb-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                <h4 className="text-[11px] font-extrabold text-blue-600 uppercase tracking-[0.2em]">{t('groupAndContact')}</h4>
              </div>
              <div className="space-y-1">
                <Link
                  href="/telegram-groups"
                  onClick={onClose}
                  className="flex items-center gap-3.5 px-4 py-3 rounded-xl text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-all duration-200 group"
                >
                  <div className="w-8 h-8 rounded-lg bg-[#0088cc]/10 group-hover:bg-[#0088cc]/20 flex items-center justify-center transition-colors">
                    <svg className="w-4 h-4 text-[#0088cc]" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/>
                    </svg>
                  </div>
                  <span className="font-semibold text-sm">{t('telegramGroup')}</span>
                </Link>
              </div>
            </div>
          </div>

          {/* ===== LOGOUT ===== */}
          <div className="mt-4 pt-4 border-t border-teal-100/60">
            <button
              onClick={handleLogout}
              className="flex items-center justify-center gap-3 w-full py-3.5 rounded-xl font-bold text-sm transition-all duration-200 border"
              style={{
                background: 'linear-gradient(135deg, #fff1f2 0%, #ffe4e6 100%)',
                borderColor: 'rgba(244,63,94,0.2)',
                color: '#e11d48',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)';
                e.currentTarget.style.color = '#ffffff';
                e.currentTarget.style.borderColor = '#f43f5e';
                e.currentTarget.style.boxShadow = '0 4px 15px rgba(244,63,94,0.35)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, #fff1f2 0%, #ffe4e6 100%)';
                e.currentTarget.style.color = '#e11d48';
                e.currentTarget.style.borderColor = 'rgba(244,63,94,0.2)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <span className="material-symbols-outlined text-lg">logout</span>
              <span className="font-extrabold">{t('logout')}</span>
            </button>
            <div className="text-center mt-3 text-[10px] text-gray-400 font-medium">v1.0.0</div>
          </div>

        </div>
      </div>
    </div>
  );
}
